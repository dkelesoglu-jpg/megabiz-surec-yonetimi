import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/providers.dart';
import '../../l10n/gen/app_localizations.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await ref.read(authProvider.notifier).signInWithEmail(_email.text.trim(), _password.text);
      if (mounted) context.pop();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(l10n.signInTitle, style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 8),
            Text(l10n.signInSubtitle),
            const SizedBox(height: 24),
            Form(
              key: _formKey,
              child: Column(
                children: [
                  TextFormField(
                    key: const Key('email'),
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    decoration: InputDecoration(labelText: l10n.email, border: const OutlineInputBorder()),
                    validator: (v) =>
                        RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v?.trim() ?? '') ? null : l10n.invalidEmail,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    key: const Key('password'),
                    controller: _password,
                    obscureText: true,
                    autofillHints: const [AutofillHints.password],
                    decoration: InputDecoration(labelText: l10n.password, border: const OutlineInputBorder()),
                    validator: (v) => (v?.length ?? 0) >= 8 ? null : l10n.passwordTooShort,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(onPressed: _busy ? null : _submit, child: Text(l10n.signIn)),
            const SizedBox(height: 24),
            // Apple ve Google ile giriş H3'te Supabase Auth ile bağlanacak.
            OutlinedButton.icon(onPressed: null, icon: const Icon(Icons.apple), label: Text(l10n.signInWithApple)),
            const SizedBox(height: 8),
            OutlinedButton.icon(onPressed: null, icon: const Icon(Icons.g_mobiledata), label: Text(l10n.signInWithGoogle)),
            const SizedBox(height: 16),
            TextButton(onPressed: () => context.pop(), child: Text(l10n.continueAsGuest)),
          ],
        ),
      ),
    );
  }
}
