# Haftalık fiyat güncelleme talimatı

Bu dosya, fiyatları her hafta güncelleyen yapay zeka görevinin talimatıdır.
Elle güncelleme yapan biri de aynı adımları izleyebilir.

## Ne takip ediliyor?

`data/cars.json` içindeki her kayıt, bir modelin **tek bir donanım + motor +
şanzıman** seçeneğidir (ör. Egea Sedan · Urban · 1.6 M.Jet 130 HP DCT · Otomatik).
Her kayıt için Türkiye'deki **tavsiye edilen anahtar teslim liste fiyatı**
(TL, KDV/ÖTV dahil) takip edilir.

- `price`: liste fiyatı (zorunlu).
- `campaign`: o ay geçerli nakit kampanyalı fiyat (varsa, isteğe bağlı). Kredi
  kampanyası veya bayi indirimi yazma.

Takip edilen modeller: Fiat Egea Sedan, Fiat Egea Cross, Toyota Corolla Hybrid
(sedan), Toyota Corolla Cross Hybrid, Skoda Fabia, Skoda Scala.

## Adımlar

1. `main` dalından yeni bir dal aç: `fiyat-guncelleme-YYYY-AA-GG`.
2. Her kayıt için güncel fiyatı bul. Kaynak önceliği:
   1. Markanın resmi Türkiye sitesindeki fiyat listesi (sayfa veya PDF)
   2. Distribütörün resmi fiyat listesi
   3. Bunlar erişilemezse, o ayın resmi listesini tablo halinde yayımlayan
      güvenilir bir haber sitesi (ör. webtekno.com, cnbce.com). Mümkünse iki
      kaynağı karşılaştır; tutmuyorsa PR'da belirt.
3. Fiyat **önceki kayıttan farklıysa** ya da yeni ayın listesi yayımlandıysa,
   `prices` dizisinin **sonuna** şu kaydı ekle:
   ```json
   { "date": "YYYY-AA-GG", "price": 1234500, "campaign": 1199500, "source": "https://..." }
   ```
   - `date`: kaynağın yayın tarihi (listenin geçerli olduğu tarih).
   - `price` / `campaign`: TL cinsinden tam sayı, nokta veya virgül kullanma.
   - `source`: Fiyatı **gerçekten gördüğün** sayfanın linki. Link yoksa kayıt ekleme.
   - Aynı listeyi ikinci kez ekleme (aynı fiyat + aynı kaynak = yeni kayıt yok).
4. Listeye **yeni donanım** eklendiyse yeni bir kayıt oluştur. Satıştan
   kalkan donanımı silme; yeni fiyat eklemeyi bırak ve PR'da belirt.
5. Fiyatı bulamadığın veya emin olmadığın kayıtlar için **fiyat ekleme**. Tahmin
   etme, eski fiyatı tekrar yazma. Bunları PR açıklamasında listele.
6. Dosyanın en üstündeki `"updated"` alanını bugünün tarihine çek.
7. `node scripts/validate.mjs` çalıştır. Hata varsa düzelt.
8. Commit at, dalı push'la ve `main` dalına **pull request** aç. PR açıklamasında
   şunlar olsun:
   - Doğrulama betiğinin ürettiği rapor tablosu
   - %15'ten büyük değişimler için kısa açıklama (yeni model yılı, zam duyurusu vb.)
   - Fiyatı bulunamayan araçlar
9. Birleştirme kuralı:
   - PR'daki GitHub Actions kontrolü **geçtiyse** ve doğrulama raporunda
     **⚠️ uyarı yoksa** (%15'ten büyük değişim, kampanya ≥ liste vb.), PR'ı
     squash ile birleştir. Site birkaç dakika içinde güncellenir.
   - Uyarı varsa ya da kaynaklar birbiriyle çelişiyorsa PR'ı **açık bırak**;
   karar repo sahibinindir.

Eklenecek yeni fiyat yoksa (yeni ay listesi yayımlanmamış ve fiyatlar aynı)
dal, commit veya PR açma; sadece "değişiklik yok" diye raporla.

## Yeni araç eklemek

`cars` dizisine şu formatta bir kayıt ekle (`prices` boş başlayabilir):

```json
{
  "id": "skoda-scala-elite-1-0-tsi-115-ps-dsg-otomatik",
  "brand": "Skoda",
  "model": "Scala",
  "trim": "Elite",
  "engine": "1.0 TSI 115 PS DSG",
  "fuel": "Benzin",
  "transmission": "Otomatik",
  "addedBy": "İsim",
  "prices": []
}
```

`id` sadece küçük harf, rakam ve `-` içerebilir ve benzersiz olmalıdır.
