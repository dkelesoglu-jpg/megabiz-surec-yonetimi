import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:global_tv/app.dart';
import 'package:global_tv/core/providers.dart';

Future<void> pumpApp(WidgetTester tester, {Locale locale = const Locale('tr')}) async {
  await tester.pumpWidget(ProviderScope(
    overrides: [localeProvider.overrideWithBuild((ref, notifier) => locale)],
    child: const GlobalTvApp(),
  ));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('açılışta Canlı TV listesi ve 3 sekme görünür', (tester) async {
    await pumpApp(tester);

    expect(find.byType(NavigationBar), findsOneWidget);
    expect(find.text('Canlı TV'), findsWidgets);
    expect(find.text('Favoriler'), findsOneWidget);
    expect(find.text('Profil'), findsOneWidget);
    expect(find.text('Big Buck Bunny'), findsOneWidget);
  });

  testWidgets('arama listeyi filtreler', (tester) async {
    await pumpApp(tester);

    await tester.enterText(find.byKey(const Key('channelSearch')), 'tears');
    await tester.pumpAndSettle();

    expect(find.text('Tears of Steel'), findsOneWidget);
    expect(find.text('Big Buck Bunny'), findsNothing);
  });

  testWidgets('favoriye eklenen kanal Favoriler sekmesinde görünür', (tester) async {
    await pumpApp(tester);

    final tile = find.ancestor(of: find.text('Big Buck Bunny'), matching: find.byType(ListTile));
    await tester.tap(find.descendant(of: tile, matching: find.byIcon(Icons.favorite_border)));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Favoriler'));
    await tester.pumpAndSettle();
    expect(find.text('Big Buck Bunny'), findsOneWidget);
  });

  testWidgets('İngilizce arayüz', (tester) async {
    await pumpApp(tester, locale: const Locale('en'));
    expect(find.text('Favorites'), findsOneWidget);
    expect(find.text('Search channels'), findsOneWidget);
  });

  testWidgets('profilden giriş yapılınca hesap seçenekleri görünür', (tester) async {
    await pumpApp(tester);

    await tester.tap(find.text('Profil'));
    await tester.pumpAndSettle();
    expect(find.text('Misafir'), findsOneWidget);
    expect(find.text('Hesabı sil'), findsNothing);

    await tester.tap(find.widgetWithText(FilledButton, 'Giriş yap'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const Key('email')), 'deneme@ornek.com');
    await tester.enterText(find.byKey(const Key('password')), 'gizli-sifre');
    await tester.tap(find.widgetWithText(FilledButton, 'Giriş yap'));
    await tester.pumpAndSettle();

    expect(find.text('deneme'), findsOneWidget);
    expect(find.text('Hesabı sil'), findsOneWidget);
  });
}
