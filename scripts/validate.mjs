// data/cars.json dosyasını doğrular ve fiyat değişim raporu üretir.
// Kullanım: node scripts/validate.mjs [dosya]
// Hata varsa 1 ile çıkar. Büyük fiyat değişimleri uyarı olarak raporlanır.
import { readFileSync, appendFileSync } from "node:fs";

const FILE = process.argv[2] ?? "data/cars.json";
const BIG_CHANGE = 0.15; // %15 üzeri değişimler işaretlenir

const errors = [];
const warnings = [];
const rows = [];

let data;
try {
  data = JSON.parse(readFileSync(FILE, "utf8"));
} catch (e) {
  console.error(`❌ ${FILE} okunamadı: ${e.message}`);
  process.exit(1);
}

const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
const isUrl = (s) => typeof s === "string" && /^https?:\/\/\S+$/.test(s);
const fmt = (n) => new Intl.NumberFormat("tr-TR").format(n) + " TL";

if (data.updated !== null && !isDate(data.updated)) errors.push(`"updated" YYYY-AA-GG formatında olmalı`);
if (!Array.isArray(data.cars)) {
  errors.push(`"cars" bir dizi olmalı`);
  data.cars = [];
}

const ids = new Set();
for (const [i, car] of data.cars.entries()) {
  const where = car?.id ?? `cars[${i}]`;
  for (const f of ["id", "brand", "model"]) {
    if (typeof car[f] !== "string" || !car[f].trim()) errors.push(`${where}: "${f}" boş olamaz`);
  }
  if (car.id && !/^[a-z0-9-]+$/.test(car.id)) errors.push(`${where}: id sadece küçük harf, rakam ve "-" içermeli`);
  if (ids.has(car.id)) errors.push(`${where}: id tekrar ediyor`);
  ids.add(car.id);

  if (!Array.isArray(car.prices)) {
    errors.push(`${where}: "prices" bir dizi olmalı`);
    continue;
  }
  let prevDate = "";
  for (const [j, p] of car.prices.entries()) {
    const at = `${where} prices[${j}]`;
    if (!isDate(p.date)) errors.push(`${at}: tarih YYYY-AA-GG olmalı`);
    else if (p.date <= prevDate) errors.push(`${at}: tarihler artan sırada ve benzersiz olmalı`);
    else prevDate = p.date;
    if (!Number.isInteger(p.price) || p.price <= 0) errors.push(`${at}: fiyat pozitif tam sayı (TL) olmalı`);
    if (!isUrl(p.source)) errors.push(`${at}: kaynak linki (source) zorunlu`);
    if (p.campaign !== undefined) {
      if (!Number.isInteger(p.campaign) || p.campaign <= 0) errors.push(`${at}: kampanyalı fiyat pozitif tam sayı olmalı`);
      else if (p.campaign >= p.price) warnings.push(`${where} (${p.date}): kampanyalı fiyat liste fiyatından düşük değil`);
    }
  }

  const n = car.prices.length;
  if (n === 0) continue;
  const last = car.prices[n - 1];
  const prev = n > 1 ? car.prices[n - 2] : null;
  const change = prev ? (last.price - prev.price) / prev.price : null;
  const name = [car.brand, car.model, car.trim, car.engine].filter(Boolean).join(" ");
  if (change !== null && Math.abs(change) > BIG_CHANGE) {
    warnings.push(`${name}: ${fmt(prev.price)} → ${fmt(last.price)} (%${(change * 100).toFixed(1)})`);
  }
  rows.push(
    `| ${name} | ${prev ? fmt(prev.price) : "—"} | ${fmt(last.price)} | ${last.campaign ? fmt(last.campaign) : "—"} | ` +
      `${change === null ? "yeni" : (change >= 0 ? "+" : "") + (change * 100).toFixed(1) + "%"}` +
      `${change !== null && Math.abs(change) > BIG_CHANGE ? " ⚠️" : ""} | [kaynak](${last.source}) |`
  );
}

let report = `## Fiyat raporu (${data.updated ?? "henüz güncellenmedi"})\n\n`;
if (rows.length) {
  report += `| Araç | Önceki liste | Son liste | Kampanyalı | Değişim | Kaynak |\n|---|---|---|---|---|---|\n${rows.join("\n")}\n\n`;
} else {
  report += `Henüz fiyat verisi yok.\n\n`;
}
if (warnings.length) report += `### ⚠️ Kontrol edilmesi gerekenler (%${BIG_CHANGE * 100}'ten büyük değişimler vb.)\n${warnings.map((w) => `- ${w}`).join("\n")}\n\n`;
if (errors.length) report += `### ❌ Hatalar\n${errors.map((e) => `- ${e}`).join("\n")}\n`;
else report += `✅ Veri dosyası geçerli (${data.cars.length} araç).\n`;

console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
process.exit(errors.length ? 1 : 0);
