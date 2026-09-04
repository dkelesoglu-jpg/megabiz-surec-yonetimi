"use client";
import { useEffect } from "react";
type Department = {
  id: number;
  name: string;
  code: string;
  parentDepartmentId?: number | null;
  managerName?: string;
  status: string;
};
type Position = { departmentId: number; title: string; status: string };
type Employee = { firstName: string; lastName: string; status: string };
export default function PersonnelOrgBridge() {
  useEffect(() => {
    let departments: Department[] = [],
      positions: Position[] = [],
      employees: Employee[] = [];
    const fill = (list: HTMLDataListElement, values: string[]) =>
      list.replaceChildren(
        ...values.map((value) => {
          const o = document.createElement("option");
          o.value = value;
          return o;
        }),
      );
    function refresh(select: HTMLSelectElement, preferred?: string) {
      const current =
        preferred || select.value || select.dataset.legacyDepartment || "";
      const active = departments.filter((d) => d.status === "Aktif");
      select.replaceChildren(
        new Option("Seçiniz", ""),
        ...active.map((d) => new Option(d.name, String(d.id))),
      );
      const match = active.find(
        (d) => String(d.id) === current || d.name === current,
      );
      select.value = match ? String(match.id) : "";
    }
    function quickAdd(select: HTMLSelectElement, refreshPositions: () => void) {
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      const modal = document.createElement("form");
      modal.className = "record-modal org-modal";
      modal.innerHTML = `<header><div><span>MERKEZİ DEPARTMAN YÖNETİMİ</span><h2>Yeni Departman</h2><p>Departman aktif şirkete kaydedilecektir.</p></div><button type="button" data-close>×</button></header><div class="form-grid"><label class="field"><span>Departman Adı *</span><input name="name" required></label><label class="field"><span>Şirket</span><input value="Aktif Şirket" disabled></label><label class="field"><span>Üst Departman</span><select name="parentDepartmentId"><option value="">Seçiniz</option></select></label><label class="field"><span>Departman Yöneticisi</span><input name="managerName" list="quick-manager-options"></label><label class="field"><span>Durum</span><select name="status"><option>Aktif</option><option>Pasif</option></select></label></div><div class="form-error" hidden></div><footer><button type="button" data-close>İptal</button><button class="primary">Kaydet</button></footer>`;
      const parent = modal.querySelector<HTMLSelectElement>(
        'select[name="parentDepartmentId"]',
      )!;
      departments
        .filter((d) => d.status === "Aktif")
        .forEach((d) => parent.add(new Option(d.name, String(d.id))));
      const managers = document.createElement("datalist");
      managers.id = "quick-manager-options";
      fill(
        managers,
        employees
          .filter((e) => e.status === "Aktif")
          .map((e) => `${e.firstName} ${e.lastName}`),
      );
      modal.append(managers);
      backdrop.append(modal);
      document.body.append(backdrop);
      modal
        .querySelectorAll<HTMLElement>("[data-close]")
        .forEach((b) => (b.onclick = () => backdrop.remove()));
      backdrop.onmousedown = (e) => {
        if (e.target === backdrop) backdrop.remove();
      };
      modal.onsubmit = async (e) => {
        e.preventDefault();
        const button =
            modal.querySelector<HTMLButtonElement>("button.primary")!,
          error = modal.querySelector<HTMLElement>(".form-error")!;
        button.disabled = true;
        const values = Object.fromEntries(new FormData(modal).entries());
        const response = await fetch("/api/organization", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...values,
            kind: "department",
            code: `DEP-${Date.now().toString().slice(-8)}`,
          }),
        });
        const result = await response.json();
        button.disabled = false;
        if (!response.ok) {
          error.hidden = false;
          error.textContent = result.error || "Departman kaydedilemedi";
          return;
        }
        departments = [...departments, result.record].sort((a, b) =>
          a.name.localeCompare(b.name, "tr"),
        );
        document
          .querySelectorAll<HTMLSelectElement>(
            'form.employee-modal select[name="departmentId"]',
          )
          .forEach((s) =>
            refresh(s, s === select ? String(result.record.id) : undefined),
          );
        select.value = String(result.record.id);
        refreshPositions();
        window.dispatchEvent(new Event("departments-updated"));
        backdrop.remove();
      };
    }
    function enhance() {
      document
        .querySelectorAll<HTMLFormElement>("form.employee-modal")
        .forEach((form) => {
          const dep = form.querySelector<HTMLSelectElement>(
              'select[name="department"],select[name="departmentId"]',
            ),
            pos = form.querySelector<HTMLInputElement | HTMLSelectElement>(
              'input[name="position"],select[name="position"]',
            ),
            manager = form.querySelector<HTMLInputElement>(
              'input[name="manager"]',
            );
          if (!dep || !pos || dep.dataset.orgReady) return;
          dep.dataset.orgReady = "1";
          dep.dataset.legacyDepartment = dep.value;
          dep.name = "departmentId";
          const posList = document.createElement("datalist");
          posList.id = `mega-position-${Math.random().toString(36).slice(2)}`;
          const managerList = document.createElement("datalist");
          managerList.id = `mega-manager-${Math.random().toString(36).slice(2)}`;
          form.append(posList, managerList);
          if (pos instanceof HTMLInputElement) {
            pos.setAttribute("list", posList.id);
            pos.placeholder = "Departmana bağlı pozisyon seçiniz";
          }
          if (manager) {
            manager.setAttribute("list", managerList.id);
            fill(
              managerList,
              employees
                .filter((e) => e.status === "Aktif")
                .map((e) => `${e.firstName} ${e.lastName}`),
            );
          }
          const legacyPosition = pos.value;
          const refreshPositions = () => {
            const titles = positions
              .filter(
                (p) =>
                  p.status === "Aktif" &&
                  (!dep.value || p.departmentId === Number(dep.value)),
              )
              .map((p) => p.title);
            if (pos instanceof HTMLSelectElement) {
              const wanted = pos.value || legacyPosition;
              pos.replaceChildren(
                new Option("Seçiniz", ""),
                ...titles.map((title) => new Option(title, title)),
              );
              pos.value = titles.includes(wanted) ? wanted : "";
            } else fill(posList, titles);
          };
          dep.addEventListener("change", () => {
            pos.value = "";
            refreshPositions();
          });
          const label = dep.closest("label");
          if (label) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "field-inline-action";
            button.textContent = "+ Yeni";
            button.title = "Yeni departman oluştur";
            button.setAttribute("aria-label", "Yeni departman oluştur");
            button.onclick = () => quickAdd(dep, refreshPositions);
            label.classList.add("has-inline-action");
            label.append(button);
          }
          const positionLabel = pos.closest("label");
          if (positionLabel) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "field-inline-action";
            button.textContent = "+ Yeni";
            button.title = "Yeni pozisyon oluştur";
            button.setAttribute("aria-label", "Yeni pozisyon oluştur");
            button.onclick = async () => {
              if (!dep.value) return alert("Önce departman seçmelisiniz.");
              const title = prompt("Yeni pozisyon / unvan adı");
              if (!title?.trim()) return;
              const response = await fetch("/api/organization", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  kind: "position",
                  title: title.trim(),
                  departmentId: Number(dep.value),
                  code: `POS-${Date.now().toString().slice(-8)}`,
                  status: "Aktif",
                }),
              });
              const result = await response.json();
              if (!response.ok)
                return alert(result.error || "Pozisyon kaydedilemedi");
              positions = [...positions, result.record];
              refreshPositions();
              pos.value = result.record.title;
            };
            positionLabel.classList.add("has-inline-action");
            positionLabel.append(button);
          }
          refresh(dep, dep.dataset.legacyDepartment);
          refreshPositions();
        });
    }
    fetch("/api/organization")
      .then((r) => r.json())
      .then((j) => {
        departments = j.departments || [];
        positions = j.positions || [];
        employees = j.employees || [];
        enhance();
      })
      .catch(() => {});
    const observer = new MutationObserver(enhance);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
