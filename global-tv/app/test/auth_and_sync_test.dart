import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:global_tv/app.dart';
import 'package:global_tv/core/providers.dart';
import 'package:global_tv/data/demo_repositories.dart';
import 'package:global_tv/data/models.dart';

class _RejectingAuth extends DemoAuthRepository {
  @override
  Future<AppUser> signInWithEmail({required String email, required String password}) async =>
      throw const AppException(AppErrorCode.invalidCredentials);
}

class _RecordingFavorites extends DemoFavoritesRepository {
  final calls = <String>[];

  @override
  Future<void> add(String channelId) async => calls.add('+$channelId');

  @override
  Future<void> remove(String channelId) async => calls.add('-$channelId');
}

void main() {
  testWidgets('hatalı giriş kullanıcıya anlaşılır mesajla gösterilir', (tester) async {
    await tester.pumpWidget(ProviderScope(
      overrides: [
        authRepositoryProvider.overrideWithValue(_RejectingAuth()),
        localeProvider.overrideWithBuild((ref, notifier) => const Locale('tr')),
      ],
      child: const GlobalTvApp(),
    ));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Profil'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, 'Giriş yap'));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('email')), 'a@b.co');
    await tester.enterText(find.byKey(const Key('password')), 'yanlis-sifre');
    await tester.tap(find.byKey(const Key('submit')));
    await tester.pumpAndSettle();

    expect(find.text('E-posta veya şifre hatalı.'), findsOneWidget);
  });

  test('misafirin favorisi sunucuya gitmez; giriş yapınca gider', () async {
    final favorites = _RecordingFavorites();
    final container = ProviderContainer(overrides: [favoritesRepositoryProvider.overrideWithValue(favorites)]);
    addTearDown(container.dispose);

    await container.read(favoritesProvider.notifier).toggle('demo-mux-bbb');
    expect(favorites.calls, isEmpty);

    await container.read(authProvider.notifier).signInWithEmail('a@b.co', 'sifre1234');
    await container.read(favoritesProvider.notifier).toggle('demo-mux-tos');
    await container.read(favoritesProvider.notifier).toggle('demo-mux-tos');
    expect(favorites.calls, ['+demo-mux-tos', '-demo-mux-tos']);
  });
}
