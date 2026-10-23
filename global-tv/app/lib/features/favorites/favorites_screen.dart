import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../l10n/gen/app_localizations.dart';
import '../../shared/channel_tile.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final favoriteIds = ref.watch(favoritesProvider);
    final channels = (ref.watch(channelsProvider).value ?? const [])
        .where((c) => favoriteIds.contains(c.id))
        .toList();

    return Scaffold(
      appBar: AppBar(title: Text(l10n.navFavorites)),
      body: channels.isEmpty
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Text(l10n.noFavorites, textAlign: TextAlign.center),
              ),
            )
          : ListView.builder(
              itemCount: channels.length,
              itemBuilder: (_, i) => ChannelTile(channel: channels[i]),
            ),
    );
  }
}
