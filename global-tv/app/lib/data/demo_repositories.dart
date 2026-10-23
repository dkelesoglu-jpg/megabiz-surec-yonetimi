import 'dart:async';

import 'models.dart';
import 'repositories.dart';

/// Yalnızca geliştirme ve test için: sağlayıcıların açıkça test amaçlı
/// yayımladığı HLS akışları ve açık lisanslı (CC BY) Blender filmleri.
/// Ayrıntılar: docs/is-listeleri/yayin-lisansi.md
const demoChannels = <Channel>[
  Channel(
    id: 'demo-apple-bipbop',
    name: 'Apple HLS Test (BipBop)',
    countryCode: 'US',
    category: ChannelCategory.other,
    language: 'en',
    streamUrl:
        'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_adv_example_hevc/master.m3u8',
    attribution: 'Apple HLS developer example stream',
    isDemo: true,
  ),
  Channel(
    id: 'demo-mux-bbb',
    name: 'Big Buck Bunny',
    countryCode: 'INT',
    category: ChannelCategory.kids,
    language: 'en',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    attribution: '© Blender Foundation, CC BY 3.0 · stream: Mux test streams',
    isDemo: true,
  ),
  Channel(
    id: 'demo-mux-tos',
    name: 'Tears of Steel',
    countryCode: 'NL',
    category: ChannelCategory.entertainment,
    language: 'en',
    streamUrl: 'https://test-streams.mux.dev/tos_ismc/main.m3u8',
    attribution: '© Blender Foundation, CC BY 3.0 · stream: Mux test streams',
    isDemo: true,
  ),
  Channel(
    id: 'demo-tr-haber',
    name: 'Demo Haber TR',
    countryCode: 'TR',
    category: ChannelCategory.news,
    language: 'tr',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    attribution: 'Yer tutucu: lisanslı kanal bulunana kadar demo akış',
    isDemo: true,
  ),
  Channel(
    id: 'demo-tr-spor',
    name: 'Demo Spor TR',
    countryCode: 'TR',
    category: ChannelCategory.sports,
    language: 'tr',
    streamUrl: 'https://test-streams.mux.dev/tos_ismc/main.m3u8',
    attribution: 'Yer tutucu: lisanslı kanal bulunana kadar demo akış',
    isDemo: true,
  ),
];

class DemoChannelRepository implements ChannelRepository {
  @override
  Future<List<Channel>> fetchChannels() async => demoChannels;
}

class DemoChatRepository implements ChatRepository {
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
    final list = _messages.putIfAbsent(channelId, () => []);
    list.add(ChatMessage(
      id: '${_nextId++}',
      channelId: channelId,
      userId: user.id,
      username: user.username,
      body: body,
      createdAt: DateTime.now(),
    ));
    _controllerFor(channelId).add(List.unmodifiable(list));
  }

  @override
  Future<void> report({required String messageId, required ReportReason reason}) async {}
}

class DemoAuthRepository implements AuthRepository {
  @override
  Future<AppUser> signInWithEmail({required String email, required String password}) async =>
      AppUser(id: 'demo-${email.hashCode}', username: email.split('@').first, email: email);

  @override
  Future<void> signOut() async {}

  @override
  Future<void> requestAccountDeletion() async {}
}
