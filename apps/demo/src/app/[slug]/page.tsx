import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { KonumIkonu, SohbetIkonu, TelefonIkonu } from '@/components/Ikon';
import { Menu } from '@/components/Menu';
import { qrSvg } from '@/qr';

import { coz } from '@studio/data';
import { anasayfaGrafi, anasayfaMetadata, baglamOlustur, ldMetni } from '@studio/seo';

import { DEMOLAR, SLUGLAR } from '@/veriler/index';

/**
 * Demolarin yayinlandigi alan adi.
 * Kendi alan adini aldiginda burayi 'demo.<alan-adin>' yap.
 */
const DEMO_ALAN = process.env.DEMO_ALAN ?? 'demo.local';

/*
   YAPIMCI KAYDI — varsayilan olarak YOK.

   Onceki surumde buraya bir isim ve link HARDCODE edilmisti. Repoyu
   klonlayan birinin musteriye gonderdigi demo, baskasinin musteri kazanma
   sayfasina link veriyordu. Raporlardaki iletisim blogu zaten `.env`'den
   okunuyordu; burasi tutarsiz kalmisti.

   Ikisi de bos birakilirsa blok hic basilmiyor — yeni kullanicinin
   sayfasi kimsenin reklamini yapmiyor.
*/
const YAPIMCI_AD = process.env.YAPIMCI_AD ?? '';
const YAPIMCI_URL = process.env.YAPIMCI_URL ?? '';

const metin = (deger: Parameters<typeof coz<string>>[0]) => coz(deger, 'tr', 'tr') ?? '';

export function generateStaticParams() {
  return SLUGLAR.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const demo = DEMOLAR[slug];
  if (!demo) return {};

  // Baslik ve aciklama @studio/seo'dan. WhatsApp'ta link paylasildiginda
  // onizleme karti bunlari gosteriyor — demo gonderiminde en cok goze
  // carpan sey bu, elle yazmiyoruz.
  return anasayfaMetadata(demo.isletme, 'tr', DEMO_ALAN);
}

export default async function DemoSayfasi({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demo = DEMOLAR[slug];
  if (!demo) notFound();

  const { isletme, vaat, basliklar } = demo;
  const adres = isletme.adresler[0];
  const gbp = isletme.gbpMetrikleri;
  const onayli = isletme.kaynak.musteriOnayli;

  const tel = isletme.iletisim.telefon;
  const wa = isletme.iletisim.whatsapp?.replace(/\D/g, '');
  const waLink = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(`Merhaba, ${isletme.ad} hakkında bilgi almak istiyorum.`)}`
    : undefined;

  const graf = anasayfaGrafi(isletme, 'tr', baglamOlustur(isletme, DEMO_ALAN));
  const bolge = adres?.ilce ?? adres?.il ?? isletme.hizmetVerilenBolgeler[0]?.ad;

  /**
   * KAPAK FOTOGRAFI — hero'nun arkasina tam genislikte giriyor.
   *
   * Neden: onceki surumde hero siyah bir ekranda isim ve iki dugmeden
   * ibaretti. Gercek musteri siteleri ekrani kaplayan bir fotografla
   * aciliyor; musteriye gonderilen prototip onun en guclu yanini
   * tasimiyordu.
   *
   * Kapak galeriden CIKARILIYOR — ayni kareyi iki kez gostermek
   * "az fotografi var" izlenimi veriyor.
   *
   * Fotografi olmayan isletmede (orn. sadece emlak kaydi) hero eski
   * haliyle, metin olarak calisiyor.
   */
  const kapak = isletme.galeri.find((g) => g.oneCikan) ?? isletme.galeri[0];
  const galeriKalan = isletme.galeri.filter((g) => g.url !== kapak?.url);

  // Google son yorumlari alaka sirasiyla donduruyor, puan sirasiyla degil —
  // gercek taramada bir isletmenin ilk dortlusunde 1 yildizli yorum cikti.
  // Musteriye gonderilen demoda kotu yorum gostermek amaci baltalar.
  // Secim yapiyoruz ama gizlemiyoruz: altta "tumunu Google'da gorun" linki var.
  const gosterilecekYorumlar = isletme.referanslar
    .filter((r) => (r.puan ?? 5) >= 4)
    .sort((a, b) => (b.puan ?? 0) - (a.puan ?? 0))
    .slice(0, 4);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldMetni(graf) }} />

      {/* Dogrulanmamis veriyi gizlemek yerine ACIKCA soyluyoruz. Hem durust
          hem de konusma baslaticisi: "yanlis bir sey varsa yazin". */}
      {!onayli && (
        <div className="taslak-serit" role="note">
          <strong>Bu bir taslak.</strong> Bilgiler Google işletme kaydınızdan alındı, tarafınızdan
          doğrulanmadı. Yanlış ya da eksik bir şey varsa yazın, düzeltelim.
        </div>
      )}

      <header className={kapak ? 'hero hero-kapakli' : 'hero'}>
        {kapak && (
          <div className="hero-fon" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={kapak.url} alt="" fetchPriority="high" />
          </div>
        )}
        <div className="sar">
          {/*
            Logo VARSA basiliyor, yoksa blok hic cikmiyor.

            Cogu prospect'in logosu yok ve olmayana yer tutucu koymak
            sayfayi eksik gosterir. Ama logosu olan biri kendi markasini
            gorunce demoya bambaska bakiyor — logolu bir prospect'te bunu denedik.

            Isim yine de <h1> olarak duruyor: logo bir gorsel, arama
            motorunun okudugu sey basliktir.
          */}
          {isletme.marka?.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="hero-logo"
              src={isletme.marka.logo.url}
              alt={`${isletme.ad} logosu`}
              width={isletme.marka.logo.genislik}
              height={isletme.marka.logo.yukseklik}
            />
          )}
          {bolge && <span className="ustluk">{bolge}</span>}
          <h1>{isletme.ad}</h1>
          <p className="vaat">{vaat}</p>
          {isletme.ozet && <p className="ozet">{metin(isletme.ozet)}</p>}

          <div className="dugmeler">
            {tel && (
              <a className="dugme dugme-ana" href={`tel:${tel.replace(/\s/g, '')}`}>
                {tel}
              </a>
            )}
            {waLink && (
              <a className="dugme dugme-ikincil" href={waLink}>
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Google puani METIN olarak gosteriliyor; aggregateRating
          isaretlemesine GIRMIYOR — Google kendi sitende kendin hakkinda
          yayinladigin puanlari isaretlemede yasakliyor. */}
      {(gbp?.yorumSayisi || isletme.kurulusYili) && (
        <section className="guven">
          <div className="sar guven-ic">
            {gbp?.puan != null && gbp.yorumSayisi ? (
              <div className="guven-oge">
                <strong>
                  {gbp.puan.toLocaleString('tr-TR', { minimumFractionDigits: 1 })}
                </strong>
                <span>
                  Google’da {gbp.yorumSayisi} değerlendirme
                  {isletme.seo.gbpUrl && (
                    <>
                      {' · '}
                      <a href={isletme.seo.gbpUrl} target="_blank" rel="noopener noreferrer">
                        gör
                      </a>
                    </>
                  )}
                </span>
              </div>
            ) : null}

            {isletme.kurulusYili && (
              <div className="guven-oge">
                <strong>{new Date().getFullYear() - isletme.kurulusYili}</strong>
                <span>yıldır bu işi yapıyoruz</span>
              </div>
            )}

            {bolge && (
              <div className="guven-oge">
                <strong>{bolge}</strong>
                <span>ve çevresinde hizmet</span>
              </div>
            )}
          </div>
        </section>
      )}

      {isletme.hizmetler.length > 0 && (
        <section className="bolum" id="hizmetler">
          <div className="sar">
            <h2>{basliklar?.hizmetler ?? 'Ne yapıyoruz'}</h2>
            <div className="hizmetler">
              {isletme.hizmetler.map((hizmet) => (
                <article className="hizmet" key={hizmet.slug}>
                  <h3>{metin(hizmet.ad)}</h3>
                  <p>{metin(hizmet.ozet)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/*
         MENU — yeme-icme demolarinda hizmetlerin hemen altinda.

         Restoranda sayfaya giren insanin aradigi ilk sey bu; galeriden
         ve yorumlardan once geliyor. Ustteki baglanti /menu adresine
         gidiyor: QR kodun isaret ettigi, hero'suz ve menusuz sade sayfa.
      */}
      {demo.menu && demo.menu.bolumler.length > 0 && (
        <section className="bolum" id="menu">
          <div className="sar">
            <div className="menu-basi">
              <h2>Menü</h2>
              <a className="menu-baglanti" href={`/${slug}/menu`}>
                QR menü sayfası →
              </a>
            </div>

            {/*
               ÇALIŞAN karekod — resmi değil, gerçeği.

               "QR menü var" demek soyut; adamın hayal etmesi gerekiyor.
               Okuttuğu anda KENDİ menüsü açılınca vaat kanıta dönüşüyor.
               Kod `qr.ts` ile sunucuda üretiliyor, dışarıdan istek yok.
            */}
            <div className="menu-qr">
              <div
                className="menu-qr-kod"
                dangerouslySetInnerHTML={{
                  __html: qrSvg(`https://${DEMO_ALAN}/${slug}/menu`, { boyut: 150 }),
                }}
              />
              <p>
                <strong>Deneyin: telefonunuzun kamerasını bu koda tutun.</strong> Menünüz
                açılacak. Masalara koyduğunuz kod bu — fiyat değiştiğinde yeniden bastırmak
                yerine tek yerden güncelliyorsunuz.
              </p>
            </div>

            <Menu menu={demo.menu} />
          </div>
        </section>
      )}

      {galeriKalan.length > 0 && (
        <section className="bolum bolum-vitrin" id="galeri">
          <div className="sar">
            <h2>{basliklar?.galeri ?? 'İşlerimizden'}</h2>
            <div className="galeri">
              {galeriKalan.map((g) => (
                // figure, buyuyen fotografi kirpan cerceve — overflow burada.
                <figure key={g.url}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt={metin(g.alt)} loading="lazy" />
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Google yorumlari — atifla gosteriliyor, isaretlemeye GIRMIYOR.
          Isletmenin kendi musterilerinin sozleri, kendi sayfasinda: demoda
          en cok is yapan bolum bu. */}
      {gosterilecekYorumlar.length > 0 && (
        <section className="bolum" id="yorumlar">
          <div className="sar">
            <h2>Müşterilerimiz ne diyor</h2>
            <div className="yorumlar">
              {gosterilecekYorumlar.map((r) => (
                <blockquote className="yorum" key={`${r.yazar}-${metin(r.metin).slice(0, 24)}`}>
                  {r.puan != null && (
                    <div className="yildiz" aria-label={`${r.puan} / 5`}>
                      {'★'.repeat(Math.round(r.puan))}
                      <span className="yildiz-bos">{'★'.repeat(5 - Math.round(r.puan))}</span>
                    </div>
                  )}
                  <p>{metin(r.metin)}</p>
                  <footer>
                    {r.yazar}
                    {r.tarih && <span> · {r.tarih}</span>}
                  </footer>
                </blockquote>
              ))}
            </div>
            <p className="atif">
              Yorumlar Google işletme kaydınızdan alınmıştır.
              {isletme.seo.gbpUrl && (
                <>
                  {' '}
                  <a href={isletme.seo.gbpUrl} target="_blank" rel="noopener noreferrer">
                    Tümünü Google’da görün
                  </a>
                </>
              )}
            </p>
          </div>
        </section>
      )}

      {isletme.sss.length > 0 && (
        <section className="bolum" id="sss">
          <div className="sar">
            <h2>Sık sorulanlar</h2>
            <div className="sss">
              {isletme.sss.map((s) => (
                <article className="soru" key={metin(s.soru)}>
                  <h3>{metin(s.soru)}</h3>
                  <p>{metin(s.cevap)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="iletisim" id="iletisim">
        <div className="sar">
          <h2>{basliklar?.iletisim ?? 'Keşif için arayın'}</h2>
          <p className="ozet">{vaat}</p>

          <div className="kanallar">
            {tel && (
              <div className="kanal">
                <span>
                  <TelefonIkonu /> Telefon
                </span>
                <a href={`tel:${tel.replace(/\s/g, '')}`}>{tel}</a>
              </div>
            )}
            {waLink && (
              <div className="kanal">
                <span>
                  <SohbetIkonu /> WhatsApp
                </span>
                <a href={waLink}>Mesaj gönder</a>
              </div>
            )}
            {adres && (
              <div className="kanal">
                <span>
                  <KonumIkonu /> Adres
                </span>
                {adres.mapsUrl ? (
                  <a href={adres.mapsUrl} target="_blank" rel="noopener noreferrer">
                    {[adres.sokak, adres.ilce, adres.il].filter(Boolean).join(', ')}
                  </a>
                ) : (
                  <span className="duz">
                    {[adres.sokak, adres.ilce, adres.il].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/*
        YAPIMCI KAYDI — bilerek eklendi.

        Bu demolar ücretsiz veriliyor ve prospect satın almasa bile
        sayfayı kullanmaya devam edebiliyor: adresi Instagram
        biyografisine koyup site yerine geçirebilir. O durumda emeğin
        karşılığı sıfır kalıyordu.

        Sayfa noindex olduğu için bu bağın SEO değeri YOK; kazanç
        doğrudan tıklama. Asıl değeri şurada: prospect sayfayı
        müşterilerine gösterirse, onları görenlerin bir kısmı da
        işletme sahibi oluyor. Dağıtım kanalı.

        Satış kapanıp site apps/musteri-* altına taşındığında bu kayıt
        OTOMATİK GİTMİYOR — orası ayrı bir uygulama. Gerçek sitede
        yapımcı kaydı kalsın mı, o müşteriyle ayrıca konuşulacak bir şey
        (ve pazarlık kozu: kayıtla şu fiyat, kayıtsız şu fiyat).
      */}
      <footer className="dip">
        <div className="sar dip-ic">
          <span>
            {isletme.ad} · {new Date().getFullYear()}
          </span>
          {YAPIMCI_AD && (
            <span className="yapimci">
              Tasarım ve yapım{' '}
              {YAPIMCI_URL ? (
                <a href={`${YAPIMCI_URL}?kaynak=demo`} target="_blank" rel="noopener">
                  {YAPIMCI_AD}
                </a>
              ) : (
                YAPIMCI_AD
              )}
            </span>
          )}
        </div>
      </footer>

      {/* Mobilde sabit arama çubuğu. Yerel işlerde dönüşümün büyük kısmı
          telefon ve WhatsApp; müşteri sayfanın neresinde olursa olsun
          tek dokunuşla ulaşabilmeli. */}
      {(tel || waLink) && (
        <nav className="mobil-cta" aria-label="Hızlı iletişim">
          {tel && (
            <a href={`tel:${tel.replace(/\s/g, '')}`}>
              <TelefonIkonu boy={16} /> Hemen ara
            </a>
          )}
          {waLink && (
            <a href={waLink}>
              <SohbetIkonu boy={16} /> WhatsApp
            </a>
          )}
        </nav>
      )}
    </>
  );
}
