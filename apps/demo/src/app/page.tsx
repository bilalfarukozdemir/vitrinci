import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DEMOLAR, SLUGLAR } from '@/veriler/index';

export const metadata: Metadata = {
  title: 'Demolar',
  robots: { index: false, follow: false },
};

/**
 * Demo listesi — SADECE GELISTIRME ORTAMINDA.
 *
 * Uretimde 404 doner. Sebep gercek bir aciktan geliyor: prospect'e
 * gonderilen linkten son segmenti silen biri, hedeflenen butun
 * isletmelerin listesine ulasiyordu.
 *
 * Iki ayri zarar vardi:
 *   1. Prospect listesi — is sirri — herkese aciktı
 *   2. "Kimseye gondermedim, sadece siz gorun diye" cumlesi curuyordu
 *
 * robots.txt tarayiciyi durdurur, INSANI DURDURMAZ. Erisimi kesen tek
 * sey sayfanin uretimde var olmamasi.
 *
 * Listeye bakmak icin: npm run dev --workspace=@studio/demo
 */
export default function Liste() {
  if (process.env.NODE_ENV === 'production') notFound();

  return <ListeIcerik />;
}

function ListeIcerik() {
  return (
    <div className="ic-liste">
      <h1>Demolar</h1>
      <p>
        İç kullanım. Yeni demo eklemek için:
        <code>node apps/demo/scripts/ekle.mjs &lt;tarama-klasörü&gt; &lt;slug&gt;</code>
      </p>

      {SLUGLAR.length === 0 ? (
        <p className="bos">Henüz demo yok.</p>
      ) : (
        <ul>
          {SLUGLAR.map((slug) => {
            const { isletme } = DEMOLAR[slug]!;
            const onayli = isletme.kaynak.musteriOnayli;
            return (
              <li key={slug}>
                <a href={`/${slug}`}>{isletme.ad}</a>
                <span>
                  {isletme.adresler[0]?.il ?? '—'} · {isletme.sektor ?? '—'}
                  {onayli ? ' · onaylı' : ' · taslak'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
