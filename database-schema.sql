-- Megabiz İş Talimatları ve Süreç Yönetim Sistemi
-- Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    manager_position_id UUID,
    color VARCHAR(50) NOT NULL DEFAULT 'blue',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Positions Table
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    manager_position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    deputy_position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    level INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for department manager
ALTER TABLE departments 
ADD CONSTRAINT fk_department_manager 
FOREIGN KEY (manager_position_id) 
REFERENCES positions(id) ON DELETE SET NULL;

-- Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    hire_date DATE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'general_manager', 'manager', 'employee')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('job_description', 'work_instruction', 'process', 'form', 'other')),
    document_number VARCHAR(100),
    revision_number VARCHAR(20),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    published_date DATE,
    last_revision_date DATE,
    prepared_by VARCHAR(255),
    reviewed_by VARCHAR(255),
    approved_by VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Descriptions Table
CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    responsibilities JSONB DEFAULT '[]',
    qualifications JSONB DEFAULT '[]',
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work Instructions Table
CREATE TABLE IF NOT EXISTS work_instructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    version VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'active', 'archived')),
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KPIs Table
CREATE TABLE IF NOT EXISTS kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_value DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Reviews Table
CREATE TABLE IF NOT EXISTS performance_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    kpi_id UUID NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    actual_value DECIMAL(10, 2) NOT NULL,
    achievement_rate DECIMAL(5, 2) NOT NULL,
    notes TEXT,
    reviewer_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_positions_department ON positions(department_id);
CREATE INDEX idx_positions_manager ON positions(manager_position_id);
CREATE INDEX idx_employees_position ON employees(position_id);
CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_documents_department ON documents(department_id);
CREATE INDEX idx_documents_position ON documents(position_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_work_instructions_department ON work_instructions(department_id);
CREATE INDEX idx_work_instructions_position ON work_instructions(position_id);
CREATE INDEX idx_kpis_position ON kpis(position_id);
CREATE INDEX idx_performance_reviews_employee ON performance_reviews(employee_id);
CREATE INDEX idx_performance_reviews_kpi ON performance_reviews(kpi_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_descriptions_updated_at BEFORE UPDATE ON job_descriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_instructions_updated_at BEFORE UPDATE ON work_instructions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON kpis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON performance_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

-- Departments policies
CREATE POLICY "Allow all authenticated users to read departments" ON departments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin to insert departments" ON departments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Allow admin to update departments" ON departments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Allow admin to delete departments" ON departments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Positions policies
CREATE POLICY "Allow all authenticated users to read positions" ON positions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin and managers to insert positions" ON positions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'general_manager', 'manager')
        )
    );

CREATE POLICY "Allow admin and managers to update positions" ON positions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'general_manager', 'manager')
        )
    );

CREATE POLICY "Allow admin to delete positions" ON positions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Employees policies
CREATE POLICY "Allow all authenticated users to read employees" ON employees
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin to insert employees" ON employees
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Allow admin and self to update employees" ON employees
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Allow admin to delete employees" ON employees
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Documents policies
CREATE POLICY "Allow all authenticated users to read documents" ON documents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert documents" ON documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow document owner and admin to update documents" ON documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND (role = 'admin' OR role = 'manager')
        )
    );

CREATE POLICY "Allow admin to delete documents" ON documents
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Similar policies for other tables
CREATE POLICY "Allow all to read job_descriptions" ON job_descriptions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow managers to modify job_descriptions" ON job_descriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'general_manager', 'manager')
        )
    );

CREATE POLICY "Allow all to read work_instructions" ON work_instructions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow managers to modify work_instructions" ON work_instructions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'general_manager', 'manager')
        )
    );

CREATE POLICY "Allow all to read kpis" ON kpis
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow managers to modify kpis" ON kpis
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'general_manager', 'manager')
        )
    );

CREATE POLICY "Allow all to read performance_reviews" ON performance_reviews
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow managers to modify performance_reviews" ON performance_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'general_manager', 'manager')
        )
    );
