/**
 * İkonlar.
 *
 * NEDEN HARICI PAKET YOK: bunlar bes tane basit geometrik sekil.
 * Lucide ya da Phosphor kurmak, kullanmadigimiz yuzlerce ikonu ve bir
 * bagimliligi da beraberinde getiriyor. Satir ici SVG'nin bagimliligi
 * yok, calisma zamani maliyeti yok.
 *
 * NEDEN `currentColor`: bu dosyada da renk YOK. Ikon, icinde bulundugu
 * metnin rengini aliyor — yani --marka-* token'larindan besleniyor ve
 * acik/koyu temada kendiliginden dogru renge donuyor. Ikona sabit renk
 * verilseydi, projenin en bastaki kurali burada delinirdi.
 *
 * NEREDE KULLANILIR: sadece TANIMA HIZLANDIRICI oldugu yerlerde —
 * iletisim kanallari ve mobil arama cubugu. Hizmet kartlarina
 * KOYULMADI: her demoda hizmetler farkli (bahce duvari, kenet cati,
 * hayvan yemi...) ve bunlara jenerik ikon eslestirmek yanlis anlam
 * uretir. Kartin isi metinle anlatmak.
 *
 * NOT: bu dosya apps/pazarlama'daki ile ayni. packages/ui'ye tasimak
 * dogru olurdu ama o paketin React bagimliligi yok; iki uygulama icin
 * 90 satirlik kopya, katman 1'e React sokmaktan ucuz. Ucuncu bir
 * tuketici cikarsa tasinir.
 */

type IkonOzellikleri = {
  /** Kutu olcusu (px). Metinle ayni satirda duruyorsa 16-18 iyi. */
  boy?: number;
  className?: string;
};

const ortak = (boy: number, className?: string) => ({
  width: boy,
  height: boy,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
  className,
});

export function TelefonIkonu({ boy = 17, className }: IkonOzellikleri) {
  return (
    <svg {...ortak(boy, className)}>
      <path d="M6.5 3h3l1.6 4-2 1.4a12.5 12.5 0 0 0 6.5 6.5l1.4-2 4 1.6v3a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 3.5 5.2 2 2 0 0 1 5.5 3h1z" />
    </svg>
  );
}

/** Sohbet balonu — WhatsApp logosu DEGIL. Marka logosu kullanmak izin
 *  ve bicim kurallarina tabi; jenerik balon hem serbest hem daha temiz. */
export function SohbetIkonu({ boy = 17, className }: IkonOzellikleri) {
  return (
    <svg {...ortak(boy, className)}>
      <path d="M20.5 11.8a8 8 0 0 1-8.6 8 9 9 0 0 1-3.3-.7L3.5 20.5l1.5-4.6a8 8 0 0 1-.9-3.7 8 8 0 0 1 8.6-8 8 8 0 0 1 7.8 7.6z" />
    </svg>
  );
}

export function PostaIkonu({ boy = 17, className }: IkonOzellikleri) {
  return (
    <svg {...ortak(boy, className)}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="m3 6.5 8.1 5.8a1.6 1.6 0 0 0 1.8 0L21 6.5" />
    </svg>
  );
}

export function KonumIkonu({ boy = 17, className }: IkonOzellikleri) {
  return (
    <svg {...ortak(boy, className)}>
      <path d="M20 10.4c0 5.5-8 11.6-8 11.6s-8-6.1-8-11.6a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10.2" r="2.8" />
    </svg>
  );
}

/** Uzeri cizili daire — "yapmadigim isler" listesinde madde isareti.
 *  Duz bir tire "madde" der; bu isaret "bunu YAPMIYORUM" der. */
export function YapilmazIkonu({ boy = 15, className }: IkonOzellikleri) {
  return (
    <svg {...ortak(boy, className)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m6.8 6.8 10.4 10.4" />
    </svg>
  );
}
