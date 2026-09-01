import { supabase } from '../lib/supabase';
import type {
    Department,
    Position,
    Employee,
    JobDescription,
    WorkInstruction,
    Document,
    Task,
    KPI,
    PerformanceReview,
    DashboardStats,
    Procedure,
    Profile,
    LeaveType,
    LeaveRequest,
    LeaveBalance,
} from '../lib/supabase';

// Helper function
function handleResponse<T>(data: T | null, error: any): T {
    if (error) {
        console.error('Database error:', error.message);
        throw new Error(`Veritabanı hatası: ${error.message}`);
    }
    if (!data) throw new Error('Veri bulunamadı');
    return data;
}

// ========================================
// PROFILES SERVICE
// ========================================
export const profilesService = {
    async getAll(): Promise<Profile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_active', true)
            .order('full_name');
        return handleResponse(data, error);
    },

    async getById(id: string): Promise<Profile> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        return handleResponse(data, error);
    },

    async create(profile: Partial<Profile>) {
        const { data, error } = await supabase
            .from('profiles')
            .insert(profile)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async update(id: string, updates: Partial<Profile>) {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async delete(id: string) {
        const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', id);
        if (error) throw new Error(`Silme hatası: ${error.message}`);
    },
};

// ========================================
// DEPARTMENTS SERVICE
// ========================================
export const departmentsService = {
    async getAll(): Promise<Department[]> {
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .eq('is_active', true)
            .order('code');
        return handleResponse(data, error);
    },

    async getAllWithPositions() {
        const { data, error } = await supabase
            .from('departments')
            .select('*, positions(*)')
            .eq('is_active', true)
            .order('code');
        return handleResponse(data, error);
    },

    async getById(id: string): Promise<Department> {
        const { data, error } = await supabase
            .from('departments')
            .select('*')
            .eq('id', id)
            .single();
        return handleResponse(data, error);
    },

    async create(dept: Partial<Department>) {
        const { data, error } = await supabase
            .from('departments')
            .insert(dept)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async update(id: string, updates: Partial<Department>) {
        const { data, error } = await supabase
            .from('departments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async delete(id: string) {
        const { error } = await supabase.from('departments').update({ is_active: false }).eq('id', id);
        if (error) throw new Error(`Silme hatası: ${error.message}`);
    },
};

// ========================================
// POSITIONS SERVICE
// ========================================
export const positionsService = {
    async getAll(): Promise<Position[]> {
        const { data, error } = await supabase
            .from('positions')
            .select('*, department:departments(*), employee:employees(*)')
            .eq('is_active', true)
            .order('code');
        return handleResponse(data, error);
    },

    async getById(id: string): Promise<Position> {
        const { data, error } = await supabase
            .from('positions')
            .select('*, department:departments(*), employee:employees(*), reports_to:positions!reports_to_position_id(*), deputy:positions!deputy_position_id(*)')
            .eq('id', id)
            .single();
        return handleResponse(data, error);
    },

    async getByDepartment(departmentId: string): Promise<Position[]> {
        const { data, error } = await supabase
            .from('positions')
            .select('*, department:departments(*), employee:employees(*)')
            .eq('department_id', departmentId)
            .eq('is_active', true)
            .order('code');
        return handleResponse(data, error);
    },

    async create(pos: Partial<Position>) {
        const { data, error } = await supabase
            .from('positions')
            .insert(pos)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async update(id: string, updates: Partial<Position>) {
        const { data, error } = await supabase
            .from('positions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async delete(id: string) {
        const { error } = await supabase.from('positions').update({ is_active: false }).eq('id', id);
        if (error) throw new Error(`Silme hatası: ${error.message}`);
    },
};

// ========================================
// EMPLOYEES SERVICE
// ========================================
export const employeesService = {
    async getAll(): Promise<Employee[]> {
        const { data, error } = await supabase
            .from('employees')
            .select('*, department:departments(*), position:positions(*)')
            .eq('employment_status', 'active')
            .order('full_name');
        return handleResponse(data, error);
    },

    async getById(id: string): Promise<Employee> {
        const { data, error } = await supabase
            .from('employees')
            .select('*, department:departments(*), position:positions(*)')
            .eq('id', id)
            .single();
        return handleResponse(data, error);
    },

    async getByDepartment(departmentId: string): Promise<Employee[]> {
        const { data, error } = await supabase
            .from('employees')
            .select('*, position:positions(*)')
            .eq('department_id', departmentId)
            .eq('employment_status', 'active')
            .order('full_name');
        return handleResponse(data, error);
    },

    async create(emp: Partial<Employee>) {
        const { data, error } = await supabase
            .from('employees')
            .insert(emp)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async update(id: string, updates: Partial<Employee>) {
        const { data, error } = await supabase
            .from('employees')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('employees')
            .update({ employment_status: 'terminated' })
            .eq('id', id);
        if (error) throw new Error(`Silme hatası: ${error.message}`);
    },
};

// ========================================
// JOB DESCRIPTIONS SERVICE
// ========================================
export const jobDescriptionsService = {
    async getAll(): Promise<JobDescription[]> {
        const { data, error } = await supabase
            .from('job_descriptions')
            .select('*, position:positions(*, department:departments(*))')
            .order('document_number');
        return handleResponse(data, error);
    },

    async getById(id: string): Promise<JobDescription> {
        const { data, error } = await supabase
            .from('job_descriptions')
            .select('*, position:positions(*, department:departments(*))')
            .eq('id', id)
            .single();
        return handleResponse(data, error);
    },

    async getByPosition(positionId: string): Promise<JobDescription | null> {
        const { data, error } = await supabase
            .from('job_descriptions')
            .select('*, position:positions(*, department:departments(*))')
            .eq('position_id', positionId)
            .order('revision_number', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw new Error(`Veritabanı hatası: ${error.message}`);
        return data;
    },

    async create(jd: Partial<JobDescription>) {
        const { data, error } = await supabase
            .from('job_descriptions')
            .insert(jd)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async update(id: string, updates: Partial<JobDescription>) {
        const { data, error } = await supabase
            .from('job_descriptions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('job_descriptions')
            .update({ status: 'archived' })
            .eq('id', id);
        if (error) throw new Error(`Silme hatası: ${error.message}`);
    },
};

// ========================================
// WORK INSTRUCTIONS SERVICE
// ========================================
export const workInstructionsService = {
    async getAll(): Promise<WorkInstruction[]> {
        const { data, error } = await supabase
            .from('work_instructions')
            .select('*, department:departments(*), position:positions(*)')
            .order('document_number');
        return handleResponse(data, error);
    },

    async getById(id: string): Promise<WorkInstruction> {
        const { data, error } = await supabase
            .from('work_instructions')
            .select('*, department:departments(*), position:positions(*)')
            .eq('id', id)
            .single();
        return handleResponse(data, error);
    },

    async getByDepartment(departmentId: string): Promise<WorkInstruction[]> {
        const { data, error } = await supabase
            .from('work_instructions')
            .select('*, department:departments(*), position:positions(*)')
            .eq('department_id', departmentId)
            .order('document_number');
        return handleResponse(data, error);
    },

    async create(wi: Partial<WorkInstruction>) {
        const { data, error } = await supabase
            .from('work_instructions')
            .insert(wi)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async update(id: string, updates: Partial<WorkInstruction>) {
        const { data, error } = await supabase
            .from('work_instructions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('work_instructions')
            .update({ status: 'archived' })
            .eq('id', id);
        if (error) throw new Error(`Silme hatası: ${error.message}`);
    },
};

// ========================================
// PROCEDURES SERVICE
// ========================================
export const proceduresService = {
    async getAll(): Promise<Procedure[]> {
        const { data, error } = await supabase
            .from('procedures')
            .select('*, work_instruction:work_instructions(*), responsible_position:positions!responsible_position_id(*)')
            .order('sequence_number');
        return handleResponse(data, error);
    },

    async create(proc: Partial<Procedure>) {
        const { data, error } = await supabase
            .from('procedures')
            .insert(proc)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async update(id: string, updates: Partial<Procedure>) {
        const { data, error } = await supabase
            .from('procedures')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return handleResponse(data, error);
    },
};

// ========================================
// DOCUMENTS SERVICE
// ========================================
export const documentsService = {
    async getAll(): Promise<Document[]> {
        const { data, error } = await supabase
            .from('documents')
            .select('*, department:departments(*), position:positions(*)')
            .order('created_at', { ascending: false });
        return handleResponse(data, error);
    },

    async getById(id: string): Promise<Document> {
        const { data, error } = await supabase
            .from('documents')
            .select('*, department:departments(*), position:positions(*)')
            .eq('id', id)
            .single();
        return handleResponse(data, error);
    },

    async getByType(type: string): Promise<Document[]> {
        const { data, error } = await supabase
            .from('documents')
            .select('*, department:departments(*), position:positions(*)')
            .eq('document_type', type)
            .order('created_at', { ascending: false });
        return handleResponse(data, error);
    },

    async create(doc: Partial<Document>) {
        const { data, error } = await supabase
            .from('documents')
            .insert(doc)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async update(id: string, updates: Partial<Document>) {
        const { data, error } = await supabase
            .from('documents')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('documents')
            .update({ status: 'archived' })
            .eq('id', id);
        if (error) throw new Error(`Silme hatası: ${error.message}`);
    },

    async uploadFile(file: File, path: string) {
        const { data, error } = await supabase.storage
            .from('documents')
            .upload(path, file, { upsert: true });
        if (error) throw new Error(`Dosya yükleme hatası: ${error.message}`);
        return data;
    },

    async getFileUrl(path: string): Promise<string> {
        const { data } = supabase.storage.from('documents').getPublicUrl(path);
        return data.publicUrl;
    },

    async getDocumentUrl(fileUrl: string | null): Promise<string | null> {
        if (!fileUrl) return null;
        // If already a full URL, return it
        if (fileUrl.startsWith('http')) return fileUrl;
        return this.getFileUrl(fileUrl);
    },
};

// ========================================
// TASKS SERVICE
// ========================================
export const tasksService = {
    async getAll(): Promise<Task[]> {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, assigned_employee:employees(*), assigned_position:positions(*), department:departments(*)')
            .order('created_at', { ascending: false });
        return handleResponse(data, error);
    },

    async getById(id: string): Promise<Task> {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, assigned_employee:employees(*), assigned_position:positions(*), department:departments(*)')
            .eq('id', id)
            .single();
        return handleResponse(data, error);
    },

    async getByEmployee(employeeId: string): Promise<Task[]> {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, department:departments(*)')
            .eq('assigned_employee_id', employeeId)
            .order('due_date', { ascending: true });
        return handleResponse(data, error);
    },

    async getOverdue(): Promise<Task[]> {
        const { data, error } = await supabase
            .from('tasks')
            .select('*, assigned_employee:employees(*), department:departments(*)')
            .or('status.eq.overdue,and(status.eq.pending,due_date.lt.today()),and(status.eq.in_progress,due_date.lt.today())')
            .order('due_date', { ascending: true });
        return handleResponse(data, error);
    },

    async create(task: Partial<Task>) {
        const { data, error } = await supabase
            .from('tasks')
            .insert(task)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async update(id: string, updates: Partial<Task>) {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('tasks')
            .update({ status: 'cancelled' })
            .eq('id', id);
        if (error) throw new Error(`Silme hatası: ${error.message}`);
    },
};

// ========================================
// KPIs SERVICE
// ========================================
export const kpisService = {
    async getAll(): Promise<KPI[]> {
        const { data, error } = await supabase
            .from('kpis')
            .select('*, position:positions(*), department:departments(*)')
            .eq('status', 'active')
            .order('title');
        return handleResponse(data, error);
    },

    async getById(id: string): Promise<KPI> {
        const { data, error } = await supabase
            .from('kpis')
            .select('*, position:positions(*), department:departments(*)')
            .eq('id', id)
            .single();
        return handleResponse(data, error);
    },

    async create(kpi: Partial<KPI>) {
        const { data, error } = await supabase
            .from('kpis')
            .insert(kpi)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async update(id: string, updates: Partial<KPI>) {
        const { data, error } = await supabase
            .from('kpis')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return handleResponse(data, error);
    },
};

// ========================================
// PERFORMANCE REVIEWS SERVICE
// ========================================
export const performanceReviewsService = {
    async getAll(): Promise<PerformanceReview[]> {
        const { data, error } = await supabase
            .from('performance_reviews')
            .select('*, employee:employees(*), evaluator:employees!evaluator_id(*)')
            .order('evaluation_date', { ascending: false });
        return handleResponse(data, error);
    },

    async getByEmployee(employeeId: string): Promise<PerformanceReview[]> {
        const { data, error } = await supabase
            .from('performance_reviews')
            .select('*, evaluator:employees!evaluator_id(*)')
            .eq('employee_id', employeeId)
            .order('period', { ascending: false });
        return handleResponse(data, error);
    },

    async create(review: Partial<PerformanceReview>) {
        const { data, error } = await supabase
            .from('performance_reviews')
            .insert(review)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async update(id: string, updates: Partial<PerformanceReview>) {
        const { data, error } = await supabase
            .from('performance_reviews')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return handleResponse(data, error);
    },
};

// ========================================
// DASHBOARD SERVICE
// ========================================
export const dashboardService = {
    async getStats(): Promise<DashboardStats> {
        const { data, error } = await supabase
            .from('v_dashboard_stats')
            .select('*')
            .single();
        
        if (error) {
            // Fallback: count manually if view doesn't exist yet
            return this.getStatsFallback();
        }
        return data as DashboardStats;
    },

    async getStatsFallback(): Promise<DashboardStats> {
        const [
            { count: activeEmployees },
            { count: activeDepartments },
            { count: activePositions },
            { count: openTasks },
            { count: overdueTasks },
            { count: pendingDocs },
        ] = await Promise.all([
            supabase.from('employees').select('*', { count: 'exact', head: true }).eq('employment_status', 'active'),
            supabase.from('departments').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('positions').select('*', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('tasks').select('*', { count: 'exact', head: true }).in('status', ['pending', 'in_progress']),
            supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
            supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'review'),
        ]);

        return {
            active_employees: activeEmployees || 0,
            active_departments: activeDepartments || 0,
            active_positions: activePositions || 0,
            open_tasks: openTasks || 0,
            overdue_tasks: overdueTasks || 0,
            pending_approval_documents: pendingDocs || 0,
            upcoming_revisions: 0,
        };
    },

    async getDepartmentDistribution() {
        const { data, error } = await supabase
            .from('positions')
            .select('department_id, departments(name, code)')
            .eq('is_active', true);

        if (error) throw new Error(`Veritabanı hatası: ${error.message}`);

        const distribution = data?.reduce((acc: any[], curr: any) => {
            const existing = acc.find((item: any) => item.department_id === curr.department_id);
            if (existing) {
                existing.value += 1;
            } else {
                acc.push({
                    department_id: curr.department_id,
                    name: curr.departments?.name,
                    code: curr.departments?.code,
                    value: 1,
                });
            }
            return acc;
        }, []) || [];

        return distribution;
    },
};

// ========================================
// LEAVE TYPES SERVICE (izin_turleri)
// ========================================
export const leaveTypesService = {
    async getAll(): Promise<LeaveType[]> {
        const { data, error } = await supabase
            .from('izin_turleri')
            .select('*')
            .eq('aktif', true)
            .order('ad');
        return handleResponse(data, error);
    },

    async getById(id: string): Promise<LeaveType> {
        const { data, error } = await supabase
            .from('izin_turleri')
            .select('*')
            .eq('id', id)
            .single();
        return handleResponse(data, error);
    },

    async create(leaveType: Partial<LeaveType>) {
        const { data, error } = await supabase
            .from('izin_turleri')
            .insert(leaveType)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async update(id: string, updates: Partial<LeaveType>) {
        const { data, error } = await supabase
            .from('izin_turleri')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return handleResponse(data, error);
    },
};

// ========================================
// LEAVE BALANCES SERVICE (izin_bakiyeleri)
// ========================================
export const leaveBalancesService = {
    // İlgili çalışan/izin türü/yıl için bakiye satırı yoksa sunucu tarafında
    // (kıdem + yaş kurallarına göre) otomatik oluşturur, varsa döndürür.
    async getOrCreate(employeeId: string, izinTuruId: string, yil?: number): Promise<LeaveBalance> {
        const { data, error } = await supabase.rpc('izin_bakiyesi_getir_veya_olustur', {
            p_employee_id: employeeId,
            p_izin_turu_id: izinTuruId,
            ...(yil ? { p_yil: yil } : {}),
        });
        return handleResponse(data, error);
    },

    async getByEmployee(employeeId: string, yil?: number): Promise<LeaveBalance[]> {
        let query = supabase
            .from('izin_bakiyeleri')
            .select('*, izin_turu:izin_turleri(*)')
            .eq('employee_id', employeeId);
        if (yil) query = query.eq('yil', yil);
        const { data, error } = await query.order('yil', { ascending: false });
        return handleResponse(data, error);
    },
};

// ========================================
// LEAVE REQUESTS SERVICE (izin_talepleri)
// ========================================
export const leaveRequestsService = {
    async getByEmployee(employeeId: string): Promise<LeaveRequest[]> {
        const { data, error } = await supabase
            .from('izin_talepleri')
            .select('*, izin_turu:izin_turleri(*)')
            .eq('employee_id', employeeId)
            .order('created_at', { ascending: false });
        return handleResponse(data, error);
    },

    // Yönetici/İK: onay bekleyen talepler
    async getPending(): Promise<LeaveRequest[]> {
        const { data, error } = await supabase
            .from('izin_talepleri')
            .select('*, employee:employees(*, department:departments(*)), izin_turu:izin_turleri(*)')
            .eq('durum', 'beklemede')
            .order('created_at', { ascending: true });
        return handleResponse(data, error);
    },

    // Yönetici/İK: tüm talepler (geçmiş dahil)
    async getAll(): Promise<LeaveRequest[]> {
        const { data, error } = await supabase
            .from('izin_talepleri')
            .select('*, employee:employees(*, department:departments(*)), izin_turu:izin_turleri(*), onaylayan:employees!onaylayan_id(*)')
            .order('created_at', { ascending: false });
        return handleResponse(data, error);
    },

    async create(request: {
        employee_id: string;
        izin_turu_id: string;
        baslangic_tarihi: string;
        bitis_tarihi: string;
        aciklama?: string;
    }) {
        const { data, error } = await supabase
            .from('izin_talepleri')
            .insert(request)
            .select('*, izin_turu:izin_turleri(*)')
            .single();
        return handleResponse(data, error);
    },

    async cancel(id: string) {
        const { error } = await supabase
            .from('izin_talepleri')
            .update({ durum: 'iptal_edildi' })
            .eq('id', id);
        if (error) throw new Error(`İptal hatası: ${error.message}`);
    },

    async approve(id: string, onaylayanId: string) {
        const { data, error } = await supabase
            .from('izin_talepleri')
            .update({ durum: 'onaylandi', onaylayan_id: onaylayanId, onay_tarihi: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        return handleResponse(data, error);
    },

    async reject(id: string, onaylayanId: string, redNedeni: string) {
        const { data, error } = await supabase
            .from('izin_talepleri')
            .update({
                durum: 'reddedildi',
                onaylayan_id: onaylayanId,
                onay_tarihi: new Date().toISOString(),
                red_nedeni: redNedeni,
            })
            .eq('id', id)
            .select()
            .single();
        return handleResponse(data, error);
    },
};
