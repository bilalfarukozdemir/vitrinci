import type { IsletmeTaslak, Marka } from '@studio/data';

/**
 * Bir demo.
 *
 * `isletme` KANONIK sema — musteri "evet" dedigi anda ayni nesne
 * `isletmeSemasi` (tam surum) ile dogrulanip yayina aliniyor.
 * Yeniden yazim yok; demo ile gercek site ayni artifact.
 */
export type Demo = {
  isletme: IsletmeTaslak;
  marka: Marka;
  markaKoyu: Marka;
  /** Hero altindaki tek cumlelik vaat: "Ücretsiz keşif, sabit fiyat" */
  vaat: string;

  /**
   * Bolum basliklari. Sablondan geliyor, bos birakilirsa insaat
   * varsayilanlari kullaniliyor.
   *
   * Otelde "Ne yapiyoruz / Islerimizden / Kesif icin arayin" ucu de
   * yanlis; otelin isi yok odasi var, kesfe degil rezervasyona
   * geliyorsun. Yanlis baslik sayfanin baska sektor icin yazildigini
   * ele veriyor — demoda en cok kaybettiren sey bu.
   */
  basliklar?: { hizmetler?: string; galeri?: string; iletisim?: string };

  /**
   * QR MENU — sadece yeme-icme demolarinda.
   *
   * Ayri bir alan olmasinin sebebi: menu `hizmetler`e sigmiyor. Hizmet
   * bir kartta ozetlenen is kalemi; menu ise kategorilere bolunmus,
   * onlarca satirlik bir liste. Ikisini ayni yapiya sokmak menuyu
   * okunmaz, hizmet kartlarini anlamsiz yapiyordu.
   *
   * `fiyat` bilerek STRING: "350 ₺", "kişi başı 350 ₺", "porsiyon 180 /
   * yarım 100" — sayisal tek bir alan bunlarin hicbirini tutamiyor.
   * Bilinmeyen fiyat bos birakiliyor, uydurulmuyor.
   *
   * Menu iki yerde cikiyor: ana sayfada bolum olarak, bir de /menu
   * adresinde tek basina — QR kodun isaret ettigi yer orasi.
   */
  menu?: {
    /** Menü üstünde görünen not: "Fiyatlar Ağustos 2026" gibi. */
    not?: string;
    bolumler: Array<{
      ad: string;
      urunler: Array<{
        ad: string;
        aciklama?: string;
        fiyat?: string;
        /**
         * "Çok tercih edilen" rozeti. Uydurma DEGIL: sadece Google
         * yorumlarinda adi gecen tabaklara veriliyor. Arastirmada
         * cikan tek somut donusum kaldiraci bu — insan kalabalik bir
         * listede neyi secmesi gerektigini bilmiyor, rozet onu secip
         * veriyor.
         */
        oneCikan?: boolean;
        /** Galerideki bir fotoğrafın yolu — varsa satırda küçük görsel. */
        gorsel?: string;
      }>;
    }>;
  };

  /**
   * OLANAKLAR — konaklamanin menu karsiligi.
   *
   * Restoranda insan once menuye bakiyor; konaklamada "somine var mi,
   * kahvalti dahil mi, evcil hayvan alinir mi" diye bakiyor. Bu sorular
   * hizmet kartina sigmiyor: kart anlatir, olanak listesi CEVAPLAR.
   * Kisa cip listesi olarak ciziliyor, tek bakista taraniyor.
   *
   * Kural ayni: SADECE dogrulanabilir olanak yazilir — yorumlarda gecen
   * ya da fotografta GORUNEN. "Jakuzi" yazmak icin jakuziyi gormus olmak
   * gerekiyor. Uydurulan tek olanak, musteriyle ilk telefonda yakalanir
   * ve butun demoyu yalanci cikarir.
   */
  olanaklar?: string[];
};
