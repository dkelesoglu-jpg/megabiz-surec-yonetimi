"use client";

import { FormEvent, useEffect, useState } from "react";
import "./employee-benefits-assets.css";

type Benefit = {
  id: number;
  definitionId?: number | null;
  name: string;
  category: string;
  amount: number;
  currency: string;
  frequency: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  includeInEmployerCost: boolean;
  description?: string | null;
  detailData?: string | null;
  status: string;
};
type Definition = { id: number; name: string; status: string };
type BenefitData = {
  assignments: Benefit[];
  definitions: Definition[];
  suggestions: Array<{
    id: number;
    definitionId: number;
    definition?: Definition;
    scopeType: string;
    department?: string;
    position?: string;
    alreadyAssigned: boolean;
  }>;
  standardBenefits: string[];
};
type Asset = {
  id: number;
  assetCode: string;
  name: string;
  category: string;
  brand?: string | null;
  model?: string | null;
  serialNo?: string | null;
  ownershipType: string;
  assignedAt?: string | null;
  expectedReturnDate?: string | null;
  returnedAt?: string | null;
  condition: string;
  status: string;
  notes?: string | null;
  monthlyCost: number;
  includeInEmployerCost: boolean;
};
const tl = (value = 0) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 2,
  }).format(value);
const detail = (item?: Benefit | null) => {
  try {
    return JSON.parse(item?.detailData || "{}") as Record<string, string>;
  } catch {
    return {};
  }
};

export default function EmployeeBenefitsAssets({ employeeId }: { employeeId: number }) {
  const [benefits, setBenefits] = useState<BenefitData | null>(null),
    [assets, setAssets] = useState<Asset[]>([]),
    [benefitModal, setBenefitModal] = useState(false),
    [assetModal, setAssetModal] = useState(false),
    [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null),
    [editingAsset, setEditingAsset] = useState<Asset | null>(null),
    [message, setMessage] = useState("");
  async function load() {
    const [benefitResponse, assetResponse] = await Promise.all([
        fetch(`/api/benefits?employeeId=${employeeId}`, { cache: "no-store" }),
        fetch(`/api/assets?employeeId=${employeeId}`, { cache: "no-store" }),
      ]),
      [benefitJson, assetJson] = await Promise.all([
        benefitResponse.json(),
        assetResponse.json(),
      ]);
    if (benefitResponse.ok) setBenefits(benefitJson);
    if (assetResponse.ok) setAssets(assetJson.assets || []);
  }
  useEffect(() => {
    // Sicil değiştiğinde iki merkezi kaynağı birlikte tazele.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);
  async function saveBenefit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget),
      payload = Object.fromEntries(form.entries()),
      response = await fetch("/api/benefits", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...payload,
          action: "employeeBenefit",
          id: editingBenefit?.id,
          employeeId,
          includeInEmployerCost: form.has("includeInEmployerCost"),
        }),
      }),
      result = await response.json();
    if (!response.ok) return setMessage(result.error || "Yan hak kaydedilemedi");
    setBenefitModal(false);
    setEditingBenefit(null);
    setMessage("Yan hak kaydedildi ve maliyet hesapları güncellendi.");
    await load();
    window.dispatchEvent(new Event("employees-updated"));
  }
  async function benefitStatus(item: Benefit, remove = false) {
    const response = await fetch(
      remove ? `/api/benefits?id=${item.id}` : "/api/benefits",
      remove
        ? { method: "DELETE" }
        : {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              action: "status",
              id: item.id,
              status: item.status === "Aktif" ? "Pasif" : "Aktif",
            }),
          },
    );
    if (!response.ok) {
      const result = await response.json();
      return setMessage(result.error || "İşlem tamamlanamadı");
    }
    await load();
    window.dispatchEvent(new Event("employees-updated"));
  }
  async function saveAsset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget),
      payload = Object.fromEntries(form.entries()),
      response = await fetch("/api/assets", {
        method: editingAsset ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...payload,
          id: editingAsset?.id,
          assignedEmployeeId: employeeId,
          includeInEmployerCost: form.has("includeInEmployerCost"),
        }),
      }),
      result = await response.json();
    if (!response.ok) return setMessage(result.error || "Zimmet kaydedilemedi");
    setAssetModal(false);
    setEditingAsset(null);
    setMessage("Zimmet kaydedildi ve maliyet hesapları güncellendi.");
    await load();
    window.dispatchEvent(new Event("employees-updated"));
  }
  async function returnAsset(item: Asset) {
    const response = await fetch("/api/assets", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...item, returnAsset: true }),
    });
    if (!response.ok) {
      const result = await response.json();
      return setMessage(result.error || "Zimmet iade alınamadı");
    }
    await load();
    window.dispatchEvent(new Event("employees-updated"));
  }
  return (
    <div className="employee-benefit-asset-stack">
      <section className="employee-direct-section">
        <header>
          <div>
            <span>02</span>
            <div>
              <h3>Yan Haklar</h3>
              <small>Personele tanımlı haklar ve işveren maliyeti durumu</small>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingBenefit(null);
              setBenefitModal(true);
            }}
          >
            ＋ Yeni Yan Hak Ekle
          </button>
        </header>
        {benefits?.suggestions?.some((item) => !item.alreadyAssigned) && (
          <div className="employee-auto-suggestions">
            <b>Departman / pozisyon önerileri</b>
            {benefits.suggestions
              .filter((item) => !item.alreadyAssigned)
              .map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setEditingBenefit({
                      id: 0,
                      definitionId: item.definitionId,
                      name: item.definition?.name || "Yan Hak",
                      category: item.definition?.name || "Diğer",
                      amount: 0,
                      currency: "TRY",
                      frequency: "Aylık",
                      effectiveFrom: new Date().toISOString().slice(0, 10),
                      includeInEmployerCost: true,
                      status: "Aktif",
                    });
                    setBenefitModal(true);
                  }}
                >
                  ＋ {item.definition?.name}
                </button>
              ))}
          </div>
        )}
        <div className="employee-direct-list">
          {benefits?.assignments.length ? (
            benefits.assignments.map((item) => (
              <article className={item.status === "Aktif" ? "" : "inactive"} key={item.id}>
                <i>{item.name.slice(0, 2).toUpperCase()}</i>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {tl(item.amount)} · {item.frequency} · {item.effectiveFrom}
                    {item.effectiveTo ? ` → ${item.effectiveTo}` : ""}
                  </small>
                  <em>
                    {item.includeInEmployerCost
                      ? "Maliyete dahil"
                      : "Maliyete dahil değil"}
                    {item.description ? ` · ${item.description}` : ""}
                  </em>
                </div>
                <b>{item.status}</b>
                <div className="employee-direct-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBenefit(item);
                      setBenefitModal(true);
                    }}
                  >
                    Düzenle
                  </button>
                  <button type="button" onClick={() => benefitStatus(item)}>
                    {item.status === "Aktif" ? "Pasif Yap" : "Aktif Yap"}
                  </button>
                  <button type="button" className="danger" onClick={() => benefitStatus(item, true)}>
                    Sil
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="employee-direct-empty">Henüz yan hak tanımlanmamış.</p>
          )}
        </div>
      </section>

      <section className="employee-direct-section">
        <header>
          <div>
            <span>03</span>
            <div>
              <h3>Zimmetler</h3>
              <small>Personele teslim edilen araç, cihaz, kart ve ekipmanlar</small>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingAsset(null);
              setAssetModal(true);
            }}
          >
            ＋ Yeni Zimmet Ekle
          </button>
        </header>
        <div className="employee-direct-list">
          {assets.length ? (
            assets.map((item) => (
              <article key={item.id}>
                <i>{item.category.slice(0, 2).toUpperCase()}</i>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {[item.brand, item.model, item.serialNo].filter(Boolean).join(" · ") ||
                      item.assetCode}
                  </small>
                  <em>
                    Teslim: {item.assignedAt || "—"} · {item.ownershipType}
                    {item.includeInEmployerCost
                      ? ` · Maliyet ${tl(item.monthlyCost)}/ay`
                      : " · Maliyete dahil değil"}
                  </em>
                </div>
                <b>{item.status}</b>
                <div className="employee-direct-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAsset(item);
                      setAssetModal(true);
                    }}
                  >
                    Düzenle
                  </button>
                  {item.status === "Zimmetli" && (
                    <button type="button" onClick={() => returnAsset(item)}>
                      İade Al
                    </button>
                  )}
                </div>
              </article>
            ))
          ) : (
            <p className="employee-direct-empty">Bu personele atanmış zimmet bulunmuyor.</p>
          )}
        </div>
      </section>
      {message && <p className="employee-direct-message">{message}</p>}
      {benefitModal && benefits && (
        <BenefitForm
          item={editingBenefit}
          definitions={benefits.definitions}
          standard={benefits.standardBenefits}
          close={() => setBenefitModal(false)}
          save={saveBenefit}
        />
      )}
      {assetModal && (
        <AssetForm
          item={editingAsset}
          employeeId={employeeId}
          close={() => setAssetModal(false)}
          save={saveAsset}
        />
      )}
    </div>
  );
}

function BenefitForm({
  item,
  definitions,
  standard,
  close,
  save,
}: {
  item: Benefit | null;
  definitions: Definition[];
  standard: string[];
  close: () => void;
  save: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const [name, setName] = useState(item?.name || "Yemek"),
    details = detail(item),
    names = [...new Set([...standard, ...definitions.map((entry) => entry.name)])];
  return (
    <div className="modal-backdrop">
      <form className="employee-direct-modal" onSubmit={save}>
        <header>
          <div>
            <span>PERSONEL YAN HAK KARTI</span>
            <h2>{item?.id ? "Yan Hakkı Düzenle" : "Yeni Yan Hak Ekle"}</h2>
          </div>
          <button type="button" onClick={close}>×</button>
        </header>
        <div className="employee-direct-form">
          <label><span>Yan Hak Adı</span><input name="name" list="benefit-names" value={name} onChange={(e) => setName(e.target.value)} required /><datalist id="benefit-names">{names.map((entry) => <option key={entry}>{entry}</option>)}</datalist></label>
          <label><span>Durum</span><select name="status" defaultValue={item?.status || "Aktif"}><option>Aktif</option><option>Pasif</option></select></label>
          <label><span>Başlangıç Tarihi</span><input name="effectiveFrom" type="date" defaultValue={item?.effectiveFrom || new Date().toISOString().slice(0, 10)} required /></label>
          <label><span>Bitiş Tarihi</span><input name="effectiveTo" type="date" defaultValue={item?.effectiveTo || ""} /></label>
          <label><span>Tutar</span><input name="amount" type="number" min="0" step="0.01" defaultValue={item?.amount || 0} required /></label>
          <label><span>Tutar Tipi</span><select name="frequency" defaultValue={item?.frequency || "Aylık"}><option>Günlük</option><option>Aylık</option><option>Yıllık</option><option>Tek Seferlik</option></select></label>
          {name === "Şirket Aracı" && <><label><span>Plaka / Araç Bilgisi</span><input name="vehicleInfo" defaultValue={details.vehicleInfo || ""} /></label><label><span>Araç Türü</span><select name="ownershipType" defaultValue={details.ownershipType || "Şirket"}><option>Şirket</option><option>Kiralık</option></select></label></>}
          {["Özel Sağlık Sigortası", "Tamamlayıcı Sağlık Sigortası"].includes(name) && <><label><span>Poliçe Başlangıcı</span><input name="policyStart" type="date" defaultValue={details.policyStart || ""} /></label><label><span>Poliçe Bitişi</span><input name="policyEnd" type="date" defaultValue={details.policyEnd || ""} /></label></>}
          <label className="wide"><span>Açıklama</span><textarea name="description" defaultValue={item?.description || ""} /></label>
          <label className="check wide"><input name="includeInEmployerCost" type="checkbox" defaultChecked={item?.includeInEmployerCost ?? true} /><span>İşveren maliyetine dahil et</span></label>
          <input type="hidden" name="category" value={name} />
          <input type="hidden" name="definitionId" value={item?.definitionId || ""} />
        </div>
        <footer><button type="button" onClick={close}>İptal</button><button className="primary">Kaydet</button></footer>
      </form>
    </div>
  );
}

function AssetForm({ item, close, save }: { item: Asset | null; employeeId: number; close: () => void; save: (event: FormEvent<HTMLFormElement>) => void }) {
  const categories = ["Bilgisayar", "Telefon", "Telefon Hattı", "Araç", "Kart", "Anahtar", "Ekipman", "Diğer"];
  return <div className="modal-backdrop"><form className="employee-direct-modal" onSubmit={save}><header><div><span>PERSONEL ZİMMET KARTI</span><h2>{item ? "Zimmeti Düzenle" : "Yeni Zimmet Ekle"}</h2></div><button type="button" onClick={close}>×</button></header><div className="employee-direct-form">
    <label><span>Zimmet Türü</span><select name="category" defaultValue={item?.category || "Bilgisayar"}>{categories.map((entry) => <option key={entry}>{entry}</option>)}</select></label>
    <label><span>Zimmet Adı</span><input name="name" defaultValue={item?.name || ""} required /></label>
    <label><span>Zimmet Kodu</span><input name="assetCode" defaultValue={item?.assetCode || "Otomatik oluşturulacak"} readOnly /></label>
    <label><span>Marka</span><input name="brand" defaultValue={item?.brand || ""} /></label>
    <label><span>Model</span><input name="model" defaultValue={item?.model || ""} /></label>
    <label><span>Seri No / Plaka / Hat No</span><input name="serialNo" defaultValue={item?.serialNo || ""} /></label>
    <label><span>Mülkiyet</span><select name="ownershipType" defaultValue={item?.ownershipType || "Şirket"}><option>Şirket</option><option>Kiralık</option><option>Personel</option></select></label>
    <label><span>Teslim Tarihi</span><input name="assignedAt" type="date" defaultValue={item?.assignedAt || new Date().toISOString().slice(0, 10)} required /></label>
    <label><span>Planlanan İade Tarihi</span><input name="expectedReturnDate" type="date" defaultValue={item?.expectedReturnDate || ""} /></label>
    <label><span>Durum / Kondisyon</span><select name="condition" defaultValue={item?.condition || "İyi"}><option>Yeni</option><option>İyi</option><option>Orta</option><option>Hasarlı</option></select></label>
    <label><span>Aylık Maliyet</span><input name="monthlyCost" type="number" min="0" step="0.01" defaultValue={item?.monthlyCost || 0} /></label>
    <label className="check"><input name="includeInEmployerCost" type="checkbox" defaultChecked={item?.includeInEmployerCost || false} /><span>Maliyete dahil et</span></label>
    <label className="wide"><span>Açıklama</span><textarea name="notes" defaultValue={item?.notes || ""} /></label>
  </div><footer><button type="button" onClick={close}>İptal</button><button className="primary">Kaydet</button></footer></form></div>;
}
