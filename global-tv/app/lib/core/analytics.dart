import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/models.dart';
import '../data/repositories.dart';
import 'providers.dart';

// ---------------------------------------------------------------------------
// Gizlilik ilkeleri (KVKK / GDPR):
// - Analitik varsayılan olarak KAPALI; yalnızca kullanıcı açıkça izin verirse gönderilir.
// - İzlenme kayıtları anonimdir: kullanıcı kimliği, e-posta, konum, reklam kimliği yok.
// - Cihaz kimliği donanımdan türetilmez; rastgele üretilir, 30 günde bir yenilenir,
//   izin geri çekilince silinir.
// - Ülke yalnızca cihazın bölge ayarından alınır (GPS / IP kullanılmaz).
// ---------------------------------------------------------------------------

enum AnalyticsConsent { loading, unasked, granted, denied }

const deviceIdMaxAge = Duration(days: 30);

/// Cihazda saklanan analitik tercihi ve anonim cihaz kimliği.
abstract interface class ConsentStore {
  Future<bool?> loadConsent();
  Future<void> saveConsent(bool granted);

  /// Rastgele cihaz kimliği; yoksa veya [deviceIdMaxAge]'den eskiyse yenisi üretilir.
  Future<String> deviceId(DateTime now);
  Future<void> clearDeviceId();
}

String newDeviceId([Random? random]) {
  final r = random ?? Random.secure();
  return List.generate(16, (_) => r.nextInt(256).toRadixString(16).padLeft(2, '0')).join();
}

class PrefsConsentStore implements ConsentStore {
  static const _consentKey = 'analytics_consent';
  static const _idKey = 'analytics_device_id';
  static const _idCreatedKey = 'analytics_device_id_created';

  // Depolama okunamazsa (ör. eklenti yok) izin "sorulmadı" sayılır; veri gönderilmez.
  @override
  Future<bool?> loadConsent() async {
    try {
      return (await SharedPreferences.getInstance()).getBool(_consentKey);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> saveConsent(bool granted) async {
    try {
      await (await SharedPreferences.getInstance()).setBool(_consentKey, granted);
    } catch (_) {}
  }

  @override
  Future<String> deviceId(DateTime now) async {
    final prefs = await SharedPreferences.getInstance();
    final id = prefs.getString(_idKey);
    final created = DateTime.tryParse(prefs.getString(_idCreatedKey) ?? '');
    if (id != null && created != null && now.difference(created) < deviceIdMaxAge) return id;
    final fresh = newDeviceId();
    await prefs.setString(_idKey, fresh);
    await prefs.setString(_idCreatedKey, now.toIso8601String());
    return fresh;
  }

  @override
  Future<void> clearDeviceId() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_idKey);
      await prefs.remove(_idCreatedKey);
    } catch (_) {}
  }
}

/// Testler ve önizleme için bellek içi depo.
class MemoryConsentStore implements ConsentStore {
  MemoryConsentStore({this.consent});

  bool? consent;
  String? id;
  DateTime? idCreated;

  @override
  Future<bool?> loadConsent() async => consent;

  @override
  Future<void> saveConsent(bool granted) async => consent = granted;

  @override
  Future<String> deviceId(DateTime now) async {
    if (id == null || now.difference(idCreated!) >= deviceIdMaxAge) {
      id = newDeviceId();
      idCreated = now;
    }
    return id!;
  }

  @override
  Future<void> clearDeviceId() async {
    id = null;
    idCreated = null;
  }
}

final clockProvider = Provider<DateTime Function()>((ref) => DateTime.now);
final consentStoreProvider = Provider<ConsentStore>((ref) => PrefsConsentStore());

/// `android` | `ios`; diğer platformlarda analitik gönderilmez.
final platformProvider = Provider<String?>((ref) => switch (defaultTargetPlatform) {
      TargetPlatform.android => 'android',
      TargetPlatform.iOS => 'ios',
      _ => null,
    });

/// Cihazın bölge ayarındaki ülke kodu (ör. TR). Konum izni gerektirmez.
final deviceCountryProvider = Provider<String?>((ref) {
  final code = PlatformDispatcher.instance.locale.countryCode?.toUpperCase();
  return code != null && RegExp(r'^[A-Z]{2}$').hasMatch(code) ? code : null;
});

class AnalyticsConsentNotifier extends Notifier<AnalyticsConsent> {
  @override
  AnalyticsConsent build() {
    ref.read(consentStoreProvider).loadConsent().then((saved) {
      if (!ref.mounted || state != AnalyticsConsent.loading) return;
      state = switch (saved) {
        true => AnalyticsConsent.granted,
        false => AnalyticsConsent.denied,
        null => AnalyticsConsent.unasked,
      };
    });
    return AnalyticsConsent.loading;
  }

  bool get granted => state == AnalyticsConsent.granted;

  Future<void> set(bool granted) async {
    state = granted ? AnalyticsConsent.granted : AnalyticsConsent.denied;
    final store = ref.read(consentStoreProvider);
    await store.saveConsent(granted);
    // İzin geri çekilince anonim cihaz kimliği de silinir.
    if (!granted) await store.clearDeviceId();
  }
}

final analyticsConsentProvider =
    NotifierProvider<AnalyticsConsentNotifier, AnalyticsConsent>(AnalyticsConsentNotifier.new);

/// Günlük aktif kullanıcı: giriş yapmış ve izin vermiş kullanıcı için oturum başına bir kez.
/// Uygulama kabuğu bu sağlayıcıyı izler.
final activityTrackerProvider = Provider<void>((ref) {
  final user = ref.watch(authProvider);
  final consent = ref.watch(analyticsConsentProvider);
  final platform = ref.watch(platformProvider);
  if (user == null || consent != AnalyticsConsent.granted || platform == null) return;
  ref.read(analyticsRepositoryProvider).touchActivity(platform).catchError((_) {});
});

/// Bir kanalın izlenme süresini ölçer. Uygulama arka plana geçince ([stop]) ölçüm
/// kapatılıp gönderilir, öne gelince ([start]) yeni ölçüm başlar; uygulama kapanırsa
/// en fazla son açık ölçüm kaybolur.
class WatchTracker {
  WatchTracker({
    required this.channelId,
    required this.repository,
    required this.store,
    required this.isConsented,
    required this.now,
    required this.platform,
    this.countryCode,
  });

  /// Bundan kısa izlemeler (kanal arasında gezinme) sayılmaz.
  static const minDuration = Duration(seconds: 5);
  static const maxDuration = Duration(hours: 24);

  final String channelId;
  final AnalyticsRepository repository;
  final ConsentStore store;
  final bool Function() isConsented;
  final DateTime Function() now;
  final String? platform;
  final String? countryCode;

  DateTime? _startedAt;

  bool get isRunning => _startedAt != null;

  void start() {
    if (isConsented()) _startedAt ??= now();
  }

  Future<void> stop() async {
    final startedAt = _startedAt;
    _startedAt = null;
    final platform = this.platform;
    // İzin ölçüm sırasında geri çekildiyse hiçbir şey gönderilmez.
    if (startedAt == null || platform == null || !isConsented()) return;
    var duration = now().difference(startedAt);
    if (duration < minDuration) return;
    if (duration > maxDuration) duration = maxDuration;
    try {
      await repository.recordWatch(WatchSession(
        channelId: channelId,
        deviceId: await store.deviceId(now()),
        platform: platform,
        countryCode: countryCode,
        startedAt: startedAt,
        duration: duration,
      ));
    } catch (_) {
      // Analitik hatası izleyiciyi etkilemez.
    }
  }
}
