# vitrinci

Klasör adı yanıltıcı: bu klasör **`bilalfarukozdemir/vitrinci`** deposudur.
Sitesi olmayan yerel işletmeyi bul → denetle → puanla → gerçek demo site üret →
gönder → cevabı takip et. Açık kaynak (MIT).

Ne olduğu `README.md`'de, **neden öyle olduğu** `ARCHITECTURE.md`'de. Kod yazmadan
önce ikisini de oku; burada tekrarlamıyorum.

> `../vitrinci-inceleme/` bu projenin eski bir inceleme kopyası. Gerçek iş burada
> yapılır, orada değil.

## İç içe iki depo — en kritik bilgi

`apps/pazarlama/` **ayrı bir git deposudur** (`bilalfarukozdemir/vitrincim-site`).
Bu deponun `.gitignore`'unda olduğu için içeride durabiliyor ama buraya ait değil.

- **Buradan `git add apps/pazarlama` yapma.** Kendi deposu var, kendi commit'i var.
- Orada çalışacaksan `apps/pazarlama/CLAUDE.md`'yi oku.
- `tools/ekran/` ve `vercel.pazarlama.json` da o siteye ait, aynı şekilde dışarıda.

## Bu klasörde gerçek kişisel veri var

`apps/demo/src/veriler/` (işletme adı, telefon, adres, Google yorumları),
`tools/prospect/out/` (ham tarama), `tools/panel/veri/` (kiminle ne konuşuldu,
anlaşılan fiyat), `apps/demo/public/foto/` (telifi bize ait olmayan fotoğraf),
`veri/` (Search Console export).

Hepsi `.gitignore`'da. **`.gitignore`'u okumadan ona satır ekleme veya çıkarma** —
her satırın gerekçesi dosyanın içinde yazılı, "açık kaynak sınırı" başlığından
aşağısı özellikle önemli.

Bu veriyi ekrana dökme, örnek diye başka dosyaya kopyalama, dışarıya gönderme.

## Commit öncesi kanca

`.githooks/pre-commit` her commit'te iki kontrol koşuyor:

| Kontrol | Ne yakalar | Süre |
|---|---|---|
| `npm run sizinti` | Repoya sızmış gerçek isim/telefon/alan adı | ~6 sn |
| `npm run bicim` | Karşılığı olmayan CSS sınıfı ve token adı | ~1 sn |

Kanca kurulu değilse: `npm run kanca-kur`

**`--no-verify` ile atlama.** Biçim denetimi özellikle önemli çünkü yakaladığı hata
sessiz: tanımsız bir CSS sınıfı derlemeyi de tip denetimini de geçiyor, sayfa
açılıyor, sadece stil uygulanmıyor. Üç kez üst üste oldu, ikisi ancak gözle yakalandı.

Push öncesi ayrıca: `npm run yayina-hazir` (temiz klon + build dahil, ~2,5 dk).

## Kurgu sözleşmesi

Yeni fikstür yazarken: alan adı `.example` ile bitecek, telefon `… 555 55 55` ile.
Kalıba uymayan her değer sızıntı sayılır. Ortak hayali set: **Çınaraltı Taş Döşeme**,
**NOVA FX**, **Anı Atölyesi**.

## Hukuk

**`ETHICS-AND-LAW.md` okunmadan tarama çalıştırılmaz.** Bu araç izin istemeden
işletme buluyor, iletişim bilgisi saklıyor, sahibi olmadığı fotoğrafları indiriyor.
Taramayı başlattığın an KVKK/GDPR kapsamında veri sorumlusu oluyorsun.

## Yapı, dil, komutlar

`apps/{demo,musteri-ornek,pazarlama}` · `packages/{data,seo,ui}` (`@studio/*`) ·
`tools/{prospect,panel,denetim,gsc,ekran}` — npm workspaces.

**Kod ve yorumlar Türkçe, README ve dökümanlar İngilizce.** Tam çeviri yapılmayacak.

```
npm run kontrol   # test + tip + biçim
npm run tara      # gerçek tarama (önce ETHICS-AND-LAW.md)
npm run panel     # takip paneli
npm run ornek     # örnek fikstürleri üret
```

## Yeniden açılmayacak kararlar

`ACIK-KAYNAK-DURUM.md`'de karar listesi var (dosya `.gitignore`'da, geçici).
**Yapılmayacaklar:** eklenti sistemi, çoklu veri kaynağı soyutlaması, web arayüzü,
npm'e paket yayınlama. Küçük ve çalışan, büyük ve yarım kalandan iyidir.

`NOTLAR-YEREL.md` de `.gitignore`'da — kişisel Vercel proje adları ve deploy
komutları içeriyor, içeriğini commit'e veya ekrana taşıma.
