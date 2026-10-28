import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/login_screen.dart';
import '../features/favorites/favorites_screen.dart';
import '../features/live_tv/live_tv_screen.dart';
import '../features/player/player_screen.dart';
import '../features/profile/privacy_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/shell/app_shell.dart';

abstract final class Routes {
  static const live = '/live';
  static const favorites = '/favorites';
  static const profile = '/profile';
  static const login = '/login';
  static const privacy = '/privacy';
  static String channel(String id) => '/channel/$id';
}

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: Routes.live,
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => AppShell(shell: shell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: Routes.live, builder: (_, _) => const LiveTvScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: Routes.favorites, builder: (_, _) => const FavoritesScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: Routes.profile, builder: (_, _) => const ProfileScreen()),
          ]),
        ],
      ),
      GoRoute(
        path: '/channel/:id',
        builder: (_, state) => PlayerScreen(channelId: state.pathParameters['id']!),
      ),
      GoRoute(path: Routes.privacy, builder: (_, _) => const PrivacyScreen()),
      GoRoute(
        path: Routes.login,
        pageBuilder: (_, _) => const MaterialPage(fullscreenDialog: true, child: LoginScreen()),
      ),
    ],
  );
});
