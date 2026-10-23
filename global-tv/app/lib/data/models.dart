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
  });

  final String id;
  final String channelId;

  /// Hesabı silinmiş kullanıcılarda `null`.
  final String? userId;
  final String username;
  final String body;
  final DateTime createdAt;
}

enum ReportReason { spam, abuse, hate, sexual, other }

class AppUser {
  const AppUser({required this.id, required this.username, required this.email});

  final String id;
  final String username;
  final String email;
}

/// Kullanıcıya gösterilebilecek, tanımlı hata türleri.
enum AppErrorCode { invalidCredentials, emailTaken, confirmEmail, rateLimited, notAvailable, geoBlocked, unknown }

class AppException implements Exception {
  const AppException(this.code);

  final AppErrorCode code;

  @override
  String toString() => 'AppException($code)';
}
