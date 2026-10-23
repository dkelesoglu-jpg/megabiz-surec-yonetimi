import '../data/models.dart';
import '../l10n/gen/app_localizations.dart';

String errorText(AppLocalizations l10n, Object error) {
  final code = error is AppException ? error.code : AppErrorCode.unknown;
  return switch (code) {
    AppErrorCode.invalidCredentials => l10n.errInvalidCredentials,
    AppErrorCode.emailTaken => l10n.errEmailTaken,
    AppErrorCode.confirmEmail => l10n.errConfirmEmail,
    AppErrorCode.rateLimited => l10n.errRateLimited,
    AppErrorCode.notAvailable => l10n.errNotAvailable,
    AppErrorCode.geoBlocked => l10n.errGeoBlocked,
    AppErrorCode.unknown => l10n.errUnknown,
  };
}
