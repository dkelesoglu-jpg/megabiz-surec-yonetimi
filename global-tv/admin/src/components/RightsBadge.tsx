import { CheckCircle2, CircleSlash, Clock, XCircle } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import type { RightsHealth } from '../lib/rights';
import { Badge } from './ui';

// Durum her zaman simge + metinle gösterilir (yalnızca renge dayanmaz).
export function RightsBadge({ health }: { health: RightsHealth | 'none' }) {
  const { t } = useI18n();
  const label = t(`health.${health}`);
  switch (health) {
    case 'valid':
      return <Badge tone="good" icon={<CheckCircle2 size={12} aria-hidden />}>{label}</Badge>;
    case 'expiring':
      return <Badge tone="warning" icon={<Clock size={12} aria-hidden />}>{label}</Badge>;
    case 'expired':
    case 'none':
      return <Badge tone="critical" icon={<XCircle size={12} aria-hidden />}>{label}</Badge>;
    case 'not_started':
      return <Badge tone="neutral" icon={<Clock size={12} aria-hidden />}>{label}</Badge>;
    case 'inactive':
      return <Badge tone="neutral" icon={<CircleSlash size={12} aria-hidden />}>{label}</Badge>;
  }
}
