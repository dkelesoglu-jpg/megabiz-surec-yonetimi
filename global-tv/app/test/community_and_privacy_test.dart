import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:global_tv/app.dart';
import 'package:global_tv/core/analytics.dart';
import 'package:global_tv/core/providers.dart';
import 'package:global_tv/core/router.dart';
import 'package:global_tv/data/demo_repositories.dart';
import 'package:global_tv/data/models.dart';
import 'package:global_tv/l10n/gen/app_localizations_en.dart';
import 'package:global_tv/l10n/gen/app_localizations_tr.dart';
import 'package:global_tv/shared/error_text.dart';

const _user = AppUser(id: 'u1', username: 'deneme', email: 'deneme@ornek.com');

/// Sunucu davranışını taklit eden sohbet deposu: moderasyon durumu ve mesajlar elle verilir.
class _FakeChat extends DemoChatRepository {
  _FakeChat({this.status = ModerationStatus.clear, this.messages = const [], this.sendError, super.rooms});

  final ModerationStatus status;
  final List<ChatMessage> messages;
  final AppErrorCode? sendError;

  @override
  Stream<List<ChatMessage>> watchMessages(String channelId) =>
      messages.isEmpty ? super.watchMessages(channelId) : Stream.value(messages);

  @override
  Stream<ModerationStatus> watchMyStatus(String userId) => Stream.value(status);

  @override
  Future<void> send({required String channelId, required AppUser user, required String body}) async {
    if (sendError != null) throw AppException(sendError!);
    return super.send(channelId: channelId, user: user, body: body);
  }
}

class _Clock {
  _Clock(this.now);
  DateTime now;
  DateTime call() => now;
}

Future<ProviderContainer> _pumpApp(
  WidgetTester tester, {
  Locale locale = const Locale('tr'),
  AppUser? user = _user,
  DemoChatRepository? chat,
  ConsentStore? store,
  DemoAnalyticsRepository? analytics,
  _Clock? clock,
  Size size = const Size(390, 844),
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  final scope = ProviderScope(
    overrides: [
      localeProvider.overrideWithBuild((ref, notifier) => locale),
      authProvider.overrideWithBuild((ref, notifier) => user),
      consentStoreProvider.overrideWithValue(store ?? MemoryConsentStore(consent: false)),
      if (chat != null) chatRepositoryProvider.overrideWithValue(chat),
      if (analytics != null) analyticsRepositoryProvider.overrideWithValue(analytics),
      if (clock != null) clockProvider.overrideWithValue(clock.call),
    ],
    child: const GlobalTvApp(),
  );
  await tester.pumpWidget(scope);
  await tester.pumpAndSettle();
  return ProviderScope.containerOf(tester.element(find.byType(GlobalTvApp)));
}

Future<void> _openChannel(WidgetTester tester, String name) async {
  final id = demoChannels.firstWhere((c) => c.name == name).id;
  // Listeye dokunmak yerine doğrudan açılır: küçük ekranda liste alanı çok dar kalabilir.
  ProviderScope.containerOf(tester.element(find.byType(GlobalTvApp))).read(routerProvider).push(Routes.channel(id));
  // Video eklentisi test ortamında yok; oynatıcı hata durumuna düşer, sohbet çalışır.
  for (var i = 0; i < 10; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}

TextField _input(WidgetTester tester) => tester.widget<TextField>(find.byKey(const Key('chatInput')));

/// Engelleyen durumda (yasak, susturma, kilit) yazma alanı yerine uyarı gösterilir.
void _expectCannotWrite() {
  expect(find.byKey(const Key('chatInput')), findsNothing);
  expect(find.widgetWithIcon(IconButton, Icons.send), findsNothing);
  expect(find.byKey(const Key('chatNotice')), findsOneWidget);
}

IconButton _sendButton(WidgetTester tester) =>
    tester.widget<IconButton>(find.widgetWithIcon(IconButton, Icons.send));

void main() {
  // -------------------------------------------------------------------------
  // İzlenme ölçümü ve gizlilik
  // -------------------------------------------------------------------------
  group('WatchTracker', () {
    late _Clock clock;
    late DemoAnalyticsRepository repo;
    late MemoryConsentStore store;
    var consented = true;

    WatchTracker tracker() => WatchTracker(
          channelId: 'demo-mux-bbb',
          repository: repo,
          store: store,
          isConsented: () => consented,
          now: clock.call,
          platform: 'android',
          countryCode: 'TR',
        );

    setUp(() {
      clock = _Clock(DateTime.utc(2026, 10, 28, 12));
      repo = DemoAnalyticsRepository();
      store = MemoryConsentStore(consent: true);
      consented = true;
    });

    test('izin varsa süre, platform, ülke ve rastgele cihaz kimliği gönderilir; kişisel veri yok', () async {
      final t = tracker()..start();
      clock.now = clock.now.add(const Duration(minutes: 2, seconds: 5));
      await t.stop();
      expect(repo.sessions, hasLength(1));
      final s = repo.sessions.single;
      expect(s.duration, const Duration(minutes: 2, seconds: 5));
      expect(s.platform, 'android');
      expect(s.countryCode, 'TR');
      expect(s.deviceId, matches(RegExp(r'^[0-9a-f]{32}$')));
    });

    test('izin yoksa hiçbir şey ölçülmez ve gönderilmez', () async {
      consented = false;
      final t = tracker()..start();
      expect(t.isRunning, isFalse);
      clock.now = clock.now.add(const Duration(minutes: 10));
      await t.stop();
      expect(repo.sessions, isEmpty);
    });

    test('izin izleme sırasında geri çekilirse gönderilmez', () async {
      final t = tracker()..start();
      clock.now = clock.now.add(const Duration(minutes: 10));
      consented = false;
      await t.stop();
      expect(repo.sessions, isEmpty);
    });

    test('5 saniyeden kısa geçişler sayılmaz; 24 saati aşan süre kırpılır', () async {
      final t = tracker()..start();
      clock.now = clock.now.add(const Duration(seconds: 4));
      await t.stop();
      expect(repo.sessions, isEmpty);

      t.start();
      clock.now = clock.now.add(const Duration(hours: 30));
      await t.stop();
      expect(repo.sessions.single.duration, WatchTracker.maxDuration);
    });

    test('cihaz kimliği 30 günde bir yenilenir', () async {
      final id = await store.deviceId(clock.now);
      expect(await store.deviceId(clock.now.add(const Duration(days: 29))), id);
      expect(await store.deviceId(clock.now.add(const Duration(days: 31))), isNot(id));
    });
  });

  testWidgets('izin kartı: "İzin verme" seçilince kart kaybolur, tercih saklanır, veri gönderilmez',
      (tester) async {
    final store = MemoryConsentStore();
    final analytics = DemoAnalyticsRepository();
    await _pumpApp(tester, store: store, analytics: analytics);

    expect(find.byKey(const Key('analyticsConsent')), findsOneWidget);
    expect(find.text('İzin ver'), findsOneWidget);
    expect(find.text('İzin verme'), findsOneWidget);
    expect(analytics.activity, isEmpty, reason: 'izin verilmeden aktiflik kaydı gönderilmemeli');

    await tester.tap(find.text('İzin verme'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('analyticsConsent')), findsNothing);
    expect(store.consent, isFalse);
    expect(analytics.activity, isEmpty);
  });

  testWidgets('izin verilince giriş yapmış kullanıcı için günlük aktiflik kaydı gönderilir', (tester) async {
    final store = MemoryConsentStore();
    final analytics = DemoAnalyticsRepository();
    await _pumpApp(tester, store: store, analytics: analytics);

    await tester.tap(find.text('İzin ver'));
    await tester.pumpAndSettle();
    expect(store.consent, isTrue);
    expect(analytics.activity, ['android']);
  });

  testWidgets('gizlilik ekranı: izin kapatılınca cihaz kimliği silinir', (tester) async {
    final store = MemoryConsentStore(consent: true);
    await store.deviceId(DateTime.now());
    await _pumpApp(tester, store: store);

    await tester.tap(find.text('Profil'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Gizlilik ve veriler'));
    await tester.pumpAndSettle();

    expect(find.text('Hiçbir zaman toplanmayanlar'), findsOneWidget);
    final sw = find.byKey(const Key('analyticsSwitch'));
    expect(tester.widget<SwitchListTile>(sw).value, isTrue);
    await tester.tap(sw);
    await tester.pumpAndSettle();
    expect(tester.widget<SwitchListTile>(sw).value, isFalse);
    expect(store.consent, isFalse);
    expect(store.id, isNull);
    expect(find.text('Tercihiniz kaydedildi.'), findsOneWidget);
  });

  // -------------------------------------------------------------------------
  // Sohbet: oda kilidi, yavaş mod, moderasyon kararları
  // -------------------------------------------------------------------------
  testWidgets('kilitli oda: uyarı görünür, yazma alanı ve gönder düğmesi kapalı', (tester) async {
    await _pumpApp(tester);
    await _openChannel(tester, 'Demo Haber TR');

    expect(find.textContaining('moderatörler tarafından geçici olarak kilitlendi'), findsOneWidget);
    _expectCannotWrite();
    expect(tester.takeException(), isNull);
  });

  testWidgets('kilitli oda uyarısı İngilizce', (tester) async {
    await _pumpApp(tester, locale: const Locale('en'));
    await _openChannel(tester, 'Demo Haber TR');
    expect(find.text('This chat room has been temporarily locked by moderators. You can still read messages.'),
        findsOneWidget);
  });

  testWidgets('yavaş mod: bilgi, gönderimden sonra kalan süre geri sayımı, süre dolunca yeniden gönderim',
      (tester) async {
    final clock = _Clock(DateTime.now());
    // Sunucu (demo) ve uygulama aynı saati kullanır.
    await _pumpApp(tester, clock: clock, chat: DemoChatRepository(now: clock.call));
    await _openChannel(tester, 'Demo Spor TR');

    expect(find.text('Yavaş mod açık: 30 saniyede bir mesaj gönderebilirsiniz.'), findsOneWidget);

    await tester.enterText(find.byKey(const Key('chatInput')), 'gol!');
    await tester.tap(find.widgetWithIcon(IconButton, Icons.send));
    await tester.pump();
    expect(find.text('gol!'), findsOneWidget);
    expect(find.text('Yavaş mod: yeni mesaj için 30 sn bekleyin.'), findsOneWidget);
    expect(_sendButton(tester).onPressed, isNull);
    expect(_input(tester).enabled, isTrue, reason: 'beklerken yazmaya devam edilebilir');

    clock.now = clock.now.add(const Duration(seconds: 12));
    await tester.pump(const Duration(seconds: 1));
    expect(find.text('Yavaş mod: yeni mesaj için 18 sn bekleyin.'), findsOneWidget);

    clock.now = clock.now.add(const Duration(seconds: 19));
    await tester.pump(const Duration(seconds: 1));
    expect(find.text('Yavaş mod açık: 30 saniyede bir mesaj gönderebilirsiniz.'), findsOneWidget);
    expect(_sendButton(tester).onPressed, isNotNull);
  });

  testWidgets('sunucu yavaş mod hatası anlaşılır mesajla gösterilir, mesaj kaybolmaz', (tester) async {
    final chat = _FakeChat(sendError: AppErrorCode.slowMode, rooms: const {'demo-mux-bbb': ChatRoomState(slowModeSeconds: 60)});
    await _pumpApp(tester, chat: chat);
    await _openChannel(tester, 'Big Buck Bunny');

    await tester.enterText(find.byKey(const Key('chatInput')), 'merhaba');
    await tester.tap(find.widgetWithIcon(IconButton, Icons.send));
    await tester.pump();
    expect(find.text('Yavaş mod açık. Bir sonraki mesajınız için lütfen bekleyin.'), findsOneWidget);
    expect(find.text('Yavaş mod: yeni mesaj için 1 dk bekleyin.'), findsOneWidget);
    expect(_input(tester).controller!.text, 'merhaba');
  });

  testWidgets('susturulan kullanıcı: kalan süre sohbette ve profilde görünür, yazamaz', (tester) async {
    final clock = _Clock(DateTime.now());
    final chat = _FakeChat(status: ModerationStatus(mutedUntil: clock.now.add(const Duration(minutes: 23))));
    await _pumpApp(tester, chat: chat, clock: clock);
    await _openChannel(tester, 'Big Buck Bunny');

    expect(find.text('Bir moderatör sizi sohbette susturdu. 23 dk sonra tekrar yazabilirsiniz.'), findsOneWidget);
    _expectCannotWrite();

    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Profil'));
    await tester.pumpAndSettle();
    expect(find.text('Sohbette susturuldunuz · kalan 23 dk'), findsOneWidget);
  });

  testWidgets('susturma süresi dolunca kullanıcı yeniden yazabilir', (tester) async {
    final clock = _Clock(DateTime.now());
    final chat = _FakeChat(status: ModerationStatus(mutedUntil: clock.now.add(const Duration(seconds: 3))));
    await _pumpApp(tester, chat: chat, clock: clock);
    await _openChannel(tester, 'Big Buck Bunny');
    expect(find.text('Bir moderatör sizi sohbette susturdu. 3 sn sonra tekrar yazabilirsiniz.'), findsOneWidget);

    clock.now = clock.now.add(const Duration(seconds: 4));
    await tester.pump(const Duration(seconds: 1));
    expect(find.byKey(const Key('chatNotice')), findsNothing);
    expect(_input(tester).enabled, isTrue);
  });

  testWidgets('yasaklı kullanıcı: sohbet kapalı, yayın izlemeye devam edebileceği söylenir',
      (tester) async {
    const chat = ModerationStatus(isBanned: true);
    await _pumpApp(tester, chat: _FakeChat(status: chat));
    await _openChannel(tester, 'Big Buck Bunny');
    expect(find.textContaining('sohbete katılımınız kapatıldı. Yayınları izlemeye devam edebilirsiniz.'),
        findsOneWidget);
    _expectCannotWrite();
  });

  testWidgets('gizlenen kendi mesajı açıklamasıyla görünür; başkasının gizli mesajı gösterilmez', (tester) async {
    final t = DateTime.now();
    final chat = _FakeChat(messages: [
      ChatMessage(id: '1', channelId: 'demo-mux-bbb', userId: _user.id, username: 'deneme', body: 'kendi mesajım', createdAt: t, isHidden: true),
      ChatMessage(id: '2', channelId: 'demo-mux-bbb', userId: 'u2', username: 'baskasi', body: 'başkasının gizli mesajı', createdAt: t, isHidden: true),
      ChatMessage(id: '3', channelId: 'demo-mux-bbb', userId: 'u2', username: 'baskasi', body: 'normal mesaj', createdAt: t),
    ]);
    await _pumpApp(tester, chat: chat);
    await _openChannel(tester, 'Big Buck Bunny');

    expect(find.text('kendi mesajım'), findsOneWidget);
    expect(find.text('Bu mesajı yalnızca siz görüyorsunuz: bir moderatör topluluk kuralları nedeniyle gizledi.'),
        findsOneWidget);
    expect(find.text('başkasının gizli mesajı'), findsNothing);
    expect(find.text('normal mesaj'), findsOneWidget);
  });

  testWidgets('misafir için oda uyarıları değil giriş çağrısı gösterilir', (tester) async {
    await _pumpApp(tester, user: null);
    await _openChannel(tester, 'Demo Haber TR');
    expect(find.text('Sohbete katılmak için giriş yapın.'), findsOneWidget);
    expect(find.byKey(const Key('chatNotice')), findsNothing);
  });

  // Uyarı kutuları küçük, yatay ve büyük yazı tipli ekranlarda taşma yapmamalı.
  for (final (name, size, scale) in const [
    ('küçük ekran', Size(390, 420), 1.0),
    ('yatay', Size(844, 390), 1.0),
    ('büyük yazı tipi', Size(390, 844), 1.6),
  ]) {
    for (final locale in const [Locale('tr'), Locale('en')]) {
      testWidgets('$name (${locale.languageCode}): yasak uyarısı taşma yapmaz', (tester) async {
        tester.platformDispatcher.textScaleFactorTestValue = scale;
        addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
        await _pumpApp(tester, locale: locale, size: size, chat: _FakeChat(status: const ModerationStatus(isBanned: true)));
        await _openChannel(tester, 'Big Buck Bunny');
        expect(tester.takeException(), isNull);
        expect(find.byKey(const Key('chatNotice')), findsOneWidget);
      });
    }
  }

  // -------------------------------------------------------------------------
  // Hata ve süre metinleri: her hata kodunun TR ve EN karşılığı var
  // -------------------------------------------------------------------------
  test('her hata kodu Türkçe ve İngilizce anlaşılır metne çevrilir', () {
    for (final l10n in [AppLocalizationsTr(), AppLocalizationsEn()]) {
      final texts = {for (final c in AppErrorCode.values) c: errorText(l10n, AppException(c))};
      for (final c in AppErrorCode.values.where((c) => c != AppErrorCode.unknown)) {
        expect(texts[c], isNot(texts[AppErrorCode.unknown]), reason: '$c genel hata metnine düşmemeli');
      }
    }
    expect(errorText(AppLocalizationsEn(), const AppException(AppErrorCode.roomLocked)),
        "This chat room is locked; messages can't be sent right now.");
  });

  test('kalan süre biçimi', () {
    final tr = AppLocalizationsTr();
    final en = AppLocalizationsEn();
    expect(remainingText(tr, const Duration(milliseconds: 200)), '1 sn');
    expect(remainingText(tr, const Duration(seconds: 45)), '45 sn');
    expect(remainingText(tr, const Duration(seconds: 61)), '2 dk');
    expect(remainingText(tr, const Duration(hours: 2, minutes: 5)), '2 sa 5 dk');
    expect(remainingText(tr, const Duration(days: 2, hours: 1)), '3 gün');
    expect(remainingText(en, const Duration(hours: 20)), '20 h 0 min');
    expect(remainingText(en, const Duration(hours: 24)), '1 day');
  });

  test('demo odaları sunucudaki kuralları uygular', () async {
    final clock = _Clock(DateTime.utc(2026, 10, 28, 12));
    final chat = DemoChatRepository(now: clock.call);
    await expectLater(chat.send(channelId: 'demo-tr-haber', user: _user, body: 'x'),
        throwsA(isA<AppException>().having((e) => e.code, 'code', AppErrorCode.roomLocked)));
    await chat.send(channelId: 'demo-tr-spor', user: _user, body: 'bir');
    await expectLater(chat.send(channelId: 'demo-tr-spor', user: _user, body: 'iki'),
        throwsA(isA<AppException>().having((e) => e.code, 'code', AppErrorCode.slowMode)));
    clock.now = clock.now.add(const Duration(seconds: 30));
    await chat.send(channelId: 'demo-tr-spor', user: _user, body: 'üç');
    await chat.send(channelId: 'demo-mux-bbb', user: _user, body: 'serbest oda');
    await chat.send(channelId: 'demo-mux-bbb', user: _user, body: 'serbest oda 2');
  });

  test('analitik izni varsayılan olarak verilmemiştir', () async {
    final container = ProviderContainer(overrides: [consentStoreProvider.overrideWithValue(MemoryConsentStore())]);
    addTearDown(container.dispose);
    expect(container.read(analyticsConsentProvider), AnalyticsConsent.loading);
    await Future<void>.delayed(Duration.zero);
    expect(container.read(analyticsConsentProvider), AnalyticsConsent.unasked);
    expect(container.read(analyticsConsentProvider.notifier).granted, isFalse);
  });
}
