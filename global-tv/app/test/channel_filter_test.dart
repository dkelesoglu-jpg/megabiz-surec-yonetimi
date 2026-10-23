import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:global_tv/core/providers.dart';
import 'package:global_tv/data/demo_repositories.dart';
import 'package:global_tv/data/models.dart';

void main() {
  group('ChannelFilter', () {
    test('filtre yoksa tüm kanallar döner', () {
      expect(const ChannelFilter().apply(demoChannels), hasLength(demoChannels.length));
    });

    test('ülke ve kategori birlikte uygulanır', () {
      final result = const ChannelFilter(countryCode: 'TR', category: ChannelCategory.news).apply(demoChannels);
      expect(result.map((c) => c.id), ['demo-tr-haber']);
    });

    test('arama büyük/küçük harf duyarsızdır', () {
      final result = const ChannelFilter(query: '  bunny ').apply(demoChannels);
      expect(result.single.id, 'demo-mux-bbb');
    });

    test('copyWith ile ülke filtresi temizlenebilir', () {
      const filter = ChannelFilter(countryCode: 'TR');
      expect(filter.copyWith(countryCode: () => null).countryCode, isNull);
    });
  });

  test('tüm demo akışlar HTTPS ve demo olarak işaretli', () async {
    final repo = DemoChannelRepository();
    for (final c in demoChannels) {
      expect(Uri.parse(await repo.streamUrl(c.id)).scheme, 'https', reason: c.id);
      expect(c.isDemo, isTrue, reason: c.id);
      expect(c.attribution, isNotNull, reason: c.id);
    }
  });

  test('favori ekle / çıkar', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    final favorites = container.read(favoritesProvider.notifier);

    await favorites.toggle('demo-mux-bbb');
    expect(container.read(favoritesProvider), {'demo-mux-bbb'});
    await favorites.toggle('demo-mux-bbb');
    expect(container.read(favoritesProvider), isEmpty);
  });
}
