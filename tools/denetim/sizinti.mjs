/**
 * SIZINTI DENETÇİSİ — yayına çıkacak dosyalarda hassas veri arar.
 *
 *   node tools/denetim/sizinti.mjs
 *
 * ─────────────────────────────────────────────────────────────────────
 * NEDEN KARA LİSTE ELLE TUTULMUYOR
 *
 * Elle tutulan liste bakımsız kalır: yeni demo eklenir, listeye
 * eklenmez, sızıntı fark edilmez. Üstelik listenin kendisi bir sır
 * dosyası olur — Bilal'in bütün prospect listesi düz metin halinde
 * repoda durur.
 *
 * Bunun yerine denetçi, YERELDEKİ GERÇEK VERİYİ okuyup yasaklı
 * terimleri kendisi türetiyor: demo dosyaları, panel durumları ve
 * tarama çıktıları. Üçü de .gitignore'da; denetçi onları okur ama
 * yayınlanacak dosyalarda GEÇMEMELERİNİ dener.
 *
 * Sonuç: yeni demo eklendiği anda otomatik olarak korumaya giriyor.
 * ─────────────────────────────────────────────────────────────────────
 *
 * ÇIKIŞ KODLARI
 *   0  tam denetim, sızıntı yok
 *   1  sızıntı var
 *   2  KISMİ denetim, bulunan kadarıyla temiz — yerel gerçek veri yok,
 *      yani yalnızca kalıp kuralları koştu (CI'ın normal durumu)
 *
 * 2'yi ayrı bir kod yapmanın sebebi: `yayina-hazir` çıktı METNİNİ
 * ayrıştırmak zorunda kalmasın. "Yeşil" ile "yarısı yeşil" arasındaki
 * farkın makine tarafından okunabilir olması gerekiyor, yoksa fark
 * ilk otomasyonda kayboluyor.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, extname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// ─────────────────────────────────────────────── yayınlanacak dosyalar

/** git'in izlediği + izlenmeyen ama dışlanmamış dosyalar. */
function yayinlanacaklar() {
  let cikti;
  try {
    cikti = execFileSync('git', ['ls-files', '-c', '-o', '--exclude-standard'], {
      cwd: kok,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    /*
       ZIP INDIREN KULLANICI. GitHub'dan "Download ZIP" ile gelen klasor
       bir git deposu degil; burasi eskiden ham bir Node yigin iziyle
       oluyordu. Bu denetimin tanimi "git'in yayinlayacagi dosyalar",
       yani gitsiz calisamaz — ama bunu SOYLEMESI gerekiyor.
    */
    console.error(`
  Bu klasör bir git deposu değil.

  \`sizinti\` ve \`temiz-clone\`, "git'in yayınlayacağı dosyalar" tanımı
  üzerine kurulu; ZIP olarak indirilen bir klasörde çalışamazlar.

  Depoyu klonlarsan ikisi de çalışır:

    git clone <depo-adresi>

  Projenin geri kalanı ZIP ile de çalışır — bu iki komut yayın öncesi
  denetim içindir, kullanmak için gerekli değildir.
`);
    process.exit(1);
  }
  /*
     `.svg` SONRADAN EKLENDI. Bagimsiz bir inceleme, ad ve telefon gomulu
     bir logo SVG'sinin yayin listesinde durup hic taranmadigini gosterdi.
     SVG metin dosyasidir ve isletme logolari tam olarak burada yasiyor.
  */
  const METIN = new Set([
    '.ts', '.tsx', '.mjs', '.js', '.json', '.css', '.md', '.html',
    '.txt', '.yml', '.yaml', '.svg', '.example', '',
  ]);

  const hepsi = cikti.split('\n').map((s) => s.trim()).filter(Boolean);
  const metin = hepsi.filter((y) => METIN.has(extname(y)));

  /*
     DENETCI ARTIK KENDINI DE TARIYOR.

     Eskiden `tools/denetim/` tamamen atlaniyordu — "denetci kendini
     taramaz" diye. Bagimsiz bir inceleme en agir sizintiyi tam orada
     buldu: bu dosyanin bir yorumunda gercek bir isletmenin adi ve
     telefonu ornek olarak yaziyordu, ve denetci onu hicbir zaman
     goremeyecekti.

     Kendini taramanin bedeli yok: asagidaki KALIPLAR birer regex KAYNAGI,
     kendi kendilerini eslestirmiyorlar.
  */
  return { metin, taranmayan: hepsi.length - metin.length };
}

// ─────────────────────────────────────────────── yasaklı terim türetme

const dosyalariTara = (dizin, uzanti) => {
  if (!existsSync(dizin)) return [];
  const cikti = [];
  for (const ad of readdirSync(dizin)) {
    const tam = join(dizin, ad);
    if (statSync(tam).isDirectory()) cikti.push(...dosyalariTara(tam, uzanti));
    else if (!uzanti || ad.endsWith(uzanti)) cikti.push(tam);
  }
  return cikti;
};

/**
 * Yerel gerçek veriden yasaklı terimleri çıkarır.
 *
 * İKİ AYRI GÜVEN SEVİYESİ VAR, bilerek:
 *
 *   TEMAS EDİLENLER (demo dosyaları + panel) — adı da telefonu da
 *   yasaklı. Bunlar mesaj attığımız, konuştuğumuz işletmeler; hangi
 *   isimlerin bizim boru hattımızda olduğu ticari bilgi.
 *
 *   HAM TARAMA (1322 kayıt) — SADECE telefon ve alan adı yasaklı,
 *   isimler DEĞİL. Sebep: o havuzda "Odalar", "Kahvaltı", "Yapı
 *   malzemesi" gibi jenerik adlar var; hepsini yasaklarsak denetçi
 *   her satırda alarm verir ve kimse ona bakmaz. Gürültü yapan
 *   denetçi, olmayan denetçidir.
 *
 * Ad için ek süzgeç: en az iki kelime ya da 10+ karakter. Tek
 * kelimelik kısa adlar ("Melen", "Vadi") gündelik metinde geçiyor.
 */
const JENERIK = new Set(
  ('odalar kahvaltı restoran otel konak bahçe yapı malzemesi malzemeleri inşaat ' +
   'tadilat peyzaj market ticaret sanayi limited şirketi hizmetleri merkezi')
    .split(' '),
);

function yasaklilar() {
  const terim = new Set();

  /** Ad — yalnız temas edilen işletmeler için. */
  const adEkle = (s) => {
    if (typeof s !== 'string') return;
    const t = s.trim();
    if (t.length < 6) return;
    const kelimeler = t.split(/\s+/);
    if (kelimeler.length < 2 && t.length < 10) return;
    if (kelimeler.every((k) => JENERIK.has(k.toLocaleLowerCase('tr')))) return;
    terim.add(t);
  };

  /*
     Platform adresleri yasaklanmaz. Ham taramada bir işletmenin
     "sitesi" olarak instagram/facebook sayfası kayıtlı olabiliyor;
     bunlar kimseye ait değil, herkesin kodunda geçiyor ve yasaklarsak
     denetçi kendi kaynak dosyalarımızda bile alarm verir.
  */
  const PLATFORM =
    /^(www\.)?(instagram|facebook|twitter|x|youtube|linkedin|sahibinden|hepsiburada|hepsiemlak|emlakjet|zingat|arabam|letgo|dolap|yemeksepeti|getir|trendyol|n11|gittigidiyor|linktr|blogspot|wordpress|wixsite|wa\.me|whatsapp|goo\.gl|maps\.app|business\.(google|site)|google|maps)\./i;

  /** Telefon ve alan adı — her kaynaktan, koşulsuz. */
  const ekle = (s) => {
    if (typeof s !== 'string') return;
    const t = s.trim();
    if (t.length < 6) return;
    if (PLATFORM.test(t) || /^(https?:\/\/)?(www\.)?(google|maps)\b/i.test(t)) return;

    /*
       EKSIK NUMARALARI ALMA. Ham havuzda isletmelerin kendi girdigi
       bozuk kayitlar var — "5555555" gibi. Bunlar kimseyi tanimlamiyor
       ama kisa olduklari icin baska metinlerin ICINDE esleşiyor ve
       denetciyi gurultuye boguyor: kurgu fikstur numaramiz
       "+903805555555" bu yuzden sizinti sanilmisti.

       Turkiye'de abone numarasi 10 hane. Daha kisasi telefon degil.
    */
    if (!/[a-zA-Z]/.test(t)) {
      const rakam = t.replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '');
      if (rakam.length < 10) return;
    }

    /*
       AYRILMIS ALAN ADLARINI ALMA. Ham havuzda "sitesi" alanina
       example.com yazmis bir isletme var — kayit bos birakilmamis ama
       gercek de degil. RFC 2606/6761'de bu adlar kayda kapali, yani
       kimsenin olamaz; yasaklarsak kendi fikstürlerimiz sizinti sayilir.
    */
    if (/(^|\.)(example|test|invalid|localhost)(\.|$)/i.test(t)) return;

    terim.add(t);
  };

  /*
     Örnek fikstürlerin `veriler/` içine kopyalanmış hali.

     `npm run ornek` hayali örnekleri gerçek demo klasörüne kopyalıyor.
     Denetçi onları gerçek işletme sanarsa, hayali adları yasaklı listeye
     alıp KAYNAKLARINI — repoda duran `veriler.ornek/` dosyalarını —
     sızıntı ilan ediyor. Temiz bir klonda `veriler/` yalnızca örneklerden
     oluştuğu için orada da aynı şey oluyordu.

     Ölçüt bilerek "bayt bayt aynı": dosya düzenlendiği anda artık örnek
     değil, kendi verin sayılıyor ve koruma geri geliyor.
  */
  const ornekler = new Map();
  for (const d of dosyalariTara(resolve(kok, 'apps/demo/src/veriler.ornek'), '.ts')) {
    ornekler.set(basename(d), readFileSync(d, 'utf8'));
  }

  // 1) demo veri dosyaları — ad, telefon, whatsapp, alan adı
  let demoSayisi = 0;
  for (const d of dosyalariTara(resolve(kok, 'apps/demo/src/veriler'), '.ts')) {
    const m = readFileSync(d, 'utf8');
    if (ornekler.get(basename(d)) === m) continue; // dokunulmamış örnek

    /*
       SADECE ISLETMENIN KENDI ADI — hizmet ve menu basliklari DEGIL.
       Demo dosyasindaki her `ad:` alanini almak, "Ulaşım ve otopark",
       "Çocuklu aileler", "Serpme kahvaltı" gibi sablondan gelen jenerik
       basliklari da yasakli listeye sokuyordu. Sonuc: sablonlar.ts kendi
       metnini sizinti sanip alarm veriyordu.

       Isletme adi `isletmeTaslakSemasi.parse({...})` blogunun ILK `ad`
       alani; sonrakiler hizmetler/menu icinde kaliyor.
    */
    const taslak = m.indexOf('isletmeTaslakSemasi.parse(');
    if (taslak !== -1) {
      adEkle(m.slice(taslak).match(/["']?ad["']?:\s*["']([^"']{6,})["']/)?.[1]);
      demoSayisi++; // index.ts gibi taslak taşımayan dosyalar sayılmasın
    }

    for (const [re, kip] of [
      // Yorum yazarlari: ucuncu kisilerin gercek adlari, kosulsuz yasakli.
      [/["']?yazar["']?:\s*["']([^"']{6,})["']/g, adEkle],
      [/["']?telefon["']?:\s*["']([^"']+)["']/g, ekle],
      [/["']?whatsapp["']?:\s*["']([^"']+)["']/g, ekle],
      [/["']?mapsPlaceId["']?:\s*["']([^"']+)["']/g, ekle],
    ]) {
      for (const e of m.matchAll(re)) kip(e[1]);
    }
  }

  // 2) panel durumları — anahtarlar demo kimlikleri
  let panelSayisi = 0;
  const panel = resolve(kok, 'tools/panel/veri/durumlar.json');
  if (existsSync(panel)) {
    try {
      const anahtarlar = Object.keys(JSON.parse(readFileSync(panel, 'utf8')));
      for (const k of anahtarlar) adEkle(k);
      panelSayisi = anahtarlar.length;
    } catch { /* bozuksa atla */ }
  }

  /*
     3) tarama çıktısı — telefon ve site.

     KURU MOD ÇIKTISI HARİÇ. `--kuru` kendi hayali fikstürlerini out/kuru/
     altına yazıyor; onu gerçek tarama sanmak, fikstür değerlerini yasaklı
     listeye sokup fixtures.mjs'nin kendisini sızıntı ilan ediyordu.
     Her kuru koşudan sonra denetçinin kızması, tam da kimsenin ona
     bakmamasını sağlayacak türden bir gürültü.
  */
  /*
     PLATFORM ALAN ADLARI YASAKLANMIYOR.

     Bir işletmenin Google kaydındaki "site" alanı her zaman kendi alan
     adı değil: çoğu küçük işletme oraya Instagram profilini ya da bir
     WhatsApp bağlantısını yazıyor. O değer olduğu gibi yasaklı listeye
     girdiğinde `instagram.com` ve `api.whatsapp.com` gibi alan adları
     "gerçek işletme verisi" sayılıyor — ve bunlara kaynak kodunda
     meşru olarak atıfta bulunan dosyalar sızıntı ilan ediliyor.

     Tam olarak bu yaşandı: perakende ve otomotiv taramaları eklendiğinde
     `api.whatsapp.com` yasaklı terime dönüştü ve `config.mjs`in KENDİ
     sosyal host listesini bloke etti.

     Bu alan adları kimseyi tanımlamıyor. "Bir işletme WhatsApp
     kullanıyor" bilgisi hangi işletme olduğunu söylemiyor; koruma
     değeri sıfır, yanlış alarm maliyeti yüksek. Liste taramanın kendi
     tanımından okunuyor ki tek yerde kalsın.
  */
  let platformHostlari = new Set();
  try {
    const cfg = readFileSync(resolve(kok, 'tools/prospect/src/config.mjs'), 'utf8');
    const blok = cfg.match(/SOSYAL_HOSTLAR\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? '';
    for (const m of blok.matchAll(/'([^']+)'/g)) platformHostlari.add(m[1].toLowerCase());
  } catch { /* config okunamazsa koruma aynen calisir, sadece yanlis alarm riski kalir */ }

  let hamSayisi = 0;
  for (const ham of dosyalariTara(resolve(kok, 'tools/prospect/out'), 'ham.json')) {
    if (/[\\/]kuru[\\/]/.test(ham)) continue;
    try {
      const kayitlar = JSON.parse(readFileSync(ham, 'utf8'));
      for (const k of kayitlar) {
        ekle(k.telefon);
        if (!k.site) continue;
        const host = String(k.site).replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');
        /*
           TAM EŞLEŞME, alt alan adı DEĞİL.

           İlk hâli `host.endsWith('.' + p)` de sayıyordu ve bu yanlıştı:
           `bir-firma.blogspot.com` ya da `bir-firma.wordpress.com`
           platformun kendisi değil, o platformda barınan BİR İŞLETMEYİ
           tanımlıyor. Alt alan adını muaf tutmak, korumayı tam da
           koruması gereken yerde deler.

           `instagram.com/kullanici` zaten sorun değil: yol kısmı
           yukarıda kırpılıyor, geriye yalnızca platform adı kalıyor.
        */
        if (!platformHostlari.has(host.toLowerCase())) ekle(host);
      }
      hamSayisi += kayitlar.length;
    } catch { /* atla */ }
  }

  return {
    terimler: [...terim],
    kaynaklar: [
      { ad: 'demo dosyaları', adet: demoSayisi, birim: 'işletme' },
      { ad: 'panel durumları', adet: panelSayisi, birim: 'kayıt' },
      { ad: 'tarama çıktısı', adet: hamSayisi, birim: 'kayıt' },
    ],
  };
}

/**
 * Yasaklı terimlerden telefon numaralarının RAKAM ÇEKİRDEĞİNİ çıkarır.
 *
 * NEDEN: düz metin karşılaştırması numaranın yazımına bağlı. Yasaklı liste
 * "0380 555 55 55" içeriyorsa aynı numaranın "+903805555555" hali FARKLI
 * bir dize; denetçi onu görmüyordu. Nitekim bir test yorumunda tam olarak
 * bu biçimde duruyordu ve ilk taramalarda hiç yakalanmadı.
 *
 * Çözüm: numarayı rakamlara indir, ülke kodunu ve baştaki sıfırı at,
 * kalan 10 hanelik aboneyi ara. Taranan satır da aynı şekilde rakama
 * indiriliyor, böylece boşluk/tire/parantez/+90 farkı önemsizleşiyor.
 */
function yasakliNumaralar(terimler) {
  const cekirdek = (s) => String(s).replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '');
  const kume = new Set();
  for (const t of terimler) {
    // Alan adlarında da rakam olabiliyor; sadece telefona benzeyenler.
    if (/[a-zA-Z]/.test(t)) continue;
    const c = cekirdek(t);
    if (c.length !== 10) continue;
    // Bilerek yayınlanan kurgu numaralar buraya girmemeli — bu kontrol
    // ham rakam üzerinden çalıştığı için IZINLI'yi kendisi sormak zorunda.
    if (izinliMi(t) || KURGU_NUMARA.has(c)) continue;
    kume.add(c);
  }
  return [...kume];
}

/**
 * Türkçe duyarlı katlama: büyük/küçük harf ve aksan farkını siler.
 *
 * NEDEN: düz `includes` harfe duyarlı. Demo dosyasında işletme
 * "Arslan Koltuk Döşeme & Tekstil" diye kayıtlıyken bir test fikstüründe
 * "ARSLAN KOLTUK DÖŞEME & TEKSTİL" yazıyordu — aynı işletme, farklı dize,
 * denetçi görmedi. Maps adlarının çoğu tamamen büyük harf geldiği için
 * bu istisna değil, kural.
 *
 * `toLowerCase()` tek başına yetmiyor: Türkçe'de İ→i eşlemesi ve ş/ç/ğ
 * gibi harflerin aksansız yazımı da eşleşmeli.
 */
const TR = { ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', I: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
const katla = (s) =>
  s.replace(/[çğıİöşüÇĞIÖŞÜ]/g, (h) => TR[h]).toLowerCase();

// ─────────────────────────────────────────────── kalıp kuralları

const KALIPLAR = [
  ['TR cep telefonu', /(?:\+90|0)\s?5\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g],
  /*
     SABIT HAT — iki bicim.

     Once yalniz parantezli yazim taniniyordu, `(0264) 555 55 55` gibi.
     Ayni numaranin `0380 555 55 55` yazimi hicbir kalibin altina
     dusmuyordu; gercek bir numara tam bu delikten gecti ve ancak
     bagimsiz inceleme yakaladi. Simdi ikisi de kapali.
  */
  ['TR sabit hat', /\(0\d{3}\)\s?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g],
  ['TR sabit hat', /(?:\+90|0)\s?(?:2[1-9]\d|3[1-9]\d|4[1-9]\d)[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/g],
  ['e-posta', /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g],
  ['Google API anahtarı', /AIza[0-9A-Za-z_-]{35}/g],
  ['Google Places kimliği', /places\/Ch[A-Za-z0-9_-]{10,}|\bCh[IJ][A-Za-z0-9_-]{20,}/g],
  ['Google/Instagram görsel adresi', /(lh\d\.googleusercontent\.com|cdninstagram\.com|fbcdn\.net)/g],
  ['Maps cid bağlantısı', /maps\.google\.com\/\?cid=\d+/g],
  /*
     KOORDINAT — Turkiye'nin tamami.

     Onceki aralik (enlem 40-41, boylam 30-31) yalnizca Duzce cevresini
     kapsiyordu; baska bir ilde calisan biri icin kural islevsizdi.
  */
  ['koordinat', /\b(3[6-9]|4[0-2])\.\d{5,},\s?(2[6-9]|3\d|4[0-5])\.\d{5,}\b/g],
];

/**
 * Bilerek yayınlanan, sızıntı sayılmayan değerler.
 *
 * FIKSTUR SOZLESMESI — repodaki her hayali işletme bu iki kuralı tutar:
 *
 *   Alan adı  →  `.example` (RFC 2606'da bu iş için ayrılmış; kimse
 *                kaydettiremez, dolayısıyla kimsenin olamaz)
 *   Telefon   →  `... 555 55 55` ile biter
 *
 * Sebep: fikstürler gerçek görünmek zorunda — şema doğrulaması, başlık
 * uzunluğu eşikleri ve WhatsApp bağı hep gerçekçi veriyle sınanıyor.
 * Ama "gerçekçi" ile "gerçek" arasındaki farkı gözle ayırt etmek zor.
 * Bu iki kalıp farkı MAKINEYE gösteriyor: kalıba uymayan her numara ve
 * her alan adı sızıntı sayılıyor, uyan hiçbiri kimsenin değil.
 */
const IZINLI = [
  /noreply@anthropic\.com/,
  // RFC 2606 / RFC 6761 — kayda kapalı adlar.
  /@example\.(com|org|net)\b/i,
  /\.(example|test|invalid|localhost)\b/i,
  /*
     E-POSTA MUAFIYETI BASA SABITLENDI.

     Eskiden `/ornek@|example@|test@/` idi ve dizenin HERHANGI bir yerinde
     eslesiyordu: gerçek bir işletmenin `test@<firma>.com.tr` adresi
     sessizce aklanıyordu. Artık yalnız yerel kısım bunlarla BASLIYORSA
     muaf.
  */
  /^(ornek|example|test|info|noreply)@(example|test|invalid|localhost)\./i,
];

/**
 * Kurgu telefon numaraları — AÇIK LİSTE, kalıp değil.
 *
 * Eskiden `555 55 55` ile biten HER numara muaftı. Ama gerçek bir cep
 * numarası da o altı haneyle bitebilir ve o kural onu sessizce
 * aklıyordu — bağımsız bir inceleme bunu deneyle gösterdi.
 *
 * Kalıp yerine açık liste, çünkü burada bakımsızlık riski yok: yeni bir
 * fikstür numarası eklendiğinde denetçi onu YAKALAR ve sen buraya
 * eklersin. Yani liste eskirse test kırmızıya döner — sessizce
 * gevşemez. Kapalı tarafa düşen bir liste güvenlidir.
 */
const KURGU_NUMARA = new Set([
  '3805555555', // 0380 555 55 55 — Düzce
  '2125555555', // 0212 555 55 55 — İstanbul
  '3745555555', // 0374 555 55 55 — Bolu
  '2645555555', // 0264 555 55 55 — Sakarya
  '5555555555', // 0555 555 55 55 — cep
]);

const numaraCekirdegi = (s) =>
  String(s).replace(/\D/g, '').replace(/^90/, '').replace(/^0/, '');

/** Bilerek yayınlanan bir değer mi? */
const izinliMi = (metin) =>
  IZINLI.some((iz) => iz.test(metin)) || KURGU_NUMARA.has(numaraCekirdegi(metin));

/**
 * ÖRNEK FİKSTÜR SÖZLEŞMESİ — `veriler.ornek/` içindekiler gerçekten hayali mi?
 *
 * NEDEN AYRI BİR KONTROL GEREKTİ
 *
 * Yukarıda, `veriler/` içinde `veriler.ornek/` ile bayt bayt aynı olan
 * dosyalar terim türetmede atlanıyor — kendi örneklerimizin kendilerini
 * sızıntı ilan etmesini önlemek için.
 *
 * Bağımsız bir inceleme bunun istismar edilebildiğini gösterdi: GERÇEK bir
 * demoyu her iki klasöre birden koyarsan türetme atlanıyor VE yayınlanan
 * kopya sıfır bulguyla geçiyor. "Bu demoyu örnek yapayım" hareketi sessiz
 * bir felakete dönüşüyordu.
 *
 * Kapatma yolu muafiyeti kaldırmak değil — o zaman örnekler yine kendilerini
 * suçlar. Doğrusu muafiyetin BEDELİNİ istemek: örnek klasöründeki her dosya
 * kurgu sözleşmesini kanıtlamak zorunda.
 *
 *   telefon/whatsapp  →  açık kurgu listesinde olacak
 *   alan adı / site   →  RFC 2606'da kayda kapalı bir ad olacak
 *   işletme adı       →  gerçek tarama havuzuyla ÇAKIŞMAYACAK
 *
 * Üçüncü kural sonradan eklendi: uydurduğumuz bir ad ("... Taş Döşeme")
 * ham havuzdaki gerçek bir işletmeyle çakıştı. Sözleşme alan adını ve
 * telefonu kapsıyordu ama adı kapsamıyordu.
 */
function ornekSozlesmesi() {
  const bulgu = [];
  const dizin = resolve(kok, 'apps/demo/src/veriler.ornek');
  if (!existsSync(dizin)) return bulgu;

  // Gerçek ad havuzu — yalnız bu kontrol için toplanıyor.
  const havuz = [];
  for (const ham of dosyalariTara(resolve(kok, 'tools/prospect/out'), 'ham.json')) {
    if (/[\\/]kuru[\\/]/.test(ham)) continue;
    try {
      for (const k of JSON.parse(readFileSync(ham, 'utf8'))) if (k.ad) havuz.push(katla(k.ad));
    } catch { /* atla */ }
  }

  const KAPALI = /\.(example|test|invalid|localhost)(\/|$|["'])/i;

  for (const d of dosyalariTara(dizin, '.ts')) {
    const yol = relative(kok, d).split('\\').join('/');
    const tam = readFileSync(d, 'utf8');
    const satirlar = tam.split('\n');

    satirlar.forEach((satir, i) => {
      const ekle = (tur, eslesen) => bulgu.push({ yol, satir: i + 1, tur, eslesen });

      for (const e of satir.matchAll(/["']?(telefon|whatsapp)["']?:\s*["']([^"']+)["']/g)) {
        if (!KURGU_NUMARA.has(numaraCekirdegi(e[2]))) {
          ekle('örnek fikstür: kurgu olmayan telefon', e[2]);
        }
      }
      for (const e of satir.matchAll(/["']?(alanAdi|site|eposta)["']?:\s*["']([^"']+)["']/g)) {
        if (!KAPALI.test(e[2] + '"')) ekle('örnek fikstür: kayda açık alan adı', e[2]);
      }
    });

    /*
       AD ÇAKIŞMASI — yalnız İŞLETMENİN KENDİ ADI.

       İlk sürüm dosyadaki her `ad:` alanına bakıyordu ve "Kahvaltı",
       "Akçakoca", "Kilit taşı döşeme" gibi menü/hizmet/bölge başlıklarını
       gerçek işletmelerle çakışmış sayıyordu — 11 bulgunun 11'i gürültüydü.
       Gürültü yapan denetçi, olmayan denetçidir.
    */
    const taslak = tam.indexOf('isletmeTaslakSemasi.parse(');
    if (taslak === -1) continue;
    const ad = tam.slice(taslak).match(/["']?ad["']?:\s*["']([^"']{6,})["']/)?.[1];
    if (!ad) continue;

    const k = katla(ad);
    const carpisan = havuz.some(
      (h) => h.includes(k) || (k.includes(h) && h.split(/\s+/).length >= 2 && h.length >= 10),
    );
    if (carpisan) {
      const satirNo = satirlar.findIndex((s, i) => i > tam.slice(0, taslak).split('\n').length - 2 && s.includes(ad));
      bulgu.push({
        yol,
        satir: satirNo + 1,
        tur: 'örnek fikstür: adı gerçek bir işletmeyle çakışıyor',
        eslesen: ad,
      });
    }
  }
  return bulgu;
}

// ─────────────────────────────────────────────── tarama

const { metin: dosyalar, taranmayan } = yayinlanacaklar();
const { terimler: yasak, kaynaklar } = yasaklilar();
const yasakKatli = yasak.map((t) => ({ ham: t, katli: katla(t) }));
const yasakNumara = yasakliNumaralar(yasak);
const bulgular = [];

/*
   TAM DENETİM Mİ, KISMİ Mİ?

   Denetçinin iki yarısı var: KALIP kuralları (telefon biçimi, e-posta,
   API anahtarı — her yerde çalışır) ve GERÇEK VERİ karşılaştırması
   (yereldeki demo/panel/tarama dosyalarından türetiliyor).

   İkinci yarı CI'da ÇALIŞAMAZ, çünkü o dosyalar tanım gereği repoda yok.
   Bu bir arıza değil; ama "✔ Sızıntı yok" yazıp geçmek yanlış güven verir:
   denetçi işinin yarısını yapmışken tamamını yapmış gibi görünür.
   O yüzden mod açıkça yazılıyor.
*/
const veriKaynagiVar = kaynaklar.some((k) => k.adet > 0);

for (const yol of dosyalar) {
  let metin;
  try {
    metin = readFileSync(resolve(kok, yol), 'utf8');
  } catch {
    continue;
  }
  const satirlar = metin.split('\n');
  const katliSatirlar = satirlar.map(katla);

  satirlar.forEach((satir, i) => {
    for (const [ad, re] of KALIPLAR) {
      re.lastIndex = 0;
      for (const e of satir.matchAll(re)) {
        if (izinliMi(e[0])) continue;
        bulgular.push({ yol, satir: i + 1, tur: ad, eslesen: e[0].slice(0, 60) });
      }
    }
    for (const t of yasakKatli) {
      if (katliSatirlar[i].includes(t.katli) && !izinliMi(t.ham)) {
        bulgular.push({ yol, satir: i + 1, tur: 'gerçek işletme verisi', eslesen: t.ham.slice(0, 60) });
      }
    }

    // Biçimden bağımsız telefon kontrolü — "+903805555555" ile
    // "0380 555 55 55" aynı numara.
    const rakamlar = satir.replace(/\D/g, '');
    if (rakamlar.length >= 10) {
      for (const n of yasakNumara) {
        if (rakamlar.includes(n)) {
          bulgular.push({ yol, satir: i + 1, tur: 'telefon (biçimden bağımsız)', eslesen: n });
        }
      }
    }
  });
}

bulgular.push(...ornekSozlesmesi());

// ─────────────────────────────────────────────── rapor

console.log(`\n  Taranan dosya : ${dosyalar.length}`);
console.log(`  Kalıp kuralı  : ${KALIPLAR.length} (telefon, e-posta, API anahtarı, Maps kimliği…)`);
console.log(`  Taranmayan    : ${taranmayan} (metin olmayan dosya — görsel, ikili)`);

if (veriKaynagiVar) {
  const ozet = kaynaklar
    .filter((k) => k.adet > 0)
    .map((k) => `${k.adet} ${k.birim} · ${k.ad}`)
    .join('\n                  ');
  console.log(`  Yasaklı terim : ${yasak.length}, şuralardan türetildi:`);
  console.log(`                  ${ozet}`);
} else {
  console.log('  Yasaklı terim : 0 — yerel gerçek veri bulunamadı');
}

if (bulgular.length) {
  const gruplu = new Map();
  for (const b of bulgular) {
    if (!gruplu.has(b.yol)) gruplu.set(b.yol, []);
    gruplu.get(b.yol).push(b);
  }

  console.log(`\n  ✘ ${bulgular.length} SIZINTI · ${gruplu.size} dosya\n`);
  for (const [yol, liste] of [...gruplu].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${yol}  (${liste.length})`);
    const gosterilecek = liste.slice(0, 6);
    for (const b of gosterilecek) {
      console.log(`      satır ${String(b.satir).padStart(4)} · ${b.tur} · ${b.eslesen}`);
    }
    if (liste.length > gosterilecek.length) {
      console.log(`      … ${liste.length - gosterilecek.length} tane daha`);
    }
    console.log();
  }
  process.exit(1);
}

if (veriKaynagiVar) {
  console.log('\n  ✔ TAM DENETİM — sızıntı yok, yayına uygun.\n');
  process.exit(0);
}

/*
   Kalıplar temiz ama gerçek veri karşılaştırması hiç koşmadı.
   Çıkış kodu 2 — ne 0 ne 1. Bu koşu bir şey KANITLAMADI, sadece
   elindekiyle bir şey bulamadı; ikisi aynı cümle değil.
*/
console.log(`
  ⚠ KISMİ DENETİM — kalıp kuralları temiz, gerçek veri karşılaştırması KOŞMADI.

    Denetçi yasaklı terimleri yereldeki demo, panel ve tarama dosyalarından
    türetiyor. Bunların hiçbiri bulunamadı — CI'da normal, çünkü o dosyalar
    tanım gereği repoda yok.

    Yakalanabilenler  : biçimi belli olan her şey (telefon, e-posta,
                        API anahtarı, Maps kimliği, koordinat)
    Yakalanamayanlar  : gerçek işletme ADLARI, alan adları ve
                        demo slug'ları — bunlar ancak yerel veriyle bilinir

    Yayın kararı için bu çıktı YETMEZ. \`npm run sizinti\` gerçek verinin
    durduğu makinede en az bir kez tam modda yeşil vermeli.
`);
process.exit(2);
