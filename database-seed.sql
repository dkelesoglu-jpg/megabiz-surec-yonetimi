-- Sample Data for Megabiz System
-- Bu SQL'i database-schema.sql çalıştırıldıktan sonra çalıştırın

-- Insert Departments
INSERT INTO departments (id, name, color) VALUES
    ('d1111111-1111-1111-1111-111111111111', 'Genel Müdürlük', 'blue'),
    ('d2222222-2222-2222-2222-222222222222', 'İnsan Kaynakları', 'green'),
    ('d3333333-3333-3333-3333-333333333333', 'Üretim', 'purple'),
    ('d4444444-4444-4444-4444-444444444444', 'Kalite', 'orange'),
    ('d5555555-5555-5555-5555-555555555555', 'Satış ve Pazarlama', 'red'),
    ('d6666666-6666-6666-6666-666666666666', 'Finans', 'indigo');

-- Insert Positions
INSERT INTO positions (id, title, department_id, manager_position_id, level) VALUES
    -- Genel Müdürlük
    ('p0000000-0000-0000-0000-000000000001', 'Genel Müdür', 'd1111111-1111-1111-1111-111111111111', NULL, 0),
    
    -- İnsan Kaynakları
    ('p0000000-0000-0000-0000-000000000002', 'İK Müdürü', 'd2222222-2222-2222-2222-222222222222', 'p0000000-0000-0000-0000-000000000001', 1),
    ('p0000000-0000-0000-0000-000000000003', 'İK Uzmanı', 'd2222222-2222-2222-2222-222222222222', 'p0000000-0000-0000-0000-000000000002', 2),
    ('p0000000-0000-0000-0000-000000000004', 'İşe Alım Uzmanı', 'd2222222-2222-2222-2222-222222222222', 'p0000000-0000-0000-0000-000000000002', 2),
    
    -- Üretim
    ('p0000000-0000-0000-0000-000000000005', 'Üretim Müdürü', 'd3333333-3333-3333-3333-333333333333', 'p0000000-0000-0000-0000-000000000001', 1),
    ('p0000000-0000-0000-0000-000000000006', 'Üretim Şefi', 'd3333333-3333-3333-3333-333333333333', 'p0000000-0000-0000-0000-000000000005', 2),
    ('p0000000-0000-0000-0000-000000000007', 'Üretim Planlama Uzmanı', 'd3333333-3333-3333-3333-333333333333', 'p0000000-0000-0000-0000-000000000005', 2),
    
    -- Kalite
    ('p0000000-0000-0000-0000-000000000008', 'Kalite Müdürü', 'd4444444-4444-4444-4444-444444444444', 'p0000000-0000-0000-0000-000000000001', 1),
    ('p0000000-0000-0000-0000-000000000009', 'Kalite Kontrol Uzmanı', 'd4444444-4444-4444-4444-444444444444', 'p0000000-0000-0000-0000-000000000008', 2),
    ('p0000000-0000-0000-0000-000000000010', 'Kalite Güvence Uzmanı', 'd4444444-4444-4444-4444-444444444444', 'p0000000-0000-0000-0000-000000000008', 2),
    
    -- Satış ve Pazarlama
    ('p0000000-0000-0000-0000-000000000011', 'Satış Müdürü', 'd5555555-5555-5555-5555-555555555555', 'p0000000-0000-0000-0000-000000000001', 1),
    ('p0000000-0000-0000-0000-000000000012', 'Satış Uzmanı', 'd5555555-5555-5555-5555-555555555555', 'p0000000-0000-0000-0000-000000000011', 2),
    ('p0000000-0000-0000-0000-000000000013', 'Pazarlama Uzmanı', 'd5555555-5555-5555-5555-555555555555', 'p0000000-0000-0000-0000-000000000011', 2),
    
    -- Finans
    ('p0000000-0000-0000-0000-000000000014', 'Finans Müdürü', 'd6666666-6666-6666-6666-666666666666', 'p0000000-0000-0000-0000-000000000001', 1),
    ('p0000000-0000-0000-0000-000000000015', 'Mali İşler Uzmanı', 'd6666666-6666-6666-6666-666666666666', 'p0000000-0000-0000-0000-000000000014', 2),
    ('p0000000-0000-0000-0000-000000000016', 'Muhasebe Uzmanı', 'd6666666-6666-6666-6666-666666666666', 'p0000000-0000-0000-0000-000000000014', 2);

-- Update department managers
UPDATE departments SET manager_position_id = 'p0000000-0000-0000-0000-000000000001' WHERE id = 'd1111111-1111-1111-1111-111111111111';
UPDATE departments SET manager_position_id = 'p0000000-0000-0000-0000-000000000002' WHERE id = 'd2222222-2222-2222-2222-222222222222';
UPDATE departments SET manager_position_id = 'p0000000-0000-0000-0000-000000000005' WHERE id = 'd3333333-3333-3333-3333-333333333333';
UPDATE departments SET manager_position_id = 'p0000000-0000-0000-0000-000000000008' WHERE id = 'd4444444-4444-4444-4444-444444444444';
UPDATE departments SET manager_position_id = 'p0000000-0000-0000-0000-000000000011' WHERE id = 'd5555555-5555-5555-5555-555555555555';
UPDATE departments SET manager_position_id = 'p0000000-0000-0000-0000-000000000014' WHERE id = 'd6666666-6666-6666-6666-666666666666';

-- Set deputy positions
UPDATE positions SET deputy_position_id = 'p0000000-0000-0000-0000-000000000003' WHERE id = 'p0000000-0000-0000-0000-000000000002';
UPDATE positions SET deputy_position_id = 'p0000000-0000-0000-0000-000000000006' WHERE id = 'p0000000-0000-0000-0000-000000000005';
UPDATE positions SET deputy_position_id = 'p0000000-0000-0000-0000-000000000009' WHERE id = 'p0000000-0000-0000-0000-000000000008';
UPDATE positions SET deputy_position_id = 'p0000000-0000-0000-0000-000000000012' WHERE id = 'p0000000-0000-0000-0000-000000000011';
UPDATE positions SET deputy_position_id = 'p0000000-0000-0000-0000-000000000015' WHERE id = 'p0000000-0000-0000-0000-000000000014';

-- NOT: Employee kayıtları için önce Supabase Authentication'dan kullanıcılar oluşturulmalıdır
-- Aşağıdaki INSERT işlemleri örnek olup, gerçek user_id'ler ile değiştirilmelidir

-- Sample Work Instructions
INSERT INTO work_instructions (code, title, department_id, position_id, version, status) VALUES
    ('IT-001', 'Çalışan İşe Alım Prosedürü', 'd2222222-2222-2222-2222-222222222222', 'p0000000-0000-0000-0000-000000000002', 'v2.3', 'active'),
    ('IT-002', 'Kalite Kontrol Standartları', 'd4444444-4444-4444-4444-444444444444', 'p0000000-0000-0000-0000-000000000008', 'v1.8', 'active'),
    ('IT-003', 'Üretim Hattı Bakım Talimatı', 'd3333333-3333-3333-3333-333333333333', 'p0000000-0000-0000-0000-000000000005', 'v3.1', 'review'),
    ('IT-004', 'Müşteri Şikayet Yönetimi', 'd5555555-5555-5555-5555-555555555555', 'p0000000-0000-0000-0000-000000000011', 'v1.5', 'active'),
    ('IT-005', 'Bütçe Planlama Süreci', 'd6666666-6666-6666-6666-666666666666', 'p0000000-0000-0000-0000-000000000014', 'v2.0', 'draft');

-- Sample Job Descriptions
INSERT INTO job_descriptions (position_id, title, description, responsibilities, qualifications) VALUES
    ('p0000000-0000-0000-0000-000000000001', 'Genel Müdür Görev Tanımı', 
     'Şirketin genel yönetiminden sorumlu üst düzey yönetici', 
     '["Stratejik planlama", "Bütçe yönetimi", "Departman koordinasyonu"]',
     '["İşletme lisans", "10+ yıl deneyim", "Liderlik becerileri"]'),
    ('p0000000-0000-0000-0000-000000000002', 'İK Müdürü Görev Tanımı',
     'İnsan kaynakları süreçlerinin yönetimi',
     '["İşe alım süreçleri", "Performans değerlendirme", "Eğitim planlama"]',
     '["İK veya işletme lisans", "5+ yıl İK deneyimi"]');
