import 'dart:ui' show PlatformDispatcher;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../data/demo_repositories.dart';
import '../data/models.dart';
import '../data/repositories.dart';
import '../data/supabase_repositories.dart';
import 'app_config.dart';

final appConfigProvider = Provider<AppConfig>((ref) => AppConfig.fromEnvironment());

/// Demo modunda `null`. main.dart'ta Supabase.initialize çağrıldıktan sonra kullanılır.
final supabaseClientProvider = Provider<SupabaseClient?>(
  (ref) => ref.watch(appConfigProvider).isDemoMode ? null : Supabase.instance.client,
);

T _pick<T>(Ref ref, T Function() demo, T Function(SupabaseClient) remote) {
  final client = ref.watch(supabaseClientProvider);
  return client == null ? demo() : remote(client);
}

final channelRepositoryProvider = Provider<ChannelRepository>(
    (ref) => _pick(ref, DemoChannelRepository.new, SupabaseChannelRepository.new));
final chatRepositoryProvider =
    Provider<ChatRepository>((ref) => _pick(ref, DemoChatRepository.new, SupabaseChatRepository.new));
final authRepositoryProvider =
    Provider<AuthRepository>((ref) => _pick(ref, DemoAuthRepository.new, SupabaseAuthRepository.new));
final favoritesRepositoryProvider = Provider<FavoritesRepository>(
    (ref) => _pick(ref, DemoFavoritesRepository.new, SupabaseFavoritesRepository.new));
final blocksRepositoryProvider = Provider<BlocksRepository>(
    (ref) => _pick(ref, DemoBlocksRepository.new, SupabaseBlocksRepository.new));
final analyticsRepositoryProvider = Provider<AnalyticsRepository>(
    (ref) => _pick(ref, DemoAnalyticsRepository.new, SupabaseAnalyticsRepository.new));

final channelsProvider = FutureProvider<List<Channel>>(
  (ref) => ref.watch(channelRepositoryProvider).fetchChannels(),
);

final streamUrlProvider = FutureProvider.autoDispose.family<String, String>(
  (ref, channelId) => ref.watch(channelRepositoryProvider).streamUrl(
        channelId,
        countryCode: PlatformDispatcher.instance.locale.countryCode,
      ),
);

// ---------------------------------------------------------------------------
// Filtreler
// ---------------------------------------------------------------------------
class ChannelFilter {
  const ChannelFilter({this.countryCode, this.category, this.query = ''});

  final String? countryCode;
  final ChannelCategory? category;
  final String query;

  ChannelFilter copyWith({
    String? Function()? countryCode,
    ChannelCategory? Function()? category,
    String? query,
  }) =>
      ChannelFilter(
        countryCode: countryCode != null ? countryCode() : this.countryCode,
        category: category != null ? category() : this.category,
        query: query ?? this.query,
      );

  List<Channel> apply(List<Channel> channels) {
    final q = query.trim().toLowerCase();
    return channels
        .where((c) => countryCode == null || c.countryCode == countryCode)
        .where((c) => category == null || c.category == category)
        .where((c) => q.isEmpty || c.name.toLowerCase().contains(q))
        .toList();
  }
}

class ChannelFilterNotifier extends Notifier<ChannelFilter> {
  @override
  ChannelFilter build() => const ChannelFilter();

  void setCountry(String? code) => state = state.copyWith(countryCode: () => code);
  void setCategory(ChannelCategory? category) => state = state.copyWith(category: () => category);
  void setQuery(String query) => state = state.copyWith(query: query);
}

final channelFilterProvider =
    NotifierProvider<ChannelFilterNotifier, ChannelFilter>(ChannelFilterNotifier.new);

final filteredChannelsProvider = Provider<AsyncValue<List<Channel>>>((ref) {
  final filter = ref.watch(channelFilterProvider);
  return ref.watch(channelsProvider).whenData(filter.apply);
});

final availableCountriesProvider = Provider<List<String>>((ref) {
  final channels = ref.watch(channelsProvider).value ?? const [];
  return {for (final c in channels) c.countryCode}.toList()..sort();
});

// ---------------------------------------------------------------------------
// Favoriler: misafirde yalnızca cihazda, girişte sunucuda
// ---------------------------------------------------------------------------
class FavoritesNotifier extends Notifier<Set<String>> {
  /// Sunucudan ilk yükleme; değişiklikler bundan sonra uygulanır ki yükleme
  /// sonucu kullanıcının o sırada yaptığı değişikliğin üzerine yazmasın.
  Future<void>? _loaded;

  @override
  Set<String> build() {
    _loaded = null;
    if (ref.watch(authProvider) != null) {
      _loaded = ref.read(favoritesRepositoryProvider).load().then((ids) {
        if (ref.mounted) state = ids;
      });
    }
    return const {};
  }

  bool isFavorite(String channelId) => state.contains(channelId);

  Future<void> toggle(String channelId) async {
    await _loaded;
    final adding = !state.contains(channelId);
    state = adding ? {...state, channelId} : ({...state}..remove(channelId));
    if (ref.read(authProvider) == null) return;
    final repo = ref.read(favoritesRepositoryProvider);
    await (adding ? repo.add(channelId) : repo.remove(channelId));
  }
}

final favoritesProvider =
    NotifierProvider<FavoritesNotifier, Set<String>>(FavoritesNotifier.new);

// ---------------------------------------------------------------------------
// Oturum, dil, engellenenler
// ---------------------------------------------------------------------------
class AuthNotifier extends Notifier<AppUser?> {
  @override
  AppUser? build() {
    ref.read(authRepositoryProvider).restoreSession().then((user) {
      if (ref.mounted && user != null) state = user;
    });
    return null;
  }

  Future<void> signInWithEmail(String email, String password) async {
    state = await ref.read(authRepositoryProvider).signInWithEmail(email: email, password: password);
  }

  Future<void> signUpWithEmail(String email, String password) async {
    state = await ref.read(authRepositoryProvider).signUpWithEmail(email: email, password: password);
  }

  Future<void> signOut() async {
    await ref.read(authRepositoryProvider).signOut();
    state = null;
  }

  Future<void> deleteAccount() async {
    await ref.read(authRepositoryProvider).deleteAccount();
    state = null;
  }
}

final authProvider = NotifierProvider<AuthNotifier, AppUser?>(AuthNotifier.new);

/// `null` = cihaz dilini kullan.
class LocaleNotifier extends Notifier<Locale?> {
  @override
  Locale? build() => null;

  void set(Locale? locale) => state = locale;
}

final localeProvider = NotifierProvider<LocaleNotifier, Locale?>(LocaleNotifier.new);

class BlockedUsersNotifier extends Notifier<Map<String, String>> {
  /// userId → kullanıcı adı
  Future<void>? _loaded;

  @override
  Map<String, String> build() {
    _loaded = null;
    if (ref.watch(authProvider) != null) {
      _loaded = ref.read(blocksRepositoryProvider).load().then((blocked) {
        if (ref.mounted) state = blocked;
      });
    }
    return const {};
  }

  Future<void> block(String userId, String username) async {
    await _loaded;
    state = {...state, userId: username};
    await ref.read(blocksRepositoryProvider).block(userId);
  }

  Future<void> unblock(String userId) async {
    await _loaded;
    state = {...state}..remove(userId);
    await ref.read(blocksRepositoryProvider).unblock(userId);
  }
}

final blockedUsersProvider =
    NotifierProvider<BlockedUsersNotifier, Map<String, String>>(BlockedUsersNotifier.new);
