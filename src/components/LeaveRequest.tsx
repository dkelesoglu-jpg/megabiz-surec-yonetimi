import { useState, useEffect } from 'react';
import { Plus, Calendar, X, Clock, CheckCircle, XCircle, Ban } from 'lucide-react';
import { leaveTypesService, leaveBalancesService, leaveRequestsService } from '../services/database.service';
import { useAuth } from '../contexts/AuthContext';
import type { LeaveType, LeaveRequest as LeaveRequestType, LeaveBalance } from '../lib/supabase';

// Sunucu tarafında trigger ile hesaplanan iş günü sayısının kullanıcıya
// gönderilmeden önce bir ön izlemesi (hafta sonları hariç).
function tahminiIsGunu(baslangic: string, bitis: string): number {
    if (!baslangic || !bitis) return 0;
    const start = new Date(baslangic);
    const end = new Date(bitis);
    if (end < start) return 0;
    let gun = 0;
    const cursor = new Date(start);
    while (cursor <= end) {
        const day = cursor.getDay();
        if (day !== 0 && day !== 6) gun++;
        cursor.setDate(cursor.getDate() + 1);
    }
    return gun;
}

export default function LeaveRequest() {
    const { profile } = useAuth();
    const employeeId = profile?.employee_id ?? null;

    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [requests, setRequests] = useState<LeaveRequestType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => { if (employeeId) loadData(); }, [employeeId]);

    const loadData = async () => {
        if (!employeeId) return;
        try {
            const [typesData, requestsData] = await Promise.all([
                leaveTypesService.getAll(),
                leaveRequestsService.getByEmployee(employeeId),
            ]);
            setLeaveTypes(typesData);
            setRequests(requestsData);
        } catch (err) {
            console.error('Veri yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!profile) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    if (!employeeId) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                <p className="text-lg font-medium">Profilinize bağlı bir çalışan kaydı bulunamadı.</p>
                <p className="text-sm mt-1">İzin talebi oluşturabilmek için İK'nın hesabınızı bir çalışan kaydıyla ilişkilendirmesi gerekir.</p>
            </div>
        );
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    const pendingCount = requests.filter(r => r.durum === 'beklemede').length;
    const approvedCount = requests.filter(r => r.durum === 'onaylandi').length;
    const rejectedCount = requests.filter(r => r.durum === 'reddedildi').length;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">İzin Taleplerim</h1>
                    <p className="text-gray-600 mt-1">İzin talebi oluşturun ve geçmiş taleplerinizi görüntüleyin</p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus size={20} /><span>Yeni İzin Talebi</span>
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Bekleyen', value: pendingCount, icon: Clock, color: 'yellow' },
                    { label: 'Onaylanan', value: approvedCount, icon: CheckCircle, color: 'green' },
                    { label: 'Reddedilen', value: rejectedCount, icon: XCircle, color: 'red' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-medium">{label}</p>
                                <p className="text-2xl font-bold mt-1">{value}</p>
                            </div>
                            <div className={`p-3 rounded-lg ${color === 'yellow' ? 'bg-yellow-100' : color === 'green' ? 'bg-green-100' : 'bg-red-100'}`}>
                                <Icon size={20} className={color === 'yellow' ? 'text-yellow-600' : color === 'green' ? 'text-green-600' : 'text-red-600'} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {requests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                    <p className="text-lg font-medium mb-2">Henüz izin talebiniz yok</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map(req => (
                        <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-base font-semibold text-gray-900">{req.izin_turu?.ad ?? 'İzin'}</h3>
                                        <div className="flex items-center gap-2">
                                            <DurumBadge durum={req.durum} />
                                            {req.durum === 'beklemede' && (
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('Bu izin talebini iptal etmek istediğinize emin misiniz?')) return;
                                                        await leaveRequestsService.cancel(req.id);
                                                        loadData();
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Talebi İptal Et"
                                                >
                                                    <Ban size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {req.aciklama && <p className="text-sm text-gray-600 mt-2">{req.aciklama}</p>}
                                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
                                        <div className="flex items-center space-x-1">
                                            <Calendar size={14} />
                                            <span>
                                                {new Date(req.baslangic_tarihi).toLocaleDateString('tr-TR')} - {new Date(req.bitis_tarihi).toLocaleDateString('tr-TR')}
                                            </span>
                                        </div>
                                        <span>• {req.gun_sayisi} iş günü</span>
                                    </div>
                                    {req.durum === 'reddedildi' && req.red_nedeni && (
                                        <p className="text-sm text-red-600 mt-2">Red nedeni: {req.red_nedeni}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <LeaveRequestModal
                    employeeId={employeeId}
                    leaveTypes={leaveTypes}
                    onClose={() => setShowModal(false)}
                    onSave={async (data) => {
                        try {
                            await leaveRequestsService.create({ employee_id: employeeId, ...data });
                            setShowModal(false);
                            loadData();
                        } catch (err: any) {
                            alert(err?.message ?? 'İzin talebi oluşturulurken hata oluştu.');
                        }
                    }}
                />
            )}
        </div>
    );
}

function DurumBadge({ durum }: { durum: string }) {
    const map: Record<string, string> = {
        beklemede: 'bg-yellow-100 text-yellow-700',
        onaylandi: 'bg-green-100 text-green-700',
        reddedildi: 'bg-red-100 text-red-700',
        iptal_edildi: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = {
        beklemede: 'Beklemede', onaylandi: 'Onaylandı', reddedildi: 'Reddedildi', iptal_edildi: 'İptal Edildi',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full shrink-0 ${map[durum] || map.beklemede}`}>{labels[durum] || durum}</span>;
}

interface LeaveRequestModalProps {
    employeeId: string;
    leaveTypes: LeaveType[];
    onClose: () => void;
    onSave: (data: { izin_turu_id: string; baslangic_tarihi: string; bitis_tarihi: string; aciklama?: string }) => Promise<void>;
}

function LeaveRequestModal({ employeeId, leaveTypes, onClose, onSave }: LeaveRequestModalProps) {
    const [form, setForm] = useState({
        izin_turu_id: leaveTypes[0]?.id || '',
        baslangic_tarihi: '',
        bitis_tarihi: '',
        aciklama: '',
    });
    const [balance, setBalance] = useState<LeaveBalance | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!form.izin_turu_id) { setBalance(null); return; }
        setBalanceLoading(true);
        leaveBalancesService.getOrCreate(employeeId, form.izin_turu_id)
            .then(setBalance)
            .catch(() => setBalance(null))
            .finally(() => setBalanceLoading(false));
    }, [form.izin_turu_id, employeeId]);

    const gunTahmini = tahminiIsGunu(form.baslangic_tarihi, form.bitis_tarihi);
    const secilenTur = leaveTypes.find(t => t.id === form.izin_turu_id);

    const handleSubmit = async () => {
        if (!form.izin_turu_id) { alert('İzin türü seçiniz.'); return; }
        if (!form.baslangic_tarihi || !form.bitis_tarihi) { alert('Başlangıç ve bitiş tarihi zorunludur.'); return; }
        if (form.bitis_tarihi < form.baslangic_tarihi) { alert('Bitiş tarihi başlangıç tarihinden önce olamaz.'); return; }
        setSubmitting(true);
        try {
            await onSave(form);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full my-8">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Yeni İzin Talebi</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">İzin Türü *</label>
                        <select value={form.izin_turu_id} onChange={e => setForm(f => ({ ...f, izin_turu_id: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {leaveTypes.length === 0 && <option value="">İzin türü tanımlı değil</option>}
                            {leaveTypes.map(t => <option key={t.id} value={t.id}>{t.ad}</option>)}
                        </select>
                    </div>

                    {secilenTur?.bakiye_takipli && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm">
                            {balanceLoading ? (
                                <span className="text-blue-700">Bakiye hesaplanıyor...</span>
                            ) : balance ? (
                                <div className="flex items-center justify-between">
                                    <span className="text-blue-900 font-medium">Kalan İzin Bakiyeniz</span>
                                    <span className="text-blue-900 font-bold text-lg">{balance.kalan_gun} gün</span>
                                </div>
                            ) : (
                                <span className="text-blue-700">Bakiye bilgisi alınamadı.</span>
                            )}
                            {balance && (
                                <p className="text-xs text-blue-700 mt-1">
                                    Hak edilen: {balance.hak_edilen_gun} + Devreden: {balance.devreden_gun} - Kullanılan: {balance.kullanilan_gun}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi *</label>
                            <input type="date" value={form.baslangic_tarihi} onChange={e => setForm(f => ({ ...f, baslangic_tarihi: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi *</label>
                            <input type="date" value={form.bitis_tarihi} min={form.baslangic_tarihi || undefined}
                                onChange={e => setForm(f => ({ ...f, bitis_tarihi: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>

                    {gunTahmini > 0 && (
                        <p className="text-sm text-gray-600">Tahmini süre: <span className="font-medium">{gunTahmini} iş günü</span> (hafta sonları hariç, kesin değer onay sürecinde hesaplanır)</p>
                    )}

                    {secilenTur?.bakiye_takipli && balance && gunTahmini > balance.kalan_gun && (
                        <p className="text-sm text-red-600 font-medium">Seçilen tarih aralığı kalan bakiyenizi aşıyor.</p>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                        <textarea value={form.aciklama} onChange={e => setForm(f => ({ ...f, aciklama: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3}
                            placeholder="İzin talebinizle ilgili ek bilgi (opsiyonel)" />
                    </div>
                </div>
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">İptal</button>
                    <button onClick={handleSubmit} disabled={submitting || leaveTypes.length === 0}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {submitting ? 'Gönderiliyor...' : 'Talebi Gönder'}
                    </button>
                </div>
            </div>
        </div>
    );
}
