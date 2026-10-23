import { CheckCircle2, CircleSlash, Clock, XCircle } from 'lucide-react';
import type { RightsHealth } from '../lib/rights';
import { Badge } from './ui';

// Durum her zaman simge + metinle gösterilir (yalnızca renge dayanmaz).
export function RightsBadge({ health }: { health: RightsHealth | 'none' }) {
  switch (health) {
    case 'valid':
      return <Badge tone="good" icon={<CheckCircle2 size={12} aria-hidden />}>Geçerli</Badge>;
    case 'expiring':
      return <Badge tone="warning" icon={<Clock size={12} aria-hidden />}>Bitiyor</Badge>;
    case 'expired':
      return <Badge tone="critical" icon={<XCircle size={12} aria-hidden />}>Süresi doldu</Badge>;
    case 'not_started':
      return <Badge tone="neutral" icon={<Clock size={12} aria-hidden />}>Başlamadı</Badge>;
    case 'inactive':
      return <Badge tone="neutral" icon={<CircleSlash size={12} aria-hidden />}>Doğrulanmadı</Badge>;
    case 'none':
      return <Badge tone="critical" icon={<XCircle size={12} aria-hidden />}>Hak yok</Badge>;
  }
}
