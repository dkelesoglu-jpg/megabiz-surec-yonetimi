// Gerçek cihazda / emülatörde / simülatörde uçtan uca duman testi.
// Çalıştırma: flutter test integration_test --dart-define-from-file=../env/dev.json
// (env dosyası olmadan demo modunda çalışır)
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:global_tv/app.dart';
import 'package:global_tv/core/providers.dart';
import 'package:integration_test/integration_test.dart';
import 'package:video_player/video_player.dart';

Future<void> pumpUntil(WidgetTester tester, Finder finder, {Duration timeout = const Duration(seconds: 30)}) async {
  final end = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(end)) {
    await tester.pump(const Duration(milliseconds: 250));
    if (finder.evaluate().isNotEmpty) return;
  }
  fail('Zaman aşımı: $finder bulunamadı');
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('kanal listesi → oynatma → sohbet → favori → profil', (tester) async {
    await tester.pumpWidget(ProviderScope(
      overrides: [localeProvider.overrideWithBuild((ref, notifier) => const Locale('tr'))],
      child: const GlobalTvApp(),
    ));
    await pumpUntil(tester, find.text('Big Buck Bunny'));

    // Oynatıcı: gerçek HLS akışı açılmalı
    await tester.tap(find.text('Big Buck Bunny'));
    await pumpUntil(tester, find.byType(VideoPlayer));
    expect(find.text('CANLI'), findsOneWidget);

    // Misafir sohbete yazamaz
    expect(find.text('Sohbete katılmak için giriş yapın.'), findsOneWidget);

    // Favoriye ekle ve geri dön
    await tester.tap(find.byTooltip('Favorilere ekle'));
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pageBack();
    await pumpUntil(tester, find.text('Favoriler'));

    await tester.tap(find.text('Favoriler'));
    await pumpUntil(tester, find.text('Big Buck Bunny'));

    await tester.tap(find.text('Profil'));
    await pumpUntil(tester, find.text('Misafir'));
  });
}
