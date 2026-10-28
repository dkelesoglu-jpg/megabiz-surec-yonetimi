import 'dart:async';

import 'models.dart';
import 'repositories.dart';

/// Yalnızca geliştirme ve test için: sağlayıcıların açıkça test amaçlı
/// yayımladığı HLS akışları ve açık lisanslı (CC BY) Blender filmleri.
/// Ayrıntılar: docs/is-listeleri/yayin-lisansi.md
/// Sunucu tarafındaki karşılığı: supabase/seed.sql
const demoChannels = <Channel>[
  Channel(
    id: 'demo-apple-bipbop',
    name: 'Apple HLS Test (BipBop)',
    countryCode: 'US',
    category: ChannelCategory.other,
    language: 'en',
    attribution: 'Apple HLS developer example stream',
    isDemo: true,
  ),
  Channel(
    id: 'demo-mux-bbb',
    name: 'Big Buck Bunny',
    countryCode: 'NL',
    category: ChannelCategory.kids,
    language: 'en',
    attribution: '© Blender Foundation, CC BY 3.0 · stream: Mux test streams',
    isDemo: true,
  ),
  Channel(
    id: 'demo-mux-tos',
    name: 'Tears of Steel',
    countryCode: 'NL',
    category: ChannelCategory.entertainment,
    language: 'en',
    attribution: '© Blender Foundation, CC BY 3.0 · stream: Mux test streams',
    isDemo: true,
  ),
  Channel(
    id: 'demo-tr-haber',
    name: 'Demo Haber TR',
    countryCode: 'TR',
    category: ChannelCategory.news,
    language: 'tr',
    attribution: 'Yer tutucu: lisanslı kanal bulunana kadar demo akış',
    isDemo: true,
  ),
  Channel(
    id: 'demo-tr-spor',
    name: 'Demo Spor TR',
    countryCode: 'TR',
    category: ChannelCategory.sports,
    language: 'tr',
    attribution: 'Yer tutucu: lisanslı kanal bulunana kadar demo akış',
    isDemo: true,
  ),
];

const _bbb = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const _tos = 'https://test-streams.mux.dev/tos_ismc/main.m3u8';

const demoStreams = <String, String>{
  'demo-apple-bipbop':
      'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_adv_example_hevc/master.m3u8',
  'demo-mux-bbb': _bbb,
  'demo-mux-tos': _tos,
  'demo-tr-haber': _bbb,
  'demo-tr-spor': _tos,
};

class DemoChannelRepository implements ChannelRepository {
  @override
  Future<List<Channel>> fetchChannels() async => demoChannels;

  @override
  Future<String> streamUrl(String channelId, {String? countryCode}) async =>
      demoStreams[channelId] ?? (throw const AppException(AppErrorCode.notAvailable));
}

/// Demo odaları: kilitli oda ve yavaş mod uyarılarını sunucusuz denemek için.
const demoRooms = <String, ChatRoomState>{
  'demo-tr-haber': ChatRoomState(isLocked: true),
  'demo-tr-spor': ChatRoomState(slowModeSeconds: 30),
};

class DemoChatRepository implements ChatRepository {
  DemoChatRepository({this.rooms = demoRooms, DateTime Function()? now}) : _now = now ?? DateTime.now;

  final Map<String, ChatRoomState> rooms;
  final DateTime Function() _now;
  final _messages = <String, List<ChatMessage>>{};
  final _controllers = <String, StreamController<List<ChatMessage>>>{};
  var _nextId = 0;

  StreamController<List<ChatMessage>> _controllerFor(String channelId) =>
      _controllers.putIfAbsent(channelId, StreamController<List<ChatMessage>>.broadcast);

  @override
  Stream<List<ChatMessage>> watchMessages(String channelId) async* {
    yield List.unmodifiable(_messages[channelId] ?? const []);
    yield* _controllerFor(channelId).stream;
  }

  @override
  Future<void> send({required String channelId, required AppUser user, required String body}) async {
    // Sunucudaki before_chat_insert kurallarının aynısı.
    final room = rooms[channelId] ?? ChatRoomState.open;
    if (room.isLocked) throw const AppException(AppErrorCode.roomLocked);
    final list = _messages.putIfAbsent(channelId, () => []);
    final now = _now();
    final lastOwn = list.where((m) => m.userId == user.id).lastOrNull;
    if (room.slowModeSeconds > 0 &&
        lastOwn != null &&
        now.difference(lastOwn.createdAt) < Duration(seconds: room.slowModeSeconds)) {
      throw const AppException(AppErrorCode.slowMode);
    }
    list.add(ChatMessage(
      id: '${_nextId++}',
      channelId: channelId,
      userId: user.id,
      username: user.username,
      body: body,
      createdAt: now,
    ));
    _controllerFor(channelId).add(List.unmodifiable(list));
  }

  @override
  Future<void> report({required String messageId, required ReportReason reason}) async {}

  @override
  Stream<ChatRoomState> watchRoom(String channelId) => Stream.value(rooms[channelId] ?? ChatRoomState.open);

  @override
  Stream<ModerationStatus> watchMyStatus(String userId) => Stream.value(ModerationStatus.clear);
}

/// Demo modunda sunucu yok: kayıtlar yalnızca bellekte tutulur (testlerde incelenir).
class DemoAnalyticsRepository implements AnalyticsRepository {
  final sessions = <WatchSession>[];
  final activity = <String>[];

  @override
  Future<void> recordWatch(WatchSession session) async => sessions.add(session);

  @override
  Future<void> touchActivity(String platform) async => activity.add(platform);
}

class DemoAuthRepository implements AuthRepository {
  @override
  Future<AppUser?> restoreSession() async => null;

  @override
  Future<AppUser> signInWithEmail({required String email, required String password}) async =>
      AppUser(id: 'demo-${email.hashCode}', username: email.split('@').first, email: email);

  @override
  Future<AppUser> signUpWithEmail({required String email, required String password}) =>
      signInWithEmail(email: email, password: password);

  @override
  Future<void> signOut() async {}

  @override
  Future<void> deleteAccount() async {}
}

class DemoFavoritesRepository implements FavoritesRepository {
  final _ids = <String>{};

  @override
  Future<Set<String>> load() async => {..._ids};

  @override
  Future<void> add(String channelId) async => _ids.add(channelId);

  @override
  Future<void> remove(String channelId) async => _ids.remove(channelId);
}

class DemoBlocksRepository implements BlocksRepository {
  @override
  Future<Map<String, String>> load() async => const {};

  @override
  Future<void> block(String userId) async {}

  @override
  Future<void> unblock(String userId) async {}
}
