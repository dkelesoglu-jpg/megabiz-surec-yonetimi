-- ============================================================
-- MEGABIZ - Değerlendirme Dönemleri (evaluation_periods)
-- SQL Migration
--
-- Supabase SQL Editor'de ÇALIŞTIRIN.
-- (Güvenli/idempotent: aynı komutlar tekrar çalıştırılabilir.)
--
-- Bu dosya "database-schema.sql" ve "rls-policies.sql" içindeki
-- yeni eklemelerin bağımsız/migration sürümüdür.
-- ============================================================

-- ============================================================
-- 1. TABLO: evaluation_periods
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluation_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    evaluation_type VARCHAR(50) NOT NULL CHECK (evaluation_type IN (
        'manager', 'self', 'peer', 'subordinate', 'mixed'
    )),
    scope VARCHAR(50) NOT NULL DEFAULT 'all_company' CHECK (scope IN (
        'all_company', 'department'
    )),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'active', 'completed', 'archived'
    )),
    created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_evaluation_period_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_eval_periods_status ON evaluation_periods(status);
CREATE INDEX IF NOT EXISTS idx_eval_periods_scope ON evaluation_periods(scope);
CREATE INDEX IF NOT EXISTS idx_eval_periods_department ON evaluation_periods(department_id);
CREATE INDEX IF NOT EXISTS idx_eval_periods_created_by ON evaluation_periods(created_by);

-- updated_at otomatik güncelleme trigger'ı
CREATE TRIGGER IF NOT EXISTS update_evaluation_periods_updated_at
    BEFORE UPDATE ON evaluation_periods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- Not: RLS KAPATILMIYOR. Yalnızca rol bazlı doğru politikalar.
-- ============================================================
ALTER TABLE evaluation_periods ENABLE ROW LEVEL SECURITY;

-- Admin & İK: dönem oluşturabilir, okuyabilir, güncelleyebilir, arşivleyebilir
DROP POLICY IF EXISTS eval_periods_admin_all ON evaluation_periods;
CREATE POLICY eval_periods_admin_all ON evaluation_periods
    FOR ALL USING (get_user_role() IN ('system_admin', 'human_resources'))
    WITH CHECK (get_user_role() IN ('system_admin', 'human_resources'));

-- Üst yönetim (YK Başkanı, Genel Müdür, GM Yardımcısı): tüm dönemleri okuyabilir
DROP POLICY IF EXISTS eval_periods_management_read ON evaluation_periods;
CREATE POLICY eval_periods_management_read ON evaluation_periods
    FOR SELECT USING (get_user_permission_level() >= 4);

-- Departman Müdürü: şirket geneli veya kendi departmanı kapsamındaki dönemleri okuyabilir
DROP POLICY IF EXISTS eval_periods_manager_read ON evaluation_periods;
CREATE POLICY eval_periods_manager_read ON evaluation_periods
    FOR SELECT USING (
        get_user_role() = 'department_manager' AND (
            scope = 'all_company' OR department_id = get_user_department_id()
        )
    );

-- Çalışan: aktif (açık) dönemleri okuyabilir
DROP POLICY IF EXISTS eval_periods_employee_read ON evaluation_periods;
CREATE POLICY eval_periods_employee_read ON evaluation_periods
    FOR SELECT USING (
        get_user_permission_level() >= 1 AND status IN ('active', 'completed')
    );

-- ============================================================
-- ÖN KOŞULLAR
-- ============================================================
-- Aşağıdaki helper fonksiyonlar zaten "rls-policies.sql" içinde tanımlıdır.
-- Bu fonksiyonlar henüz oluşturulmamışsa önce rls-policies.sql'in üst
-- kısmındaki HELPER FUNCTIONS bölümünü çalıştırın:
--   get_user_role(), get_user_permission_level(), get_user_department_id()
