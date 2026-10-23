import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../core/providers.dart';
import '../core/router.dart';
import '../data/models.dart';
import '../l10n/gen/app_localizations.dart';

String categoryLabel(AppLocalizations l10n, ChannelCategory category) => switch (category) {
      ChannelCategory.news => l10n.categoryNews,
      ChannelCategory.sports => l10n.categorySports,
      ChannelCategory.entertainment => l10n.categoryEntertainment,
      ChannelCategory.kids => l10n.categoryKids,
      ChannelCategory.music => l10n.categoryMusic,
      ChannelCategory.documentary => l10n.categoryDocumentary,
      ChannelCategory.other => l10n.categoryOther,
    };

class ChannelTile extends ConsumerWidget {
  const ChannelTile({super.key, required this.channel});

  final Channel channel;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final scheme = Theme.of(context).colorScheme;
    final isFavorite = ref.watch(favoritesProvider).contains(channel.id);

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        width: 56,
        height: 40,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: scheme.primaryContainer,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          channel.name.characters.first.toUpperCase(),
          style: TextStyle(color: scheme.onPrimaryContainer, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      title: Text(channel.name, maxLines: 1, overflow: TextOverflow.ellipsis),
      subtitle: Text('${channel.countryCode} · ${categoryLabel(l10n, channel.category)}'
          '${channel.isDemo ? ' · ${l10n.demoBadge}' : ''}'),
      trailing: IconButton(
        tooltip: isFavorite ? l10n.removeFavorite : l10n.addFavorite,
        icon: Icon(isFavorite ? Icons.favorite : Icons.favorite_border,
            color: isFavorite ? scheme.error : null),
        onPressed: () => ref.read(favoritesProvider.notifier).toggle(channel.id),
      ),
      onTap: () => context.push(Routes.channel(channel.id)),
    );
  }
}
