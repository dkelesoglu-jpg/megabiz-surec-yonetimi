import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';

import '../../core/analytics.dart';
import '../../core/providers.dart';
import '../../l10n/gen/app_localizations.dart';
import '../../shared/error_text.dart';
import '../chat/chat_panel.dart';

class PlayerScreen extends ConsumerWidget {
  const PlayerScreen({super.key, required this.channelId});

  final String channelId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final channels = ref.watch(channelsProvider).value ?? const [];
    final channel = channels.where((c) => c.id == channelId).firstOrNull;

    if (channel == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(child: Text(l10n.noChannels)),
      );
    }

    final isFavorite = ref.watch(favoritesProvider).contains(channel.id);
    return Scaffold(
      appBar: AppBar(
        title: Text(channel.name),
        actions: [
          IconButton(
            tooltip: isFavorite ? l10n.removeFavorite : l10n.addFavorite,
            icon: Icon(isFavorite ? Icons.favorite : Icons.favorite_border),
            onPressed: () => ref.read(favoritesProvider.notifier).toggle(channel.id),
          ),
        ],
      ),
      // Video en fazla gövdenin %45'i kadar yer kaplar; yatay ekranda veya klavye
      // açıkken sohbet alanı sıkışıp taşmaz.
      body: LayoutBuilder(
        builder: (context, constraints) => Column(
          children: [
            SizedBox(
              height: (constraints.maxWidth * 9 / 16).clamp(0.0, constraints.maxHeight * 0.45),
              width: double.infinity,
              child: ColoredBox(
                color: Colors.black,
                child: ref
                    .watch(streamUrlProvider(channel.id))
                    .when(
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (e, _) => _PlayerMessage(
                        text: errorText(l10n, e),
                        onRetry: () => ref.invalidate(streamUrlProvider(channel.id)),
                      ),
                      data: (url) => _HlsPlayer(key: ValueKey(url), url: url, channelId: channel.id),
                    ),
              ),
            ),
            if (channel.attribution != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
                child: Text(
                  channel.attribution!,
                  style: Theme.of(context).textTheme.bodySmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            const Divider(),
            Expanded(child: ChatPanel(channelId: channel.id)),
          ],
        ),
      ),
    );
  }
}

class _PlayerMessage extends StatelessWidget {
  const _PlayerMessage({required this.text, required this.onRetry});

  final String text;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          text,
          style: const TextStyle(color: Colors.white),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        FilledButton.tonal(onPressed: onRetry, child: Text(AppLocalizations.of(context).retry)),
      ],
    ),
  );
}

class _HlsPlayer extends ConsumerStatefulWidget {
  const _HlsPlayer({super.key, required this.url, required this.channelId});

  final String url;
  final String channelId;

  @override
  ConsumerState<_HlsPlayer> createState() => _HlsPlayerState();
}

class _HlsPlayerState extends ConsumerState<_HlsPlayer> with WidgetsBindingObserver {
  VideoPlayerController? _controller;
  bool _failed = false;

  /// İzlenme süresi yalnızca yayın oynamaya başladıktan sonra ve izin verildiyse ölçülür.
  late final WatchTracker _tracker;

  /// Güncel izin durumu; dispose sırasında `ref` kullanılamadığı için burada tutulur.
  bool _consented = false;

  @override
  void initState() {
    super.initState();
    ref.listenManual(analyticsConsentProvider, (_, next) => _consented = next == AnalyticsConsent.granted,
        fireImmediately: true);
    _tracker = WatchTracker(
      channelId: widget.channelId,
      repository: ref.read(analyticsRepositoryProvider),
      store: ref.read(consentStoreProvider),
      isConsented: () => _consented,
      now: ref.read(clockProvider),
      platform: ref.read(platformProvider),
      countryCode: ref.read(deviceCountryProvider),
    );
    WidgetsBinding.instance.addObserver(this);
    _init();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final controller = _controller;
    if (controller == null || !controller.value.isInitialized) return;
    if (state == AppLifecycleState.resumed) {
      _tracker.start();
    } else if (state == AppLifecycleState.paused || state == AppLifecycleState.detached) {
      _tracker.stop();
    }
  }

  Future<void> _init() async {
    final url = Uri.parse(widget.url);
    // Güvenlik: yalnızca HTTPS kaynaklar oynatılır.
    if (url.scheme != 'https') {
      setState(() => _failed = true);
      return;
    }
    final controller = VideoPlayerController.networkUrl(url, formatHint: VideoFormat.hls);
    _controller = controller;
    try {
      await controller.initialize();
      await controller.play();
      if (mounted) {
        _tracker.start();
        setState(() => _failed = false);
      }
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  Future<void> _retry() async {
    await _controller?.dispose();
    setState(() {
      _controller = null;
      _failed = false;
    });
    await _init();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    // Ekrandan çıkınca ölçüm kapanır ve (izin varsa) gönderilir.
    _tracker.stop();
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final controller = _controller;

    Widget child;
    if (_failed) {
      return _PlayerMessage(text: l10n.playerError, onRetry: _retry);
    } else if (controller == null || !controller.value.isInitialized) {
      child = const CircularProgressIndicator();
    } else {
      child = Stack(
        alignment: Alignment.center,
        children: [
          AspectRatio(aspectRatio: controller.value.aspectRatio, child: VideoPlayer(controller)),
          Positioned(
            left: 8,
            top: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              color: Colors.red,
              child: Text(
                l10n.liveBadge,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
          ),
          Positioned(
            right: 4,
            bottom: 4,
            child: ValueListenableBuilder(
              valueListenable: controller,
              builder: (_, value, _) => IconButton(
                color: Colors.white,
                icon: Icon(value.volume == 0 ? Icons.volume_off : Icons.volume_up),
                onPressed: () => controller.setVolume(value.volume == 0 ? 1 : 0),
              ),
            ),
          ),
        ],
      );
    }

    return Center(child: child);
  }
}
