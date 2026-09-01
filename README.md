# Megabiz - İş Talimatları ve Süreç Yönetim Sistemi

Kurumsal iş talimatları, organizasyon yapısı, görev tanımları ve KPI yönetimi için geliştirilmiş kapsamlı bir yönetim sistemi.

## 🚀 Özellikler

### ✅ Tamamlanan Özellikler

- **Dashboard**: Canlı istatistikler ve performans metrikleri
- **Organizasyon Yapısı**: 
  - İnteraktif organizasyon şeması
  - Pozisyon ve departman yönetimi
  - Hiyerarşik yapı görselleştirme
  - Zoom kontrolleri
- **İş Talimatları**: CRUD işlemleri ve doküman yönetimi
- **Görev Takibi**: Görev atama ve takip sistemi
- **Doküman Yönetimi**: Dosya yükleme ve versiyonlama
- **Yönetim Raporları**: Analitik raporlar
- **Rol Bazlı Yetkilendirme**: Admin, Genel Müdür, Yönetici, Çalışan
- **İzin Yönetimi**: İzin talebi oluşturma, bakiye takibi, yönetici/İK onay akışı

### 🔄 Veritabanı Entegrasyonu

- Supabase PostgreSQL veritabanı
- Real-time veri senkronizasyonu
- Row Level Security (RLS) politikaları
- Otomatik timestamp güncellemeleri

## 📋 Veritabanı Tabloları

1. **companies** - Şirketler (multi-tenant altyapı)
2. **departments** - Departman bilgileri
3. **positions** - Pozisyon tanımları ve hiyerarşi
4. **employees** - Çalışan bilgileri ve roller
5. **job_descriptions** - Görev tanımları
6. **work_instructions** - İş talimatları
7. **kpis** - KPI tanımları
8. **performance_reviews** - Performans değerlendirmeleri
9. **documents** - Doküman meta verileri
10. **izin_turleri** - Şirket bazlı izin türü tanımları (kıdem/yaşa göre gün hakkı)
11. **izin_talepleri** - Çalışan izin talepleri (oluşturma, onay, red)
12. **izin_bakiyeleri** - Çalışan/izin türü/yıl bazlı izin bakiyesi

Tüm tablolar `company_id` üzerinden şirkete bağlıdır ve RLS politikaları her
şirketin yalnızca kendi verisini görmesini sağlar (bkz. Multi-Tenant Yapı).

## 🛠️ Teknoloji Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Icons**: Lucide React
- **File Upload**: React Dropzone
- **Build Tool**: Vite

## 📦 Kurulum

### 1. Proje Bağımlılıkları

```bash
npm install
```

### 2. Supabase Kurulumu

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. SQL Editor'den `src/lib` içindeki aşağıdaki dosyaları SIRAYLA çalıştırın:
   1. `database-schema.sql` - Temel tablo yapıları
   2. `multi-tenant-schema.sql` - `companies` tablosu ve `company_id` altyapısı
   3. `rls-policies.sql` - Rol ve şirket bazlı erişim politikaları
   4. `leave-management-schema.sql` - İzin yönetimi tabloları ve hesaplama fonksiyonları
   5. `leave-management-rls.sql` - İzin yönetimi erişim politikaları
   6. `database-seed.sql` - Örnek veriler (opsiyonel)

Her dosya tekrar tekrar çalıştırılabilir (idempotent) şekilde yazılmıştır.

### 3. Environment Variables

`.env.example` dosyasını `.env` olarak kopyalayın ve değerleri doldurun:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Supabase URL ve Anon Key'i şuradan alabilirsiniz:
- Supabase Dashboard > Settings > API

### 4. Storage Bucket Oluşturma

Supabase Dashboard'da Storage bölümünden `documents` isimli bir public bucket oluşturun.

### 5. Uygulamayı Çalıştırma

```bash
npm run dev
```

Uygulama `http://localhost:5173` adresinde çalışacaktır.

## 🏢 Multi-Tenant Yapı

Sistem birden fazla şirketi tek bir Supabase projesinde izole şekilde
barındırabilir. Her tablo bir `company_id` kolonu taşır ve RLS politikaları
`get_user_company_id()` fonksiyonu üzerinden bir kullanıcının yalnızca kendi
şirketinin verisini görebilmesini/değiştirebilmesini garanti eder. Yeni
kurulumlarda `multi-tenant-schema.sql` mevcut/örnek veriyi otomatik olarak
`Megabiz` adında varsayılan bir şirkete bağlar; ek şirketler `companies`
tablosuna satır eklenerek tanımlanabilir.

## 🗓️ İzin Yönetimi

- **Çalışan tarafı**: "İzin Taleplerim" ekranından izin türü, tarih aralığı ve
  açıklama girilerek talep oluşturulur; seçilen izin türünün kalan bakiyesi
  formda anlık gösterilir.
- **Yönetici/İK tarafı**: "İzin Onayları" ekranında (Departman Müdürü ve üstü
  ile İK rolü görebilir) bekleyen talepler listelenir, onaylanabilir veya
  gerekçe girilerek reddedilebilir.
- **Yıllık izin hakkı hesaplaması** (`hesapla_yillik_izin_hakki` fonksiyonu),
  4857 sayılı İş Kanunu md. 53 asgarilerini uygular:
  - 1-5 yıl kıdem: 14 gün, 5-15 yıl: 20 gün, 15+ yıl: 26 gün
  - 18 yaşından küçük veya 50 yaşından büyük çalışanlar için asgari 20 gün
    (kıdem kademesinin üzerine çıkar, asla düşürmez)
  - `izin_turleri` tablosundaki bu kademe değerleri **şirket bazlı** override
    edilebilir; CHECK kısıtları override'ın kanuni asgarinin altına
    düşürülmesini engeller, yalnızca üzerine çıkılmasına izin verir.
- İzin bakiyeleri `izin_bakiyeleri` tablosunda çalışan/izin türü/yıl bazında
  tutulur ve bir talep onaylandığında otomatik olarak güncellenir; yetersiz
  bakiye durumunda onay işlemi veritabanı seviyesinde reddedilir.

## 🔐 Rol Hiyerarşisi

1. **Admin** - Tüm yetkilere sahip
2. **General Manager** - Genel müdür yetkileri
3. **Manager** - Departman yöneticisi yetkileri
4. **Employee** - Temel kullanıcı yetkileri

## 📄 Desteklenen Dosya Tipleri

- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Microsoft Excel (.xls, .xlsx)

## 🎯 Kullanım Senaryoları

### Yeni Departman Ekleme

1. Organizasyon Yapısı modülüne gidin
2. "Departman Ekle" butonuna tıklayın
3. Departman bilgilerini doldurun
4. Departman rengini seçin
5. Kaydedin

### İş Talimatı Yükleme

1. İş Talimatları modülüne gidin
2. "Yeni Talimat" butonuna tıklayın
3. Talimat bilgilerini doldurun
4. PDF/Word dosyasını yükleyin
5. Revizyon bilgilerini girin
6. Onay akışını tamamlayın

### Pozisyon Detaylarını Görüntüleme

1. Organizasyon şemasında bir pozisyona tıklayın
2. Açılan modal'da 7 sekme bulunur:
   - Pozisyon Bilgileri
   - Görev Tanımı
   - Yetki ve Sorumluluklar
   - İş Talimatları
   - Bağlı Süreçler
   - Kullanılan Formlar
   - KPI ve Performans (şu an pasif)

## 🔧 Geliştirme

### Build

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

## 📊 Database Schema Özellikleri

- **UUID** primary keys
- **Timestamps** (created_at, updated_at)
- **Foreign key** relationships
- **Cascade** delete için uygun yapı
- **Indexes** performans için
- **Triggers** otomatik timestamp güncellemeleri için
- **RLS Policies** güvenlik için

## 🛡️ Güvenlik

- Row Level Security (RLS) enabled
- Rol bazlı erişim kontrolü
- Supabase Auth entegrasyonu
- Secure file uploads
- SQL injection koruması

## 📝 Notlar

- KPI sistemi şu an pasif durumda, görev tanımları ve iş talimatları tamamlandıktan sonra aktif hale gelecektir.
- Tüm tarih ve saat bilgileri UTC timezone'da saklanmaktadır.
- Dosya yüklemeleri Supabase Storage'da güvenli şekilde saklanmaktadır.
- Her doküman revizyon numarası ile takip edilmektedir.

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 Destek

Sorularınız için issue açabilirsiniz.

## 📜 Lisans

MIT License

---

**Megabiz** - Modern İş Süreçleri Yönetimi © 2024
