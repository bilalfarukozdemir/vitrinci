import type { Demo } from '@/tipler';

/**
 * MENU — hem ana sayfadaki bolumde hem /menu sayfasinda ayni bilesen.
 *
 * Tasarim kararlari, arastirilmis QR menu kilavuzlarindan:
 *
 *   KATEGORI CIPLERI  Telefonda en cok kazandiran sey bu. 19 kalemlik
 *                     bir menude insan aradigi bolume kaydirarak
 *                     gitmiyor, vazgeciyor. Cipler yapiskan ust
 *                     cubugun altinda duruyor.
 *   ROZET             "Cok tercih edilen". Kalabalik listede insan ne
 *                     sececegini bilmiyor; rozet onun yerine seciyor.
 *                     SADECE Google yorumlarinda adi gecen tabaklara
 *                     veriliyor — uydurma degil, dogrulanabilir.
 *   FOTOGRAF          Satir ici kucuk kare. Her kaleme degil, elimizde
 *                     gercek fotografi olana.
 *   NOKTALI CIZGI     Ad ile fiyat arasinda. Basili menulerin duzeni;
 *                     goz ikisini bu sekilde esitliyor.
 *
 * Uygulanmayan bir oneri: alerjen/diyet etiketleri. Kilavuzlar onu
 * onemli buluyor ve hakli, ama bir tabagin vejetaryen olup olmadigini
 * disaridan BILEMEYIZ. Uydurmak, alerjisi olan birini hastaneye
 * gonderebilir. Musteri kendi girdiginde eklenir.
 */

/** Bölüm adından çapa kimliği. Türkçe harfler ASCII'ye iniyor. */
const capa = (ad: string) =>
  'menu-' +
  ad
    .toLocaleLowerCase('tr')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export function Menu({ menu, tam = false }: { menu: NonNullable<Demo['menu']>; tam?: boolean }) {
  const Baslik = tam ? 'h2' : 'h3';

  return (
    <>
      {menu.not && <p className="menu-not">{menu.not}</p>}

      {menu.bolumler.length > 2 && (
        <nav className="menu-cipler" aria-label="Menü bölümleri">
          {menu.bolumler.map((b) => (
            <a key={b.ad} href={`#${capa(b.ad)}`}>
              {b.ad}
            </a>
          ))}
        </nav>
      )}

      <div className={`menu-izgara${tam ? ' menu-izgara-tam' : ''}`}>
        {menu.bolumler.map((bolum) => (
          <section className="menu-bolum" id={capa(bolum.ad)} key={bolum.ad}>
            <Baslik>{bolum.ad}</Baslik>
            <ul>
              {bolum.urunler.map((u) => {
                /*
                   KART mi SATIR mi?

                   Kart olmasi icin hem oneCikan hem gorsel gerekiyor.
                   Sebep: 23 kalemin 3'unde 64px'lik minik kare olmasi
                   sayfayi "zengin" degil "eksik" gosteriyordu — goz her
                   satirda gorsel ariyor, bulamiyor. 23 fotografimiz yok
                   ve olmayacak.

                   Ya hepsi ya hicbiri. Satirlardan kucuk gorsel kalkti;
                   bolumun yildizi tam genislikte karta donustu. Bir
                   guclu gorsel an + temiz bir liste, basili menulerin
                   yuzyillik duzeni.

                   gorsel'i olup oneCikan olmayan kalemlerde alan veride
                   duruyor ama cizilmiyor — ilerde one cikarilirsa hazir.
                */
                const kart = Boolean(u.oneCikan && u.gorsel);
                return (
                  <li key={u.ad} className={kart ? 'menu-kart' : undefined}>
                    {kart && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="menu-kart-gorsel" src={u.gorsel} alt={u.ad} loading="lazy" />
                    )}
                    <div className="menu-govde">
                      <div className="menu-satir">
                        <span className="menu-ad">{u.ad}</span>
                        {/* Noktali cizgi AYRI bir flex ogesi. ::after olarak
                            yazilinca butun cocuklardan sonra diziliyordu ve
                            noktalar fiyatin ARDINDAN bosluga uzuyordu. */}
                        <span className="menu-nokta" aria-hidden="true" />
                        {u.fiyat && <span className="menu-fiyat">{u.fiyat}</span>}
                      </div>
                      {u.oneCikan && <span className="menu-rozet">çok tercih edilen</span>}
                      {u.aciklama && <p className="menu-aciklama">{u.aciklama}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
