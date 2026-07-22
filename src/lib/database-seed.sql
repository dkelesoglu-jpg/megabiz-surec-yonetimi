-- ========================================
-- MEGABIZ - Seed Data (Gerçek Organizasyon Yapısı)
-- ========================================
-- Bu SQL, database-schema.sql ve rls-policies.sql çalıştırıldıktan sonra
-- SQL Editor'de çalıştırılmalıdır.

-- ========================================
-- 1. DEPARTMENTS
-- ========================================
INSERT INTO departments (id, name, code, description) VALUES
    ('dep-ust-yonetim', 'Üst Yönetim', 'UST', 'Yönetim Kurulu ve Genel Müdürlük'),
    ('dep-mali-isler', 'Mali İşler', 'MALI', 'Muhasebe, mali işler ve finansal raporlama'),
    ('dep-satis', 'Satış', 'SATIS', 'Satış ve müşteri ilişkileri'),
    ('dep-satin-alma', 'Satın Alma', 'SATIN', 'Tedarik, satın alma ve sözleşme yönetimi');

-- ========================================
-- 2. POSITIONS
-- ========================================

-- Üst Yönetim
INSERT INTO positions (id, title, code, department_id, reports_to_position_id, position_summary) VALUES
    ('pos-genel-mudur', 'Yönetim Kurulu Başkanı / Genel Müdür', 'GM-01', 'dep-ust-yonetim', NULL, 'Şirketin genel yönetiminden ve stratejik kararlarından sorumlu üst düzey yönetici.'),
    ('pos-genel-mudur-yard', 'Genel Müdür Yardımcısı', 'GM-02', 'dep-ust-yonetim', 'pos-genel-mudur', 'Genel Müdüre bağlı olarak departman operasyonlarını koordine eder.'),
    ('pos-yonetici-asistan', 'Yönetici Asistanı', 'GM-03', 'dep-ust-yonetim', 'pos-genel-mudur', 'Yönetim Kurulu Başkanı / Genel Müdüre idari destek sağlar.');

-- Mali İşler Departmanı
INSERT INTO positions (id, title, code, department_id, reports_to_position_id, position_summary) VALUES
    ('pos-mali-mudur', 'Mali İşler Müdürü', 'MALI-01', 'dep-mali-isler', 'pos-genel-mudur', 'Mali işler departmanının yönetiminden sorumludur.'),
    ('pos-muhasebe-uzman', 'Muhasebe Uzmanı', 'MALI-02', 'dep-mali-isler', 'pos-mali-mudur', 'Muhasebe kayıtları, beyannameler ve mali raporlama işlemlerini yürütür.'),
    ('pos-muhasebe-yardimci', 'Muhasebe Uzman Yardımcısı', 'MALI-03', 'dep-mali-isler', 'pos-mali-mudur', 'Muhasebe uzmanına destek olur, günlük muhasebe işlemlerini gerçekleştirir.');

-- Satış Departmanı
INSERT INTO positions (id, title, code, department_id, reports_to_position_id, position_summary) VALUES
    ('pos-satis-mudur', 'Satış Müdürü', 'SATIS-01', 'dep-satis', 'pos-genel-mudur', 'Satış departmanının yönetiminden ve satış hedeflerinden sorumludur.'),
    ('pos-satis-uzman', 'Satış ve İş Geliştirme Uzmanı', 'SATIS-02', 'dep-satis', 'pos-satis-mudur', 'Yeni müşteri geliştirme ve satış stratejilerini uygular.'),
    ('pos-satis-eleman', 'Satış Elemanı', 'SATIS-03', 'dep-satis', 'pos-satis-mudur', 'Satış faaliyetlerini gerçekleştirir ve müşteri ilişkilerini yönetir.');

-- Satın Alma Departmanı
INSERT INTO positions (id, title, code, department_id, reports_to_position_id, position_summary) VALUES
    ('pos-satin-alma-mudur', 'Satın Alma Müdürü', 'SATIN-01', 'dep-satin-alma', 'pos-genel-mudur', 'Satın alma departmanının yönetiminden ve tedarik süreçlerinden sorumludur.'),
    ('pos-tedarik-uzman', 'Tedarik ve İş Geliştirme Uzmanı', 'SATIN-02', 'dep-satin-alma', 'pos-satin-alma-mudur', 'Tedarikçi geliştirme ve stratejik satın alma süreçlerini yönetir.'),
    ('pos-tedarik-sorumlu', 'Tedarik Sorumlusu', 'SATIN-03', 'dep-satin-alma', 'pos-satin-alma-mudur', 'Günlük satın alma işlemlerini ve sipariş takibini gerçekleştirir.');

-- ========================================
-- 3. DEPARTMENT MANAGER ASSIGNMENTS
-- ========================================
UPDATE departments SET manager_position_id = 'pos-mali-mudur' WHERE id = 'dep-mali-isler';
UPDATE departments SET manager_position_id = 'pos-satis-mudur' WHERE id = 'dep-satis';
UPDATE departments SET manager_position_id = 'pos-satin-alma-mudur' WHERE id = 'dep-satin-alma';

-- ========================================
-- 4. EMPLOYEES (Örnek çalışanlar)
-- ========================================
INSERT INTO employees (id, full_name, email, phone, department_id, position_id, employment_status, start_date) VALUES
    -- Üst Yönetim
    ('emp-001', 'Ahmet Yılmaz', 'ahmet.yilmaz@megabiz.com', '+90 532 000 0001', 'dep-ust-yonetim', 'pos-genel-mudur', 'active', '2020-01-01'),
    ('emp-002', 'Mehmet Kaya', 'mehmet.kaya@megabiz.com', '+90 532 000 0002', 'dep-ust-yonetim', 'pos-genel-mudur-yard', 'active', '2020-06-15'),
    ('emp-003', 'Ayşe Demir', 'ayse.demir@megabiz.com', '+90 532 000 0003', 'dep-ust-yonetim', 'pos-yonetici-asistan', 'active', '2021-03-01'),

    -- Mali İşler
    ('emp-004', 'Fatma Çelik', 'fatma.celik@megabiz.com', '+90 532 000 0004', 'dep-mali-isler', 'pos-mali-mudur', 'active', '2020-02-01'),
    ('emp-005', 'Ali Şahin', 'ali.sahin@megabiz.com', '+90 532 000 0005', 'dep-mali-isler', 'pos-muhasebe-uzman', 'active', '2021-01-15'),
    ('emp-006', 'Zeynep Arslan', 'zeynep.arslan@megabiz.com', '+90 532 000 0006', 'dep-mali-isler', 'pos-muhasebe-yardimci', 'active', '2022-05-01'),

    -- Satış
    ('emp-007', 'Can Yıldız', 'can.yildiz@megabiz.com', '+90 532 000 0007', 'dep-satis', 'pos-satis-mudur', 'active', '2020-04-01'),
    ('emp-008', 'Elif Koç', 'elif.koc@megabiz.com', '+90 532 000 0008', 'dep-satis', 'pos-satis-uzman', 'active', '2021-07-01'),
    ('emp-009', 'Burak Özkan', 'burak.ozkan@megabiz.com', '+90 532 000 0009', 'dep-satis', 'pos-satis-eleman', 'active', '2022-09-15'),

    -- Satın Alma
    ('emp-010', 'Deniz Aydın', 'deniz.aydin@megabiz.com', '+90 532 000 0010', 'dep-satin-alma', 'pos-satin-alma-mudur', 'active', '2020-03-01'),
    ('emp-011', 'Gül Polat', 'gul.polat@megabiz.com', '+90 532 000 0011', 'dep-satin-alma', 'pos-tedarik-uzman', 'active', '2021-09-01'),
    ('emp-012', 'Hakan Kurt', 'hakan.kurt@megabiz.com', '+90 532 000 0012', 'dep-satin-alma', 'pos-tedarik-sorumlu', 'active', '2022-01-15');

-- ========================================
-- 5. POSITIONS - Employee Assignment
-- ========================================
UPDATE positions SET employee_id = 'emp-001' WHERE id = 'pos-genel-mudur';
UPDATE positions SET employee_id = 'emp-002' WHERE id = 'pos-genel-mudur-yard';
UPDATE positions SET employee_id = 'emp-003' WHERE id = 'pos-yonetici-asistan';
UPDATE positions SET employee_id = 'emp-004' WHERE id = 'pos-mali-mudur';
UPDATE positions SET employee_id = 'emp-005' WHERE id = 'pos-muhasebe-uzman';
UPDATE positions SET employee_id = 'emp-006' WHERE id = 'pos-muhasebe-yardimci';
UPDATE positions SET employee_id = 'emp-007' WHERE id = 'pos-satis-mudur';
UPDATE positions SET employee_id = 'emp-008' WHERE id = 'pos-satis-uzman';
UPDATE positions SET employee_id = 'emp-009' WHERE id = 'pos-satis-eleman';
UPDATE positions SET employee_id = 'emp-010' WHERE id = 'pos-satin-alma-mudur';
UPDATE positions SET employee_id = 'emp-011' WHERE id = 'pos-tedarik-uzman';
UPDATE positions SET employee_id = 'emp-012' WHERE id = 'pos-tedarik-sorumlu';

-- ========================================
-- 6. DEPUTY POSITIONS (Vekâlet ilişkileri)
-- ========================================
UPDATE positions SET deputy_position_id = 'pos-mali-mudur' WHERE id = 'pos-genel-mudur';
UPDATE positions SET deputy_position_id = 'pos-muhasebe-uzman' WHERE id = 'pos-mali-mudur';
UPDATE positions SET deputy_position_id = 'pos-satis-uzman' WHERE id = 'pos-satis-mudur';
UPDATE positions SET deputy_position_id = 'pos-tedarik-uzman' WHERE id = 'pos-satin-alma-mudur';

-- ========================================
-- 7. JOB DESCRIPTIONS (Örnek görev tanımları)
-- ========================================
INSERT INTO job_descriptions (id, position_id, document_number, revision_number, publication_date, summary, qualifications, responsibilities, authorities, success_criteria, status) VALUES
    ('jd-001', 'pos-genel-mudur', 'GT-GM-001', 'R1', '2024-01-15',
     'Şirketin genel yönetiminden ve stratejik kararlarından sorumlu en üst düzey yöneticidir.',
     ARRAY['İşletme veya İktisat alanında lisans/yüksek lisans', 'En az 15 yıl yönetim deneyimi', 'İleri düzey İngilizce bilgisi'],
     ARRAY['Şirket stratejilerini belirlemek ve uygulamak', 'Bütçe ve mali planlamaları onaylamak', 'Üst düzey yönetici atamalarını yapmak', 'Yönetim Kurulu ile koordinasyonu sağlamak'],
     ARRAY['Bütçe onay yetkisi', 'İşe alma ve çıkarma yetkisi', 'Stratejik karar alma yetkisi'],
     ARRAY['Yıllık büyüme hedeflerine ulaşılması', 'Mali karlılık oranlarının korunması', 'Çalışan memnuniyet anketi sonucu > %80'],
     'approved'),

    ('jd-002', 'pos-mali-mudur', 'GT-MALI-001', 'R1', '2024-01-15',
     'Mali işler departmanının yönetiminden, mali raporlamadan ve muhasebe süreçlerinden sorumludur.',
     ARRAY['Maliye, Muhasebe veya İşletme alanında lisans', 'En az 8 yıl mali işler deneyimi', 'SMMM veya YMM belgesi tercih nedeni'],
     ARRAY['Mali raporları hazırlamak ve sunmak', 'Bütçe planlamasını yönetmek', 'Vergi beyannamelerini kontrol etmek', 'Mali denetim sürecini koordine etmek'],
     ARRAY['Mali onay yetkisi (belirlenen limit dahil)', 'Departman bütçesi yönetimi', 'Mali raporlama onayı'],
     ARRAY['Mali raporların zamanında hazırlanması', 'Vergi uyumluluğunun %100 sağlanması', 'Denetim sonuçlarının temiz olması'],
     'approved'),

    ('jd-003', 'pos-satis-mudur', 'GT-SATIS-001', 'R1', '2024-01-15',
     'Satış departmanının yönetiminden, satış hedeflerinin gerçekleştirilmesinden ve müşteri ilişkilerinden sorumludur.',
     ARRAY['İşletme, Pazarlama veya ilgili alanda lisans', 'En az 7 yıl satış deneyimi', 'CRM sistemleri kullanım deneyimi'],
     ARRAY['Satış stratejilerini geliştirmek ve uygulamak', 'Satış ekibini yönetmek ve motive etmek', 'Müşteri ilişkilerini geliştirmek', 'Satış raporlarını hazırlamak'],
     ARRAY['Satış ekibi performans değerlendirmesi', 'Fiyatlandırma onay yetkisi (limit dahil)', 'Müşteri sözleşme onayı'],
     ARRAY['Yıllık satış hedeflerinin %100+ gerçekleştirilmesi', 'Müşteri memnuniyet skoru > %85', 'Yeni müşteri kazanım hedeflerinin karşılanması'],
     'approved');

-- ========================================
-- 8. WORK INSTRUCTIONS (Örnek iş talimatları)
-- ========================================
INSERT INTO work_instructions (id, department_id, position_id, title, document_number, revision_number, publication_date, purpose, scope, content, status) VALUES
    ('wi-001', 'dep-mali-isler', 'pos-mali-mudur', 'Aylık Mali Raporlama Süreci', 'IT-MALI-001', 'R0', '2024-01-10',
     'Aylık mali raporların hazırlanması, kontrol edilmesi ve sunulması sürecini tanımlar.',
     'Mali İşler Departmanı tüm çalışanlarını kapsar.',
     '1. Ay sonunda tüm hesap kayıtları kontrol edilir.\n2. Gelir-gider raporları hazırlanır.\n3. Bilanço ve gelir tablosu oluşturulur.\n4. Raporlar Mali İşler Müdürü tarafından incelenir.\n5. Genel Müdüre sunulur.',
     'approved'),

    ('wi-002', 'dep-satis', 'pos-satis-mudur', 'Müşteri Sipariş Süreci', 'IT-SATIS-001', 'R0', '2024-01-10',
     'Müşteri siparişlerinin alınmasından teslimine kadar olan süreci tanımlar.',
     'Satış Departmanı tüm çalışanlarını ve ilgili departmanları kapsar.',
     '1. Sipariş müşteri tarafından iletilir.\n2. Satış Elemanı siparişi sisteme kaydeder.\n3. Stok durumu kontrol edilir.\n4. Fiyatlandırma onayı alınır.\n5. Sipariş onaylanır ve üretim/teslimat planlanır.',
     'approved'),

    ('wi-003', 'dep-satin-alma', 'pos-satin-alma-mudur', 'Satın Alma Süreci', 'IT-SATIN-001', 'R0', '2024-01-10',
     'Satın alma taleplerinin değerlendirilmesinden mal/hizmet alımına kadar olan süreci tanımlar.',
     'Satın Alma Departmanı tüm çalışanlarını kapsar.',
     '1. Satın alma talebi ilgili departmandan iletilir.\n2. Tedarik Sorumlusu teklif toplar.\n3. Teklifler karşılaştırılır.\n4. Uygun tedarikçi seçilir.\n5. Sipariş onaylanır ve takip edilir.',
     'approved');

-- ========================================
-- 9. DOCUMENTS (Örnek dokümanlar)
-- ========================================
INSERT INTO documents (id, title, document_type, department_id, position_id, document_number, revision_number, publication_date, prepared_by, controlled_by, approved_by, status) VALUES
    ('doc-001', 'Genel Müdür Görev Tanımı', 'job_description', 'dep-ust-yonetim', 'pos-genel-mudur', 'GT-GM-001', 'R1', '2024-01-15', 'İnsan Kaynakları', 'Kalite Yöneticisi', 'Genel Müdür', 'published'),
    ('doc-002', 'Mali İşler Müdürü Görev Tanımı', 'job_description', 'dep-mali-isler', 'pos-mali-mudur', 'GT-MALI-001', 'R1', '2024-01-15', 'İnsan Kaynakları', 'Kalite Yöneticisi', 'Genel Müdür', 'published'),
    ('doc-003', 'Aylık Mali Raporlama İş Talimatı', 'work_instruction', 'dep-mali-isler', 'pos-mali-mudur', 'IT-MALI-001', 'R0', '2024-01-10', 'Mali İşler Müdürü', 'Kalite Yöneticisi', 'Genel Müdür', 'published'),
    ('doc-004', 'Müşteri Sipariş İş Talimatı', 'work_instruction', 'dep-satis', 'pos-satis-mudur', 'IT-SATIS-001', 'R0', '2024-01-10', 'Satış Müdürü', 'Kalite Yöneticisi', 'Genel Müdür', 'published'),
    ('doc-005', 'Satın Alma İş Talimatı', 'work_instruction', 'dep-satin-alma', 'pos-satin-alma-mudur', 'IT-SATIN-001', 'R0', '2024-01-10', 'Satın Alma Müdürü', 'Kalite Yöneticisi', 'Genel Müdür', 'approved'),
    ('doc-006', 'Muhasebe Uzmanı Görev Tanımı', 'job_description', 'dep-mali-isler', 'pos-muhasebe-uzman', 'GT-MALI-002', 'R0', NULL, 'İnsan Kaynakları', 'Kalite Yöneticisi', NULL, 'draft');

-- ========================================
-- 10. TASKS (Örnek görevler)
-- ========================================
INSERT INTO tasks (id, title, description, assigned_employee_id, assigned_position_id, department_id, priority, status, due_date, created_at) VALUES
    ('task-001', 'Ocak Ayı Mali Raporlarının Hazırlanması', 'Ocak ayı gelir-gider raporlarının ve bilançonun hazırlanması', 'emp-005', 'pos-muhasebe-uzman', 'dep-mali-isler', 'high', 'in_progress', '2024-02-05', NOW()),
    ('task-002', 'Yeni Müşteri Teklif Hazırlama', 'ABC Şirketi için yıllık sözleşme teklifinin hazırlanması', 'emp-008', 'pos-satis-uzman', 'dep-satis', 'high', 'pending', '2024-02-01', NOW()),
    ('task-003', 'Ofis Malzemeleri Satın Alma', 'Q1 dönemi ofis malzemeleri siparişinin verilmesi', 'emp-012', 'pos-tedarik-sorumlu', 'dep-satin-alma', 'medium', 'pending', '2024-02-10', NOW()),
    ('task-004', 'Yıllık Performans Değerlendirmeleri', '2023 yılı performans değerlendirmelerinin tamamlanması', 'emp-002', 'pos-genel-mudur-yard', 'dep-ust-yonetim', 'urgent', 'overdue', '2024-01-31', NOW()),
    ('task-005', 'Vergi Beyannamesi Hazırlama', 'KDV ve muhtasar beyannamelerin hazırlanması', 'emp-006', 'pos-muhasebe-yardimci', 'dep-mali-isler', 'urgent', 'in_progress', '2024-02-07', NOW());

-- ========================================
-- 11. KPIs (Örnek KPI tanımları - altyapı için)
-- ========================================
INSERT INTO kpis (id, title, position_id, department_id, description, unit, target_value, weight, frequency, status) VALUES
    ('kpi-001', 'Yıllık Satış Hedefi', 'pos-satis-mudur', 'dep-satis', 'Yıllık satış gelir hedefine ulaşma oranı', 'percentage', 100.00, 3.0, 'monthly', 'active'),
    ('kpi-002', 'Mali Raporlama Zamanında Teslim', 'pos-mali-mudur', 'dep-mali-isler', 'Aylık mali raporların zamanında hazırlanma oranı', 'percentage', 100.00, 2.5, 'monthly', 'active'),
    ('kpi-003', 'Müşteri Memnuniyet Skoru', 'pos-satis-uzman', 'dep-satis', 'Müşteri memnuniyet anketi ortalama puanı', 'score', 85.00, 2.0, 'quarterly', 'active');
