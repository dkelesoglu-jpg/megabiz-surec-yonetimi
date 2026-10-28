import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/analytics.dart';
import '../../core/providers.dart';
import '../../l10n/gen/app_localizations.dart';

class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.shell});

  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final config = ref.watch(appConfigProvider);
    // Günlük aktif kullanıcı kaydı (yalnızca giriş yapılmış ve izin verilmişse).
    ref.watch(activityTrackerProvider);

    final scaffold = Scaffold(
      body: shell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: shell.currentIndex,
        onDestinationSelected: (i) => shell.goBranch(i, initialLocation: i == shell.currentIndex),
        destinations: [
          NavigationDestination(icon: const Icon(Icons.live_tv_outlined), selectedIcon: const Icon(Icons.live_tv), label: l10n.navLive),
          NavigationDestination(icon: const Icon(Icons.favorite_border), selectedIcon: const Icon(Icons.favorite), label: l10n.navFavorites),
          NavigationDestination(icon: const Icon(Icons.person_outline), selectedIcon: const Icon(Icons.person), label: l10n.navProfile),
        ],
      ),
    );

    // Test ve geliştirme sürümlerinin canlı sürümle karıştırılmaması için.
    if (config.isProduction) return scaffold;
    return Banner(
      message: config.env.toUpperCase(),
      location: BannerLocation.topEnd,
      color: config.env == 'staging' ? Colors.orange : Colors.green.shade700,
      child: scaffold,
    );
  }
}
