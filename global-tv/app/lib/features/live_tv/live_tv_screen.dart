import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
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
                      itemCount: list.length,
                      itemBuilder: (_, i) => ChannelTile(channel: list[i]),
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
              DropdownButton<String?>(
                key: const Key('countryFilter'),
                value: filter.countryCode,
                underline: const SizedBox.shrink(),
                items: [
                  DropdownMenuItem(value: null, child: Text(l10n.allCountries)),
                  for (final code in countries) DropdownMenuItem(value: code, child: Text(code)),
                ],
                onChanged: notifier.setCountry,
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
