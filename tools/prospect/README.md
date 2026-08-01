# Prospect Motoru

Niş × şehir tarayıp işletmeleri bulur, sitelerini denetler, **fırsat skoruna** göre sıralar ve her biri için gönderilebilir bir analiz raporu üretir.

Mantık şu: makine kimin peşine düşeceğini söyler, satışı demo kapatır. Skor sıralaması senin zamanını nereye harcayacağına karar verir — asıl kıt kaynak o.

---

## Kurulum

```bash
cp .env.example .env
```

Sonra `.env` içindeki `GOOGLE_API_KEY` satırını doldur:

1. [console.cloud.google.com](https://console.cloud.google.com) → yeni proje
2. **APIs & Services → Enable APIs** → şu ikisini aktif et:
   - `Places API (New)`
   - `PageSpeed Insights API`
3. **Credentials → Create credentials → API key**
4. Anahtarı `.env` dosyasına yaz

### Maliyet

Google, eski **aylık 200$ kredi** modelini 28 Şubat 2025'te kaldırdı. Yerine SKU başına aylık ücretsiz istek kotası geldi.

Motorun istediği alanlar (`websiteUri`, `nationalPhoneNumber`, `rating`, `userRatingCount`, `reviews`) **Text Search Enterprise + Atmosphere** katmanına giriyor:

| | |
|---|---|
| Aylık ücretsiz | **1.000 istek** |
| Sonrası | 1.000 istek başına ~40$ (istek başı ~0,040$) |
| Bir istek | 20 işletme döndürür → işletme başına ~0,00175$ |
| Bir şehir taraması | 10 terim × 5 ilçe × ~2 sayfa ≈ **100 istek** |
| Pratikte | **Ayda ~10 şehir taraması ücretsiz** |

Bu alanlar pazarlık konusu değil: site denetim için, telefon iletişim için, puan+yorum canlılık skoru için, **yorum metni işletmenin gerçekten ne yaptığını anlamak için**. Buna karşılık Text Search tek istekte 20 işletme döndürdüğü için Place Details ile tek tek çekmekten **20 kat ucuz** — mevcut uygulama zaten en verimli yol.

Fotoğraflar ayrı: tarama sadece **referans** topluyor (bedava), görüntüler yalnızca demo yaptığın işletmeler için indiriliyor (Place Photo SKU, ~$7/1000). 5 fotoğraf ≈ 0,035$.

Her tarama sonunda kaç istek harcadığını ve kotanın neresinde olduğunu ekrana yazıyor.

**PageSpeed Insights tamamen bedava** — faturalandırma bile gerektirmiyor, günlük 25.000 istek.

### Faturayı sıfırla sabitlemek (önerilir)

Google Cloud'da **kota tavanı** koy: APIs & Services → Places API (New) → Quotas & System Limits → günlük istek limitini örneğin 200'e çek. Tavan aşıldığında istekler reddedilir; ücret oluşmaz. Bu, unutulmuş bir döngünün fatura çıkarmasını fiziksel olarak engelleyen tek yöntem.

Ayrıca Billing → Budgets & alerts üzerinden 5$'lık bir uyarı bütçesi kur.

`.env` dosyasındaki `REFERANS_METNI` alanını **Search Console'dan çıkardığın gerçek sayıyla** doldur. Raporun en çok iş yapan satırı orası.

Bu aracın kendi bağımlılığı yok. Ama depo kökündeki `npm install` yine de
gerekiyor (workspace bağlantıları için) ve **Node 22.18+** şart — testler
`.ts` dosyalarını bayraksız çalıştırıyor. Ayrıntı: [SETUP.md](../../SETUP.md).

## Kullanım

```bash
node src/index.mjs --nis=insaat --sehir=Düzce,Bolu
```

```bash
node src/index.mjs --nis=ihracatci --sehir=Kocaeli,Bursa --limit=60
```

İlk deneme için hızlı tur (PageSpeed atlanır, tarama ~1 dakika):

```bash
node src/index.mjs --nis=insaat --sehir=Düzce --hiz-yok --ilce-yok
```

| Parametre | Ne yapar |
|---|---|
| `--nis=` | `insaat`, `ihracatci`, `klinik`, `otomotiv`, `turizm` |
| `--sehir=` | Virgülle ayır. Yeni şehir/ilçe eklemek için `src/config.mjs` |
| `--limit=N` | Kaç işletme için rapor + hız ölçümü (varsayılan 40) |
| `--hiz-yok` | PageSpeed'i atla — çok daha hızlı biter |
| `--ilce-yok` | İlçe bazlı tarama yapma — daha az API çağrısı, daha az kapsam |

## Çıktılar

| Dosya | Ne işe yarar |
|---|---|
| `out/panel.html` | **Buradan başla.** Sıralı prospect listesi. **İÇ KULLANIM — paylaşma, deploy etme.** |
| `out/prospects.csv` | Excel'de açılır tam liste (Türkçe yerel için `;` ayraçlı + BOM) |
| `out/raporlar/*.html` | Prospect'e gönderilecek raporlar. Tek dosya, bağımsız, deploy edilebilir |

**Dikkat:** `panel.html` senin prospect listen. `raporlar/` klasörünü deploy ederken paneli yanına koyma.

## Fırsat skoru nasıl hesaplanıyor

```
canlılık  = yorum sayısı (log) + puan ortalaması + telefon kaydı        → 0-100
zayıflık  = tespit edilen eksiklerin ağırlıklı toplamı                   → 0-100
fırsat    = (0.4 + 0.6 × canlılık/100) × zayıflık
```

Canlılık bir **kapı**, zayıflık **çarpan**. Sebebi: ölü bir işletmenin kötü sitesi değersizdir — parası yoktur, ilgilenmez. Canlı işletme + kötü site = altın.

Ağırlıkları `src/config.mjs` içindeki `BULGULAR` tablosundan oynatabilirsin. Kendi tecrübenle kalibre et; hangi eksiğin müşteriyi ikna ettiğini birkaç görüşmeden sonra göreceksin.

## Raporları yayınlama

```bash
cd out/raporlar
vercel --prod
```

`analiz.senin-siten.com` gibi bir alt alan adına bağla. Sonuç:

```
analiz.senin-siten.com/ornek-firma.html
```

Raporlarda `noindex` var — Google'a düşmezler, sadece linki olan görür.

---

## Mesaj şablonları

Kısa tut. Türkiye'de WhatsApp'ta uzun ilk mesaj okunmadan siliniyor. Amaç satış değil, **linke tıklatmak.**

### 1) Sitesi hiç olmayan işletme

> Merhaba [İsim] Bey, ben Bilal. Web sitesi ve Google görünürlüğü işi yapıyorum.
>
> Düzce'de Arabacı Taş'ın sitesini ben yaptım — "düzce kilit taşı" aramasında 1. sırada, ayda [X] kişi oradan buluyor.
>
> [Firma] için de kısa bir durum analizi çıkardım, 1 dakikada okunuyor:
> analiz.senin-siten.com/[slug].html
>
> Bir şey satmaya çalışmıyorum, işine yarar diye düşündüm. İlgini çekerse yazarsın.

### 2) Sitesi var ama zayıf

> Merhaba [İsim] Bey, ben Bilal — web/SEO işi yapıyorum.
>
> [Firma]'nın sitesine baktım, [en kritik bulgu, tek cümle: "telefonda düzgün açılmıyor" / "Google'da hizmet sayfalarınız hiç görünmüyor"]. Sizin sektörde aramaların çoğu telefondan geliyor, o yüzden gözüme çarptı.
>
> Detayını 4 maddede çıkardım: analiz.senin-siten.com/[slug].html
>
> Kendiniz de yaptırabilirsiniz, sorun değil. Sadece bilmeniz gerekir diye düşündüm.

### 3) Demo versiyonu — en yüksek dönüşüm

Panelin ilk 20'sine bunu kullan. Anasayfalarının gerçek bir taslağını yap, Vercel'e at.

> Merhaba [İsim] Bey. Ben Bilal, web sitesi yapıyorum.
>
> [Firma] için bir örnek anasayfa hazırladım — fotoğraflarınızı ve Google yorumlarınızı kullandım:
> [firma]-ornek.vercel.app
>
> Kimseye göndermedim, sadece siz görün diye. Beğenmezseniz zaten bir şey kaybetmiyorsunuz.

Bu mesaj silinmiyor. Kimse kendi işletmesinin sitesini görmeden geçmiyor.

### 4) İhracatçı / imalatçı (e-posta, daha resmî)

> Konu: [Firma] — yurt dışı aramalarda görünürlük
>
> Merhaba,
>
> [Firma]'nın sitesine baktım. [Ürün] üretip ihracat yapıyorsunuz ama site yalnızca Türkçe. Alman veya Körfez'deki bir alıcı sizi kendi dilinde aradığında hiçbir sonuçta görünmüyorsunuz.
>
> Son olarak [Referans firma] için 5 dilli bir site kurdum — Türkiye, BAE ve Suudi Arabistan pazarlarına satış yapıyorlar: [referans-alan-adi]
>
> [Firma] için hazırladığım kısa analiz: analiz.senin-siten.com/[slug].html
>
> 15 dakikalık bir görüşmeye açıksanız, hangi pazarda ne kadar aranıyorsunuz — somut sayılarla gösterebilirim.

---

## Operasyon ritmi

| Ne | Ne sıklıkta |
|---|---|
| Yeni tarama | Haftada 1, tek niş × 2-3 şehir |
| Mesaj gönderimi | **Günde 20-30, fazlası değil** |
| Elle demo | Haftada 5 (ilk 20'den) |
| Takip mesajı | 4 gün sonra 1 kez, sonra bırak |

Dönüşüm beklentisi, gerçekçi rakamlar: 100 mesaj → ~15 okuma/yanıt → ~5 görüşme → 1-2 iş. Demo gönderdiklerinde bu oran 2-3 katına çıkıyor.

Yani **haftada 100 mesaj + 5 demo = ayda 4-8 iş.** Sorunun cevabı burada, SEO'da değil.

## Uyarılar

**Numaranı yakma.** WhatsApp toplu mesajı tespit edip numarayı banlıyor. Kurallar:
- İşin için ayrı bir numara kullan, kişiselini kullanma
- Günde 30'u geçme, mesajlar arasında bekle
- Her mesajı kişiselleştir — aynı metni kopyala-yapıştır yapma
- Kayıtlı olmayan numaraya çok fazla mesaj = risk. Mümkünse önce arayıp sonra yaz

**KVKK.** Sadece işletmelerin kendi yayınladığı halka açık ticari iletişim bilgilerini kullanıyorsun ve B2B ticari tanıtım yapıyorsun — bu savunulabilir bir zemin. Yine de: kim olduğunu açıkça yaz, ilk mesajda ne istediğini söyle, "ilgilenmiyorum" diyene bir daha yazma, listeyi kimseyle paylaşma. Toplu/otomatik gönderim yapma; bu araç zaten liste üretiyor, gönderimi elle yap.

**Rapor tonu.** `config.mjs` içindeki bulgu açıklamalarını değiştirirsen aşağılayıcı olmamasına dikkat et. "Siteniz kötü" satmıyor; "şu 4 fırsat duruyor" satıyor. Sitesi zaten iyi olanı listeden çıkar — o kişiye mesaj atmak itibar kaybı.

---

## Vercel deploy

Monorepo olduğu için her uygulamanın kendi yapılandırma dosyası var
(`vercel.demo.json`). Vercel projeleri tek bir `.vercel/project.json`
paylaştığından, **deploy öncesi her seferinde o uygulamaya bağlanmak
gerekiyor**:

```bash
vercel link --yes --project <proje-adin> --scope <hesabin> --local-config vercel.demo.json && vercel deploy --prod --yes --local-config vercel.demo.json --scope <hesabin>
```

İki şey pahalıya öğrenildi:

- **`link` atlanırsa** son bağlanılan proje kazanır. Birden fazla Vercel
  projesi olan bir depoda bu, demoları yanlış projeye yollamak demek —
  ve canlı adres 404'e düşüyor.
- **`--prod` şart.** Onsuz önizleme yayını oluyor; asıl adres eski sürümde
  kalıyor ve müşteriye gönderdiğin link güncellenmemiş görünüyor.

Demolar her zaman `noindex` — hem `robots.ts` hem sayfa bazında.
