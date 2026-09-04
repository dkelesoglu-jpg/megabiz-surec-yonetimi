"use client";
import { useState } from "react";
type Employee = {
  id: number;
  employeeNo: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
};
type Summary = {
  companyName: string;
  count: number;
  employees: Employee[];
  confirmationPhrase: string;
  signature: string;
};
export default function BulkPersonnelDelete({
  records,
  close,
  done,
}: {
  records: Employee[];
  close: () => void;
  done: (message: string) => void;
}) {
  const [selected, setSelected] = useState<number[]>([]),
    [summary, setSummary] = useState<Summary | null>(null),
    [phrase, setPhrase] = useState(""),
    [checked, setChecked] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  function toggle(id: number) {
    setSummary(null);
    setSelected(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  }
  async function preview() {
    setBusy(true);
    setError("");
    const r = await fetch("/api/employees/bulk-delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ employeeIds: selected }),
      }),
      j = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(j.error || "Silme özeti hazırlanamadı");
      return;
    }
    setSummary(j);
  }
  async function remove() {
    if (!summary) return;
    setBusy(true);
    setError("");
    const r = await fetch("/api/employees/bulk-delete", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          employeeIds: selected,
          signature: summary.signature,
          confirmationPhrase: phrase,
        }),
      }),
      j = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(j.error || "Personeller silinemedi");
      return;
    }
    window.dispatchEvent(new Event("employees-updated"));
    done(`${j.deleted} personel ve bağlı kayıtları silindi`);
  }
  return (
    <div className="modal-backdrop">
      <section className="bulk-delete-modal">
        <header>
          <div>
            <span>PERSONEL / GÜVENLİ TOPLU İŞLEM</span>
            <h2>Toplu Personel Sil</h2>
            <p>Yalnızca seçili şirketteki işaretlediğiniz siciller silinir.</p>
          </div>
          <button onClick={close}>×</button>
        </header>
        {!summary ? (
          <>
            <div className="bulk-delete-toolbar">
              <label>
                <input
                  type="checkbox"
                  checked={
                    records.length > 0 && selected.length === records.length
                  }
                  onChange={(e) =>
                    setSelected(
                      e.target.checked ? records.map((x) => x.id) : [],
                    )
                  }
                />{" "}
                Tümünü seç
              </label>
              <strong>{selected.length} personel seçildi</strong>
            </div>
            <div className="bulk-delete-list">
              {records.length === 0 ? (
                <p>Bu şirkette silinebilecek personel kaydı bulunmuyor.</p>
              ) : (
                records.map((e) => (
                  <label key={e.id}>
                    <input
                      type="checkbox"
                      checked={selected.includes(e.id)}
                      onChange={() => toggle(e.id)}
                    />
                    <span>
                      <b>
                        {e.firstName} {e.lastName}
                      </b>
                      <small>
                        {e.employeeNo} · {e.department} · {e.position}
                      </small>
                    </span>
                  </label>
                ))
              )}
            </div>
            <footer>
              <button onClick={close}>İptal</button>
              <button
                className="danger"
                disabled={!selected.length || busy}
                onClick={preview}
              >
                {busy ? "Hazırlanıyor…" : "Silme Özetini Gör"}
              </button>
            </footer>
          </>
        ) : (
          <>
            <div className="bulk-delete-warning">
              <strong>
                {summary.count} personel {summary.companyName} şirketinden
                silinecek.
              </strong>
              <p>
                Personel sicilleri ve personele bağlı maliyet, performans, yan
                hak, avans ve belge bağlantıları kaldırılır. Departman ve
                pozisyon tanımları korunur.
              </p>
            </div>
            <div className="bulk-delete-summary">
              {summary.employees.map((e) => (
                <span key={e.id}>
                  {e.employeeNo} · {e.firstName} {e.lastName} · {e.department}
                </span>
              ))}
            </div>
            <label className="bulk-delete-confirm">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />{" "}
              Şirketi, personelleri ve kayıt adedini kontrol ettim.
            </label>
            <label className="bulk-delete-phrase">
              Onaylamak için aşağıdaki ifadeyi yazın:
              <b>{summary.confirmationPhrase}</b>
              <input
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
              />
            </label>
            <footer>
              <button
                onClick={() => {
                  setSummary(null);
                  setPhrase("");
                  setChecked(false);
                }}
              >
                Geri
              </button>
              <button
                className="danger"
                disabled={
                  busy || !checked || phrase !== summary.confirmationPhrase
                }
                onClick={remove}
              >
                {busy ? "Siliniyor…" : `${summary.count} Personeli Kalıcı Sil`}
              </button>
            </footer>
          </>
        )}
        {error && <div className="form-error">{error}</div>}
      </section>
    </div>
  );
}
