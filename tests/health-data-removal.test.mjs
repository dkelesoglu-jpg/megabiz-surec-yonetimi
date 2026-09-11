import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  containsPersonalHealthFields,
  isHealthDocument,
  withoutHealthDocuments,
} from "../db/health-data.ts";

const source = async (path) => readFile(new URL(path, import.meta.url), "utf8");

test("kan grubu personel formu ve aktif şema modelinden kaldırılmıştır", async () => {
  const [page, schema] = await Promise.all([
    source("../app/page.tsx"),
    source("../db/schema.ts"),
  ]);
  assert.doesNotMatch(page, /bloodType|Kan Grubu/);
  assert.doesNotMatch(schema, /bloodType|blood_type/);
});

test("personel API kişisel sağlık alanlarını kabul etmez", async () => {
  for (const payload of [
    { bloodType: "value" },
    { diagnosis: "value" },
    { medical: "value" },
    { treatment: "value" },
    { sağlık: "value" },
  ]) assert.equal(containsPersonalHealthFields(payload), true);
  assert.equal(containsPersonalHealthFields({ firstName: "Test", department: "Operasyon" }), false);
  const route = await source("../app/api/employees/route.ts");
  assert.equal((route.match(/containsPersonalHealthFields\(p\)/g) ?? []).length, 2);
  const columns = route.match(/const EMPLOYEE_MUTATION_COLUMNS = \[([\s\S]*?)\]\.join/)?.[1] ?? "";
  assert.doesNotMatch(columns, /blood_type|bloodType|health|medical|diagnosis|treatment/i);
  assert.match(route, /from\("employees"\)\s*\.insert\(insertValues\)\s*\.select\(EMPLOYEE_MUTATION_COLUMNS\)/);
  assert.match(route, /from\("employees"\)\s*\.select\(EMPLOYEE_MUTATION_COLUMNS\)/);
  assert.match(route, /from\("employees"\)\s*\.update\(updateValues\)[\s\S]*?\.select\(EMPLOYEE_MUTATION_COLUMNS\)/);
});

test("sağlık ve istirahat belgeleri tanınır ve listeden çıkarılır", () => {
  const rows = [
    { id: 1, category: "Sağlık Raporu", name: "belge.pdf" },
    { id: 2, category: "Rapor / İstirahat Belgesi", name: "belge.pdf" },
    { id: 3, category: "Diğer", name: "medical-report.pdf" },
    { id: 4, category: "Sertifika", name: "egitim.pdf" },
  ];
  assert.equal(isHealthDocument(rows[0]), true);
  assert.equal(isHealthDocument(rows[1]), true);
  assert.equal(isHealthDocument(rows[2]), true);
  assert.deepEqual(withoutHealthDocuments(rows).map((row) => row.id), [4]);
});

test("belge API sağlık yüklemesini reddeder, listeleme ve indirmeyi filtreler", async () => {
  const route = await source("../app/api/documents/route.ts");
  assert.match(route, /isHealthDocument\(\{ category, name: file\.name \}\)/);
  assert.match(route, /withoutHealthDocuments\(data \?\? \[\]\)/);
  assert.match(route, /!row \|\| isHealthDocument\(row\)/);
  assert.doesNotMatch(route, /\.select\(\s*["']\*["']\s*\)|\.select\(\s*\)/);
});

test("sağlık belge kategorileri ve tanıtım metni UI'dan kaldırılmıştır", async () => {
  const [documents, dashboard] = await Promise.all([
    source("../app/document-center.tsx"),
    source("../app/dashboard.tsx"),
  ]);
  assert.doesNotMatch(documents, /Sağlık Raporu|Rapor \/ İstirahat Belgesi/);
  assert.doesNotMatch(dashboard, /sağlık raporu/i);
});

test("özel sağlık sigortası finansal yan hak olarak korunur", async () => {
  const [route, manager] = await Promise.all([
    source("../app/api/benefits/route.ts"),
    source("../app/benefits-manager.tsx"),
  ]);
  assert.match(route, /Özel Sağlık Sigortası/);
  assert.match(manager, /Özel Sağlık Sigortası/);
});

test("Hastalık İzni yalnızca izin türü olarak korunur", async () => {
  const leave = await source("../app/leave-manager.tsx");
  assert.match(leave, /Hastalık İzni/);
  assert.doesNotMatch(leave, /teşhis|tedavi|sağlık raporu|medical|diagnosis/i);
});
