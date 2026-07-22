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

### 🔄 Veritabanı Entegrasyonu

- Supabase PostgreSQL veritabanı
- Real-time veri senkronizasyonu
- Row Level Security (RLS) politikaları
- Otomatik timestamp güncellemeleri

## 📋 Veritabanı Tabloları

1. **departments** - Departman bilgileri
2. **positions** - Pozisyon tanımları ve hiyerarşi
3. **employees** - Çalışan bilgileri ve roller
4. **job_descriptions** - Görev tanımları
5. **work_instructions** - İş talimatları
6. **kpis** - KPI tanımları
7. **performance_reviews** - Performans değerlendirmeleri
8. **documents** - Doküman meta verileri

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
3. SQL Editor'den aşağıdaki dosyaları sırayla çalıştırın:
   - `database-schema.sql` - Tablo yapıları ve politikalar
   - `database-seed.sql` - Örnek veriler

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
