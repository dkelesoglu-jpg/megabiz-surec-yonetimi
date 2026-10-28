enum ChannelCategory { news, sports, entertainment, kids, music, documentary, other }

class Channel {
  const Channel({
    required this.id,
    required this.name,
    required this.countryCode,
    required this.category,
    required this.language,
    this.attribution,
    this.isDemo = false,
  });

  final String id;
  final String name;

  /// ISO 3166-1 alpha-2 ülke kodu (ör. TR, US).
  final String countryCode;
  final ChannelCategory category;
  final String language;

  /// Lisansın gerektirdiği atıf metni (ör. CC BY).
  final String? attribution;
  final bool isDemo;
}

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.channelId,
    required this.userId,
    required this.username,
    required this.body,
    required this.createdAt,
    this.isHidden = false,
  });

  final String id;
  final String channelId;

  /// Hesabı silinmiş kullanıcılarda `null`.
  final String? userId;
  final String username;
  final String body;
  final DateTime createdAt;

  /// Moderatör gizledi. Sunucu gizli mesajı yalnızca yazarına (ve moderatörlere) gönderir.
  final bool isHidden;
}

/// Sohbet odası ayarları (oda = kanal). Moderatörler panelden değiştirir.
class ChatRoomState {
  const ChatRoomState({this.isLocked = false, this.slowModeSeconds = 0});

  static const open = ChatRoomState();

  final bool isLocked;

  /// 0 = kapalı. Kullanıcı bu odada en fazla bu sürede bir mesaj gönderebilir.
  final int slowModeSeconds;
}

/// Oturum açmış kullanıcının kendi moderasyon durumu.
class ModerationStatus {
  const ModerationStatus({this.isBanned = false, this.mutedUntil});

  static const clear = ModerationStatus();

  final bool isBanned;
  final DateTime? mutedUntil;

  bool isMutedAt(DateTime now) => mutedUntil != null && mutedUntil!.isAfter(now);
}

/// Anonim izlenme kaydı. Kullanıcı kimliği, e-posta veya konum içermez.
class WatchSession {
  const WatchSession({
    required this.channelId,
    required this.deviceId,
    required this.platform,
    required this.startedAt,
    required this.duration,
    this.countryCode,
  });

  final String channelId;

  /// Uygulamanın ürettiği rastgele kimlik (donanım kimliği değil); 30 günde bir yenilenir.
  final String deviceId;

  /// `android` | `ios`
  final String platform;

  /// Cihazın bölge ayarından (ör. TR). Konum veya IP kullanılmaz.
  final String? countryCode;
  final DateTime startedAt;
  final Duration duration;
}

enum ReportReason { spam, abuse, hate, sexual, other }

class AppUser {
  const AppUser({required this.id, required this.username, required this.email});

  final String id;
  final String username;
  final String email;
}

/// Kullanıcıya gösterilebilecek, tanımlı hata türleri.
enum AppErrorCode {
  invalidCredentials,
  emailTaken,
  confirmEmail,
  rateLimited,
  roomLocked,
  slowMode,
  muted,
  banned,
  notAvailable,
  geoBlocked,
  unknown,
}

class AppException implements Exception {
  const AppException(this.code);

  final AppErrorCode code;

  @override
  String toString() => 'AppException($code)';
}
