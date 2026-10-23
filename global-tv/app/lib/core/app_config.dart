/// Derleme zamanında `--dart-define-from-file=../env/<ortam>.json` ile gelen
/// ortam yapılandırması. Gizli anahtarlar kaynak koda yazılmaz.
class AppConfig {
  const AppConfig({
    required this.env,
    required this.supabaseUrl,
    required this.supabaseAnonKey,
  });

  factory AppConfig.fromEnvironment() => const AppConfig(
        env: String.fromEnvironment('APP_ENV', defaultValue: 'dev'),
        supabaseUrl: String.fromEnvironment('SUPABASE_URL'),
        supabaseAnonKey: String.fromEnvironment('SUPABASE_ANON_KEY'),
      );

  final String env;
  final String supabaseUrl;
  final String supabaseAnonKey;

  bool get isProduction => env == 'prod';

  /// Supabase bilgisi verilmemişse uygulama yerel demo veriyle çalışır.
  bool get isDemoMode => supabaseUrl.isEmpty || supabaseAnonKey.isEmpty;
}
