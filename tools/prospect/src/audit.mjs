const PSI_UC = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
const TARAYICI_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/** HTML icinden ilk eslesmeyi cikarir, yoksa null. */
function yakala(html, desen) {
  const m = html.match(desen);
  return m ? (m[1] ?? '').trim() : null;
}

/**
 * Bir sitenin HTML'ini cekip kaba ama guvenilir SEO/teknik sinyalleri toplar.
 * Tarayici calistirmadigimiz icin JS ile sonradan basilan icerigi gormez —
 * bu bir kisit degil avantaj: Google'in ilk gecisi de buna cok benzer bir goruntu goruyor.
 */
export async function siteyiDenetle(urlMetni) {
  const rapor = {
    erisildi: false,
    sonUrl: null,
    https: false,
    bulgular: [],
    olcumler: {},
  };

  let url;
  try {
    url = new URL(urlMetni.startsWith('http') ? urlMetni : `https://${urlMetni}`);
  } catch {
    rapor.bulgular.push('erisilemedi');
    return rapor;
  }

  let html = '';
  try {
    const yanit = await fetch(url, {
      headers: { 'User-Agent': TARAYICI_UA, 'Accept-Language': 'tr,en;q=0.8' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });

    rapor.sonUrl = yanit.url;
    rapor.https = new URL(yanit.url).protocol === 'https:';

    if (!yanit.ok) {
      rapor.bulgular.push('erisilemedi');
      rapor.olcumler.httpKodu = yanit.status;
      return rapor;
    }

    html = await yanit.text();
    rapor.erisildi = true;
    rapor.olcumler.htmlKb = Math.round(Buffer.byteLength(html, 'utf8') / 1024);
  } catch {
    rapor.bulgular.push('erisilemedi');
    return rapor;
  }

  const kucuk = html.toLowerCase();

  if (!rapor.https) rapor.bulgular.push('https_yok');

  // --- Mobil uyum ---
  if (!/<meta[^>]+name=["']viewport["']/i.test(html)) rapor.bulgular.push('mobil_uyumsuz');

  // --- Baslik ---
  const baslik = yakala(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  rapor.olcumler.baslik = baslik;
  if (!baslik) rapor.bulgular.push('baslik_yok');
  else if (baslik.length < 20 || baslik.length > 65) rapor.bulgular.push('baslik_kotu');

  // --- Meta aciklama ---
  const aciklama =
    yakala(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ??
    yakala(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  rapor.olcumler.aciklama = aciklama;
  if (!aciklama || aciklama.length < 40) rapor.bulgular.push('aciklama_yok');

  // --- H1 ---
  if (!/<h1[\s>]/i.test(html)) rapor.bulgular.push('h1_yok');

  // --- Yapisal veri ---
  const schemaVar =
    /application\/ld\+json/i.test(html) &&
    /"@type"\s*:\s*"(LocalBusiness|Organization|ProfessionalService|HomeAndConstructionBusiness|Dentist|Store|GeneralContractor|MedicalClinic|Hotel|Restaurant)"/i.test(html);
  if (!schemaVar) rapor.bulgular.push('schema_yok');

  // --- Iletisim akislari ---
  if (!/href=["']tel:/i.test(html)) rapor.bulgular.push('telefon_yok');
  if (!/(wa\.me|api\.whatsapp\.com|whatsapp:\/\/)/i.test(kucuk)) rapor.bulgular.push('whatsapp_yok');
  if (!/(google\.com\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google)/i.test(kucuk)) {
    rapor.bulgular.push('harita_yok');
  }

  // --- Guncellik: footer'daki telif yili en guclu "olu site" sinyali ---
  const yillar = [...html.matchAll(/(?:©|&copy;|copyright)[^0-9]{0,20}(20\d{2})/gi)].map((m) => Number(m[1]));
  const buYil = new Date().getFullYear();
  if (yillar.length) {
    const enYeni = Math.max(...yillar);
    rapor.olcumler.telifYili = enYeni;
    if (enYeni <= buYil - 2) rapor.bulgular.push('eski_icerik');
  }

  // --- Hazir platform tespiti ---
  const jenerator = (yakala(html, /<meta[^>]+name=["']generator["'][^>]+content=["']([^"']*)["']/i) ?? '').toLowerCase();
  const sablonIzi =
    /wix\.com|_wixcss|parastorage/.test(kucuk) ||
    /blogspot|weebly|squarespace|shopify|wordpress\.com|webflow/.test(kucuk) ||
    /wix|weebly|squarespace|blogger|joomla/.test(jenerator);
  if (sablonIzi) {
    rapor.bulgular.push('sablon_platform');
    rapor.olcumler.platform = jenerator || 'şablon platformu';
  }

  // --- Sayfa agirligi ---
  if (rapor.olcumler.htmlKb > 450) rapor.bulgular.push('agir_sayfa');

  // --- Dil alternatifleri ---
  const hreflangSayisi = (html.match(/hreflang=/gi) ?? []).length;
  rapor.olcumler.dilSayisi = hreflangSayisi;

  return rapor;
}

/**
 * PageSpeed Insights ile mobil performans skoru. Ucretsiz ama yavas (~10-20sn),
 * o yuzden sadece elemeyi gecen adaylarda calistiriyoruz.
 */
export async function hiziOlc(url, apiKey) {
  try {
    // Anahtar opsiyonel: PSI anahtarsiz da cevap veriyor, sadece kotasi daha dar.
    const adres =
      `${PSI_UC}?url=${encodeURIComponent(url)}&strategy=mobile&category=performance` +
      (apiKey ? `&key=${apiKey}` : '');
    const yanit = await fetch(adres, { signal: AbortSignal.timeout(75000) });
    if (!yanit.ok) return null;

    const veri = await yanit.json();
    const skor = veri?.lighthouseResult?.categories?.performance?.score;
    if (typeof skor !== 'number') return null;

    const olcumler = veri.lighthouseResult.audits ?? {};
    return {
      skor: Math.round(skor * 100),
      lcp: olcumler['largest-contentful-paint']?.displayValue ?? null,
      cls: olcumler['cumulative-layout-shift']?.displayValue ?? null,
      tbt: olcumler['total-blocking-time']?.displayValue ?? null,
    };
  } catch {
    return null;
  }
}
