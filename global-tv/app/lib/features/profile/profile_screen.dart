import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../core/router.dart';
import '../../l10n/gen/app_localizations.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(authProvider);
    final locale = ref.watch(localeProvider);
    final blocked = ref.watch(blockedUsersProvider);
    final config = ref.watch(appConfigProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.navProfile)),
      body: ListView(
        children: [
          ListTile(
            leading: CircleAvatar(child: Text((user?.username ?? '?').characters.first.toUpperCase())),
            title: Text(user?.username ?? l10n.guest),
            subtitle: user == null ? null : Text(user.email),
            trailing: user == null
                ? FilledButton(onPressed: () => context.push(Routes.login), child: Text(l10n.signIn))
                : null,
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.language),
            title: Text(l10n.language),
            trailing: DropdownButton<String?>(
              value: locale?.languageCode,
              underline: const SizedBox.shrink(),
              items: [
                DropdownMenuItem(value: null, child: Text(l10n.languageAuto)),
                const DropdownMenuItem(value: 'tr', child: Text('Türkçe')),
                const DropdownMenuItem(value: 'en', child: Text('English')),
              ],
              onChanged: (code) => ref.read(localeProvider.notifier).set(code == null ? null : Locale(code)),
            ),
          ),
          ExpansionTile(
            leading: const Icon(Icons.block),
            title: Text(l10n.blockedUsers),
            trailing: Text('${blocked.length}'),
            children: [
              for (final e in blocked.entries)
                ListTile(
                  title: Text(e.value),
                  trailing: IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => ref.read(blockedUsersProvider.notifier).unblock(e.key),
                  ),
                ),
            ],
          ),
          ListTile(
            leading: const Icon(Icons.privacy_tip_outlined),
            title: Text(l10n.privacy),
            // H6: gizlilik politikası, onay yönetimi, veri dışa aktarma
            onTap: null,
          ),
          if (user != null) ...[
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout),
              title: Text(l10n.signOut),
              onTap: () => ref.read(authProvider.notifier).signOut(),
            ),
            ListTile(
              leading: Icon(Icons.delete_forever, color: Theme.of(context).colorScheme.error),
              title: Text(l10n.deleteAccount, style: TextStyle(color: Theme.of(context).colorScheme.error)),
              onTap: () => _confirmDelete(context, ref),
            ),
          ],
          if (!config.isProduction)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(l10n.environmentLabel(config.env),
                  textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
            ),
        ],
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final l10n = AppLocalizations.of(context);
    final messenger = ScaffoldMessenger.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.deleteAccount),
        content: Text(l10n.deleteAccountConfirm),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(l10n.cancel)),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Theme.of(context).colorScheme.error),
            onPressed: () => Navigator.pop(context, true),
            child: Text(l10n.delete),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    await ref.read(authProvider.notifier).deleteAccount();
    messenger.showSnackBar(SnackBar(content: Text(l10n.accountDeletionRequested)));
  }
}
