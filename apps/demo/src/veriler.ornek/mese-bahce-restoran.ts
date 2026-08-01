/**
 * Meşe Bahçe Restoran — ÖRNEK FİKSTÜR (hayali işletme)
 *
 * Şablon: Yeme-içme. Üç örnek içinde MENÜLÜ olan tek fikstür bu, yani
 * `/[slug]/menu` rotasını ve QR kodunu ayakta tutan şey. Menüyü buradan
 * kaldırırsan o rota hiçbir örnekle sınanmaz hale gelir.
 *
 * ─────────────────────────────────────────────────────────────────────
 * NEDEN MENÜ AYRI BİR ALAN
 *
 * Menü `hizmetler`e sığmıyor: hizmet bir kartta özetlenen iş kalemi, menü
 * ise kategorilere bölünmüş onlarca satır. İkisini aynı yapıya sokmak
 * menüyü okunmaz, hizmet kartlarını anlamsız yapıyor. Burada ikisi bir
 * arada duruyor — restoranın "hizmet"leri mekân/grup/ulaşım, yemekler ise
 * menüde.
 *
 * FİYATLAR BOŞ BIRAKILDI. Örnek veride uydurma fiyat yazmak, kopyalayıp
 * kendi işletmesine uyarlayan kişinin eski fiyatla yayına çıkmasına yol
 * açıyor. `fiyat` string olduğu için "kişi başı 350 ₺" gibi biçimler de
 * yazılabiliyor; bilinmiyorsa boş kalması doğru davranış.
 *
 * Fotoğraf yok, alan adı `.example`, telefon `555 55 55` — gerekçeler
 * `kavakdere-tas-doseme.ts` başlığında.
 * ─────────────────────────────────────────────────────────────────────
 */
import { isletmeTaslakSemasi } from '@studio/data';

import type { Demo } from '@/tipler';

const demo: Demo = {
  vaat: 'Meşelerin altında, ocak başında',

  // Yeme-içmede varsayılan başlıklar ("Ne yapıyoruz") yanlış düşüyor:
  // restoranın işi yok, mutfağı var; keşfe değil yer ayırtmaya geliyorsun.
  basliklar: {
    hizmetler: 'Mutfağımız',
    galeri: 'Mekândan',
    iletisim: 'Yer ayırtmak için arayın',
  },

  marka: {
    renkler: {
      ana: '#3f6b44',
      vurgu: '#8a9a3c',
      arkaplan: '#f9f8f3',
      yuzey: '#ffffff',
      metin: '#1a1d16',
      soluk: '#63685c',
    },
    kose: 'yuvarlak',
    ton: 'sicak',
  },

  markaKoyu: {
    renkler: {
      ana: '#9fbf6a',
      vurgu: '#9fbf6a',
      arkaplan: '#101310',
      yuzey: '#191d18',
      metin: '#eceee6',
      soluk: '#8f958a',
    },
    kose: 'yuvarlak',
    ton: 'sicak',
  },

  menu: {
    not: 'Fiyatlar işletme tarafından girilir — bu sayfa yapıyı gösteriyor.',
    bolumler: [
      {
        ad: 'Kahvaltı',
        urunler: [
          {
            ad: 'Serpme köy kahvaltısı',
            aciklama: 'Meşelerin altında, kişi başı — hafta sonu 09:00-13:00',
            oneCikan: true,
          },
          { ad: 'Menemen', aciklama: 'Tereyağında, isteğe göre sucuklu' },
          { ad: 'Sahanda yumurta', aciklama: 'Pastırmalı ya da sade' },
          { ad: 'Bal kaymak' },
        ],
      },
      {
        ad: 'Çorbalar',
        urunler: [
          { ad: 'Mercimek' },
          { ad: 'Yayla' },
          { ad: 'Kelle paça', aciklama: 'Hafta sonu' },
        ],
      },
      {
        ad: 'Ocak başı',
        urunler: [
          { ad: 'Kuzu pirzola', oneCikan: true },
          { ad: 'Adana / Urfa kebap' },
          { ad: 'Tavuk şiş' },
          { ad: 'Köfte', aciklama: 'Izgara ya da tavada' },
        ],
      },
      {
        ad: 'Ev yemekleri',
        urunler: [
          { ad: 'Fırında güveç', aciklama: 'Kuzu etli, mevsim sebzeleriyle' },
          { ad: 'Mantı', aciklama: 'El açması' },
          { ad: 'Günün yemeği', aciklama: 'Her gün değişiyor — arayıp sorabilirsiniz' },
        ],
      },
      {
        ad: 'Tatlı ve içecek',
        urunler: [
          { ad: 'Sütlaç', aciklama: 'Fırında' },
          { ad: 'Künefe' },
          { ad: 'Demleme çay' },
          { ad: 'Türk kahvesi' },
        ],
      },
    ],
  },

  isletme: isletmeTaslakSemasi.parse({
    slug: 'mese-bahce-restoran',
    ad: 'Meşe Bahçe Restoran',
    sektor: 'aile restoranı',
    googleTurleri: ['restaurant'],
    kurulusYili: 2016,

    ozet:
      'Şehir çıkışında, meşelerin altında bir aile restoranı. Sabah serpme kahvaltı, ' +
      'öğleden sonra ocak başı ve ev yemekleri. Bahçede oturma alanı, kapalı ' +
      'salonda 80 kişilik kapasite var.',

    slogan: 'Yolun kenarında değil, ağaçların altında',

    iletisim: {
      telefon: '0374 555 55 55',
      whatsapp: '+905555555555',
    },

    adresler: [
      {
        sokak: 'Yayla Yolu 4. km',
        ilce: 'Merkez',
        il: 'Bolu',
        postaKodu: '14000',
        ulke: 'TR',
        mapsUrl: 'https://maps.google.com/?q=mese-bahce-restoran',
        ziyaretEdilebilir: true,
      },
    ],

    hizmetVerilenBolgeler: [{ ad: 'Bolu', tur: 'il', il: 'Bolu', sayfaAc: false }],

    // Restoranda "hizmet" = misafirin karar vermeden önce sorduğu şeyler.
    // Yemekler menüde; buraya yazılırsa iki liste birbirini tekrar ediyor.
    hizmetler: [
      {
        slug: 'mutfak',
        ad: 'Mutfak',
        ozet:
          'Ocak başı ve ev yemekleri. Et ızgara sipariş üzerine pişiyor, ' +
          'güveç ve mantı günlük yapılıyor.',
        anahtarKelimeler: ['bolu restoran', 'ocak başı', 'ev yemeği'],
        oneCikan: true,
      },
      {
        slug: 'mekan',
        ad: 'Mekân',
        ozet:
          'Bahçede ağaç altı masalar, kapalı salonda 80 kişilik oturma. ' +
          'Kışın salon sobalı, yazın bahçe gölgede.',
        anahtarKelimeler: ['bahçeli restoran bolu', 'ağaç altı kahvaltı'],
      },
      {
        slug: 'grup-kutlama',
        ad: 'Grup ve kutlama',
        ozet:
          'Kalabalık masalar, doğum günü ve iş yemekleri için önceden yer ayırtma. ' +
          'Kişi sayısını söyleyin, düzeni ona göre kuralım.',
        anahtarKelimeler: ['grup yemeği bolu', 'kutlama mekanı'],
      },
      {
        slug: 'ulasim',
        ad: 'Ulaşım ve otopark',
        ozet: 'Şehir merkezinden 10 dakika. Ücretsiz otopark, otobüs için ayrı alan var.',
        anahtarKelimeler: ['yol tarifi', 'otoparklı restoran'],
      },
    ],

    galeri: [],

    referanslar: [
      {
        yazar: 'Emre Y.',
        metin:
          'Kahvaltı için gittik, ağaçların altındaki masaları çok beğendik. ' +
          'Serpme kahvaltı iki kişiye fazla geldi, tazeydi.',
        puan: 5,
        kaynak: 'musteri',
      },
      {
        yazar: 'Zeynep A.',
        metin:
          'Kalabalık bir aile yemeği için önceden aradık, masaları birleştirip ' +
          'hazırlamışlar. Çocuklar için de rahat bir alan var.',
        puan: 5,
        kaynak: 'musteri',
      },
      {
        yazar: 'Hakan B.',
        metin: 'Pirzola gerçekten ocak başında pişiyor. Yol üstü bir yer değil, gidip oturuluyor.',
        puan: 4,
        kaynak: 'musteri',
      },
    ],

    sss: [
      {
        soru: 'Rezervasyon gerekiyor mu?',
        cevap:
          'Hafta içi genelde gerekmiyor. Hafta sonu ve kalabalık masalar için arayıp ' +
          'yer ayırtmanızı öneririz.',
      },
      {
        soru: 'Otopark var mı?',
        cevap: 'Evet, ücretsiz. Otobüsle gelen gruplar için ayrı bir alan ayırdık.',
      },
      {
        soru: 'Kaç kişilik grupları alıyorsunuz?',
        cevap:
          'Salonda 80 kişiye kadar. Arayın, tarihi ve kişi sayısını söyleyin — ' +
          'düzeni ona göre kuruyoruz.',
      },
      {
        soru: 'Çocuklu aileler için uygun mu?',
        cevap: 'Evet. Mama sandalyesi ve çocukların rahat edeceği ayrı bir alan var.',
      },
      {
        soru: 'Kahvaltı saat kaça kadar?',
        cevap: 'Hafta sonu 13:00\'e kadar. Hafta içi kahvaltı 11:00\'de kapanıyor.',
      },
    ],

    calismaSaatleri: [
      { gun: 1, acilis: '08:00', kapanis: '22:00' },
      { gun: 2, acilis: '08:00', kapanis: '22:00' },
      { gun: 3, acilis: '08:00', kapanis: '22:00' },
      { gun: 4, acilis: '08:00', kapanis: '22:00' },
      { gun: 5, acilis: '08:00', kapanis: '23:00' },
      { gun: 6, acilis: '08:00', kapanis: '23:00' },
      { gun: 0, acilis: '08:00', kapanis: '22:00' },
    ],

    // Panel bu iki alani okuyup puan ve yorum sayisini gosteriyor;
    // orneklerde bos kalinca panel ornekleri eksik gosteriyordu.
    gbpMetrikleri: { puan: 4.7, yorumSayisi: 186 },

    diller: { varsayilan: 'tr', destekli: ['tr'] },

    seo: {
      alanAdi: 'mesebahce.example',
      indekslenebilir: false,
    },

    kaynak: {
      tur: 'elle',
      musteriOnayli: true,
    },
  }),
};

export default demo;
