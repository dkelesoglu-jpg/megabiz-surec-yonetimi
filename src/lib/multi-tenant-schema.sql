-- ========================================
-- MEGABIZ - Multi-Tenant Altyapısı
-- ========================================
-- Bu dosya database-schema.sql çalıştırıldıktan SONRA, rls-policies.sql
-- çalıştırılmadan ÖNCE SQL Editor'de çalıştırılmalıdır.
--
-- Ne yapar:
--   1. companies (şirketler) tablosunu oluşturur
--   2. Mevcut tüm tablolara company_id kolonu ekler
--   3. Mevcut veriyi tek bir varsayılan şirkete ("Megabiz") bağlar
--   4. company_id kolonlarını NOT NULL yapar
--   5. Şirket içi benzersizlik kısıtlarını (code, email, document_number vb.)
--      global'den şirket bazlıya çevirir
--   6. get_user_company_id() yardımcı fonksiyonunu ve profil/çalışan
--      company_id senkronizasyon tetikleyicisini ekler
--
-- Bu script tekrar tekrar çalıştırılabilir (idempotent).

-- ========================================
-- 1. COMPANIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    tax_number VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 2. ADD company_id TO ALL EXISTING TABLES
-- ========================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE positions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE work_instructions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE procedures ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE performance_reviews ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- İzin hesaplaması yaş istisnasında kullanılacak (bkz. leave-management-schema.sql)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_date DATE;

-- ========================================
-- 3. BACKFILL: mevcut veriyi tek bir varsayılan şirkete bağla
-- ========================================
DO $$
DECLARE
    v_company_id UUID;
BEGIN
    SELECT id INTO v_company_id FROM companies ORDER BY created_at LIMIT 1;

    IF v_company_id IS NULL THEN
        INSERT INTO companies (name, code) VALUES ('Megabiz', 'MEGABIZ')
        RETURNING id INTO v_company_id;
    END IF;

    UPDATE profiles SET company_id = v_company_id WHERE company_id IS NULL;
    UPDATE departments SET company_id = v_company_id WHERE company_id IS NULL;
    UPDATE positions SET company_id = v_company_id WHERE company_id IS NULL;
    UPDATE employees SET company_id = v_company_id WHERE company_id IS NULL;
    UPDATE job_descriptions SET company_id = v_company_id WHERE company_id IS NULL;
    UPDATE work_instructions SET company_id = v_company_id WHERE company_id IS NULL;
    UPDATE procedures SET company_id = v_company_id WHERE company_id IS NULL;
    UPDATE documents SET company_id = v_company_id WHERE company_id IS NULL;
    UPDATE tasks SET company_id = v_company_id WHERE company_id IS NULL;
    UPDATE kpis SET company_id = v_company_id WHERE company_id IS NULL;
    UPDATE performance_reviews SET company_id = v_company_id WHERE company_id IS NULL;
END $$;

-- ========================================
-- 4. company_id ARTIK ZORUNLU
-- ========================================
ALTER TABLE profiles ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE departments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE positions ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE employees ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE job_descriptions ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE work_instructions ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE procedures ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE documents ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE kpis ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE performance_reviews ALTER COLUMN company_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_company ON departments(company_id);
CREATE INDEX IF NOT EXISTS idx_positions_company ON positions(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_job_desc_company ON job_descriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_wi_company ON work_instructions(company_id);
CREATE INDEX IF NOT EXISTS idx_proc_company ON procedures(company_id);
CREATE INDEX IF NOT EXISTS idx_docs_company ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_kpi_company ON kpis(company_id);
CREATE INDEX IF NOT EXISTS idx_perf_company ON performance_reviews(company_id);

-- ========================================
-- 5. BENZERSİZLİK KISITLARINI ŞİRKET BAZLI YAP
-- ========================================
-- Bu kolonlar önceden global UNIQUE idi; iki farklı şirketin aynı
-- departman kodunu / belge numarasını kullanabilmesi için şirket
-- bazlı UNIQUE(company_id, ...) kısıtına çevriliyor.

ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_code_key;
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_company_code_unique;
ALTER TABLE departments ADD CONSTRAINT departments_company_code_unique UNIQUE (company_id, code);

ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_code_key;
ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_company_code_unique;
ALTER TABLE positions ADD CONSTRAINT positions_company_code_unique UNIQUE (company_id, code);

ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_email_key;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_company_email_unique;
ALTER TABLE employees ADD CONSTRAINT employees_company_email_unique UNIQUE (company_id, email);

ALTER TABLE job_descriptions DROP CONSTRAINT IF EXISTS job_descriptions_document_number_key;
ALTER TABLE job_descriptions DROP CONSTRAINT IF EXISTS job_descriptions_company_doc_number_unique;
ALTER TABLE job_descriptions ADD CONSTRAINT job_descriptions_company_doc_number_unique UNIQUE (company_id, document_number);

ALTER TABLE work_instructions DROP CONSTRAINT IF EXISTS work_instructions_document_number_key;
ALTER TABLE work_instructions DROP CONSTRAINT IF EXISTS work_instructions_company_doc_number_unique;
ALTER TABLE work_instructions ADD CONSTRAINT work_instructions_company_doc_number_unique UNIQUE (company_id, document_number);

ALTER TABLE procedures DROP CONSTRAINT IF EXISTS procedures_procedure_code_key;
ALTER TABLE procedures DROP CONSTRAINT IF EXISTS procedures_company_code_unique;
ALTER TABLE procedures ADD CONSTRAINT procedures_company_code_unique UNIQUE (company_id, procedure_code);

ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_number_key;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_company_doc_number_unique;
ALTER TABLE documents ADD CONSTRAINT documents_company_doc_number_unique UNIQUE (company_id, document_number);

-- ========================================
-- 6. YARDIMCI FONKSİYONLAR
-- ========================================

-- Giriş yapmış kullanıcının şirket ID'sini döndürür (tüm RLS politikalarının temeli)
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT company_id FROM profiles
        WHERE id = auth.uid() AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Giriş yapmış kullanıcının çalışan (employee) ID'sini döndürür
CREATE OR REPLACE FUNCTION get_user_employee_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT employee_id FROM profiles
        WHERE id = auth.uid() AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Bir profile employee_id atandığında/değiştiğinde company_id'yi
-- otomatik olarak ilgili çalışanın şirketiyle senkronize eder, böylece
-- company_id hiçbir zaman employee_id ile tutarsız düşemez.
CREATE OR REPLACE FUNCTION sync_profile_company_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.employee_id IS NOT NULL THEN
        SELECT company_id INTO NEW.company_id FROM employees WHERE id = NEW.employee_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_sync_profile_company ON profiles;
CREATE TRIGGER trg_sync_profile_company
    BEFORE INSERT OR UPDATE OF employee_id ON profiles
    FOR EACH ROW EXECUTE FUNCTION sync_profile_company_id();

-- ========================================
-- 7. COMPANIES TABLOSU İÇİN RLS
-- ========================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS companies_self_read ON companies;
CREATE POLICY companies_self_read ON companies
    FOR SELECT USING (id = get_user_company_id());

DROP POLICY IF EXISTS companies_admin_update ON companies;
CREATE POLICY companies_admin_update ON companies
    FOR UPDATE USING (id = get_user_company_id() AND get_user_role() = 'system_admin');
