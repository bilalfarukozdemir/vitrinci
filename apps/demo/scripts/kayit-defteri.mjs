/**
 * `src/veriler/index.ts` kayit defterini uretir.
 *
 * NEDEN AYRI DOSYA: iki ureten var — `ekle.mjs` (gercek tarama ciktisindan
 * demo olusturur) ve `ornek.mjs` (hayali ornek fiksturleri kopyalar). Ikisi
 * de ayni defteri yazmak zorunda. Kopyalanmis iki surum sessizce ayrisir:
 * birine yeni bir alan eklenir, otekinden eklenmez, ve fark ancak build
 * patladiginda goze carpar.
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Dizindeki demo dosyalarini tarayip index.ts'i yeniden yazar.
 *
 * Defter dizinin GERCEK icerigi'nden turetiliyor, bir listeden degil —
 * dosya elle silinse bile defter dogru kaliyor.
 *
 * @param {string} veriDizin `src/veriler` mutlak yolu
 * @returns {string[]} deftere giren slug'lar
 */
export function kayitDefteriYaz(veriDizin) {
  const dosyalar = readdirSync(veriDizin)
    .filter((d) => d.endsWith('.ts') && d !== 'index.ts')
    .map((d) => d.replace(/\.ts$/, ''))
    .sort();

  writeFileSync(
    resolve(veriDizin, 'index.ts'),
    `/**
 * Demo kayit defteri — OTOMATIK URETILIYOR.
 * Elle duzenleme; \`npm run ornek\` ve \`ekle.mjs\` yeniden yaziyor.
 */
import type { Demo } from '@/tipler';

${dosyalar.map((s, i) => `import demo${i} from './${s}.ts';`).join('\n')}

export const DEMOLAR: Record<string, Demo> = {
${dosyalar.map((s, i) => `  ${JSON.stringify(s)}: demo${i},`).join('\n')}
};

export const SLUGLAR = Object.keys(DEMOLAR);
`,
    'utf8',
  );

  return dosyalar;
}
