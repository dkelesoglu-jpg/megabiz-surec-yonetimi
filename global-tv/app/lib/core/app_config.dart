/// Derleme zamanında `--dart-define-from-file=../env/<ortam>.json` ile gelen
/// ortam yapılandırması. Gizli anahtarlar kaynak koda yazılmaz.
class AppConfig {
  const AppConfig({
    required this.env,
    required this.supabaseUrl,
    required this.supabasePublishableKey,
  });

  factory AppConfig.fromEnvironment() => const AppConfig(
        env: String.fromEnvironment('APP_ENV', defaultValue: 'dev'),
        supabaseUrl: String.fromEnvironment('SUPABASE_URL'),
        supabasePublishableKey: String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY'),
      );

  final String env;
  final String supabaseUrl;
  final String supabasePublishableKey;

  bool get isProduction => env == 'prod';

  /// Supabase bilgisi verilmemişse uygulama yerel demo veriyle çalışır.
  bool get isDemoMode => supabaseUrl.isEmpty || supabasePublishableKey.isEmpty;
}
