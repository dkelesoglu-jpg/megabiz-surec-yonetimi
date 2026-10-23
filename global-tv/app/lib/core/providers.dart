import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/demo_repositories.dart';
import '../data/models.dart';
import '../data/repositories.dart';
import 'app_config.dart';

final appConfigProvider = Provider<AppConfig>((ref) => AppConfig.fromEnvironment());

// H2: AppConfig.isDemoMode false olduğunda Supabase uygulamaları döndürülecek.
final channelRepositoryProvider = Provider<ChannelRepository>((ref) => DemoChannelRepository());
final chatRepositoryProvider = Provider<ChatRepository>((ref) => DemoChatRepository());
final authRepositoryProvider = Provider<AuthRepository>((ref) => DemoAuthRepository());

final channelsProvider = FutureProvider<List<Channel>>(
  (ref) => ref.watch(channelRepositoryProvider).fetchChannels(),
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
// Favoriler (H2: Supabase `favorites` tablosuna bağlanacak)
// ---------------------------------------------------------------------------
class FavoritesNotifier extends Notifier<Set<String>> {
  @override
  Set<String> build() => const {};

  bool isFavorite(String channelId) => state.contains(channelId);

  void toggle(String channelId) {
    state = state.contains(channelId)
        ? ({...state}..remove(channelId))
        : {...state, channelId};
  }
}

final favoritesProvider =
    NotifierProvider<FavoritesNotifier, Set<String>>(FavoritesNotifier.new);

// ---------------------------------------------------------------------------
// Oturum, dil, engellenenler
// ---------------------------------------------------------------------------
class AuthNotifier extends Notifier<AppUser?> {
  @override
  AppUser? build() => null;

  Future<void> signInWithEmail(String email, String password) async {
    state = await ref.read(authRepositoryProvider).signInWithEmail(email: email, password: password);
  }

  Future<void> signOut() async {
    await ref.read(authRepositoryProvider).signOut();
    state = null;
  }

  Future<void> deleteAccount() async {
    await ref.read(authRepositoryProvider).requestAccountDeletion();
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
  @override
  Map<String, String> build() => const {};

  void block(String userId, String username) => state = {...state, userId: username};
  void unblock(String userId) => state = {...state}..remove(userId);
}

final blockedUsersProvider =
    NotifierProvider<BlockedUsersNotifier, Map<String, String>>(BlockedUsersNotifier.new);
