-- ========================================
-- MEGABIZ - İzin Yönetimi RLS Politikaları
-- ========================================
-- Bu dosya leave-management-schema.sql çalıştırıldıktan SONRA
-- SQL Editor'de çalıştırılmalıdır. Tekrar tekrar çalıştırılabilir.
--
-- get_user_company_id(), get_user_employee_id(): multi-tenant-schema.sql
-- get_user_role(), get_user_permission_level(), get_user_department_id(): rls-policies.sql

ALTER TABLE izin_turleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE izin_talepleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE izin_bakiyeleri ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 1. İZİN TÜRLERİ POLİTİKALARI
-- ========================================

-- Tüm çalışanlar kendi şirketinin aktif izin türlerini görebilir
DROP POLICY IF EXISTS izin_turleri_employee_read ON izin_turleri;
CREATE POLICY izin_turleri_employee_read ON izin_turleri
    FOR SELECT USING (
        company_id = get_user_company_id() AND
        (aktif = TRUE OR get_user_permission_level() >= 4 OR get_user_role() = 'human_resources')
    );

-- System Admin, HR, üst yönetim (>=4): izin türlerini tanımlayabilir/güncelleyebilir
DROP POLICY IF EXISTS izin_turleri_admin_write ON izin_turleri;
CREATE POLICY izin_turleri_admin_write ON izin_turleri
    FOR ALL USING (
        company_id = get_user_company_id() AND
        (get_user_role() IN ('system_admin', 'human_resources') OR get_user_permission_level() >= 4)
    )
    WITH CHECK (
        company_id = get_user_company_id() AND
        (get_user_role() IN ('system_admin', 'human_resources') OR get_user_permission_level() >= 4)
    );

-- ========================================
-- 2. İZİN TALEPLERİ POLİTİKALARI
-- ========================================

-- Çalışan: kendi izin taleplerini görebilir
DROP POLICY IF EXISTS izin_talepleri_self_read ON izin_talepleri;
CREATE POLICY izin_talepleri_self_read ON izin_talepleri
    FOR SELECT USING (
        company_id = get_user_company_id() AND
        employee_id = get_user_employee_id()
    );

-- Çalışan: kendi adına izin talebi oluşturabilir
DROP POLICY IF EXISTS izin_talepleri_self_insert ON izin_talepleri;
CREATE POLICY izin_talepleri_self_insert ON izin_talepleri
    FOR INSERT WITH CHECK (
        company_id = get_user_company_id() AND
        employee_id = get_user_employee_id() AND
        durum = 'beklemede'
    );

-- Çalışan: sadece beklemedeki kendi talebini iptal edebilir (onay/red yetkisi yok)
DROP POLICY IF EXISTS izin_talepleri_self_cancel ON izin_talepleri;
CREATE POLICY izin_talepleri_self_cancel ON izin_talepleri
    FOR UPDATE USING (
        company_id = get_user_company_id() AND
        employee_id = get_user_employee_id() AND
        durum = 'beklemede'
    )
    WITH CHECK (
        company_id = get_user_company_id() AND
        employee_id = get_user_employee_id() AND
        durum IN ('beklemede', 'iptal_edildi')
    );

-- Departman Müdürü: kendi departmanındaki çalışanların taleplerini görebilir
DROP POLICY IF EXISTS izin_talepleri_manager_read ON izin_talepleri;
CREATE POLICY izin_talepleri_manager_read ON izin_talepleri
    FOR SELECT USING (
        company_id = get_user_company_id() AND
        get_user_role() = 'department_manager' AND
        employee_id IN (SELECT id FROM employees WHERE department_id = get_user_department_id())
    );

-- Departman Müdürü: kendi departmanındaki çalışanların taleplerini onaylayıp reddedebilir
DROP POLICY IF EXISTS izin_talepleri_manager_approve ON izin_talepleri;
CREATE POLICY izin_talepleri_manager_approve ON izin_talepleri
    FOR UPDATE USING (
        company_id = get_user_company_id() AND
        get_user_role() = 'department_manager' AND
        employee_id IN (SELECT id FROM employees WHERE department_id = get_user_department_id())
    )
    WITH CHECK (
        company_id = get_user_company_id() AND
        employee_id IN (SELECT id FROM employees WHERE department_id = get_user_department_id())
    );

-- HR ve üst yönetim (>=4): şirketteki tüm talepleri görebilir ve onaylayıp reddedebilir
DROP POLICY IF EXISTS izin_talepleri_hr_management_all ON izin_talepleri;
CREATE POLICY izin_talepleri_hr_management_all ON izin_talepleri
    FOR ALL USING (
        company_id = get_user_company_id() AND
        (get_user_role() = 'human_resources' OR get_user_permission_level() >= 4)
    )
    WITH CHECK (
        company_id = get_user_company_id() AND
        (get_user_role() = 'human_resources' OR get_user_permission_level() >= 4)
    );

-- System Admin: tam yetki
DROP POLICY IF EXISTS izin_talepleri_admin_all ON izin_talepleri;
CREATE POLICY izin_talepleri_admin_all ON izin_talepleri
    FOR ALL USING (company_id = get_user_company_id() AND get_user_role() = 'system_admin')
    WITH CHECK (company_id = get_user_company_id() AND get_user_role() = 'system_admin');

-- ========================================
-- 3. İZİN BAKİYELERİ POLİTİKALARI
-- ========================================

-- Çalışan: kendi bakiyesini görebilir
DROP POLICY IF EXISTS izin_bakiyeleri_self_read ON izin_bakiyeleri;
CREATE POLICY izin_bakiyeleri_self_read ON izin_bakiyeleri
    FOR SELECT USING (
        company_id = get_user_company_id() AND
        employee_id = get_user_employee_id()
    );

-- Departman Müdürü: kendi departmanındaki çalışanların bakiyelerini görebilir
DROP POLICY IF EXISTS izin_bakiyeleri_manager_read ON izin_bakiyeleri;
CREATE POLICY izin_bakiyeleri_manager_read ON izin_bakiyeleri
    FOR SELECT USING (
        company_id = get_user_company_id() AND
        get_user_role() = 'department_manager' AND
        employee_id IN (SELECT id FROM employees WHERE department_id = get_user_department_id())
    );

-- HR, üst yönetim (>=4) ve System Admin: tüm bakiyeleri görebilir ve yönetebilir
-- (Olağan akışta bakiyeler izin_bakiyesi_getir_veya_olustur() ve onay tetikleyicisi
-- üzerinden SECURITY DEFINER ile güncellenir; bu politika HR'ın manuel düzeltme
-- yapabilmesi için mevcuttur, örn. yıl başı devir düzeltmesi.)
DROP POLICY IF EXISTS izin_bakiyeleri_hr_admin_all ON izin_bakiyeleri;
CREATE POLICY izin_bakiyeleri_hr_admin_all ON izin_bakiyeleri
    FOR ALL USING (
        company_id = get_user_company_id() AND
        (get_user_role() IN ('system_admin', 'human_resources') OR get_user_permission_level() >= 4)
    )
    WITH CHECK (
        company_id = get_user_company_id() AND
        (get_user_role() IN ('system_admin', 'human_resources') OR get_user_permission_level() >= 4)
    );
