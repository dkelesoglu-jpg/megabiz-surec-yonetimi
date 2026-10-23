enum ChannelCategory { news, sports, entertainment, kids, music, documentary, other }

class Channel {
  const Channel({
    required this.id,
    required this.name,
    required this.countryCode,
    required this.category,
    required this.language,
    required this.streamUrl,
    this.attribution,
    this.isDemo = false,
  });

  final String id;
  final String name;

  /// ISO 3166-1 alpha-2 ülke kodu (ör. TR, US). Uluslararası içerik için `INT`.
  final String countryCode;
  final ChannelCategory category;
  final String language;

  /// Yalnızca yayın hakkı doğrulanmış HTTPS HLS adresi. Gerçek ortamda bu
  /// değer `get-stream` Edge Function'ından alınır.
  final String streamUrl;

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
  final String userId;
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
