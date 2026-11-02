// Uygulamanın Supabase depolarını gerçek sunucuya karşı dener (yerel yığın veya globaltv-dev).
// Ortam değişkenleri yoksa atlanır; `flutter test` (test/ klasörü) bu dosyayı çalıştırmaz.
//
//   SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... SUPABASE_SECRET_KEY=... GLOBALTV_REMOTE_TESTS=1 \
//     flutter test test_remote
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:global_tv/data/models.dart';
import 'package:global_tv/data/supabase_repositories.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

const bbb = '00000000-0000-4000-8000-000000000002';
const tos = '00000000-0000-4000-8000-000000000003';
const forbiddenRefs = ['xklessegjdczwujitwuw', 'rggxrvanfofmnqolucnc']; // şirket projeleri

void main() {
  final env = Platform.environment;
  final url = env['SUPABASE_URL'] ?? '';
  final key = env['SUPABASE_PUBLISHABLE_KEY'] ?? '';
  final secret = env['SUPABASE_SECRET_KEY'] ?? '';
  final skip = url.isEmpty || env['GLOBALTV_REMOTE_TESTS'] != '1' || forbiddenRefs.any(url.contains)
      ? 'Gerçek sunucu tanımlı değil (veya şirket projesi)'
      : null;
  final run = DateTime.now().millisecondsSinceEpoch.toRadixString(36);
  final created = <String>[];
  late SupabaseClient admin;

  SupabaseClient client() => SupabaseClient(url, key, authOptions: const AuthClientOptions(autoRefreshToken: false, authFlowType: AuthFlowType.implicit));

  Future<(SupabaseClient, AppUser)> signedUp(String tag) async {
    final c = client();
    final user = await SupabaseAuthRepository(c)
        .signUpWithEmail(email: 'app-$run-$tag@example.com', password: 'Gt-$run-Pass9');
    created.add(user.id);
    return (c, user);
  }

  setUpAll(() {
    if (skip != null) return;
    admin = SupabaseClient(url, secret);
  });
  tearDownAll(() async {
    if (skip != null) return;
    await admin.from('chat_room_settings').delete().eq('channel_id', tos);
    for (final id in created) {
      await admin.auth.admin.deleteUser(id);
    }
  });

  test('kayıt ve giriş: profil kullanıcı adı döner; yanlış şifre anlaşılır hata verir', () async {
    final (_, user) = await signedUp('a');
    expect(user.username, isNotEmpty);
    final auth = SupabaseAuthRepository(client());
    final again = await auth.signInWithEmail(email: 'app-$run-a@example.com', password: 'Gt-$run-Pass9');
    expect(again.id, user.id);
    await expectLater(auth.signInWithEmail(email: 'app-$run-a@example.com', password: 'yanlis-sifre'),
        throwsA(isA<AppException>().having((e) => e.code, 'code', AppErrorCode.invalidCredentials)));
    await expectLater(auth.signUpWithEmail(email: 'app-$run-a@example.com', password: 'Gt-$run-Pass9'),
        throwsA(isA<AppException>().having((e) => e.code, 'code', AppErrorCode.emailTaken)));
  }, skip: skip);

  test('kanallar: yalnızca hakkı geçerli olanlar gelir', () async {
    final channels = await SupabaseChannelRepository(client()).fetchChannels();
    expect(channels.map((c) => c.id), contains(bbb));
    expect(channels.map((c) => c.id), isNot(contains('00000000-0000-4000-8000-000000000005')));
  }, skip: skip);

  test('sohbet: gönderilen mesaj diğer kullanıcının akışında görünür', () async {
    final (ca, a) = await signedUp('b');
    final (cb, _) = await signedUp('c');
    final stream = SupabaseChatRepository(cb).watchMessages(bbb);
    final seen = stream.firstWhere((list) => list.any((m) => m.body == 'uygulama $run')).timeout(const Duration(seconds: 20));
    await Future<void>.delayed(const Duration(seconds: 2));
    await SupabaseChatRepository(ca).send(channelId: bbb, user: a, body: 'uygulama $run');
    final list = await seen;
    expect(list.firstWhere((m) => m.body == 'uygulama $run').userId, a.id);
  }, skip: skip);

  test('oda kilidi ve yavaş mod: akış güncellenir, hatalar doğru koda çevrilir', () async {
    final (c, u) = await signedUp('d');
    final repo = SupabaseChatRepository(c);
    final locked = repo.watchRoom(tos).firstWhere((r) => r.isLocked).timeout(const Duration(seconds: 20));
    await Future<void>.delayed(const Duration(seconds: 2));
    await admin.from('chat_room_settings').upsert({'channel_id': tos, 'is_locked': true});
    expect((await locked).isLocked, isTrue);
    await expectLater(repo.send(channelId: tos, user: u, body: 'x'),
        throwsA(isA<AppException>().having((e) => e.code, 'code', AppErrorCode.roomLocked)));

    await admin.from('chat_room_settings').upsert({'channel_id': tos, 'is_locked': false, 'slow_mode_seconds': 30});
    await repo.send(channelId: tos, user: u, body: 'ilk');
    await expectLater(repo.send(channelId: tos, user: u, body: 'ikinci'),
        throwsA(isA<AppException>().having((e) => e.code, 'code', AppErrorCode.slowMode)));
  }, skip: skip);

  test('susturma ve yasak: durum akışı güncellenir, gönderim muted/banned koduyla reddedilir', () async {
    final (c, u) = await signedUp('e');
    final repo = SupabaseChatRepository(c);
    final muted = repo.watchMyStatus(u.id).firstWhere((s) => s.mutedUntil != null).timeout(const Duration(seconds: 20));
    await Future<void>.delayed(const Duration(seconds: 2));
    await admin.from('profiles').update({'muted_until': DateTime.now().toUtc().add(const Duration(minutes: 30)).toIso8601String()}).eq('id', u.id);
    expect((await muted).isMutedAt(DateTime.now()), isTrue);
    await expectLater(repo.send(channelId: bbb, user: u, body: 'x'),
        throwsA(isA<AppException>().having((e) => e.code, 'code', AppErrorCode.muted)));

    await admin.from('profiles').update({'muted_until': null, 'is_banned': true}).eq('id', u.id);
    await expectLater(repo.send(channelId: bbb, user: u, body: 'x'),
        throwsA(isA<AppException>().having((e) => e.code, 'code', AppErrorCode.banned)));
  }, skip: skip);

  test('gizlenen mesaj yazarına isHidden ile gelir', () async {
    final (c, u) = await signedUp('f');
    await SupabaseChatRepository(c).send(channelId: bbb, user: u, body: 'gizlenecek $run');
    await admin.from('chat_messages').update({'is_hidden': true}).eq('body', 'gizlenecek $run');
    final list = await SupabaseChatRepository(c).watchMessages(bbb)
        .firstWhere((l) => l.any((m) => m.body == 'gizlenecek $run')).timeout(const Duration(seconds: 20));
    expect(list.firstWhere((m) => m.body == 'gizlenecek $run').isHidden, isTrue);
  }, skip: skip);

  test('engel listesi: kullanıcı adı başkasının profiline erişmeden gelir', () async {
    final (ca, _) = await signedUp('g');
    final (_, b) = await signedUp('h');
    final blocks = SupabaseBlocksRepository(ca);
    await blocks.block(b.id);
    expect(await blocks.load(), {b.id: b.username});
    await blocks.unblock(b.id);
    expect(await blocks.load(), isEmpty);
  }, skip: skip);

  test('analitik: anonim izlenme ve günlük aktiflik kaydı kabul edilir', () async {
    final (c, _) = await signedUp('i');
    final repo = SupabaseAnalyticsRepository(c);
    await repo.recordWatch(WatchSession(
      channelId: bbb, deviceId: '0123456789abcdef0123456789abcdef', platform: 'android',
      countryCode: 'TR', startedAt: DateTime.now().subtract(const Duration(minutes: 3)), duration: const Duration(minutes: 3)));
    await repo.touchActivity('android');
    final rows = await admin.from('watch_sessions').select('user_id, duration_seconds').eq('device_hash', '0123456789abcdef0123456789abcdef');
    expect(rows.last['user_id'], isNull, reason: 'izlenme kaydı anonim olmalı');
    expect(rows.last['duration_seconds'], 180);
  }, skip: skip);

  test('hesap silme isteği (Edge Function) — yerel yığında Edge Runtime kapalı', () {}, skip: skip ?? 'Edge Function testi gerçek globaltv-dev projesinde yapılacak');
}
