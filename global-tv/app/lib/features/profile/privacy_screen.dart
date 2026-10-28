import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/analytics.dart';
import '../../l10n/gen/app_localizations.dart';

/// Gizlilik ve veriler: analitik izni ve hangi verinin toplandığı / toplanmadığı.
class PrivacyScreen extends ConsumerWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final consent = ref.watch(analyticsConsentProvider);

    Widget section(String title, String body) => Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: theme.textTheme.titleSmall),
              const SizedBox(height: 6),
              Text(body, style: theme.textTheme.bodyMedium),
            ],
          ),
        );

    return Scaffold(
      appBar: AppBar(title: Text(l10n.privacy)),
      body: ListView(
        children: [
          SwitchListTile(
            key: const Key('analyticsSwitch'),
            secondary: const Icon(Icons.insights_outlined),
            title: Text(l10n.privacyAnalyticsSwitch),
            subtitle: Text(l10n.privacyAnalyticsSubtitle),
            value: consent == AnalyticsConsent.granted,
            onChanged: consent == AnalyticsConsent.loading
                ? null
                : (on) async {
                    final messenger = ScaffoldMessenger.of(context);
                    await ref.read(analyticsConsentProvider.notifier).set(on);
                    messenger.showSnackBar(SnackBar(content: Text(l10n.privacyConsentSaved)));
                  },
          ),
          const Divider(),
          section(l10n.privacyCollectedTitle, l10n.privacyCollected),
          section(l10n.privacyNotCollectedTitle, l10n.privacyNotCollected),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(l10n.privacyRetention, style: theme.textTheme.bodySmall),
          ),
        ],
      ),
    );
  }
}
