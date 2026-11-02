# Haftalık fiyat güncelleme talimatı

Bu dosya, fiyatları her hafta güncelleyen yapay zeka görevinin talimatıdır.
Elle güncelleme yapan biri de aynı adımları izleyebilir.

## Ne takip ediliyor?

`data/cars.json` içindeki her araç için **sıfır aracın Türkiye'deki başlangıç
liste fiyatı**, yani o modelin satıştaki **en düşük donanım/motor seçeneğinin**
anahtar teslim fiyatı (TL, KDV/ÖTV dahil).

Kampanya, indirimli veya kredi fiyatlarını değil, **liste fiyatını** kullan.

## Adımlar

1. `main` dalından yeni bir dal aç: `fiyat-guncelleme-YYYY-AA-GG`.
2. Her araç için güncel fiyatı bul. Kaynak önceliği:
   1. Markanın resmi Türkiye sitesindeki fiyat listesi (sayfa veya PDF)
   2. Distribütörün resmi fiyat listesi
   3. Bunlar yoksa resmi listeyi açıkça alıntılayan güvenilir bir haber sitesi
3. Her araç için `prices` dizisinin **sonuna** şu kaydı ekle:
   ```json
   { "date": "YYYY-AA-GG", "price": 1234500, "source": "https://..." }
   ```
   - `price`: TL cinsinden tam sayı, nokta veya virgül kullanma.
   - `source`: Fiyatı **gerçekten gördüğün** sayfanın linki. Link yoksa kayıt ekleme.
   - `date`: Güncellemenin yapıldığı gün. Aynı tarihte ikinci kayıt ekleme.
4. Başlangıç donanımı değiştiyse `trim`, `fuel` ve `transmission` alanlarını güncelle.
5. Fiyatı bulamadığın veya emin olmadığın araçlar için **kayıt ekleme**. Tahmin
   etme, eski fiyatı tekrar yazma. Bu araçları PR açıklamasında listele.
6. Dosyanın en üstündeki `"updated"` alanını bugünün tarihine çek.
7. `node scripts/validate.mjs` çalıştır. Hata varsa düzelt.
8. Commit at, dalı push'la ve `main` dalına **pull request** aç. PR açıklamasında
   şunlar olsun:
   - Doğrulama betiğinin ürettiği rapor tablosu
   - %15'ten büyük değişimler için kısa açıklama (yeni model yılı, zam duyurusu vb.)
   - Fiyatı bulunamayan araçlar
9. PR'ı **birleştirme**. Birleştirme kararı repo sahibinindir.

## Yeni araç eklemek

`cars` dizisine şu formatta bir kayıt ekle (`prices` boş başlayabilir):

```json
{
  "id": "marka-model",
  "brand": "Marka",
  "model": "Model",
  "trim": "",
  "fuel": "",
  "transmission": "",
  "addedBy": "İsim",
  "prices": []
}
```

`id` sadece küçük harf, rakam ve `-` içerebilir ve benzersiz olmalıdır.
