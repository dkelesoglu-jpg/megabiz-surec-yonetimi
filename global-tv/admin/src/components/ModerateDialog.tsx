import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';
import type { ModerationAction } from '../lib/types';
import { FormError, errorMessage, useToast } from './feedback';
import { Button, Field, Modal, Select, TextInput } from './ui';

/** Susturma / engelleme iletişim kutusu (Topluluk ve Moderasyon sayfalarında ortak). */
export function ModerateDialog({ profile, action, onClose, onDone }: {
  profile: { id: string; username: string };
  action: ModerationAction;
  onClose: () => void;
  onDone: () => void;
}) {
  const { api } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [minutes, setMinutes] = useState(60 * 24);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    try {
      await api.moderateUser(profile.id, action, reason || undefined, minutes);
      toast.notify(t('mod.applied', { name: profile.username }));
      onDone();
    } catch (e) {
      setError(errorMessage(t, e));
    }
  }

  const buttonLabel = { mute: t('mod.mute'), unmute: t('mod.unmute'), ban: t('mod.ban'), unban: t('mod.unban') }[action];

  return (
    <Modal open title={t(`mod.dlg.${action}`)} onClose={onClose}
      footer={<><Button onClick={onClose}>{t('common.cancel')}</Button><Button variant={action === 'ban' ? 'danger' : 'primary'} onClick={submit}>{buttonLabel}</Button></>}>
      <p className="mb-3 text-sm">{t('mod.dlgUser', { name: profile.username })}</p>
      <div className="grid gap-3">
        {action === 'mute' && (
          <Field label={t('mod.duration')}>{(id) => (
            <Select id={id} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              <option value={60}>{t('mod.d1h')}</option>
              <option value={60 * 24}>{t('mod.d24h')}</option>
              <option value={60 * 24 * 7}>{t('mod.d7d')}</option>
            </Select>)}
          </Field>
        )}
        {(action === 'mute' || action === 'ban') && (
          <Field label={t('common.reason')} hint={t('mod.reasonHint')}>{(id) => <TextInput id={id} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
        )}
      </div>
      <FormError message={error} />
    </Modal>
  );
}
