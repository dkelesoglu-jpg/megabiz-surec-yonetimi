-- ========================================
-- MEGABIZ - Süreç Yönetim Sistemi
-- Database Schema
-- ========================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. PROFILES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'system_admin',
        'board_chairman',
        'general_manager',
        'deputy_general_manager',
        'department_manager',
        'human_resources',
        'employee'
    )),
    employee_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ========================================
-- 2. DEPARTMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    manager_position_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_active ON departments(is_active);

-- ========================================
-- 3. POSITIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    reports_to_position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    deputy_position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    position_summary TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_positions_department ON positions(department_id);
CREATE INDEX idx_positions_reports_to ON positions(reports_to_position_id);
CREATE INDEX idx_positions_active ON positions(is_active);
CREATE INDEX idx_positions_code ON positions(code);

-- Foreign key for department manager
ALTER TABLE departments
    ADD CONSTRAINT fk_dept_manager_position
    FOREIGN KEY (manager_position_id)
    REFERENCES positions(id) ON DELETE SET NULL;

-- ========================================
-- 4. EMPLOYEES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    employment_status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (employment_status IN (
        'active', 'inactive', 'on_leave', 'terminated'
    )),
    start_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_position ON employees(position_id);
CREATE INDEX idx_employees_status ON employees(employment_status);
CREATE INDEX idx_employees_email ON employees(email);

-- Link profiles to employees
ALTER TABLE profiles
    ADD CONSTRAINT fk_profile_employee
    FOREIGN KEY (employee_id)
    REFERENCES employees(id) ON DELETE SET NULL;

-- ========================================
-- 5. JOB DESCRIPTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    document_number VARCHAR(50) NOT NULL UNIQUE,
    revision_number VARCHAR(20) NOT NULL DEFAULT 'R0',
    publication_date DATE,
    summary TEXT,
    qualifications TEXT[],
    responsibilities TEXT[],
    authorities TEXT[],
    success_criteria TEXT[],
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'review', 'approved', 'archived'
    )),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_desc_position ON job_descriptions(position_id);
CREATE INDEX idx_job_desc_status ON job_descriptions(status);
CREATE INDEX idx_job_desc_doc_number ON job_descriptions(document_number);

-- ========================================
-- 6. WORK INSTRUCTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS work_instructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    document_number VARCHAR(50) NOT NULL UNIQUE,
    revision_number VARCHAR(20) NOT NULL DEFAULT 'R0',
    publication_date DATE,
    purpose TEXT,
    scope TEXT,
    content TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'review', 'approved', 'archived'
    )),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wi_department ON work_instructions(department_id);
CREATE INDEX idx_wi_position ON work_instructions(position_id);
CREATE INDEX idx_wi_status ON work_instructions(status);
CREATE INDEX idx_wi_doc_number ON work_instructions(document_number);

-- ========================================
-- 7. PROCEDURES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS procedures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_instruction_id UUID NOT NULL REFERENCES work_instructions(id) ON DELETE CASCADE,
    procedure_code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    responsible_position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    control_position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    approval_position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    frequency VARCHAR(50) CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'as_needed')),
    sequence_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_proc_wi ON procedures(work_instruction_id);
CREATE INDEX idx_proc_responsible ON procedures(responsible_position_id);
CREATE INDEX idx_proc_code ON procedures(procedure_code);

-- ========================================
-- 8. DOCUMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'job_description', 'work_instruction', 'procedure',
        'form', 'report', 'policy'
    )),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    document_number VARCHAR(50) NOT NULL UNIQUE,
    revision_number VARCHAR(20) NOT NULL DEFAULT 'R0',
    publication_date DATE,
    prepared_by VARCHAR(255),
    controlled_by VARCHAR(255),
    approved_by VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'review', 'approved', 'published', 'archived'
    )),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_docs_type ON documents(document_type);
CREATE INDEX idx_docs_department ON documents(department_id);
CREATE INDEX idx_docs_position ON documents(position_id);
CREATE INDEX idx_docs_status ON documents(status);
CREATE INDEX idx_docs_number ON documents(document_number);

-- ========================================
-- 9. TASKS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    assigned_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    assigned_position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'completed', 'cancelled', 'overdue'
    )),
    due_date DATE,
    completion_date DATE,
    evidence_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tasks_employee ON tasks(assigned_employee_id);
CREATE INDEX idx_tasks_position ON tasks(assigned_position_id);
CREATE INDEX idx_tasks_department ON tasks(department_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ========================================
-- 10. KPIs TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    description TEXT,
    unit VARCHAR(50) NOT NULL,
    target_value DECIMAL(10, 2) NOT NULL,
    weight DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN (
        'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_kpi_position ON kpis(position_id);
CREATE INDEX idx_kpi_department ON kpis(department_id);
CREATE INDEX idx_kpi_status ON kpis(status);

-- ========================================
-- 11. PERFORMANCE REVIEWS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL,
    evaluator_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    total_score DECIMAL(5, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'completed', 'approved'
    )),
    evaluation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_perf_employee ON performance_reviews(employee_id);
CREATE INDEX idx_perf_evaluator ON performance_reviews(evaluator_id);
CREATE INDEX idx_perf_status ON performance_reviews(status);
CREATE INDEX idx_perf_period ON performance_reviews(period);

-- ========================================
-- TRIGGERS: Auto-update updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_descriptions_updated_at BEFORE UPDATE ON job_descriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_instructions_updated_at BEFORE UPDATE ON work_instructions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_procedures_updated_at BEFORE UPDATE ON procedures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON kpis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON performance_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VIEWS: Dashboard Stats
-- ========================================
CREATE OR REPLACE VIEW v_dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM employees WHERE employment_status = 'active') AS active_employees,
    (SELECT COUNT(*) FROM departments WHERE is_active = TRUE) AS active_departments,
    (SELECT COUNT(*) FROM positions WHERE is_active = TRUE) AS active_positions,
    (SELECT COUNT(*) FROM tasks WHERE status IN ('pending', 'in_progress')) AS open_tasks,
    (SELECT COUNT(*) FROM tasks WHERE status = 'overdue' OR (status IN ('pending', 'in_progress') AND due_date < CURRENT_DATE)) AS overdue_tasks,
    (SELECT COUNT(*) FROM documents WHERE status = 'review') AS pending_approval_documents,
    (SELECT COUNT(*) FROM documents WHERE status = 'approved' AND (publication_date IS NULL OR publication_date > CURRENT_DATE - INTERVAL '30 days')) AS upcoming_revisions;

-- ========================================
-- FUNCTIONS: Get user department
-- ========================================
CREATE OR REPLACE FUNCTION get_user_department(p_employee_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT department_id FROM employees WHERE id = p_employee_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
