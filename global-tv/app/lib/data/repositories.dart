import 'models.dart';

/// Ekranlar yalnızca bu arayüzleri bilir. Demo modunda `Demo…`, Supabase
/// yapılandırıldığında `Supabase…` uygulamaları kullanılır.
abstract interface class ChannelRepository {
  Future<List<Channel>> fetchChannels();

  /// Yayın hakkı ve ülke kontrolünden geçen HTTPS HLS adresi.
  Future<String> streamUrl(String channelId, {String? countryCode});
}

abstract interface class ChatRepository {
  Stream<List<ChatMessage>> watchMessages(String channelId);
  Future<void> send({required String channelId, required AppUser user, required String body});
  Future<void> report({required String messageId, required ReportReason reason});

  /// Oda kilidi ve yavaş mod; moderatör değiştirdiğinde anında güncellenir.
  Stream<ChatRoomState> watchRoom(String channelId);

  /// Kullanıcının kendi susturma / yasak durumu.
  Stream<ModerationStatus> watchMyStatus(String userId);
}

/// Yalnızca kullanıcı analitik iznini verdiyse çağrılır.
abstract interface class AnalyticsRepository {
  Future<void> recordWatch(WatchSession session);

  /// Günlük aktif kullanıcı sayımı (giriş yapmış kullanıcı, günde bir kayıt).
  Future<void> touchActivity(String platform);
}

abstract interface class AuthRepository {
  /// Uygulama açılışında kayıtlı oturumu geri yükler.
  Future<AppUser?> restoreSession();
  Future<AppUser> signInWithEmail({required String email, required String password});
  Future<AppUser> signUpWithEmail({required String email, required String password});
  Future<void> signOut();
  Future<void> deleteAccount();
}

abstract interface class FavoritesRepository {
  Future<Set<String>> load();
  Future<void> add(String channelId);
  Future<void> remove(String channelId);
}

abstract interface class BlocksRepository {
  /// userId → kullanıcı adı
  Future<Map<String, String>> load();
  Future<void> block(String userId);
  Future<void> unblock(String userId);
}
