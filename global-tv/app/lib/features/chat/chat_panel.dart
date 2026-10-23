import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/router.dart';
import '../../data/models.dart';
import '../../l10n/gen/app_localizations.dart';

final chatMessagesProvider = StreamProvider.family<List<ChatMessage>, String>(
  (ref, channelId) => ref.watch(chatRepositoryProvider).watchMessages(channelId),
);

class ChatPanel extends ConsumerStatefulWidget {
  const ChatPanel({super.key, required this.channelId});

  final String channelId;

  @override
  ConsumerState<ChatPanel> createState() => _ChatPanelState();
}

class _ChatPanelState extends ConsumerState<ChatPanel> {
  final _input = TextEditingController();

  @override
  void dispose() {
    _input.dispose();
    super.dispose();
  }

  Future<void> _send(AppUser user) async {
    final body = _input.text.trim();
    if (body.isEmpty) return;
    _input.clear();
    await ref.read(chatRepositoryProvider).send(channelId: widget.channelId, user: user, body: body);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(authProvider);
    final blocked = ref.watch(blockedUsersProvider);
    final messages = (ref.watch(chatMessagesProvider(widget.channelId)).value ?? const [])
        .where((m) => !blocked.containsKey(m.userId))
        .toList();

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
                      subtitle: Text(m.body),
                      onLongPress: user == null || m.userId == user.id
                          ? null
                          : () => _showMessageActions(context, m),
                    );
                  },
                ),
        ),
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
                : Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _input,
                          maxLength: 500,
                          decoration: InputDecoration(hintText: l10n.chatHint, counterText: ''),
                          onSubmitted: (_) => _send(user),
                        ),
                      ),
                      IconButton(
                        tooltip: l10n.chatSend,
                        icon: const Icon(Icons.send),
                        onPressed: () => _send(user),
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
        ref.read(blockedUsersProvider.notifier).block(message.userId, message.username);
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
