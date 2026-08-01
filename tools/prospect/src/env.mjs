import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const kokDizin = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * .env dosyasini process.env icine yukler. Node surumunden bagimsiz calissin diye
 * --env-file yerine elle okuyoruz. Zaten tanimli olan degiskenleri ezmez.
 */
export function envYukle() {
  const yol = resolve(kokDizin, '.env');
  if (!existsSync(yol)) return;

  for (const satir of readFileSync(yol, 'utf8').split(/\r?\n/)) {
    const temiz = satir.trim();
    if (!temiz || temiz.startsWith('#')) continue;

    const ayirac = temiz.indexOf('=');
    if (ayirac === -1) continue;

    const anahtar = temiz.slice(0, ayirac).trim();
    let deger = temiz.slice(ayirac + 1).trim();

    // Cift veya tek tirnakla sarilmis degerleri soy.
    if (deger.length >= 2 && /^(".*"|'.*')$/s.test(deger)) deger = deger.slice(1, -1);

    if (!(anahtar in process.env)) process.env[anahtar] = deger;
  }
}

export { kokDizin };
