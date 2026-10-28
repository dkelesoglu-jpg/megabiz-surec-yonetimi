import 'package:supabase_flutter/supabase_flutter.dart';

import 'models.dart';
import 'repositories.dart';

/// Supabase uygulamaları. Erişim kuralları veritabanında (RLS) uygulanır;
/// bkz. supabase/migrations ve supabase/tests/rls_test.sql
class SupabaseChannelRepository implements ChannelRepository {
  SupabaseChannelRepository(this._client);

  final SupabaseClient _client;

  @override
  Future<List<Channel>> fetchChannels() async {
    // RLS yalnızca aktif ve yayın hakkı geçerli kanalları döndürür.
    final rows = await _client
        .from('channels')
        .select('id, name, country_code, category, language, attribution')
        .order('sort_order');
    return [
      for (final r in rows)
        Channel(
          id: r['id'] as String,
          name: r['name'] as String,
          countryCode: (r['country_code'] as String).trim(),
          category: ChannelCategory.values.asNameMap()[r['category']] ?? ChannelCategory.other,
          language: r['language'] as String,
          attribution: r['attribution'] as String?,
        ),
    ];
  }

  @override
  Future<String> streamUrl(String channelId, {String? countryCode}) async {
    try {
      final res = await _client.functions.invoke(
        'get-stream',
        body: {'channel_id': channelId, 'country': ?countryCode},
      );
      final url = (res.data as Map)['url'] as String;
      if (!url.startsWith('https://')) throw const AppException(AppErrorCode.notAvailable);
      return url;
    } on FunctionException catch (e) {
      throw AppException(e.status == 403 ? AppErrorCode.geoBlocked : AppErrorCode.notAvailable);
    }
  }
}

class SupabaseChatRepository implements ChatRepository {
  SupabaseChatRepository(this._client);

  final SupabaseClient _client;

  @override
  Stream<List<ChatMessage>> watchMessages(String channelId) => _client
      .from('chat_messages')
      .stream(primaryKey: ['id'])
      .eq('channel_id', channelId)
      .order('created_at', ascending: false)
      .limit(100)
      .map((rows) => [
            for (final r in rows.reversed)
              ChatMessage(
                id: '${r['id']}',
                channelId: r['channel_id'] as String,
                userId: r['user_id'] as String?,
                username: r['author_name'] as String,
                body: r['body'] as String,
                createdAt: DateTime.parse(r['created_at'] as String),
                isHidden: r['is_hidden'] as bool? ?? false,
              ),
          ]);

  @override
  Future<void> send({required String channelId, required AppUser user, required String body}) async {
    try {
      // user_id ve author_name sunucuda oturumdan atanır.
      await _client.from('chat_messages').insert({'channel_id': channelId, 'body': body});
    } on PostgrestException catch (e) {
      throw AppException(await _sendError(e));
    }
  }

  /// Sunucu kurallarını (before_chat_insert, chat_insert RLS) kullanıcıya anlaşılır koda çevirir.
  Future<AppErrorCode> _sendError(PostgrestException e) async {
    for (final (key, code) in const [
      ('room_locked', AppErrorCode.roomLocked),
      ('slow_mode', AppErrorCode.slowMode),
      ('rate_limited', AppErrorCode.rateLimited),
    ]) {
      if (e.message.contains(key)) return code;
    }
    // RLS reddi (42501): yasaklı veya susturulmuş kullanıcı.
    if (e.code == '42501') {
      final status = await _myStatus(_client.auth.currentUser?.id);
      if (status.isBanned) return AppErrorCode.banned;
      if (status.isMutedAt(DateTime.now())) return AppErrorCode.muted;
    }
    return AppErrorCode.unknown;
  }

  Future<ModerationStatus> _myStatus(String? userId) async {
    if (userId == null) return ModerationStatus.clear;
    final row = await _client.from('profiles').select('is_banned, muted_until').eq('id', userId).maybeSingle();
    return row == null ? ModerationStatus.clear : _status(row);
  }

  static ModerationStatus _status(Map<String, dynamic> row) => ModerationStatus(
        isBanned: row['is_banned'] as bool? ?? false,
        mutedUntil: row['muted_until'] == null ? null : DateTime.parse(row['muted_until'] as String),
      );

  @override
  Stream<ChatRoomState> watchRoom(String channelId) => _client
      .from('chat_room_settings')
      .stream(primaryKey: ['channel_id'])
      .eq('channel_id', channelId)
      .map((rows) => rows.isEmpty
          ? ChatRoomState.open
          : ChatRoomState(
              isLocked: rows.first['is_locked'] as bool? ?? false,
              slowModeSeconds: rows.first['slow_mode_seconds'] as int? ?? 0,
            ));

  // RLS: kullanıcı yalnızca kendi profilini okur ve yalnızca onun değişikliklerini alır.
  @override
  Stream<ModerationStatus> watchMyStatus(String userId) => _client
      .from('profiles')
      .stream(primaryKey: ['id'])
      .eq('id', userId)
      .map((rows) => rows.isEmpty ? ModerationStatus.clear : _status(rows.first));

  @override
  Future<void> report({required String messageId, required ReportReason reason}) async {
    await _client.from('reports').insert({
      'reporter_id': _client.auth.currentUser!.id,
      'message_id': int.parse(messageId),
      'reason': reason.name,
    });
  }
}

class SupabaseAuthRepository implements AuthRepository {
  SupabaseAuthRepository(this._client);

  final SupabaseClient _client;

  Future<AppUser> _toAppUser(User user) async {
    final profile = await _client.from('profiles').select('username').eq('id', user.id).maybeSingle();
    return AppUser(
      id: user.id,
      username: profile?['username'] as String? ?? user.email ?? '',
      email: user.email ?? '',
    );
  }

  @override
  Future<AppUser?> restoreSession() async {
    final user = _client.auth.currentUser;
    return user == null ? null : _toAppUser(user);
  }

  @override
  Future<AppUser> signInWithEmail({required String email, required String password}) async {
    try {
      final res = await _client.auth.signInWithPassword(email: email, password: password);
      return await _toAppUser(res.user!);
    } on AuthException {
      throw const AppException(AppErrorCode.invalidCredentials);
    }
  }

  @override
  Future<AppUser> signUpWithEmail({required String email, required String password}) async {
    try {
      final res = await _client.auth.signUp(email: email, password: password);
      if (res.session == null) {
        // E-posta doğrulaması açıksa (staging/prod) oturum doğrulamadan sonra açılır.
        throw const AppException(AppErrorCode.confirmEmail);
      }
      return await _toAppUser(res.user!);
    } on AuthException catch (e) {
      throw AppException(e.code == 'user_already_exists' ? AppErrorCode.emailTaken : AppErrorCode.unknown);
    }
  }

  @override
  Future<void> signOut() => _client.auth.signOut();

  @override
  Future<void> deleteAccount() async {
    await _client.functions.invoke('delete-account');
    await _client.auth.signOut();
  }
}

class SupabaseFavoritesRepository implements FavoritesRepository {
  SupabaseFavoritesRepository(this._client);

  final SupabaseClient _client;

  @override
  Future<Set<String>> load() async {
    final rows = await _client.from('favorites').select('channel_id');
    return {for (final r in rows) r['channel_id'] as String};
  }

  @override
  Future<void> add(String channelId) => _client
      .from('favorites')
      .upsert({'user_id': _client.auth.currentUser!.id, 'channel_id': channelId});

  @override
  Future<void> remove(String channelId) => _client.from('favorites').delete().eq('channel_id', channelId);
}

class SupabaseBlocksRepository implements BlocksRepository {
  SupabaseBlocksRepository(this._client);

  final SupabaseClient _client;

  @override
  Future<Map<String, String>> load() async {
    final rows = await _client.from('blocks').select('blocked_id');
    final ids = [for (final r in rows) r['blocked_id'] as String];
    if (ids.isEmpty) return {};
    // Başkalarının profiline erişim yok; yalnızca kullanıcı adı alınır.
    final names = await _client.rpc('public_usernames', params: {'p_ids': ids}) as List;
    final byId = {for (final n in names) n['id'] as String: n['username'] as String};
    return {for (final id in ids) id: byId[id] ?? ''};
  }

  @override
  Future<void> block(String userId) => _client
      .from('blocks')
      .upsert({'blocker_id': _client.auth.currentUser!.id, 'blocked_id': userId});

  @override
  Future<void> unblock(String userId) => _client.from('blocks').delete().eq('blocked_id', userId);
}

class SupabaseAnalyticsRepository implements AnalyticsRepository {
  SupabaseAnalyticsRepository(this._client);

  final SupabaseClient _client;

  // Kullanıcı kimliği gönderilmez (user_id boş kalır): kayıt anonimdir.
  @override
  Future<void> recordWatch(WatchSession session) => _client.from('watch_sessions').insert({
        'device_hash': session.deviceId,
        'channel_id': session.channelId,
        'platform': session.platform,
        'country_code': session.countryCode,
        'started_at': session.startedAt.toUtc().toIso8601String(),
        'duration_seconds': session.duration.inSeconds,
      });

  @override
  Future<void> touchActivity(String platform) => _client.rpc('touch_activity', params: {'p_platform': platform});
}
