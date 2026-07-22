-- ========================================
-- MEGABIZ - Row Level Security Policies
-- Rol bazlı erişim kontrol politikaları
-- ========================================

-- RLS'yi tüm tablolar için aktif et
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Kullanıcının rolünü döndür
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM profiles
        WHERE id = auth.uid() AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcının departman ID'sini döndür
CREATE OR REPLACE FUNCTION get_user_department_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT e.department_id
        FROM employees e
        JOIN profiles p ON p.employee_id = e.id
        WHERE p.id = auth.uid() AND p.is_active = TRUE
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcının yetki seviyesini döndür (yüksek sayı = yüksek yetki)
CREATE OR REPLACE FUNCTION get_user_permission_level()
RETURNS INTEGER AS $$
DECLARE
    user_role TEXT;
BEGIN
    user_role := get_user_role();
    RETURN CASE user_role
        WHEN 'system_admin' THEN 7
        WHEN 'board_chairman' THEN 6
        WHEN 'general_manager' THEN 5
        WHEN 'deputy_general_manager' THEN 4
        WHEN 'department_manager' THEN 3
        WHEN 'human_resources' THEN 2
        WHEN 'employee' THEN 1
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 1. PROFILES POLICIES
-- ========================================

-- System Admin: tüm profilleri yönetir
CREATE POLICY profiles_admin_all ON profiles
    FOR ALL USING (get_user_role() = 'system_admin');

-- HR: tüm profilleri okuyabilir, düzenleyebilir
CREATE POLICY profiles_hr_read ON profiles
    FOR SELECT USING (get_user_role() = 'human_resources');

CREATE POLICY profiles_hr_update ON profiles
    FOR UPDATE USING (get_user_role() = 'human_resources');

-- Diğer roller: sadece kendi profillerini görebilir
CREATE POLICY profiles_self_read ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY profiles_self_update ON profiles
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ========================================
-- 2. DEPARTMENTS POLICIES
-- ========================================

-- System Admin, YK Başkanı, Genel Müdür: tüm departmanlar
CREATE POLICY departments_admin_all ON departments
    FOR ALL USING (get_user_permission_level() >= 5);

-- GM Yardımcısı: tüm departmanları okuyabilir
CREATE POLICY departments_deputy_read ON departments
    FOR SELECT USING (get_user_role() = 'deputy_general_manager');

-- Departman Müdürü: sadece kendi departmanı
CREATE POLICY departments_manager_read ON departments
    FOR SELECT USING (
        get_user_role() = 'department_manager' AND
        id = get_user_department_id()
    );

CREATE POLICY departments_manager_update ON departments
    FOR UPDATE USING (
        get_user_role() = 'department_manager' AND
        id = get_user_department_id()
    );

-- HR: tüm departmanları okuyabilir
CREATE POLICY departments_hr_all ON departments
    FOR ALL USING (get_user_role() = 'human_resources');

-- Çalışan: aktif departmanları okuyabilir
CREATE POLICY departments_employee_read ON departments
    FOR SELECT USING (
        get_user_permission_level() >= 1 AND is_active = TRUE
    );

-- ========================================
-- 3. POSITIONS POLICIES
-- ========================================

-- System Admin, YK Başkanı, Genel Müdür, GM Yardımcısı: tüm pozisyonlar
CREATE POLICY positions_admin_all ON positions
    FOR ALL USING (get_user_permission_level() >= 4);

-- HR: tüm pozisyonları yönetebilir
CREATE POLICY positions_hr_all ON positions
    FOR ALL USING (get_user_role() = 'human_resources');

-- Departman Müdürü: kendi departmanının pozisyonları
CREATE POLICY positions_manager_read ON positions
    FOR SELECT USING (
        get_user_role() = 'department_manager' AND
        department_id = get_user_department_id()
    );

CREATE POLICY positions_manager_write ON positions
    FOR ALL USING (
        get_user_role() = 'department_manager' AND
        department_id = get_user_department_id()
    );

-- Çalışan: aktif pozisyonları okuyabilir
CREATE POLICY positions_employee_read ON positions
    FOR SELECT USING (
        get_user_permission_level() >= 1 AND is_active = TRUE
    );

-- ========================================
-- 4. EMPLOYEES POLICIES
-- ========================================

-- System Admin: tüm çalışanları yönetir
CREATE POLICY employees_admin_all ON employees
    FOR ALL USING (get_user_role() = 'system_admin');

-- YK Başkanı, Genel Müdür, GM Yardımcısı: tüm çalışanları okuyabilir
CREATE POLICY employees_management_read ON employees
    FOR SELECT USING (get_user_permission_level() >= 4);

-- HR: tüm çalışanları yönetebilir
CREATE POLICY employees_hr_all ON employees
    FOR ALL USING (get_user_role() = 'human_resources');

-- Departman Müdürü: sadece kendi departmanının çalışanları
CREATE POLICY employees_manager_read ON employees
    FOR SELECT USING (
        get_user_role() = 'department_manager' AND
        department_id = get_user_department_id()
    );

CREATE POLICY employees_manager_update ON employees
    FOR UPDATE USING (
        get_user_role() = 'department_manager' AND
        department_id = get_user_department_id()
    );

-- Çalışan: sadece kendi bilgisi
CREATE POLICY employees_self_read ON employees
    FOR SELECT USING (
        id IN (SELECT employee_id FROM profiles WHERE id = auth.uid())
    );

-- ========================================
-- 5. JOB DESCRIPTIONS POLICIES
-- ========================================

-- System Admin, HR: tüm görev tanımlarını yönetir
CREATE POLICY jd_admin_all ON job_descriptions
    FOR ALL USING (get_user_role() IN ('system_admin', 'human_resources'));

-- YK Başkanı, Genel Müdür, GM Yardımcısı: tüm görev tanımlarını okuyabilir
CREATE POLICY jd_management_read ON job_descriptions
    FOR SELECT USING (get_user_permission_level() >= 4);

-- Departman Müdürü: kendi departmanının görev tanımları
CREATE POLICY jd_manager_read ON job_descriptions
    FOR SELECT USING (
        get_user_role() = 'department_manager' AND
        position_id IN (
            SELECT id FROM positions WHERE department_id = get_user_department_id()
        )
    );

CREATE POLICY jd_manager_write ON job_descriptions
    FOR ALL USING (
        get_user_role() = 'department_manager' AND
        position_id IN (
            SELECT id FROM positions WHERE department_id = get_user_department_id()
        )
    );

-- Çalışan: kendi pozisyonunun görev tanımı
CREATE POLICY jd_employee_read ON job_descriptions
    FOR SELECT USING (
        get_user_permission_level() >= 1 AND
        position_id IN (
            SELECT position_id FROM employees
            WHERE id IN (SELECT employee_id FROM profiles WHERE id = auth.uid())
        )
    );

-- ========================================
-- 6. WORK INSTRUCTIONS POLICIES
-- ========================================

CREATE POLICY wi_admin_all ON work_instructions
    FOR ALL USING (get_user_role() IN ('system_admin', 'human_resources'));

CREATE POLICY wi_management_read ON work_instructions
    FOR SELECT USING (get_user_permission_level() >= 4);

CREATE POLICY wi_manager_all ON work_instructions
    FOR ALL USING (
        get_user_role() = 'department_manager' AND
        department_id = get_user_department_id()
    );

CREATE POLICY wi_employee_read ON work_instructions
    FOR SELECT USING (
        get_user_permission_level() >= 1 AND (
            department_id = get_user_department_id()
            OR status = 'approved'
        )
    );

-- ========================================
-- 7. PROCEDURES POLICIES
-- ========================================

CREATE POLICY procedures_admin_all ON procedures
    FOR ALL USING (get_user_role() IN ('system_admin', 'human_resources'));

CREATE POLICY procedures_management_read ON procedures
    FOR SELECT USING (get_user_permission_level() >= 4);

CREATE POLICY procedures_employee_read ON procedures
    FOR SELECT USING (
        get_user_permission_level() >= 1 AND
        work_instruction_id IN (
            SELECT id FROM work_instructions
            WHERE department_id = get_user_department_id() OR status = 'approved'
        )
    );

-- ========================================
-- 8. DOCUMENTS POLICIES
-- ========================================

CREATE POLICY documents_admin_all ON documents
    FOR ALL USING (get_user_role() IN ('system_admin', 'human_resources'));

CREATE POLICY documents_management_read ON documents
    FOR SELECT USING (get_user_permission_level() >= 4);

CREATE POLICY documents_management_write ON documents
    FOR ALL USING (get_user_permission_level() >= 4);

-- Departman Müdürü: kendi departmanının dokümanları
CREATE POLICY documents_manager_all ON documents
    FOR ALL USING (
        get_user_role() = 'department_manager' AND
        (department_id = get_user_department_id() OR department_id IS NULL)
    );

-- Çalışan: kendi departmanının ve onaylı genel dokümanlar
CREATE POLICY documents_employee_read ON documents
    FOR SELECT USING (
        get_user_permission_level() >= 1 AND (
            department_id = get_user_department_id()
            OR status IN ('approved', 'published')
        )
    );

CREATE POLICY documents_employee_write ON documents
    FOR INSERT WITH CHECK (get_user_permission_level() >= 1)
    WITH CHECK (get_user_permission_level() >= 1);

-- ========================================
-- 9. TASKS POLICIES
-- ========================================

CREATE POLICY tasks_admin_all ON tasks
    FOR ALL USING (get_user_role() IN ('system_admin', 'human_resources'));

CREATE POLICY tasks_management_all ON tasks
    FOR ALL USING (get_user_permission_level() >= 4);

-- Departman Müdürü: kendi departmanının görevleri
CREATE POLICY tasks_manager_all ON tasks
    FOR ALL USING (
        get_user_role() = 'department_manager' AND
        (department_id = get_user_department_id() OR department_id IS NULL)
    );

-- Çalışan: kendi görevleri
CREATE POLICY tasks_employee_read ON tasks
    FOR SELECT USING (
        assigned_employee_id IN (
            SELECT id FROM employees
            WHERE id IN (SELECT employee_id FROM profiles WHERE id = auth.uid())
        )
        OR assigned_position_id IN (
            SELECT position_id FROM employees
            WHERE id IN (SELECT employee_id FROM profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY tasks_employee_update ON tasks
    FOR UPDATE USING (
        assigned_employee_id IN (
            SELECT id FROM employees
            WHERE id IN (SELECT employee_id FROM profiles WHERE id = auth.uid())
        )
    );

-- ========================================
-- 10. KPIs POLICIES
-- ========================================

CREATE POLICY kpis_admin_all ON kpis
    FOR ALL USING (get_user_role() IN ('system_admin', 'human_resources'));

CREATE POLICY kpis_management_read ON kpis
    FOR SELECT USING (get_user_permission_level() >= 4);

CREATE POLICY kpis_manager_all ON kpis
    FOR ALL USING (
        get_user_role() = 'department_manager' AND
        department_id = get_user_department_id()
    );

-- Çalışan: kendi pozisyonunun KPI'ları
CREATE POLICY kpis_employee_read ON kpis
    FOR SELECT USING (
        get_user_permission_level() >= 1 AND
        position_id IN (
            SELECT position_id FROM employees
            WHERE id IN (SELECT employee_id FROM profiles WHERE id = auth.uid())
        )
    );

-- ========================================
-- 11. PERFORMANCE REVIEWS POLICIES
-- ========================================

CREATE POLICY perf_admin_all ON performance_reviews
    FOR ALL USING (get_user_role() IN ('system_admin', 'human_resources'));

CREATE POLICY perf_management_all ON performance_reviews
    FOR ALL USING (get_user_permission_level() >= 4);

-- Departman Müdürü: kendi departmanının değerlendirmeleri
CREATE POLICY perf_manager_all ON performance_reviews
    FOR ALL USING (
        get_user_role() = 'department_manager' AND
        employee_id IN (
            SELECT id FROM employees WHERE department_id = get_user_department_id()
        )
    );

-- Çalışan: kendi değerlendirmeleri
CREATE POLICY perf_employee_read ON performance_reviews
    FOR SELECT USING (
        employee_id IN (
            SELECT id FROM employees
            WHERE id IN (SELECT employee_id FROM profiles WHERE id = auth.uid())
        )
    );
