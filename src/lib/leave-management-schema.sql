-- ========================================
-- MEGABIZ - İzin Yönetimi Şeması
-- ========================================
-- Bu dosya database-schema.sql, multi-tenant-schema.sql ve rls-policies.sql
-- çalıştırıldıktan SONRA SQL Editor'de çalıştırılmalıdır.
-- Ardından leave-management-rls.sql çalıştırılmalıdır.
--
-- İçerik:
--   1. izin_turleri   - şirket bazlı izin türü tanımları (yıllık, mazeret, ücretsiz vb.)
--   2. izin_talepleri - çalışanların oluşturduğu izin talepleri
--   3. izin_bakiyeleri - çalışan/izin türü/yıl bazlı izin bakiyesi
--   4. hesapla_yillik_izin_hakki() - kıdem + yaş istisnasına göre yıllık izin hakkı hesabı
--   5. Bakiye otomatik oluşturma ve onay sırasında bakiye düşme tetikleyicileri

-- ========================================
-- 1. İZİN TÜRLERİ
-- ========================================
CREATE TABLE IF NOT EXISTS izin_turleri (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    ad VARCHAR(100) NOT NULL,
    kod VARCHAR(50) NOT NULL,
    aciklama TEXT,

    -- TRUE ise gün hakkı kıdem yılına göre hesaplanır (bkz. hesapla_yillik_izin_hakki).
    -- FALSE ise sabit_gun_sayisi kullanılır (örn. 3 günlük evlilik izni).
    kidem_bazli_hesaplama BOOLEAN NOT NULL DEFAULT FALSE,

    -- Kıdem bazlı izin türleri için gün hakkı kademeleri (4857 sayılı İş Kanunu md. 53).
    -- Şirket, kanuni asgari değerin ÜZERİNDE bir hak tanımlayabilir; CHECK kısıtları
    -- bu değerlerin kanuni asgarinin altına düşürülmesini engeller.
    kidem_1_5_yil_gun INTEGER NOT NULL DEFAULT 14 CHECK (kidem_1_5_yil_gun >= 14),
    kidem_5_15_yil_gun INTEGER NOT NULL DEFAULT 20 CHECK (kidem_5_15_yil_gun >= 20),
    kidem_15_yil_uzeri_gun INTEGER NOT NULL DEFAULT 26 CHECK (kidem_15_yil_uzeri_gun >= 26),
    -- 18 yaşından küçük ve 50 yaşından büyük çalışanlar için asgari izin günü.
    yas_istisna_min_gun INTEGER NOT NULL DEFAULT 20 CHECK (yas_istisna_min_gun >= 20),

    -- Kıdem bazlı olmayan (sabit) izin türleri için yıllık gün hakkı.
    sabit_gun_sayisi INTEGER,

    -- Kullanılmayan günlerin bir sonraki yıla devredip devretmeyeceği.
    yillik_devir_hakki BOOLEAN NOT NULL DEFAULT TRUE,
    -- Bu izin türü izin_bakiyeleri üzerinden takip edilsin mi (ör. ücretsiz izin için FALSE olabilir).
    bakiye_takipli BOOLEAN NOT NULL DEFAULT TRUE,

    aktif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE (company_id, kod),
    CHECK (kidem_bazli_hesaplama OR sabit_gun_sayisi IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_izin_turleri_company ON izin_turleri(company_id);
CREATE INDEX IF NOT EXISTS idx_izin_turleri_aktif ON izin_turleri(aktif);

DROP TRIGGER IF EXISTS update_izin_turleri_updated_at ON izin_turleri;
CREATE TRIGGER update_izin_turleri_updated_at BEFORE UPDATE ON izin_turleri
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 2. İZİN TALEPLERİ
-- ========================================
CREATE TABLE IF NOT EXISTS izin_talepleri (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    izin_turu_id UUID NOT NULL REFERENCES izin_turleri(id) ON DELETE RESTRICT,

    baslangic_tarihi DATE NOT NULL,
    bitis_tarihi DATE NOT NULL,
    -- Hafta sonları hariç iş günü sayısı; BEFORE trigger ile otomatik hesaplanır.
    gun_sayisi NUMERIC(5,2) NOT NULL DEFAULT 0,
    aciklama TEXT,

    durum VARCHAR(20) NOT NULL DEFAULT 'beklemede' CHECK (durum IN (
        'beklemede', 'onaylandi', 'reddedildi', 'iptal_edildi'
    )),
    onaylayan_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    onay_tarihi TIMESTAMP WITH TIME ZONE,
    red_nedeni TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CHECK (bitis_tarihi >= baslangic_tarihi)
);

CREATE INDEX IF NOT EXISTS idx_izin_talepleri_company ON izin_talepleri(company_id);
CREATE INDEX IF NOT EXISTS idx_izin_talepleri_employee ON izin_talepleri(employee_id);
CREATE INDEX IF NOT EXISTS idx_izin_talepleri_durum ON izin_talepleri(durum);
CREATE INDEX IF NOT EXISTS idx_izin_talepleri_tarih ON izin_talepleri(baslangic_tarihi);

DROP TRIGGER IF EXISTS update_izin_talepleri_updated_at ON izin_talepleri;
CREATE TRIGGER update_izin_talepleri_updated_at BEFORE UPDATE ON izin_talepleri
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 3. İZİN BAKİYELERİ
-- ========================================
CREATE TABLE IF NOT EXISTS izin_bakiyeleri (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    izin_turu_id UUID NOT NULL REFERENCES izin_turleri(id) ON DELETE CASCADE,
    yil INTEGER NOT NULL,

    hak_edilen_gun NUMERIC(5,2) NOT NULL DEFAULT 0,
    devreden_gun NUMERIC(5,2) NOT NULL DEFAULT 0,
    kullanilan_gun NUMERIC(5,2) NOT NULL DEFAULT 0,
    kalan_gun NUMERIC(5,2) GENERATED ALWAYS AS (hak_edilen_gun + devreden_gun - kullanilan_gun) STORED,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE (employee_id, izin_turu_id, yil)
);

CREATE INDEX IF NOT EXISTS idx_izin_bakiyeleri_company ON izin_bakiyeleri(company_id);
CREATE INDEX IF NOT EXISTS idx_izin_bakiyeleri_employee ON izin_bakiyeleri(employee_id);
CREATE INDEX IF NOT EXISTS idx_izin_bakiyeleri_yil ON izin_bakiyeleri(yil);

DROP TRIGGER IF EXISTS update_izin_bakiyeleri_updated_at ON izin_bakiyeleri;
CREATE TRIGGER update_izin_bakiyeleri_updated_at BEFORE UPDATE ON izin_bakiyeleri
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. YILLIK İZİN HAKKI HESAPLAMA FONKSİYONU
-- ========================================
-- 4857 sayılı İş Kanunu md. 53 asgari değerleri kullanılır, ancak izin_turleri
-- tablosundaki kademeler şirket bazlı override edilebildiği için (kanuni asgarinin
-- üzerinde) gerçek hesaplama her zaman izin_turleri satırındaki değerlerden yapılır.
--
--   Kıdem 1-5 yıl (1 dahil, 5 hariç)   -> kidem_1_5_yil_gun     (kanuni asgari: 14)
--   Kıdem 5-15 yıl (5 dahil, 15 hariç) -> kidem_5_15_yil_gun    (kanuni asgari: 20)
--   Kıdem 15 yıl ve üzeri              -> kidem_15_yil_uzeri_gun (kanuni asgari: 26)
--   1 yıldan az kıdem                  -> 0 (kanunen yıllık izin hakkı henüz doğmamıştır)
--   18 yaşından küçük veya 50+ yaşında -> en az yas_istisna_min_gun (asgari 20), diğer
--                                          kademelerin ÜZERİNE çıkar, asla düşürmez
CREATE OR REPLACE FUNCTION hesapla_yillik_izin_hakki(
    p_employee_id UUID,
    p_izin_turu_id UUID,
    p_yil INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
    v_start_date DATE;
    v_birth_date DATE;
    v_calc_date DATE;
    v_kidem_yil INTEGER;
    v_yas INTEGER;
    v_gun NUMERIC;
    v_izin_turu izin_turleri%ROWTYPE;
BEGIN
    SELECT * INTO v_izin_turu FROM izin_turleri WHERE id = p_izin_turu_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'İzin türü bulunamadı: %', p_izin_turu_id;
    END IF;

    IF NOT v_izin_turu.kidem_bazli_hesaplama THEN
        RETURN COALESCE(v_izin_turu.sabit_gun_sayisi, 0);
    END IF;

    SELECT start_date, birth_date INTO v_start_date, v_birth_date
    FROM employees WHERE id = p_employee_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Çalışan bulunamadı: %', p_employee_id;
    END IF;

    -- İlgili izin yılının sonu referans alınır (gelecek tarihe taşmamak için bugünle sınırlanır).
    v_calc_date := LEAST(CURRENT_DATE, make_date(p_yil, 12, 31));

    IF v_calc_date < v_start_date THEN
        RETURN 0;
    END IF;

    v_kidem_yil := EXTRACT(YEAR FROM AGE(v_calc_date, v_start_date))::INTEGER;

    IF v_kidem_yil < 1 THEN
        v_gun := 0;
    ELSIF v_kidem_yil < 5 THEN
        v_gun := v_izin_turu.kidem_1_5_yil_gun;
    ELSIF v_kidem_yil < 15 THEN
        v_gun := v_izin_turu.kidem_5_15_yil_gun;
    ELSE
        v_gun := v_izin_turu.kidem_15_yil_uzeri_gun;
    END IF;

    IF v_birth_date IS NOT NULL THEN
        v_yas := EXTRACT(YEAR FROM AGE(v_calc_date, v_birth_date))::INTEGER;
        IF (v_yas < 18 OR v_yas >= 50) AND v_gun > 0 THEN
            v_gun := GREATEST(v_gun, v_izin_turu.yas_istisna_min_gun);
        END IF;
    END IF;

    RETURN v_gun;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- ========================================
-- 5. BAKİYE OTOMATİK OLUŞTURMA / GETİRME
-- ========================================
-- İlgili employee/izin_turu/yil için bakiye satırı yoksa, hak_edilen_gun'u
-- hesapla_yillik_izin_hakki() (kıdem bazlı) veya sabit_gun_sayisi (sabit) ile,
-- devreden_gun'u ise bir önceki yılın kalan bakiyesiyle (devir hakkı varsa) oluşturur.
-- SECURITY DEFINER: normal bir çalışan izin_bakiyeleri tablosuna doğrudan yazamaz,
-- ama kendi bakiyesini bu fonksiyon üzerinden görüntüleyebilir/oluşturabilir.
CREATE OR REPLACE FUNCTION izin_bakiyesi_getir_veya_olustur(
    p_employee_id UUID,
    p_izin_turu_id UUID,
    p_yil INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
RETURNS izin_bakiyeleri AS $$
DECLARE
    v_bakiye izin_bakiyeleri%ROWTYPE;
    v_onceki_bakiye izin_bakiyeleri%ROWTYPE;
    v_izin_turu izin_turleri%ROWTYPE;
    v_company_id UUID;
    v_hak_edilen NUMERIC := 0;
    v_devreden NUMERIC := 0;
BEGIN
    SELECT * INTO v_bakiye FROM izin_bakiyeleri
    WHERE employee_id = p_employee_id AND izin_turu_id = p_izin_turu_id AND yil = p_yil;
    IF FOUND THEN
        RETURN v_bakiye;
    END IF;

    SELECT * INTO v_izin_turu FROM izin_turleri WHERE id = p_izin_turu_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'İzin türü bulunamadı: %', p_izin_turu_id;
    END IF;

    SELECT company_id INTO v_company_id FROM employees WHERE id = p_employee_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Çalışan bulunamadı: %', p_employee_id;
    END IF;

    IF v_izin_turu.kidem_bazli_hesaplama THEN
        v_hak_edilen := hesapla_yillik_izin_hakki(p_employee_id, p_izin_turu_id, p_yil);
    ELSE
        v_hak_edilen := COALESCE(v_izin_turu.sabit_gun_sayisi, 0);
    END IF;

    IF v_izin_turu.yillik_devir_hakki THEN
        SELECT * INTO v_onceki_bakiye FROM izin_bakiyeleri
        WHERE employee_id = p_employee_id AND izin_turu_id = p_izin_turu_id AND yil = p_yil - 1;
        IF FOUND THEN
            v_devreden := GREATEST(v_onceki_bakiye.kalan_gun, 0);
        END IF;
    END IF;

    INSERT INTO izin_bakiyeleri (company_id, employee_id, izin_turu_id, yil, hak_edilen_gun, devreden_gun, kullanilan_gun)
    VALUES (v_company_id, p_employee_id, p_izin_turu_id, p_yil, v_hak_edilen, v_devreden, 0)
    ON CONFLICT (employee_id, izin_turu_id, yil) DO UPDATE SET updated_at = NOW()
    RETURNING * INTO v_bakiye;

    RETURN v_bakiye;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========================================
-- 6. TALEP TARİHLERİNDEN İŞ GÜNÜ SAYISINI OTOMATİK HESAPLA
-- ========================================
CREATE OR REPLACE FUNCTION is_gunu_hesapla(p_baslangic DATE, p_bitis DATE)
RETURNS NUMERIC AS $$
DECLARE
    v_gun NUMERIC := 0;
    v_tarih DATE := p_baslangic;
BEGIN
    WHILE v_tarih <= p_bitis LOOP
        -- ISODOW: 1=Pazartesi ... 7=Pazar; 6 ve 7 (Cumartesi/Pazar) hariç tutulur.
        IF EXTRACT(ISODOW FROM v_tarih) < 6 THEN
            v_gun := v_gun + 1;
        END IF;
        v_tarih := v_tarih + 1;
    END LOOP;
    RETURN v_gun;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION izin_talebi_gun_sayisi_hesapla()
RETURNS TRIGGER AS $$
BEGIN
    NEW.gun_sayisi := is_gunu_hesapla(NEW.baslangic_tarihi, NEW.bitis_tarihi);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_izin_talebi_gun_sayisi ON izin_talepleri;
CREATE TRIGGER trg_izin_talebi_gun_sayisi
    BEFORE INSERT OR UPDATE OF baslangic_tarihi, bitis_tarihi ON izin_talepleri
    FOR EACH ROW EXECUTE FUNCTION izin_talebi_gun_sayisi_hesapla();

-- ========================================
-- 7. ONAY/RED SIRASINDA BAKİYEYİ GÜNCELLE
-- ========================================
-- 'onaylandi' durumuna geçildiğinde: bakiye satırı yoksa oluşturulur, yetersiz
-- bakiye varsa talep reddedilir (exception), yeterliyse kullanilan_gun artırılır.
-- 'onaylandi' durumundan çıkıldığında (red/iptal): kullanilan_gun geri düşülür.
CREATE OR REPLACE FUNCTION izin_talebi_bakiye_guncelle()
RETURNS TRIGGER AS $$
DECLARE
    v_izin_turu izin_turleri%ROWTYPE;
    v_bakiye izin_bakiyeleri%ROWTYPE;
    v_yil INTEGER;
BEGIN
    SELECT * INTO v_izin_turu FROM izin_turleri WHERE id = NEW.izin_turu_id;

    IF NOT v_izin_turu.bakiye_takipli THEN
        RETURN NEW;
    END IF;

    v_yil := EXTRACT(YEAR FROM NEW.baslangic_tarihi)::INTEGER;

    IF NEW.durum = 'onaylandi' AND (TG_OP = 'INSERT' OR OLD.durum IS DISTINCT FROM 'onaylandi') THEN
        v_bakiye := izin_bakiyesi_getir_veya_olustur(NEW.employee_id, NEW.izin_turu_id, v_yil);

        IF v_bakiye.kalan_gun < NEW.gun_sayisi THEN
            RAISE EXCEPTION 'Yetersiz izin bakiyesi: kalan % gün, talep edilen % gün', v_bakiye.kalan_gun, NEW.gun_sayisi;
        END IF;

        UPDATE izin_bakiyeleri
        SET kullanilan_gun = kullanilan_gun + NEW.gun_sayisi
        WHERE id = v_bakiye.id;

    ELSIF TG_OP = 'UPDATE' AND OLD.durum = 'onaylandi' AND NEW.durum IS DISTINCT FROM 'onaylandi' THEN
        UPDATE izin_bakiyeleri
        SET kullanilan_gun = GREATEST(kullanilan_gun - OLD.gun_sayisi, 0)
        WHERE employee_id = OLD.employee_id
          AND izin_turu_id = OLD.izin_turu_id
          AND yil = EXTRACT(YEAR FROM OLD.baslangic_tarihi)::INTEGER;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_izin_talebi_bakiye ON izin_talepleri;
CREATE TRIGGER trg_izin_talebi_bakiye
    AFTER INSERT OR UPDATE OF durum ON izin_talepleri
    FOR EACH ROW EXECUTE FUNCTION izin_talebi_bakiye_guncelle();
