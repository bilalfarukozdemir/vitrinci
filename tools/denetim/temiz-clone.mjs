/**
 * TEMİZ KLON TESTİ — repoyu klonlayan birinin gördüğü şeyi kurar ve çalıştırır.
 *
 *   node tools/denetim/temiz-clone.mjs
 *   node tools/denetim/temiz-clone.mjs --tut     (geçici klasörü silme)
 *
 * ─────────────────────────────────────────────────────────────────────
 * NE KANITLIYOR
 *
 * Açık kaynak yapmanın şartı tek cümleyle şu: HASSAS VERİ GİTMESİN AMA
 * YENİ KURAN ÇALIŞTIRABİLSİN. İki yarısı da tahmine dayanamaz.
 *
 *   Birinci yarı — `git ls-files`'ın döndürdüğü dosyalarda `veriler/`,
 *   `foto/`, `out/`, `panel/veri/` gibi yolların HİÇBİRİ bulunmamalı.
 *
 *   İkinci yarı — o dosyalarla sıfırdan kurup çalıştırmak MÜMKÜN olmalı:
 *   npm install → kontrol → ornek → build. Dördü de geçmeli.
 *
 * Sızıntı denetçisi (`npm run sizinti`) içeriğe bakıyor: yayınlanacak
 * dosyalarda gerçek veri geçiyor mu. Bu test ise yapıya bakıyor: doğru
 * dosyalar mı gidiyor ve gidenler yetiyor mu. İkisi farklı soru.
 *
 * ─────────────────────────────────────────────────────────────────────
 * NEDEN HASSAS YOL LİSTESİ ELLE TUTULUYOR
 *
 * Sızıntı denetçisinde kara liste bilerek türetiliyor — elle tutulan liste
 * bakımsız kalır. Burada tersi doğru: bu liste .gitignore'dan TÜRETİLMEMELİ.
 *
 * Sebep, ikisinin farklı soruları cevaplaması. .gitignore bir yapılandırma;
 * bu liste ise bir NİYET BEYANI. Listeyi .gitignore'dan türetirsek, biri
 * .gitignore'dan `apps/demo/src/veriler/` satırını sildiğinde test de
 * onunla birlikte fikrini değiştirir ve mutlu mesut geçer. İkisi birbirini
 * doğrulamaz, birbirini tekrar eder.
 *
 * Bağımsız yazılmış olması testin bütün değeri. Kısa tutuluyor: buraya
 * sadece "asla yayınlanmamalı" diyebileceğimiz yollar giriyor.
 * ─────────────────────────────────────────────────────────────────────
 *
 * Çıkış kodu 0 = klon temiz ve çalışıyor, 1 = değil.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const tut = process.argv.includes('--tut');

/**
 * Yayınlanan repoda ASLA bulunmaması gereken yollar.
 * Yukarıdaki başlıkta neden elle tutulduğu yazıyor — türetme.
 */
const YASAK_YOLLAR = [
  ['apps/demo/src/veriler/', 'üçüncü kişilerin adı, telefonu, Google yorumları'],
  ['apps/demo/public/foto/', 'telifi bize ait olmayan işletme fotoğrafları'],
  ['apps/demo/eski-yollar.json', 'gönderilmiş demo linklerinin gerçek slugları'],
  ['apps/pazarlama/', 'kişisel pazarlama sitesi'],
  ['vercel.pazarlama.json', 'pazarlama sitesinin yapılandırması'],
  ['tools/ekran/', 'vaka görüntüsü aracı, gerçek müşteri siteleri listeli'],
  ['tools/prospect/out/', 'tarama çıktısı — işletme listeleri ve iletişim bilgileri'],
  ['tools/prospect/src/fixtures.yerel.mjs', 'kalibrasyon için gerçek siteler'],
  ['tools/panel/veri/', 'hangi işletmeyle ne konuşulduğu, anlaşılan fiyatlar'],
  ['tools/gsc/veri/', 'Search Console dışa aktarımları'],
  ['veri/', 'dışarıdan gelen ham veri'],
  ['tools/denetim/gecici/', 'denetçinin geçici çıktıları'],
  ['ACIK-KAYNAK-DURUM.md', 'açık kaynak hazırlığının iç mutfağı'],
  ['NOTLAR-YEREL.md', 'kişisel deploy komutları ve proje adları'],
  // `.env` KURALI SONA YAZILDI, cunku ozel: asagidaki eslesme mantigi
  // ismi `/` ile bitmeyen kurallari TAM YOL sayiyor. `.env` kokte
  // aranirken asil anahtarin durdugu `tools/prospect/.env` kaciyordu —
  // bagimsiz bir inceleme bunu buldu. Artik ad bazli eslesiyor.
  ['*.env', 'API anahtarları — hangi klasörde olursa olsun'],
  ['*.env.local', 'yerel ortam değişkenleri'],
];

// ─────────────────────────────────────────────── yardımcılar

const sure = (ms) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} sn`);

let adimNo = 0;
const TOPLAM = 7;
const basla = (baslik) => {
  adimNo++;
  process.stdout.write(`  [${adimNo}/${TOPLAM}] ${baslik.padEnd(34)}`);
  return Date.now();
};
const bitti = (t0, mesaj) => console.log(`${mesaj}  · ${sure(Date.now() - t0)}`);

/*
   Klasör yolu burada tutuluyor ki `oldu()` başarısızlıkta da temizleyebilsin.
   Temizlemeseydi her başarısız koşu geride kurulu bir node_modules bırakırdı
   — birkaç yüz MB, sessizce, tekrar tekrar.
*/
let klon = null;

function oldu(sebep, ayrinti) {
  console.log(`\n\n  ✘ TEMİZ KLON TESTİ BAŞARISIZ\n\n    ${sebep}\n`);
  if (ayrinti) console.log(`${ayrinti}\n`);

  if (klon && !tut) rmSync(klon, { recursive: true, force: true });
  console.log(
    tut && klon
      ? `  Geçici klasör inceleme için duruyor:\n  ${klon}\n`
      : '  Tekrar denerken --tut ver, geçici klasör silinmesin.\n',
  );
  process.exit(1);
}

/**
 * Komutu klon içinde çalıştırır; patlarsa çıktının kuyruğuyla durur.
 *
 * Komut TEK DİZE olarak veriliyor, argüman dizisi olarak değil. Sebebi
 * Windows: `npm` aslında `npm.cmd`, ve onu kabuk olmadan çalıştırmak
 * ENOENT veriyor. `shell: true` + argüman dizisi ise Node'un DEP0190
 * uyarısını tetikliyor (argümanlar kabuğa kaçışsız birleştiriliyor).
 * Tek dize ikisini de çözüyor — komutlar sabit, dışarıdan girdi almıyor.
 */
function calistir(baslik, komut, klon) {
  const t0 = basla(baslik);
  const sonuc = spawnSync(komut, {
    cwd: klon,
    shell: true,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, CI: '1', NEXT_TELEMETRY_DISABLED: '1' },
  });

  const cikti = `${sonuc.stdout ?? ''}${sonuc.stderr ?? ''}`;
  if (sonuc.status !== 0) {
    bitti(t0, '✘');
    // status null = süreç hiç başlamadı; sebebi `error` alanında.
    const sebep = sonuc.error
      ? `\`${komut}\` başlatılamadı: ${sonuc.error.message}`
      : `\`${komut}\` çıkış kodu ${sonuc.status} verdi.`;
    oldu(sebep, cikti.split('\n').slice(-30).join('\n'));
  }
  return { cikti, t0 };
}

// ─────────────────────────────────────────────── 1. dosyaları topla

console.log('\n  TEMİZ KLON TESTİ\n');

let t = basla('Yayınlanacak dosyalar');

/*
   Henüz commit atılmadığı için `git archive HEAD` kullanılamıyor.
   `-c -o --exclude-standard` = izlenen + izlenmeyen ama dışlanmamış,
   yani "şu an commit atsak repoya ne girerdi". Denetçi de aynı listeyi
   kullanıyor; ikisinin aynı tanımda anlaşması önemli.
*/
let gitCikti;
try {
  gitCikti = execFileSync('git', ['ls-files', '-c', '-o', '--exclude-standard'], {
    cwd: kok,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
} catch {
  // ZIP indiren kullanici — bkz. sizinti.mjs'deki ayni durum.
  bitti(t, '✘');
  oldu(
    'Bu klasör bir git deposu değil.\n' +
      '    Bu test "git\'in yayınlayacağı dosyalar" tanımı üzerine kurulu;\n' +
      '    ZIP olarak indirilen bir klasörde çalışamaz. `git clone` ile al.',
  );
}

const dosyalar = gitCikti
  .split('\n')
  .map((s) => s.trim())
  .filter(Boolean);

if (!dosyalar.length) oldu('git hiç dosya döndürmedi — depo boş mu?');
bitti(t, `${String(dosyalar.length).padStart(3)} dosya`);

// ─────────────────────────────────────────────── 2. hassas yol denetimi

t = basla('Hassas yol denetimi');

/*
   Üç eşleşme biçimi:
     `dizin/`   → o önekle başlayan her yol
     `*.ad`     → hangi klasörde olursa olsun o adla biten dosya
     `tam/yol`  → birebir

   Ortadaki biçim sonradan eklendi: kural yalnız `.env` yazıyordu ve
   `d === '.env'` diye karşılaştırılıyordu, yani asıl anahtarın durduğu
   `tools/prospect/.env` hiçbir kurala takılmıyordu. Niyet beyanı en
   önemli sır için sessizdi.
*/
const eslesirMi = (d, yol) => {
  if (yol.endsWith('/')) return d.startsWith(yol);
  if (yol.startsWith('*')) {
    const son = yol.slice(1);
    return d === son.replace(/^\./, '') || d.endsWith(son) || d === son;
  }
  return d === yol;
};

const kacaklar = [];
for (const [yol, sebep] of YASAK_YOLLAR) {
  const eslesen = dosyalar.filter((d) => eslesirMi(d, yol));
  if (eslesen.length) kacaklar.push({ yol, sebep, eslesen });
}

if (kacaklar.length) {
  bitti(t, '✘');
  const ayrinti = kacaklar
    .map(
      ({ yol, sebep, eslesen }) =>
        `      ${yol}  (${sebep})\n` +
        eslesen.slice(0, 5).map((d) => `        · ${d}`).join('\n') +
        (eslesen.length > 5 ? `\n        … ${eslesen.length - 5} tane daha` : ''),
    )
    .join('\n\n');
  oldu(
    `Yayınlanacak listede ${kacaklar.length} hassas yol var.\n` +
      '    .gitignore\'a eklenmeleri gerekiyor.',
    ayrinti,
  );
}
/*
   KILIT DOSYASI AYRI KONTROL EDILIYOR.

   `package-lock.json` yayin listesinde ve yayinlanmasi gerekiyor (CI `npm ci`
   kullaniyor). Ama icinde WORKSPACE ADLARI duruyor: yayinlanmayan bir
   uygulama yereldeki disk uzerinde durdugu surece her `npm install` onu
   kilide geri yaziyor ve ozel projenin adi, surumu, bagimliliklari sizmis
   oluyor.

   Ne sizinti denetcisi ne de yukaridaki yol kontrolu bunu goruyordu —
   dosya adi masum, icerigi degil. Bagimsiz bir inceleme buldu.

   Cozum: kilidi yayinlanacak dosyalardan olusan gecici bir dizinde
   yeniden uret, sonra geri kopyala. Bu kontrol de unutulmadigini soyler.
*/
const kilit = dosyalar.find((d) => d === 'package-lock.json');
if (kilit) {
  const icerik = readFileSync(resolve(kok, kilit), 'utf8');
  const sizanlar = YASAK_YOLLAR
    .filter(([y]) => y.endsWith('/') && !y.startsWith('*'))
    .map(([y]) => y.replace(/\/$/, ''))
    .filter((y) => icerik.includes(`"${y}"`));

  if (sizanlar.length) {
    bitti(t, '✘');
    oldu(
      `package-lock.json yayınlanmayan workspace adı içeriyor: ${sizanlar.join(', ')}\n` +
        '    Yereldeki `npm install` onu geri yazmış olabilir. Kilidi temiz\n' +
        '    dosyalarla yeniden üret:\n\n' +
        '      git ls-files -c -o --exclude-standard | (geçici dizine kopyala)\n' +
        '      rm package-lock.json && npm install --package-lock-only\n' +
        '      (kilidi geri kopyala)',
    );
  }
}

bitti(t, `${String(YASAK_YOLLAR.length).padStart(3)} kural + kilit temiz`);

// ─────────────────────────────────────────────── 3. klonu kur

t = basla('Geçici klona kopyalanıyor');

/*
   Depo AĞACININ DIŞINA kopyalıyoruz. İçeride bir alt klasör olsaydı npm
   yukarı doğru yürüyüp asıl deponun workspace kökünü bulabilir ve klon
   asıl node_modules'ü kullanırdı — yani test, kanıtlamaya çalıştığı şeyi
   sessizce baypas ederdi.
*/
klon = mkdtempSync(join(tmpdir(), 'temiz-klon-'));

/*
   KOPYA SIRASINDA AĞACIN DEĞİŞMEDİĞİ DOĞRULANIYOR.

   Bu test bir ANLIK GÖRÜNTÜ hakkında hüküm veriyor: "şu dosyalar yayına
   uygun". Kopyalama sürerken biri dosyaları düzenliyorsa hüküm hiçbir
   sürüm hakkında doğru olmuyor — yarısı eski, yarısı yeni bir ağaç
   sınanmış oluyor.

   Bir kez tam olarak bu oldu ve teşhis etmesi pahalıydı: tek bir test
   patladı, yirmi denemede tekrarlanmadı, ve sebebin kod olmadığı ancak
   aynı kökte ikinci bir düzenleyici çalıştığı fark edilince anlaşıldı.
   Sessiz başarısızlık yerine açık bir hata mesajı, o saatleri geri veriyor.

   Boyut karşılaştırması kırpık okumayı, mtime karşılaştırması eş zamanlı
   düzenlemeyi yakalıyor. İkisi de ucuz.
*/
const damga = (y) => {
  const s = statSync(y);
  return `${s.size}:${s.mtimeMs}`;
};

const oncekiDamgalar = new Map();
for (const d of dosyalar) {
  const kaynak = resolve(kok, d);
  const hedef = resolve(klon, d);
  mkdirSync(dirname(hedef), { recursive: true });

  oncekiDamgalar.set(d, damga(kaynak));
  cpSync(kaynak, hedef);

  if (statSync(kaynak).size !== statSync(hedef).size) {
    oldu(`Kopya eksik çıktı: ${d} — dosya okunurken değişmiş olabilir.`);
  }
}

// Kopya bittikten sonra kaynağa geri bak: değişen oldu mu?
const oynayanlar = dosyalar.filter((d) => damga(resolve(kok, d)) !== oncekiDamgalar.get(d));
if (oynayanlar.length) {
  oldu(
    `Kopyalama sürerken ${oynayanlar.length} dosya değişti — ağaç sabit değil.\n` +
      '    Aynı depoda çalışan başka bir düzenleyici (editör, ajan, eşitleme\n' +
      '    istemcisi) varsa durmasını bekle; bu test hareketli bir hedef\n' +
      '    hakkında hüküm veremez.\n\n' +
      oynayanlar.slice(0, 8).map((d) => `      · ${d}`).join('\n'),
  );
}

bitti(t, `${String(dosyalar.length).padStart(3)} dosya`);

// ─────────────────────────────────────────────── 4. kurulum ve kontrol

const kurulum = calistir('npm install', 'npm install --no-audit --no-fund', klon);
bitti(kurulum.t0, 'bağımlılıklar kuruldu');

const kontrol = calistir('npm run kontrol', 'npm run kontrol', klon);
const testSayisi = kontrol.cikti.match(/# pass (\d+)|ℹ pass (\d+)/);
bitti(kontrol.t0, `${testSayisi ? (testSayisi[1] ?? testSayisi[2]) : '?'} test geçti`);

// ─────────────────────────────────────────────── 5. örnek fikstürler

/*
   BU SIRA TESTİN ASIL KONUSU.

   `src/veriler/` .gitignore'da, yani temiz klonda YOK. `npm run ornek`
   çalıştırılmadan `next build` "@/veriler bulunamadı" diye patlıyor.
   Aşağıdaki iki kontrol o bağımlılığı yazıya döküyor: önce klasörün
   gerçekten olmadığını, sonra komutun onu gerçekten oluşturduğunu
   doğruluyoruz. Biri değişirse belgelenen kurulum sırası yanlış demektir.
*/
const veriDizin = resolve(klon, 'apps/demo/src/veriler');

if (existsSync(veriDizin)) {
  oldu(
    'Temiz klonda `apps/demo/src/veriler/` VAR — olmamalıydı.\n' +
      '    Demek ki gerçek demo verisi yayınlanacak listeye girmiş.',
  );
}

const ornek = calistir('npm run ornek', 'npm run ornek', klon);

if (!existsSync(veriDizin) || !statSync(veriDizin).isDirectory()) {
  oldu('`npm run ornek` çalıştı ama `apps/demo/src/veriler/` oluşmadı.');
}
const demoSayisi = ornek.cikti.match(/Kayıt defteri: (\d+) demo/);
bitti(ornek.t0, `${demoSayisi ? demoSayisi[1] : '?'} örnek demo`);

// ─────────────────────────────────────────────── 6. build

const build = calistir('npm run build (demo)', 'npm run build --workspace=@studio/demo', klon);
bitti(build.t0, 'build tamam');

// ─────────────────────────────────────────────── temizlik

if (!tut) rmSync(klon, { recursive: true, force: true });

console.log(`
  ✔ TEMİZ KLON ÇALIŞIYOR

    ${dosyalar.length} dosya yayınlanıyor, hassas yolların hiçbiri içinde değil.
    Sıfırdan kurulup derleniyor: install → kontrol → ornek → build.
${tut ? `\n    Geçici klasör: ${klon}\n` : ''}`);
