import { useState, useEffect } from 'react';
import { Calendar, User, Building2, Check, X, Clock } from 'lucide-react';
import { leaveRequestsService } from '../services/database.service';
import { useAuth } from '../contexts/AuthContext';
import type { LeaveRequest } from '../lib/supabase';

export default function LeaveApprovals() {
    const { profile, hasRole } = useAuth();
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const data = await leaveRequestsService.getPending();
            setRequests(data);
        } catch (err) {
            console.error('Veri yüklenirken hata:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (req: LeaveRequest) => {
        if (!profile?.employee_id) return;
        if (!confirm(`${req.employee?.full_name ?? 'Çalışan'} için ${req.gun_sayisi} günlük izin talebini onaylamak istediğinize emin misiniz?`)) return;
        setProcessingId(req.id);
        try {
            await leaveRequestsService.approve(req.id, profile.employee_id);
            setRequests(prev => prev.filter(r => r.id !== req.id));
        } catch (err: any) {
            alert(err?.message ?? 'Onaylama sırasında hata oluştu.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (redNedeni: string) => {
        if (!rejectTarget || !profile?.employee_id) return;
        if (!redNedeni.trim()) { alert('Red nedeni zorunludur.'); return; }
        setProcessingId(rejectTarget.id);
        try {
            await leaveRequestsService.reject(rejectTarget.id, profile.employee_id, redNedeni.trim());
            setRequests(prev => prev.filter(r => r.id !== rejectTarget.id));
            setRejectTarget(null);
        } catch (err: any) {
            alert(err?.message ?? 'Reddetme sırasında hata oluştu.');
        } finally {
            setProcessingId(null);
        }
    };

    if (!profile) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    if (!hasRole('department_manager')) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                <p className="text-lg font-medium">Bu sayfayı görüntüleme yetkiniz yok.</p>
            </div>
        );
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">İzin Onayları</h1>
                <p className="text-gray-600 mt-1">Onay bekleyen izin taleplerini inceleyin</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 inline-flex items-center gap-3">
                <div className="p-3 rounded-lg bg-yellow-100"><Clock size={20} className="text-yellow-600" /></div>
                <div>
                    <p className="text-sm text-gray-600 font-medium">Onay Bekleyen</p>
                    <p className="text-2xl font-bold">{requests.length}</p>
                </div>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                    <p className="text-lg font-medium mb-2">Onay bekleyen izin talebi yok</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map(req => (
                        <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-base font-semibold text-gray-900">{req.employee?.full_name ?? 'Bilinmeyen Çalışan'}</h3>
                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">{req.izin_turu?.ad ?? 'İzin'}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                                        {req.employee?.department && (
                                            <div className="flex items-center space-x-1"><Building2 size={14} /><span>{req.employee.department.name}</span></div>
                                        )}
                                        <div className="flex items-center space-x-1">
                                            <Calendar size={14} />
                                            <span>{new Date(req.baslangic_tarihi).toLocaleDateString('tr-TR')} - {new Date(req.bitis_tarihi).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                        <span>• {req.gun_sayisi} iş günü</span>
                                        <div className="flex items-center space-x-1 text-gray-400">
                                            <User size={14} /><span>Talep: {new Date(req.created_at).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                    </div>
                                    {req.aciklama && <p className="text-sm text-gray-600 mt-2">{req.aciklama}</p>}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleApprove(req)}
                                        disabled={processingId === req.id}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                                    >
                                        <Check size={16} /> Onayla
                                    </button>
                                    <button
                                        onClick={() => setRejectTarget(req)}
                                        disabled={processingId === req.id}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                                    >
                                        <X size={16} /> Reddet
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {rejectTarget && (
                <RejectModal
                    request={rejectTarget}
                    submitting={processingId === rejectTarget.id}
                    onClose={() => setRejectTarget(null)}
                    onConfirm={handleReject}
                />
            )}
        </div>
    );
}

interface RejectModalProps {
    request: LeaveRequest;
    submitting: boolean;
    onClose: () => void;
    onConfirm: (redNedeni: string) => void;
}

function RejectModal({ request, submitting, onClose, onConfirm }: RejectModalProps) {
    const [reason, setReason] = useState('');

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900">İzin Talebini Reddet</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-3">
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">{request.employee?.full_name}</span> için {request.gun_sayisi} günlük izin talebini reddetme nedeninizi belirtin.
                    </p>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        rows={3}
                        autoFocus
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Red nedeni *"
                    />
                </div>
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Vazgeç</button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={submitting}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                        {submitting ? 'Gönderiliyor...' : 'Reddet'}
                    </button>
                </div>
            </div>
        </div>
    );
}
