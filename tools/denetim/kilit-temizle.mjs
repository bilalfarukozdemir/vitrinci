/*
   KILIT DOSYASINI YAYIN LISTESINDEN YENIDEN URETIR.

   Sorun tekrar eden cinsten: `package-lock.json` yayinlaniyor (CI `npm ci`
   kullaniyor) ama icinde WORKSPACE ADLARI duruyor. Yayinlanmayan bir
   uygulama — Bilal'in kendi pazarlama sitesi gibi — yerel diskte durdugu
   surece HER `npm install` onu kilide geri yaziyor. Ozel projenin adi,
   surumu ve bagimlilik agaci boylece herkese acik bir dosyaya sizmis
   oluyor.

   `temiz-clone.mjs` bunu YAKALIYOR ama duzeltmiyor; el ile yapilacak bir
   dans tarif ediyor. Dans her npm install'dan sonra tekrarlaniyor, yani
   er ya da gec atlanacak bir adim. Burasi onu otomatiklestiriyor.

   Nasil calisiyor: yalnizca YAYINLANACAK dosyalari depo agacinin DISINDA
   gecici bir dizine kopyalayip kilidi orada uretiyor. Disarida olmasi
   sart — iceride bir alt klasor olsaydi npm yukari yuruyup asil deponun
   workspace kokunu bulur ve gizlenen uygulamayi yine gorurdu.

   Kurulum YAPILMIYOR (`--package-lock-only`), yani agdan paket cekmiyor;
   yalnizca cozumleme yapiyor.
*/
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const tut = process.argv.includes('--tut');

const yaz = (s) => process.stdout.write(`${s}\n`);

// ── 1. yayinlanacak dosyalar: izlenen + izlenmeyen ama gitignore'da olmayan
const dosyalar = execFileSync('git', ['ls-files', '-c', '-o', '--exclude-standard'], {
  cwd: kok,
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
})
  .split('\n')
  .filter(Boolean);

yaz(`  ${dosyalar.length} yayınlanacak dosya`);

// ── 2. depo agacinin DISINA kopyala
const gecici = mkdtempSync(join(tmpdir(), 'vitrinci-kilit-'));

for (const d of dosyalar) {
  const kaynak = resolve(kok, d);
  if (!existsSync(kaynak)) continue; // silinmis ama henuz commit'lenmemis
  const hedef = join(gecici, d);
  mkdirSync(dirname(hedef), { recursive: true });
  cpSync(kaynak, hedef);
}

// ── 3. kilidi orada uret
rmSync(join(gecici, 'package-lock.json'), { force: true });

yaz('  kilit yeniden üretiliyor (kurulum yok)…');
execFileSync('npm', ['install', '--package-lock-only', '--ignore-scripts'], {
  cwd: gecici,
  stdio: ['ignore', 'ignore', 'inherit'],
  shell: process.platform === 'win32',
});

// ── 4. geri kopyala
const yeni = readFileSync(join(gecici, 'package-lock.json'), 'utf8');
const eski = existsSync(resolve(kok, 'package-lock.json'))
  ? readFileSync(resolve(kok, 'package-lock.json'), 'utf8')
  : '';

if (yeni === eski) {
  yaz('  kilit zaten temiz — değişiklik yok');
} else {
  writeFileSync(resolve(kok, 'package-lock.json'), yeni, 'utf8');
  yaz('  ✔ package-lock.json temizlendi');
}

if (tut) yaz(`  geçici dizin: ${gecici}`);
else rmSync(gecici, { recursive: true, force: true });
