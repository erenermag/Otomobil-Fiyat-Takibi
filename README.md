# Sıfır Araç Fiyat Takibi

Türkiye'de sıfır araçların başlangıç liste fiyatlarını haftalık takip eden,
GitHub Pages üzerinde yayınlanan statik bir site.

## Yapı

| Dosya | Görevi |
|---|---|
| `index.html`, `assets/` | Site: fiyat kartları, değişim yüzdesi, fiyat geçmişi grafiği, marka filtresi |
| `data/cars.json` | Tüm veriler. Her fiyat kaydında tarih, TL tutarı ve kaynak linki bulunur |
| `scripts/validate.mjs` | Veri dosyasını doğrular, %15'ten büyük değişimleri işaretler |
| `GUNCELLEME.md` | Haftalık güncelleme talimatı (yapay zeka görevi veya elle güncelleme için) |
| `.github/workflows/pages.yml` | Her PR'da doğrulama yapar, `main` dalına her push'ta siteyi yayınlar |

## Güncelleme akışı

1. Haftalık görev fiyatları araştırır, `data/cars.json` dosyasını günceller ve bir PR açar.
2. GitHub Actions veriyi doğrular. Rapor tablosu, PR'daki kontrolün **Summary** sekmesinde görünür.
3. PR'ı kontrol edip birleştirirsin. Site birkaç dakika içinde güncellenir.

## GitHub Pages'i açma (bir kerelik)

Repo **Settings → Pages → Build and deployment → Source** ayarını **GitHub Actions** yap.
Site şu adreste yayına girer: `https://erenermag.github.io/Otomobil-Fiyat-Takibi/`

## Yerelde çalıştırma

```bash
python3 -m http.server 8000   # sonra http://localhost:8000
node scripts/validate.mjs     # veri doğrulama
```
