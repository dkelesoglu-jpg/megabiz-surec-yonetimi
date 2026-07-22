import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ========================================
// TYPES
// ========================================

export type UserRole =
    | 'system_admin'
    | 'board_chairman'
    | 'general_manager'
    | 'deputy_general_manager'
    | 'department_manager'
    | 'human_resources'
    | 'employee';

export type EmploymentStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';
export type DocumentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';
export type JDStatus = 'draft' | 'review' | 'approved' | 'archived';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type DocumentType = 'job_description' | 'work_instruction' | 'procedure' | 'form' | 'report' | 'policy';
export type ReviewStatus = 'pending' | 'in_progress' | 'completed' | 'approved';
export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'as_needed';
export type KPIFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type KPIStatus = 'active' | 'inactive' | 'archived';

export interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    employee_id: string | null;
    is_active: boolean;
    created_at: string;
}

export interface Department {
    id: string;
    name: string;
    code: string;
    description: string | null;
    manager_position_id: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Position {
    id: string;
    title: string;
    code: string;
    department_id: string;
    reports_to_position_id: string | null;
    deputy_position_id: string | null;
    employee_id: string | null;
    position_summary: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    department?: Department;
    reports_to?: Position;
    deputy?: Position;
    employee?: Employee;
}

export interface Employee {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    department_id: string | null;
    position_id: string | null;
    employment_status: EmploymentStatus;
    start_date: string;
    created_at: string;
    updated_at: string;
    department?: Department;
    position?: Position;
}

export interface JobDescription {
    id: string;
    position_id: string;
    document_number: string;
    revision_number: string;
    publication_date: string | null;
    summary: string | null;
    qualifications: string[];
    responsibilities: string[];
    authorities: string[];
    success_criteria: string[];
    status: JDStatus;
    file_url: string | null;
    created_at: string;
    updated_at: string;
    position?: Position;
}

export interface WorkInstruction {
    id: string;
    department_id: string;
    position_id: string | null;
    title: string;
    document_number: string;
    revision_number: string;
    publication_date: string | null;
    purpose: string | null;
    scope: string | null;
    content: string | null;
    status: JDStatus;
    file_url: string | null;
    created_at: string;
    updated_at: string;
    department?: Department;
    position?: Position;
}

export interface Procedure {
    id: string;
    work_instruction_id: string;
    procedure_code: string;
    title: string;
    description: string | null;
    responsible_position_id: string | null;
    control_position_id: string | null;
    approval_position_id: string | null;
    frequency: FrequencyType | null;
    sequence_number: number;
    created_at: string;
    updated_at: string;
    work_instruction?: WorkInstruction;
    responsible_position?: Position;
    control_position?: Position;
    approval_position?: Position;
}

export interface Document {
    id: string;
    title: string;
    document_type: DocumentType;
    department_id: string | null;
    position_id: string | null;
    document_number: string;
    revision_number: string;
    publication_date: string | null;
    prepared_by: string | null;
    controlled_by: string | null;
    approved_by: string | null;
    status: DocumentStatus;
    file_url: string | null;
    created_at: string;
    updated_at: string;
    department?: Department;
    position?: Position;
}

export interface Task {
    id: string;
    title: string;
    description: string | null;
    assigned_employee_id: string | null;
    assigned_position_id: string | null;
    department_id: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string | null;
    completion_date: string | null;
    evidence_url: string | null;
    created_at: string;
    updated_at: string;
    assigned_employee?: Employee;
    assigned_position?: Position;
    department?: Department;
}

export interface KPI {
    id: string;
    title: string;
    position_id: string;
    department_id: string;
    description: string | null;
    unit: string;
    target_value: number;
    weight: number;
    frequency: KPIFrequency;
    status: KPIStatus;
    created_at: string;
    updated_at: string;
    position?: Position;
    department?: Department;
}

export interface PerformanceReview {
    id: string;
    employee_id: string;
    period: string;
    evaluator_id: string | null;
    total_score: number | null;
    status: ReviewStatus;
    evaluation_date: string | null;
    created_at: string;
    updated_at: string;
    employee?: Employee;
    evaluator?: Employee;
}

export interface DashboardStats {
    active_employees: number;
    active_departments: number;
    active_positions: number;
    open_tasks: number;
    overdue_tasks: number;
    pending_approval_documents: number;
    upcoming_revisions: number;
}

// ========================================
// AUTH HELPERS
// ========================================

export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

export const getProfile = async () => {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*, employees(*, position:positions(*, department:departments(*)), department:departments(*))')
        .eq('id', user.id)
        .eq('is_active', true)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return data;
};

// Permission level check
export const canAccess = (userRole: UserRole, requiredMinLevel: number): boolean => {
    const levels: Record<UserRole, number> = {
        system_admin: 7,
        board_chairman: 6,
        general_manager: 5,
        deputy_general_manager: 4,
        department_manager: 3,
        human_resources: 2,
        employee: 1,
    };
    return levels[userRole] >= requiredMinLevel;
};

export const getRoleDisplayName = (role: UserRole): string => {
    const names: Record<UserRole, string> = {
        system_admin: 'Sistem Yöneticisi',
        board_chairman: 'Yönetim Kurulu Başkanı',
        general_manager: 'Genel Müdür',
        deputy_general_manager: 'Genel Müdür Yardımcısı',
        department_manager: 'Departman Müdürü',
        human_resources: 'İnsan Kaynakları',
        employee: 'Çalışan',
    };
    return names[role];
};
