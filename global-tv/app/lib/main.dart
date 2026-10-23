import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // H2: AppConfig.isDemoMode false ise burada Supabase.initialize(...) çağrılacak.
  runApp(const ProviderScope(child: GlobalTvApp()));
}
