import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:global_tv/app.dart';
import 'package:global_tv/core/providers.dart';

/// Oynatıcı ekranı: geri tuşu ve yerleşim, Android ve iOS görünümünde,
/// dikey / yatay / klavye açık ekran boyutlarında.
void main() {
  const sizes = {
    'telefon dikey': Size(390, 844),
    'klavye açık': Size(390, 420),
    'telefon yatay': Size(844, 390),
    'tablet': Size(1024, 768),
  };

  for (final entry in sizes.entries) {
    testWidgets(
      '${entry.key}: taşma yok, geri tuşu listeye döndürür',
      variant: const TargetPlatformVariant({TargetPlatform.android, TargetPlatform.iOS}),
      (tester) async {
        tester.view.physicalSize = entry.value;
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.reset);

        await tester.pumpWidget(
          ProviderScope(
            overrides: [localeProvider.overrideWithBuild((ref, notifier) => const Locale('tr'))],
            child: const GlobalTvApp(),
          ),
        );
        await tester.pumpAndSettle();

        await tester.ensureVisible(find.text('Big Buck Bunny'));
        await tester.pumpAndSettle();
        await tester.tap(find.text('Big Buck Bunny'));
        // Video eklentisi test ortamında yok; oynatıcı hata/tekrar dene durumuna düşer.
        for (var i = 0; i < 10; i++) {
          await tester.pump(const Duration(milliseconds: 100));
        }
        expect(tester.takeException(), isNull, reason: 'yerleşim taşması veya hata olmamalı');
        expect(find.text('Sohbete katılmak için giriş yapın.'), findsOneWidget);

        expect(find.byType(BackButton), findsOneWidget);
        await tester.tap(find.byType(BackButton));
        await tester.pumpAndSettle();

        expect(find.byType(NavigationBar), findsOneWidget);
        expect(find.text('Big Buck Bunny'), findsOneWidget);
      },
    );
  }
}
