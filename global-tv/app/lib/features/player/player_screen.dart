import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';

import '../../core/providers.dart';
import '../../data/models.dart';
import '../../l10n/gen/app_localizations.dart';
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
      return Scaffold(appBar: AppBar(), body: Center(child: Text(l10n.noChannels)));
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
      body: Column(
        children: [
          _HlsPlayer(channel: channel),
          if (channel.attribution != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
              child: Text(channel.attribution!, style: Theme.of(context).textTheme.bodySmall),
            ),
          const Divider(),
          Expanded(child: ChatPanel(channelId: channel.id)),
        ],
      ),
    );
  }
}

class _HlsPlayer extends StatefulWidget {
  const _HlsPlayer({required this.channel});

  final Channel channel;

  @override
  State<_HlsPlayer> createState() => _HlsPlayerState();
}

class _HlsPlayerState extends State<_HlsPlayer> {
  VideoPlayerController? _controller;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    final url = Uri.parse(widget.channel.streamUrl);
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
      if (mounted) setState(() => _failed = false);
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
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final controller = _controller;

    Widget child;
    if (_failed) {
      child = Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(l10n.playerError, style: const TextStyle(color: Colors.white)),
          const SizedBox(height: 8),
          FilledButton.tonal(onPressed: _retry, child: Text(l10n.retry)),
        ],
      );
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
              child: Text(l10n.liveBadge,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
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

    return AspectRatio(
      aspectRatio: 16 / 9,
      child: ColoredBox(color: Colors.black, child: Center(child: child)),
    );
  }
}
