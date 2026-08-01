import { BULGULAR } from './config.mjs';

const kacir = (metin) =>
  String(metin ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const ORTAK_STIL = `
:root{--bg:#f6f7f9;--kart:#fff;--metin:#111827;--soluk:#6b7280;--cizgi:#e5e7eb;
--kirmizi:#dc2626;--turuncu:#ea580c;--yesil:#059669;--mavi:#1d4ed8;--vurgu:#111827}
@media(prefers-color-scheme:dark){:root{--bg:#0b0d10;--kart:#14181d;--metin:#e8eaed;
--soluk:#9aa3ad;--cizgi:#252b33;--vurgu:#e8eaed}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--metin);
font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
-webkit-font-smoothing:antialiased}
.sar{max-width:760px;margin:0 auto;padding:32px 20px 64px}
.kart{background:var(--kart);border:1px solid var(--cizgi);border-radius:14px;padding:24px;margin:16px 0}
h1{font-size:clamp(24px,4.5vw,34px);line-height:1.2;letter-spacing:-.02em;margin:0 0 8px}
h2{font-size:19px;letter-spacing:-.01em;margin:32px 0 4px}
.soluk{color:var(--soluk)}
.kucuk{font-size:14px}
.etiket{display:inline-block;font-size:12px;font-weight:600;letter-spacing:.06em;
text-transform:uppercase;padding:5px 10px;border-radius:999px;border:1px solid var(--cizgi)}
table{width:100%;border-collapse:collapse;font-size:14px}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--cizgi);vertical-align:top}
th{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--soluk);font-weight:600}
a{color:var(--mavi)}
@media(prefers-color-scheme:dark){a{color:#7aa2ff}}
.kaydir{overflow-x:auto;-webkit-overflow-scrolling:touch}
`;

/**
 * Prospect'e gonderilecek denetim raporu. Tek dosya, dis bagimlilik yok —
 * dogrudan Vercel'e static olarak atilabilir.
 */
export function raporUret(kayit, sahip) {
  const puan = Math.max(0, 100 - kayit.zayiflik); // musteriye "site sagligi" olarak gosteriyoruz
  const renk = puan < 40 ? 'var(--kirmizi)' : puan < 70 ? 'var(--turuncu)' : 'var(--yesil)';
  const derece = puan < 40 ? 'Ciddi eksikler var' : puan < 70 ? 'İyileştirmeye açık' : 'Büyük ölçüde sağlıklı';

  const siteYok = kayit.bulgular.includes('site_yok');

  /*
     GIRIS CUMLESI — YAPILMAMIS ISI IDDIA ETME.

     Onceki surum site acilmadiginda bile "Sitenizi N baslikta inceledim:
     mobil uyum, sayfa hizi, arama gorunurlugu..." yaziyordu. Site hic
     acilmamisken. Gecici olarak down olan bir siteye bu rapor gitse,
     sahibi hakli olarak "bakmamis bile" der — ve `site_yok` bulgusunun
     kendi aciklamasi tam bu riski anlatiyor.
     Bir de tekil durumda "1 baslikta inceledim: [dort kalem]" bozuktu.
  */
  function girisMetni(k, yok) {
    if (yok) {
      return 'Google işletme kaydınız aktif, ancak bağlı bir web siteniz ' +
        'görünmüyor. Aşağıda bunun size neye mal olduğunu özetledim.';
    }
    if (k.bulgular.includes('erisilemedi')) {
      return 'Sitenizin adresine ulaşmayı denedim, sayfa açılmadı. ' +
        'İçeriğini inceleyemedim — aşağıdakiler yalnızca dışarıdan ' +
        'görülebilenler. Site geçici olarak kapalıysa haber verin, tekrar bakayım.';
    }
    const n = k.bulgular.length;
    return n === 1
      ? 'Sitenize baktım; öne çıkan tek bir başlık var, aşağıda.'
      : `Sitenizi ${n} başlıkta inceledim: mobil uyum, sayfa hızı, ` +
        'arama görünürlüğü ve müşterinin size ulaşma yolları.';
  }
  const bulguKartlari = kayit.bulgular
    .map((kod) => BULGULAR[kod])
    .filter(Boolean)
    .sort((a, b) => b.puan - a.puan);

  const wa = (sahip.telefon ?? '').replace(/[^0-9]/g, '');
  const waMetin = encodeURIComponent(
    `Merhaba, ${kayit.ad} için hazırladığınız site analizini inceledim.`,
  );

  return `<!doctype html>
<html lang="tr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${kacir(kayit.ad)} — Web Sitesi & Google Görünürlük Analizi</title>
<style>${ORTAK_STIL}
.gosterge{display:flex;align-items:center;gap:22px;flex-wrap:wrap}
.halka{width:104px;height:104px;border-radius:50%;flex:0 0 auto;display:grid;place-items:center;
background:conic-gradient(${renk} calc(${puan}*1%),var(--cizgi) 0);position:relative}
.halka::after{content:"";position:absolute;inset:9px;border-radius:50%;background:var(--kart)}
.halka span{position:relative;font-size:27px;font-weight:700;letter-spacing:-.02em}
.bulgu{padding:16px 0;border-bottom:1px solid var(--cizgi)}
.bulgu:last-child{border-bottom:0;padding-bottom:0}
.bulgu h3{margin:0 0 5px;font-size:16px;display:flex;gap:9px;align-items:baseline}
.bulgu p{margin:0;color:var(--soluk);font-size:15px}
.nokta{color:var(--kirmizi);font-weight:700;flex:0 0 auto}
.cta{background:var(--vurgu);color:var(--kart);border-radius:14px;padding:26px}
.cta h2{margin:0 0 8px;color:var(--kart)}
.cta p{margin:0 0 18px;opacity:.82;font-size:15px}
.dugme{display:inline-block;background:var(--kart);color:var(--vurgu);text-decoration:none;
font-weight:600;padding:12px 20px;border-radius:9px;margin:0 8px 8px 0;font-size:15px}
.kanit{border-left:3px solid var(--yesil);padding:2px 0 2px 16px;margin:20px 0;font-size:15px}
</style></head><body><div class="sar">

<p class="etiket">Ücretsiz Analiz · ${new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</p>
<h1>${kacir(kayit.ad)}</h1>
<p class="soluk">${kacir(kayit.adres)}</p>

<div class="kart gosterge">
  <!-- Olcek YAZILIYOR. Ciplak bir "0" ya da "10" isletme sahibinin
       gozunde bozuk bir sayfa gibi duruyordu; "/100" onu bir puana
       cevirir ve halkanin doluluk orani da anlam kazanir. -->
  <div class="halka"><span>${puan}<small>/100</small></span></div>
  <div>
    <div style="font-size:19px;font-weight:650;letter-spacing:-.01em">${derece}</div>
    <p class="soluk kucuk" style="margin:5px 0 0;max-width:42ch">
      ${girisMetni(kayit, siteYok)}
    </p>
  </div>
</div>

<h2>Ne buldum</h2>
<p class="soluk kucuk" style="margin-top:0">Önem sırasına göre listeledim.</p>
<div class="kart">
${bulguKartlari
  .map(
    (b) => `  <div class="bulgu">
    <h3><span class="nokta">•</span><span>${kacir(b.baslik)}</span></h3>
    <p>${kacir(b.aciklama)}</p>
  </div>`,
  )
  .join('\n')}
</div>

${
  kayit.hiz
    ? `<h2>Mobil hız ölçümü</h2>
<p class="soluk kucuk" style="margin-top:0">Google PageSpeed Insights, ${new Date().toLocaleDateString('tr-TR')}</p>
<div class="kart kaydir"><table>
  <tr><th>Ölçüm</th><th>Sonuç</th></tr>
  <tr><td>Performans skoru (mobil)</td><td><strong>${kayit.hiz.skor} / 100</strong></td></tr>
  ${kayit.hiz.lcp ? `<tr><td>En büyük içeriğin yüklenmesi</td><td>${kacir(kayit.hiz.lcp)}</td></tr>` : ''}
  ${kayit.hiz.cls ? `<tr><td>Görsel kayma</td><td>${kacir(kayit.hiz.cls)}</td></tr>` : ''}
  ${kayit.hiz.tbt ? `<tr><td>Etkileşim gecikmesi</td><td>${kacir(kayit.hiz.tbt)}</td></tr>` : ''}
</table></div>`
    : ''
}

<h2>Google işletme kaydınız</h2>
<div class="kart kaydir"><table>
  <tr><th>Ortalama puan</th><td>${kayit.puan != null ? `${kayit.puan} / 5` : 'Kayıt yok'}</td></tr>
  <tr><th>Yorum sayısı</th><td>${kayit.yorumSayisi}${kayit.yorumSayisi < 15 ? ' — harita sıralamasında en hızlı kazanç burada' : ''}</td></tr>
  <tr><th>Telefon</th><td>${kayit.telefon ? kacir(kayit.telefon) : 'Kayıtlı değil'}</td></tr>
  <tr><th>Web sitesi</th><td>${kayit.site ? `<a href="${kacir(kayit.site)}" rel="noopener nofollow">${kacir(kayit.site)}</a>` : 'Kayıtlı değil'}</td></tr>
</table></div>

${
  sahip.referansMetni
    ? `<div class="kanit"><strong>Neden ben:</strong> ${kacir(sahip.referansMetni)}
${sahip.referansLink ? `<br><a href="${kacir(sahip.referansLink)}" rel="noopener">${kacir(sahip.referansLink)}</a>` : ''}</div>`
    : ''
}

<div class="kart cta">
  <h2>Bu analiz ücretsiz, devamı size kalmış</h2>
  <p>Yukarıdaki maddelerin hangisi işinize kaç müşteriye mal oluyor — 10 dakikalık bir telefonda net konuşabiliriz. Satış konuşması değil; ne yapılması gerektiğini söylerim, kendiniz de yaptırabilirsiniz.</p>
  ${wa ? `<a class="dugme" href="https://wa.me/${wa}?text=${waMetin}">WhatsApp'tan yaz</a>` : ''}
  ${sahip.telefon ? `<a class="dugme" href="tel:${kacir(sahip.telefon.replace(/\s/g, ''))}">${kacir(sahip.telefon)}</a>` : ''}
</div>

<p class="soluk kucuk">
  ${kacir(sahip.ad)}${sahip.unvan ? ` · ${kacir(sahip.unvan)}` : ''}
  ${sahip.site ? ` · <a href="https://${kacir(sahip.site)}">${kacir(sahip.site)}</a>` : ''}
  ${sahip.eposta ? ` · ${kacir(sahip.eposta)}` : ''}
  <br><br>
  Bu analiz herkese açık verilerle hazırlandı: Google işletme kaydınız ve sitenizin genel erişime açık sayfası.
  Sitenize hiçbir müdahalede bulunulmadı, hiçbir veri saklanmadı.
</p>

</div></body></html>`;
}

/** Sadece senin gorecegin ic panel. Bunu ASLA raporlarla ayni klasore koyma. */
export function panelUret(kayitlar, meta) {
  const renkli = (oncelik) =>
    oncelik === 'ÇOK YÜKSEK' ? 'var(--kirmizi)' : oncelik === 'YÜKSEK' ? 'var(--turuncu)' : 'var(--soluk)';

  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prospect Paneli — ${kacir(meta.nisAdi)}</title>
<style>${ORTAK_STIL}
.sar{max-width:1200px}
tbody tr:hover{background:rgba(127,127,127,.06)}
.skor{font-weight:700;font-variant-numeric:tabular-nums}
</style></head><body><div class="sar">
<h1>Prospect Paneli</h1>
<p class="soluk">${kacir(meta.nisAdi)} · ${kacir(meta.sehirler)} · ${kayitlar.length} işletme · ${new Date().toLocaleString('tr-TR')}</p>
<p class="kucuk soluk">Fırsat skoru = işletmenin canlılığı × sitesinin zayıflığı. Yukarıdan aşağı git; ilk 20'ye elle demo hazırla.</p>
<div class="kart kaydir"><table>
<thead><tr>
<th>#</th><th>Skor</th><th>Öncelik</th><th>İşletme</th><th>Şehir</th><th>Yorum</th><th>Puan</th>
<th>Site</th><th>Hız</th><th>Telefon</th><th>Rapor</th>
</tr></thead><tbody>
${kayitlar
  .map(
    (k, i) => `<tr>
<td class="soluk">${i + 1}</td>
<td class="skor" style="color:${renkli(k.oncelik)}">${k.firsat}</td>
<td class="kucuk" style="color:${renkli(k.oncelik)}">${k.oncelik}</td>
<td><strong>${kacir(k.ad)}</strong><br><span class="kucuk soluk">${kacir(k.sorgu)}</span></td>
<td class="kucuk">${kacir(k.sehir)}</td>
<td>${k.yorumSayisi}</td>
<td>${k.puan ?? '—'}</td>
<td class="kucuk">${k.site ? `<a href="${kacir(k.site)}" rel="noopener nofollow">site</a>` : '<strong>YOK</strong>'}</td>
<td>${k.hiz?.skor ?? '—'}</td>
<td class="kucuk">${kacir(k.telefon ?? '—')}</td>
<td class="kucuk">${k.raporDosyasi ? `<a href="raporlar/${kacir(k.raporDosyasi)}">aç</a>` : '—'} · <a href="${kacir(k.mapsUrl)}" rel="noopener">maps</a></td>
</tr>`,
  )
  .join('\n')}
</tbody></table></div>
</div></body></html>`;
}
