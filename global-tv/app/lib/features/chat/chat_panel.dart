import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/analytics.dart';
import '../../core/providers.dart';
import '../../core/router.dart';
import '../../data/models.dart';
import '../../l10n/gen/app_localizations.dart';
import '../../shared/error_text.dart';

final chatMessagesProvider = StreamProvider.family<List<ChatMessage>, String>(
  (ref, channelId) => ref.watch(chatRepositoryProvider).watchMessages(channelId),
);

final chatRoomProvider = StreamProvider.family<ChatRoomState, String>(
  (ref, channelId) => ref.watch(chatRepositoryProvider).watchRoom(channelId),
);

/// Oturum açmış kullanıcının susturma / yasak durumu; misafirde boş.
final myModerationStatusProvider = StreamProvider<ModerationStatus>((ref) {
  final user = ref.watch(authProvider);
  return user == null
      ? Stream.value(ModerationStatus.clear)
      : ref.watch(chatRepositoryProvider).watchMyStatus(user.id);
});

class ChatPanel extends ConsumerStatefulWidget {
  const ChatPanel({super.key, required this.channelId});

  final String channelId;

  @override
  ConsumerState<ChatPanel> createState() => _ChatPanelState();
}

class _ChatPanelState extends ConsumerState<ChatPanel> {
  final _input = TextEditingController();

  /// Bu cihazdan son başarılı gönderim (yavaş mod geri sayımı için).
  DateTime? _lastSentAt;

  /// Yalnızca bir geri sayım (yavaş mod, susturma) sürerken saniyede bir yeniler.
  Timer? _ticker;

  @override
  void dispose() {
    _ticker?.cancel();
    _input.dispose();
    super.dispose();
  }

  void _keepTicking(bool needed) {
    if (needed && _ticker == null) {
      _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) setState(() {});
      });
    } else if (!needed && _ticker != null) {
      _ticker!.cancel();
      _ticker = null;
    }
  }

  Future<void> _send(AppUser user) async {
    final body = _input.text.trim();
    if (body.isEmpty) return;
    final messenger = ScaffoldMessenger.of(context);
    final l10n = AppLocalizations.of(context);
    final now = ref.read(clockProvider);
    _input.clear();
    try {
      await ref.read(chatRepositoryProvider).send(channelId: widget.channelId, user: user, body: body);
      if (mounted) setState(() => _lastSentAt = now());
    } on AppException catch (e) {
      _input.text = body;
      // Sunucu yavaş modu bildirdiyse geri sayımı buradan başlat (saat farkına karşı).
      if (e.code == AppErrorCode.slowMode && mounted) setState(() => _lastSentAt = now());
      messenger.showSnackBar(SnackBar(content: Text(errorText(l10n, e))));
    } catch (e) {
      _input.text = body;
      messenger.showSnackBar(SnackBar(content: Text(errorText(l10n, e))));
    }
  }

  /// Yavaş modda bir sonraki mesaja kalan süre; bekleme yoksa `null`.
  Duration? _slowModeWait(ChatRoomState room, List<ChatMessage> messages, AppUser user, DateTime now) {
    if (room.slowModeSeconds <= 0) return null;
    DateTime? last = _lastSentAt;
    for (final m in messages) {
      if (m.userId == user.id && (last == null || m.createdAt.isAfter(last))) last = m.createdAt;
    }
    if (last == null) return null;
    final wait = Duration(seconds: room.slowModeSeconds) - now.difference(last);
    if (wait <= Duration.zero) return null;
    return wait > Duration(seconds: room.slowModeSeconds) ? Duration(seconds: room.slowModeSeconds) : wait;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(authProvider);
    final blocked = ref.watch(blockedUsersProvider);
    final now = ref.watch(clockProvider)();
    final room = ref.watch(chatRoomProvider(widget.channelId)).value ?? ChatRoomState.open;
    final status = ref.watch(myModerationStatusProvider).value ?? ModerationStatus.clear;
    final messages = (ref.watch(chatMessagesProvider(widget.channelId)).value ?? const [])
        .where((m) => !blocked.containsKey(m.userId))
        // Gizlenen mesajı sunucu yalnızca yazarına gönderir; yine de yalnızca kendi mesajında gösterilir.
        .where((m) => !m.isHidden || (user != null && m.userId == user.id))
        .toList();

    final muted = user != null && status.isMutedAt(now);
    final slowWait = user == null ? null : _slowModeWait(room, messages, user, now);
    _keepTicking(muted || slowWait != null);

    // Öncelik: yasak > susturma > oda kilidi > yavaş mod.
    final (IconData, String, bool)? notice = switch (user) {
      null => null,
      _ when status.isBanned => (Icons.gpp_bad_outlined, l10n.chatBanned, true),
      _ when muted => (Icons.volume_off_outlined, l10n.chatMuted(remainingText(l10n, status.mutedUntil!.difference(now))), true),
      _ when room.isLocked => (Icons.lock_outline, l10n.chatRoomLocked, true),
      _ when slowWait != null => (Icons.hourglass_bottom, l10n.chatSlowModeWait(remainingText(l10n, slowWait)), false),
      _ when room.slowModeSeconds > 0 => (Icons.timer_outlined, l10n.chatSlowMode(room.slowModeSeconds), false),
      _ => null,
    };
    final canWrite = user != null && !status.isBanned && !muted && !room.isLocked;
    final canSend = canWrite && slowWait == null;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(l10n.chatTitle, style: Theme.of(context).textTheme.titleMedium),
          ),
        ),
        Expanded(
          child: messages.isEmpty
              ? Center(child: Text(l10n.chatEmpty))
              : ListView.builder(
                  reverse: true,
                  itemCount: messages.length,
                  itemBuilder: (_, i) {
                    final m = messages[messages.length - 1 - i];
                    return ListTile(
                      dense: true,
                      title: Text(m.username, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: m.isHidden ? _HiddenMessage(body: m.body) : Text(m.body),
                      onLongPress: user == null || m.userId == null || m.userId == user.id
                          ? null
                          : () => _showMessageActions(context, m),
                    );
                  },
                ),
        ),
        // Bilgi (yavaş mod) yazma alanının üstünde; engelleyen durum yazma alanının yerine geçer
        // (küçük ekranda ikisi birden sığmaz, zaten yazılamaz).
        if (notice != null && !notice.$3) _ChatNotice(icon: notice.$1, text: notice.$2, blocking: false),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 8, 8),
            child: user == null
                ? Row(
                    children: [
                      Expanded(child: Text(l10n.chatLoginRequired)),
                      TextButton(onPressed: () => context.push(Routes.login), child: Text(l10n.signIn)),
                    ],
                  )
                : notice != null && notice.$3
                ? Padding(
                    padding: const EdgeInsets.only(right: 8, top: 4),
                    child: _ChatNotice(icon: notice.$1, text: notice.$2, blocking: true, margin: EdgeInsets.zero),
                  )
                : Row(
                    children: [
                      Expanded(
                        child: TextField(
                          key: const Key('chatInput'),
                          controller: _input,
                          enabled: canWrite,
                          maxLength: 500,
                          decoration: InputDecoration(hintText: l10n.chatHint, counterText: ''),
                          onSubmitted: canSend ? (_) => _send(user) : null,
                        ),
                      ),
                      IconButton(
                        tooltip: l10n.chatSend,
                        icon: const Icon(Icons.send),
                        onPressed: canSend ? () => _send(user) : null,
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  Future<void> _showMessageActions(BuildContext context, ChatMessage message) async {
    final l10n = AppLocalizations.of(context);
    final messenger = ScaffoldMessenger.of(context);
    final action = await showModalBottomSheet<String>(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.flag_outlined),
              title: Text(l10n.report),
              onTap: () => Navigator.pop(context, 'report'),
            ),
            ListTile(
              leading: const Icon(Icons.block),
              title: Text(l10n.blockUser),
              onTap: () => Navigator.pop(context, 'block'),
            ),
          ],
        ),
      ),
    );
    if (!context.mounted) return;

    switch (action) {
      case 'report':
        final reason = await _pickReason(context);
        if (reason == null) return;
        await ref.read(chatRepositoryProvider).report(messageId: message.id, reason: reason);
        messenger.showSnackBar(SnackBar(content: Text(l10n.reportSent)));
      case 'block':
        await ref.read(blockedUsersProvider.notifier).block(message.userId!, message.username);
        messenger.showSnackBar(SnackBar(content: Text(l10n.userBlocked(message.username))));
    }
  }

  Future<ReportReason?> _pickReason(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final labels = {
      ReportReason.spam: l10n.reasonSpam,
      ReportReason.abuse: l10n.reasonAbuse,
      ReportReason.hate: l10n.reasonHate,
      ReportReason.sexual: l10n.reasonSexual,
      ReportReason.other: l10n.reasonOther,
    };
    return showDialog<ReportReason>(
      context: context,
      builder: (context) => SimpleDialog(
        title: Text(l10n.reportReasonTitle),
        children: [
          for (final e in labels.entries)
            SimpleDialogOption(onPressed: () => Navigator.pop(context, e.key), child: Text(e.value)),
        ],
      ),
    );
  }
}

/// Gönderme alanının üstünde, kullanıcının neden yazamadığını veya neye dikkat etmesi
/// gerektiğini açıklayan bilgi kutusu. Simge + metin: yalnızca renge dayanmaz.
class _ChatNotice extends StatelessWidget {
  const _ChatNotice({
    required this.icon,
    required this.text,
    required this.blocking,
    this.margin = const EdgeInsets.fromLTRB(12, 4, 12, 0),
  });

  final IconData icon;
  final String text;
  final EdgeInsets margin;

  /// Yazmayı engelleyen durum (yasak, susturma, kilit) mı, bilgi (yavaş mod) mi.
  final bool blocking;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final fg = blocking ? scheme.onErrorContainer : scheme.onSecondaryContainer;
    return Semantics(
      liveRegion: true,
      child: Container(
        key: const Key('chatNotice'),
        width: double.infinity,
        margin: margin,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        // Çok büyük yazı tipinde metin kaydırılır, sohbet alanını itip taşma yapmaz.
        constraints: const BoxConstraints(maxHeight: 112),
        decoration: BoxDecoration(
          color: blocking ? scheme.errorContainer : scheme.secondaryContainer,
          borderRadius: BorderRadius.circular(12),
        ),
        child: SingleChildScrollView(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 18, color: fg),
              const SizedBox(width: 8),
              Expanded(child: Text(text, style: TextStyle(color: fg))),
            ],
          ),
        ),
      ),
    );
  }
}

class _HiddenMessage extends StatelessWidget {
  const _HiddenMessage({required this.body});

  final String body;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(body, style: TextStyle(fontStyle: FontStyle.italic, color: theme.colorScheme.outline)),
        const SizedBox(height: 2),
        Row(
          children: [
            Icon(Icons.visibility_off_outlined, size: 14, color: theme.colorScheme.error),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                AppLocalizations.of(context).chatMessageHidden,
                style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.error),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
