/**
 * Prospect takip paneli — YEREL.
 *
 *   npm run panel        → http://127.0.0.1:4321
 *
 * ─────────────────────────────────────────────────────────────────────
 * NEDEN YEREL, NEDEN SITEDE DEGIL
 *
 * Bu panelde gercek isletmelerin adi, telefonu ve adresi duruyor.
 * Bunlar Bilal'in degil, UCUNCU KISILERIN kisisel verisi — KVKK
 * kapsaminda. Internete acilan her kopyasi bir sizinti riski.
 *
 * Pazarlama sitesinin icine koymak en kotusuydu: ayni dagitim hem
 * herkese acik sayfalari hem bu veriyi sunardi ve tek bir yetkilendirme
 * hatasi hepsini acardi.
 *
 * En guvenli sistem internete hic cikmayandir. Sunucu SADECE 127.0.0.1
 * dinliyor — ayni agdaki baska bir cihaz bile ulasamaz. Giris ekrani
 * yok cunku gerekmiyor; kirilacak parola da yok.
 *
 * Telefondan erisim gerekirse Supabase + auth ile ayri bir projeye
 * tasiriz. O gun geldiginde konusulacak bir sey, bugun degil.
 * ─────────────────────────────────────────────────────────────────────
 *
 * VERI IKI KATMAN:
 *   turetilen  demo dosyalarindan okunuyor (ad, telefon, maps, demo adresi).
 *              Panel bunlari DEGISTIRMIYOR; kaynak apps/demo/src/veriler.
 *   durum      tools/panel/veri/durumlar.json — panelin yazdigi tek dosya.
 *              .gitignore'da; repoya girmiyor.
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const buKok = dirname(fileURLToPath(import.meta.url));
const repoKok = resolve(buKok, '..', '..');
const demoDizin = resolve(repoKok, 'apps', 'demo', 'src', 'veriler');
const veriDizin = resolve(buKok, 'veri');
const durumDosya = resolve(veriDizin, 'durumlar.json');

/*
   PORT DEGISTIRILEBILIR — ve cakisma SESSIZ GECMIYOR.

   Sabit port tehlikeli cikti: ayni makinede ikinci bir kopya calistiran
   biri `npm run panel` diyor, port zaten dolu oldugu icin sunucu
   baslamiyor, ama tarayicida localhost:4321 acilinca ILK kopyanin paneli
   geliyor — yani BASKA BIR CALISMANIN gercek musteri verisi. Bagimsiz bir
   inceleme sirasinda tam olarak bu oldu.

   PANEL_PORT=4322 npm run panel
*/
const PORT = Number(process.env.PANEL_PORT ?? 4321);
// Demolarin yayinlandigi adres. Sabit kodluyken repoyu klonlayan herkesin
// paneli BASKASININ barindirma adresine link veriyordu.
const DEMO_ALAN = process.env.DEMO_ALAN
  ? `https://${process.env.DEMO_ALAN.replace(/^https?:\/\//, '')}`
  : 'http://localhost:3001';

// ---------------------------------------------------------------- okuma

/**
 * Demo dosyalarindan alan cikarir.
 *
 * Dosyalarin bir kismi uretecten ("ad": "x"), bir kismi elle duzeltilmis
 * (ad: 'x') — iki tirnak stili de var. Girinti seviyesi anahtar: 4 bosluk
 * isletme nesnesinin ust seviyesi, 6 bosluk ic nesneler (iletisim, adres).
 * Ust seviyeye demirlemezsek `ad` hizmet ve galeri icinde de eslesiyor.
 */
function alan(metin, anahtar, girinti = 4) {
  const bosluk = ' '.repeat(girinti);
  const desen = new RegExp(`^${bosluk}["']?${anahtar}["']?:\\s*["']([^"']+)["']`, 'm');
  return (metin.match(desen) ?? [])[1];
}

/**
 * Google puani ve yorum sayisi — SADECE gbpMetrikleri blogundan.
 *
 * Duz arama yanlis sonuc veriyordu: her yorumun da bir `puan` alani var
 * ve dosyada `referanslar` blogu `gbpMetrikleri`nden ONCE geliyor.
 * Aksemsettinoglu 4.8 iken panelde 5 gorunuyordu — ilk yorumun puani.
 */
function gbpMetrikleri(metin) {
  const blok = metin.match(/["']?gbpMetrikleri["']?:\s*\{([\s\S]*?)\}/);
  if (!blok) return {};
  const al = (k) => {
    const d = (blok[1].match(new RegExp(`["']?${k}["']?:\\s*([\\d.]+)`)) ?? [])[1];
    return d === undefined ? undefined : Number(d);
  };
  return { puan: al('puan'), yorumSayisi: al('yorumSayisi') };
}

function demolariOku() {
  if (!existsSync(demoDizin)) return [];

  return readdirSync(demoDizin)
    .filter((d) => d.endsWith('.ts') && d !== 'index.ts')
    .map((dosya) => {
      const metin = readFileSync(resolve(demoDizin, dosya), 'utf8');
      const yol = dosya.replace(/\.ts$/, '');

      // Baslik blogundaki "GÖNDERİLMEDİ" notu — AS Celik gibi vazgecilenler.
      const vazgecildi = /DURUM\s*:\s*GÖNDERİLMEDİ/i.test(metin);

      return {
        kimlik: yol,
        ad: alan(metin, 'ad') ?? yol,
        sektor: alan(metin, 'sektor'),
        telefon: alan(metin, 'telefon', 6),
        whatsapp: alan(metin, 'whatsapp', 6),
        il: alan(metin, 'il', 8),
        ilce: alan(metin, 'ilce', 8),
        mapsUrl: (alan(metin, 'mapsUrl', 8) ?? '').split('&')[0] || undefined,
        ...gbpMetrikleri(metin),
        demoUrl: `${DEMO_ALAN}/${yol}`,
        vazgecildi,
      };
    })
    .sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
}

function durumlariOku() {
  if (!existsSync(durumDosya)) return {};
  try {
    return JSON.parse(readFileSync(durumDosya, 'utf8'));
  } catch {
    return {};
  }
}

function durumlariYaz(veri) {
  mkdirSync(veriDizin, { recursive: true });
  writeFileSync(durumDosya, JSON.stringify(veri, null, 2), 'utf8');
}

// ---------------------------------------------------------------- sunucu

const govdeOku = (istek) =>
  new Promise((coz, red) => {
    let veri = '';
    istek.on('data', (p) => {
      veri += p;
      if (veri.length > 1e6) red(new Error('gövde çok büyük'));
    });
    istek.on('end', () => coz(veri));
  });

const json = (yanit, veri, kod = 200) => {
  yanit.writeHead(kod, { 'content-type': 'application/json; charset=utf-8' });
  yanit.end(JSON.stringify(veri));
};

const sunucu = createServer(async (istek, yanit) => {
  const { pathname } = new URL(istek.url, `http://127.0.0.1:${PORT}`);

  try {
    if (istek.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      yanit.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        // Yerel olsa da arama motoru talimati birakiyoruz: bir gun
        // yanlislikla disari acilirsa ilk savunma hatti bu.
        'x-robots-tag': 'noindex, nofollow, noarchive',
        'cache-control': 'no-store',
      });
      yanit.end(readFileSync(resolve(buKok, 'panel.html'), 'utf8'));
      return;
    }

    if (istek.method === 'GET' && pathname === '/api/kayitlar') {
      const durumlar = durumlariOku();
      const kayitlar = demolariOku().map((d) => ({ ...d, ...(durumlar[d.kimlik] ?? {}) }));
      json(yanit, kayitlar);
      return;
    }

    if (istek.method === 'PUT' && pathname.startsWith('/api/kayit/')) {
      const kimlik = decodeURIComponent(pathname.slice('/api/kayit/'.length));
      const gelen = JSON.parse(await govdeOku(istek));

      // SADECE bilinen alanlar yaziliyor. Turetilen alanlar (ad, telefon,
      // maps) buradan degistirilemez — onlarin kaynagi demo dosyasi.
      const izinli = [
        'durum', 'gonderim', 'sonTemas', 'kayipSebebi',
        'fiyat', 'siteDurumu', 'siteUrl', 'not',
      ];
      const temiz = {};
      for (const k of izinli) if (k in gelen) temiz[k] = gelen[k];

      const durumlar = durumlariOku();
      durumlar[kimlik] = { ...(durumlar[kimlik] ?? {}), ...temiz };
      durumlariYaz(durumlar);
      json(yanit, { tamam: true });
      return;
    }

    yanit.writeHead(404).end('yok');
  } catch (hata) {
    json(yanit, { hata: String(hata?.message ?? hata) }, 500);
  }
});

/*
   Port doluysa SESSIZ KALMA. Eskiden sunucu baslamiyor, kullanici
   tarayicida ayni adresi acinca BASKA bir kopyanin panelini goruyordu —
   ve o panelde baska birinin gercek musteri verisi olabiliyor.
*/
sunucu.on('error', (hata) => {
  if (hata.code === 'EADDRINUSE') {
    console.error(`
  ${PORT} portu zaten kullanımda.

  Büyük ihtimalle bu panelin başka bir kopyası çalışıyor. Tarayıcıda
  http://127.0.0.1:${PORT} açarsan ONUN verisini görürsün — bu makinede
  birden fazla çalışma varsa başka bir çalışmanın müşteri verisi.

  Ya çalışan kopyayı kapat, ya da farklı bir port ver:

      PANEL_PORT=${PORT + 1} npm run panel
`);
    process.exit(1);
  }
  throw hata;
});

// 127.0.0.1 — 0.0.0.0 DEGIL. Ayni agdaki telefon bile ulasamaz.
sunucu.listen(PORT, '127.0.0.1', () => {
  const sayi = demolariOku().length;
  console.log(`
  Panel açıldı:  http://127.0.0.1:${PORT}
  ${sayi} demo okundu · durumlar: tools/panel/veri/durumlar.json

  Sadece bu bilgisayardan erişilebilir. Kapatmak için Ctrl+C.
`);
});
