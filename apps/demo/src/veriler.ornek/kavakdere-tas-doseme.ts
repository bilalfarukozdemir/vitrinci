/**
 * Kavakdere Taş Döşeme — ÖRNEK FİKSTÜR (hayali işletme)
 *
 * Şablon: İnşaat / tadilat. Üç örnekten en "standart" olanı — başlıklar
 * varsayılan ("Ne yapıyoruz / İşlerimizden / Keşif için arayın"), menü yok,
 * hizmet kartları var. Yeni bir sektör eklerken kıyas noktan bu olsun.
 *
 * ─────────────────────────────────────────────────────────────────────
 * NEDEN FOTOĞRAF YOK
 *
 * Repoda başkasına ait tek görsel bulunmuyor: gerçek demolardaki
 * fotoğraflar Google ve Instagram'dan indiriliyor, telifi işletmenin ya da
 * fotoğrafçının. Örnek fikstürlere stok görsel koymak da yanlış olurdu —
 * o zaman "fotoğrafsız işletme nasıl görünüyor" sorusu hiç sınanmazdı.
 *
 * `galeri: []` bilerek: hero kapaksız metin moduna düşüyor ve galeri
 * bölümü hiç basılmıyor. Kendi verinle çalıştırdığında fotoğraflar
 * gelince ikisi de kendiliğinden açılıyor.
 *
 * VERİ HAYALİ, KALIBI GERÇEK
 *
 * Alan adı `.example` (RFC 2606 — kayda kapalı), telefon `555 55 55` ile
 * bitiyor. `npm run sizinti` bu iki kalıbı tanıyor; uymayan bir numara ya
 * da alan adı buraya girerse gerçek veri sayılıp yayını durduruyor.
 * ─────────────────────────────────────────────────────────────────────
 */
import { isletmeTaslakSemasi } from '@studio/data';

import type { Demo } from '@/tipler';

const demo: Demo = {
  vaat: 'Ücretsiz keşif, yazılı fiyat, sabit teslim tarihi',

  marka: {
    renkler: {
      ana: '#6b5744',
      vurgu: '#a8763c',
      arkaplan: '#faf8f5',
      yuzey: '#ffffff',
      metin: '#1d1a16',
      soluk: '#6a625a',
    },
    kose: 'yumusak',
    ton: 'sicak',
  },

  markaKoyu: {
    renkler: {
      ana: '#c9a173',
      vurgu: '#c9a173',
      arkaplan: '#121011',
      yuzey: '#1c1917',
      metin: '#efeae4',
      soluk: '#9b928a',
    },
    kose: 'yumusak',
    ton: 'sicak',
  },

  isletme: isletmeTaslakSemasi.parse({
    slug: 'kavakdere-tas-doseme',
    ad: 'Kavakdere Taş Döşeme',
    sektor: 'kilit taşı ve doğal taş döşeme',
    googleTurleri: ['general_contractor'],
    kurulusYili: 2009,

    ozet:
      'Düzce ve çevresinde avlu, bahçe ve otopark için kilit taşı, parke taşı ve ' +
      'doğal taş döşüyoruz. Zemin hazırlığından kenar bordürüne kadar tek ekiple ' +
      'çalışıyoruz — taşeron devri yok.',

    slogan: 'Zemini doğru hazırlarsan taş oturur',

    iletisim: {
      telefon: '0380 555 55 55',
      whatsapp: '+905555555555',
      eposta: 'bilgi@kavakderetas.example',
    },

    adresler: [
      {
        sokak: 'Sanayi Sitesi 4. Blok No:12',
        ilce: 'Düzce Merkez',
        il: 'Düzce',
        postaKodu: '81100',
        ulke: 'TR',
        mapsUrl: 'https://maps.google.com/?q=kavakdere-tas-doseme',
        ziyaretEdilebilir: true,
      },
    ],

    hizmetVerilenBolgeler: [
      { ad: 'Düzce', tur: 'il', il: 'Düzce', sayfaAc: true },
      { ad: 'Akçakoca', tur: 'ilce', il: 'Düzce', sayfaAc: true },
      { ad: 'Gölyaka', tur: 'ilce', il: 'Düzce', sayfaAc: false },
    ],

    hizmetler: [
      {
        slug: 'kilit-tasi-doseme',
        ad: 'Kilit taşı döşeme',
        ozet:
          'Avlu, bahçe yolu ve otopark için kilit taşı. Kazı, kum serme ve sıkıştırma ' +
          'dahil; zemin hazırlığı yapılmadan döşenen taş bir kışta oynuyor.',
        anahtarKelimeler: ['düzce kilit taşı', 'kilit taşı döşeme', 'avlu taşı'],
        oneCikan: true,
        fiyat: { min: 350, max: 750, birim: 'm²', paraBirimi: 'TRY' },
      },
      {
        slug: 'dogal-tas-uygulama',
        ad: 'Doğal taş kaplama',
        ozet:
          'Bahçe duvarı, cephe ve şömine için doğal taş kaplama. Taşın derzine ve ' +
          'yönüne göre örülür; hazır panel yapıştırmıyoruz.',
        anahtarKelimeler: ['doğal taş kaplama düzce', 'bahçe duvarı taş'],
      },
      {
        slug: 'istinat-duvari',
        ad: 'İstinat duvarı',
        ozet:
          'Betonarme ya da taş istinat duvarı. Zemin etüdüne göre drenaj ve ' +
          'donatı planlanır — su tahliyesi olmayan duvar er geç şişer.',
        anahtarKelimeler: ['istinat duvarı düzce', 'bahçe istinat duvarı'],
      },
      {
        slug: 'beton-avlu',
        ad: 'Beton avlu ve saha betonu',
        ozet:
          'Baskı beton, silinmiş beton ve saha betonu uygulaması. Derz aralıkları ' +
          'ölçüye göre kesilir; çatlağın çoğu derz atlanmasından çıkıyor.',
        anahtarKelimeler: ['beton avlu düzce', 'baskı beton', 'saha betonu'],
      },
    ],

    /*
       FOTOĞRAF YOK — yukarıdaki başlıkta açıklandı. Bu alan dolduğunda
       hero kapak fotoğrafını arka plana alıyor ve galeri bölümü açılıyor.
    */
    galeri: [],

    referanslar: [
      {
        yazar: 'Mehmet K.',
        metin:
          'Avluyu komple döşediler. Verilen tarihte başladılar, verilen tarihte bitti. ' +
          'Fiyat da başta konuşulan rakamdı, sonradan ek kalem çıkmadı.',
        puan: 5,
        kaynak: 'musteri',
      },
      {
        yazar: 'Ayşe T.',
        metin:
          'Bahçe duvarını yaptılar. En çok hoşuma giden, işi bitince ortalığı ' +
          'temizleyip gitmeleri oldu.',
        puan: 5,
        kaynak: 'musteri',
      },
      {
        yazar: 'Serkan D.',
        metin: 'Keşfe geldiler, ölçü aldılar, fiyatı yazılı verdiler. Temiz iş.',
        puan: 4,
        kaynak: 'musteri',
      },
    ],

    sss: [
      {
        soru: 'Keşif ücretli mi?',
        cevap: 'Hayır. Düzce içi keşif ücretsiz; ölçüyü alıp fiyatı yazılı veriyoruz.',
      },
      {
        soru: 'Ne kadar sürer?',
        cevap:
          'Ortalama bir avlu 2-4 gün. Kazı çıkarsa ya da hava bozarsa süreyi baştan ' +
          'söylüyoruz; iş başladıktan sonra tarih değiştirmiyoruz.',
      },
      {
        soru: 'Taşı siz mi temin ediyorsunuz?',
        cevap:
          'İkisi de olur. Bizden alırsanız fabrika fiyatına yakın çıkıyor, ama ' +
          'kendi taşınızı da döşeriz.',
      },
      {
        soru: 'Garanti veriyor musunuz?',
        cevap:
          'İşçilik garantili. Oturma ya da oynama olursa gelip düzeltiyoruz — ' +
          'zaten zemini bu yüzden baştan doğru hazırlıyoruz.',
      },
      {
        soru: 'Kışın çalışıyor musunuz?',
        cevap:
          'Don olmayan günlerde evet. Donmuş zemine taş döşenmez; baharı beklemek ' +
          'gerekiyorsa açıkça söylüyoruz.',
      },
    ],

    calismaSaatleri: [
      { gun: 1, acilis: '08:00', kapanis: '18:00' },
      { gun: 2, acilis: '08:00', kapanis: '18:00' },
      { gun: 3, acilis: '08:00', kapanis: '18:00' },
      { gun: 4, acilis: '08:00', kapanis: '18:00' },
      { gun: 5, acilis: '08:00', kapanis: '18:00' },
      { gun: 6, acilis: '09:00', kapanis: '14:00' },
      { gun: 0, kapali: true },
    ],

    // Panel bu iki alani okuyup puan ve yorum sayisini gosteriyor;
    // orneklerde bos kalinca panel ornekleri eksik gosteriyordu.
    gbpMetrikleri: { puan: 4.8, yorumSayisi: 34 },

    diller: { varsayilan: 'tr', destekli: ['tr'] },

    seo: {
      alanAdi: 'kavakderetas.example',
      // Örnek fikstür arama motorlarına kapalı kalıyor — demo barındırma
      // adresinde yayınlanan hayali bir işletme indekslenmemeli.
      indekslenebilir: false,
    },

    kaynak: {
      tur: 'elle',
      // Örnek veri elle yazıldı ve "onaylı" sayılıyor: sayfa taslak şeridi
      // taşımıyor, yani çerçevenin BİTMİŞ çıktısını gösteriyor. Gerçek
      // prospect demolarında bu alan false kalır ve şerit görünür.
      musteriOnayli: true,
    },
  }),
};

export default demo;
