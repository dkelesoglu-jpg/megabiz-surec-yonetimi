"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
type Doc = {
  id: number;
  name: string;
  mimeType: string;
  size: number;
  category: string;
  relatedType: string;
  relatedId: string;
  version: string;
  expiryDate: string;
  uploadedBy: string;
  createdAt: string;
};
type Employee = {
  id: number;
  firstName: string;
  lastName: string;
  nationalId: string;
  employeeNo: string;
  department: string;
};
const onboarding = [
  "Kimlik Fotokopisi",
  "İkametgâh Belgesi",
  "Adli Sicil Kaydı",
  "Diploma / Mezuniyet Belgesi",
  "Sağlık Raporu",
  "SGK İşe Giriş Bildirgesi",
  "İş Sözleşmesi",
  "KVKK Aydınlatma / Açık Rıza",
  "Banka IBAN Belgesi",
  "Fotoğraf",
  "Askerlik Durum Belgesi",
  "Yabancı Çalışma İzni",
];
const categories = [
  ...onboarding,
  "Yıllık İzin Belgesi",
  "Mazeret İzin Belgesi",
  "Rapor / İstirahat Belgesi",
  "Avans Talep Formu",
  "Borç Sözleşmesi",
  "Çalışan Onayı",
  "Yönetici Onayı",
  "Banka Dekontu",
  "Ödeme Makbuzu",
  "Tahsilat Belgesi",
  "Zimmet Tutanağı",
  "Başarı Belgesi",
  "Proje Çıktısı",
  "Müşteri Geri Bildirimi",
  "Eğitim Sertifikası",
  "Yönetici Notu",
  "Performans Görüşme Formu",
  "Sertifika",
  "Görev Tanımı",
  "İş Talimatı",
  "Diğer",
];
export default function DocumentCenter() {
  const [open, setOpen] = useState(false),
    [docs, setDocs] = useState<Doc[]>([]),
    [employees, setEmployees] = useState<Employee[]>([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [employeeId, setEmployeeId] = useState(""),
    [checklist, setChecklist] = useState(false);
  async function load() {
    const [d, e] = await Promise.all([
        fetch("/api/documents"),
        fetch("/api/employees"),
      ]),
      dj = await d.json(),
      ej = await e.json();
    if (d.ok) setDocs(dj.documents || []);
    else
      setMessage(
        dj.error === "MODULE_ACCESS_DENIED"
          ? "Belge modülüne erişim yetkiniz yok."
          : dj.error || "Belgeler alınamadı.",
      );
    if (e.ok) setEmployees(ej.employees || []);
  }
  useEffect(() => {
    if (open) load();
  }, [open]);
  const selected = employees.find((e) => String(e.id) === employeeId);
  const visible = useMemo(() => {
    const q = query.toLocaleLowerCase("tr");
    return docs.filter((d) => {
      const e = employees.find((x) => String(x.id) === d.relatedId),
        hay = [
          d.name,
          d.category,
          d.expiryDate,
          d.createdAt,
          e?.firstName,
          e?.lastName,
          e?.nationalId,
          e?.employeeNo,
        ]
          .join(" ")
          .toLocaleLowerCase("tr");
      return (!employeeId || d.relatedId === employeeId) && hay.includes(q);
    });
  }, [docs, employees, query, employeeId]);
  async function upload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    f.set("relatedType", "employee");
    const r = await fetch("/api/documents", { method: "POST", body: f }),
      j = await r.json();
    if (r.ok) {
      setMessage("Belge kişi dosyasına güvenli şekilde yüklendi.");
      e.currentTarget.reset();
      await load();
    } else setMessage(j.error || "Dosya yüklenemedi.");
    setBusy(false);
  }
  async function remove(d: Doc) {
    if (!confirm(`“${d.name}” dosyası silinsin mi?`)) return;
    const r = await fetch(`/api/documents?id=${d.id}`, { method: "DELETE" });
    if (r.ok) {
      setMessage("Dosya silindi.");
      load();
    }
  }
  const completed = new Set(
    docs.filter((d) => d.relatedId === employeeId).map((d) => d.category),
  );
  return (
    <>
      <button style={launcher} onClick={() => setOpen(true)}>
        ▣ Belge Merkezi
      </button>
      {open && (
        <div
          style={backdrop}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <section className="doc-modal">
            <header className="doc-header">
              <div>
                <small>ARANABİLİR PERSONEL DOSYASI</small>
                <h2>Belge / Evrak Merkezi</h2>
                <p>
                  Tarama, yükleme, işe giriş kontrolü ve kişi bazlı evrak
                  arşivi.
                </p>
              </div>
              <button onClick={() => setOpen(false)}>×</button>
            </header>
            <div className="doc-search">
              <label>
                <span>Personel seçin</span>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                >
                  <option value="">Tüm personel</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} · {e.nationalId} ·{" "}
                      {e.employeeNo}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>T.C., ad soyad, sicil, tarih veya belge ara</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="T.C., sicil no, ad soyad veya tarih"
                />
              </label>
              <button onClick={() => setChecklist(!checklist)}>
                ☑ İşe Giriş Evrakları
              </button>
            </div>
            {checklist && (
              <section className="onboarding-check">
                <header>
                  <div>
                    <b>
                      {selected
                        ? `${selected.firstName} ${selected.lastName}`
                        : "Personel seçilmedi"}
                    </b>
                    <span>İşe girişte istenen standart belgeler</span>
                  </div>
                  <strong>
                    {selected ? `${completed.size}/${onboarding.length}` : "—"}
                  </strong>
                </header>
                <div>
                  {onboarding.map((x) => (
                    <label key={x} className={completed.has(x) ? "done" : ""}>
                      <input
                        type="checkbox"
                        checked={completed.has(x)}
                        readOnly
                      />
                      <span>{x}</span>
                      <small>
                        {completed.has(x) ? "Dosya mevcut" : "Bekleniyor"}
                      </small>
                    </label>
                  ))}
                </div>
                <p>
                  Listede olmayan evrakı “Belge Türü” kutusuna manuel
                  yazabilirsiniz.
                </p>
              </section>
            )}
            <form className="doc-upload" onSubmit={upload}>
              <label className="doc-file">
                <span>Dosya seçin veya tarayın</span>
                <input
                  name="file"
                  type="file"
                  required
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  capture="environment"
                />
                <small>
                  Telefon kamerasıyla tarama desteklenir · en fazla 10 MB
                </small>
              </label>
              <div className="doc-fields">
                <label>
                  Personel
                  <select name="relatedId" required defaultValue={employeeId}>
                    <option value="">Seçiniz</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} · {e.nationalId}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Belge Türü
                  <input
                    name="category"
                    required
                    list="document-categories"
                    placeholder="Seçin veya manuel yazın"
                  />
                  <datalist id="document-categories">
                    {categories.map((x) => (
                      <option key={x} value={x} />
                    ))}
                  </datalist>
                </label>
                <label>
                  Belge Tarihi
                  <input name="documentDate" type="date" />
                </label>
                <label>
                  Geçerlilik Bitişi
                  <input name="expiryDate" type="date" />
                </label>
                <label>
                  Versiyon
                  <input name="version" defaultValue="1.0" />
                </label>
              </div>
              <button className="doc-upload-button" disabled={busy}>
                {busy ? "Yükleniyor…" : "⇧ Dosyayı Aktar"}
              </button>
            </form>
            {message && <p className="doc-notice">{message}</p>}
            <div className="doc-toolbar">
              <strong>Kişi Dosyaları</strong>
              <span>{visible.length} belge</span>
            </div>
            <div className="doc-list">
              {visible.length === 0 ? (
                <p className="doc-empty">
                  Arama ölçütlerine uygun belge bulunamadı.
                </p>
              ) : (
                visible.map((d) => {
                  const e = employees.find((x) => String(x.id) === d.relatedId);
                  return (
                    <article key={d.id}>
                      <span className="doc-icon">
                        {d.name.toLowerCase().endsWith(".pdf") ? "PDF" : "DOS"}
                      </span>
                      <div>
                        <strong>{d.name}</strong>
                        <small>
                          {e
                            ? `${e.firstName} ${e.lastName} · T.C. ${e.nationalId}`
                            : "Personel bağlantısı yok"}
                        </small>
                        <em>
                          {d.category} · {formatSize(d.size)} ·{" "}
                          {new Date(d.createdAt).toLocaleDateString("tr-TR")}
                        </em>
                      </div>
                      {d.expiryDate && (
                        <span className="doc-expiry">
                          Bitiş:{" "}
                          {new Date(d.expiryDate).toLocaleDateString("tr-TR")}
                        </span>
                      )}
                      <a href={`/api/documents?download=${d.id}`}>İndir</a>
                      <button onClick={() => remove(d)}>Sil</button>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
function formatSize(n: number) {
  return n > 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.ceil(n / 1024)} KB`;
}
const launcher = {
  position: "fixed" as const,
  right: 160,
  bottom: 22,
  zIndex: 40,
  border: "1px solid #dfe6ee",
  borderRadius: 10,
  background: "white",
  color: "#29405e",
  height: 38,
  padding: "0 14px",
  fontSize: 8,
  boxShadow: "0 10px 25px #07172f18",
};
const backdrop = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 130,
  background: "#061228b0",
  display: "grid",
  placeItems: "center",
  padding: 15,
};
