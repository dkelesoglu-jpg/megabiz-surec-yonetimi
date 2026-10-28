import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/analytics.dart';
import '../../core/providers.dart';
import '../../core/router.dart';
import '../../data/models.dart';
import '../../l10n/gen/app_localizations.dart';
import '../../shared/channel_tile.dart';

class LiveTvScreen extends ConsumerWidget {
  const LiveTvScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final channels = ref.watch(filteredChannelsProvider);
    final isDemo = ref.watch(appConfigProvider).isDemoMode;
    // İzin sorusu listenin başında, kaydırılabilir alanda: küçük ekranda taşma yapmaz,
    // uygulamanın kullanımını engellemez.
    final askConsent = ref.watch(analyticsConsentProvider) == AnalyticsConsent.unasked;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.navLive)),
      body: Column(
        children: [
          if (isDemo)
            MaterialBanner(
              content: Text(l10n.demoModeNotice),
              leading: const Icon(Icons.science_outlined),
              actions: const [SizedBox.shrink()],
            ),
          const _FilterBar(),
          const Divider(height: 1),
          Expanded(
            child: channels.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text(l10n.playerError)),
              data: (list) => list.isEmpty
                  ? Center(child: Text(l10n.noChannels))
                  : ListView.builder(
                      key: const Key('channelList'),
                      itemCount: list.length + (askConsent ? 1 : 0),
                      itemBuilder: (_, i) => askConsent
                          ? (i == 0 ? const AnalyticsConsentCard() : ChannelTile(channel: list[i - 1]))
                          : ChannelTile(channel: list[i]),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterBar extends ConsumerWidget {
  const _FilterBar();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final filter = ref.watch(channelFilterProvider);
    final notifier = ref.read(channelFilterProvider.notifier);
    final countries = ref.watch(availableCountriesProvider);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                flex: 3,
                child: TextField(
                  key: const Key('channelSearch'),
                  decoration: InputDecoration(
                    hintText: l10n.searchChannels,
                    prefixIcon: const Icon(Icons.search),
                    isDense: true,
                    border: const OutlineInputBorder(),
                  ),
                  onChanged: notifier.setQuery,
                ),
              ),
              const SizedBox(width: 8),
              // Büyük yazı tipinde ve uzun metinlerde ("All countries") satırdan taşmaz.
              Flexible(
                flex: 2,
                child: DropdownButton<String?>(
                  key: const Key('countryFilter'),
                  isExpanded: true,
                  value: filter.countryCode,
                  underline: const SizedBox.shrink(),
                  items: [
                    DropdownMenuItem(value: null, child: Text(l10n.allCountries, overflow: TextOverflow.ellipsis)),
                    for (final code in countries) DropdownMenuItem(value: code, child: Text(code)),
                  ],
                  onChanged: notifier.setCountry,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _chip(l10n.allCategories, filter.category == null, () => notifier.setCategory(null)),
                for (final c in ChannelCategory.values)
                  _chip(categoryLabel(l10n, c), filter.category == c, () => notifier.setCategory(c)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, bool selected, VoidCallback onTap) => Padding(
        padding: const EdgeInsets.only(right: 8),
        child: ChoiceChip(label: Text(label), selected: selected, onSelected: (_) => onTap()),
      );
}

/// Açık rıza: "İzin ver" ve "İzin verme" eşit ağırlıkta; seçilmezse veri gönderilmez.
class AnalyticsConsentCard extends ConsumerWidget {
  const AnalyticsConsentCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final notifier = ref.read(analyticsConsentProvider.notifier);
    return Card(
      key: const Key('analyticsConsent'),
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.insights_outlined, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Expanded(child: Text(l10n.analyticsConsentTitle, style: theme.textTheme.titleSmall)),
              ],
            ),
            const SizedBox(height: 8),
            Text(l10n.analyticsConsentBody, style: theme.textTheme.bodySmall),
            const SizedBox(height: 8),
            Wrap(
              alignment: WrapAlignment.end,
              spacing: 8,
              children: [
                TextButton(onPressed: () => context.push(Routes.privacy), child: Text(l10n.analyticsDetails)),
                OutlinedButton(onPressed: () => notifier.set(false), child: Text(l10n.analyticsDeny)),
                OutlinedButton(onPressed: () => notifier.set(true), child: Text(l10n.analyticsAllow)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
