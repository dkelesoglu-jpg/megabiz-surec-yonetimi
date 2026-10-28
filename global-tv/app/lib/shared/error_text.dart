import '../data/models.dart';
import '../l10n/gen/app_localizations.dart';

String errorText(AppLocalizations l10n, Object error) {
  final code = error is AppException ? error.code : AppErrorCode.unknown;
  return switch (code) {
    AppErrorCode.invalidCredentials => l10n.errInvalidCredentials,
    AppErrorCode.emailTaken => l10n.errEmailTaken,
    AppErrorCode.confirmEmail => l10n.errConfirmEmail,
    AppErrorCode.rateLimited => l10n.errRateLimited,
    AppErrorCode.roomLocked => l10n.errRoomLocked,
    AppErrorCode.slowMode => l10n.errSlowMode,
    AppErrorCode.muted => l10n.errMuted,
    AppErrorCode.banned => l10n.errBanned,
    AppErrorCode.notAvailable => l10n.errNotAvailable,
    AppErrorCode.geoBlocked => l10n.errGeoBlocked,
    AppErrorCode.unknown => l10n.errUnknown,
  };
}

/// Kalan süreyi okunur biçimde verir: "45 sn", "12 dk", "2 sa 5 dk", "3 gün".
String remainingText(AppLocalizations l10n, Duration d) {
  final seconds = d.inSeconds < 1 ? 1 : (d.inMilliseconds / 1000).ceil();
  if (seconds < 60) return l10n.durationSeconds(seconds);
  final minutes = (seconds / 60).ceil();
  if (minutes < 60) return l10n.durationMinutes(minutes);
  if (minutes < 24 * 60) return l10n.durationHours(minutes ~/ 60, minutes % 60);
  return l10n.durationDays((minutes / (24 * 60)).ceil());
}
