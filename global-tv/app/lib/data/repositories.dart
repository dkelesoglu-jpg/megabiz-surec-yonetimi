import 'models.dart';

/// Ekranlar yalnızca bu arayüzleri bilir. H1'de `Demo…` uygulamaları,
/// H2'den itibaren `Supabase…` uygulamaları aynı arayüzün arkasına takılır.
abstract interface class ChannelRepository {
  Future<List<Channel>> fetchChannels();
}

abstract interface class ChatRepository {
  Stream<List<ChatMessage>> watchMessages(String channelId);
  Future<void> send({required String channelId, required AppUser user, required String body});
  Future<void> report({required String messageId, required ReportReason reason});
}

abstract interface class AuthRepository {
  Future<AppUser> signInWithEmail({required String email, required String password});
  Future<void> signOut();
  Future<void> requestAccountDeletion();
}
