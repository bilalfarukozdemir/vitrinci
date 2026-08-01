/**
 * Gölköy Konağı — ÖRNEK FİKSTÜR (hayali işletme)
 *
 * Şablon: Konaklama. Bu fikstürün varlık sebebi `basliklar` alanı.
 *
 * ─────────────────────────────────────────────────────────────────────
 * NEDEN ÜÇÜNCÜ BİR ÖRNEK GEREKİYORDU
 *
 * İnşaat varsayılanları ("Ne yapıyoruz / İşlerimizden / Keşif için
 * arayın") otelde üçü birden yanlış: otelin işi yok odası var, keşfe
 * değil rezervasyona geliyorsun. Yanlış başlık, sayfanın başka bir sektör
 * için yazıldığını ele veriyor — demoda en çok kaybettiren şey bu.
 *
 * Örnek fikstürler yalnızca inşaat ve restorandan ibaret olsaydı, bu alan
 * repoda hiç gösterilmeden dururdu ve ilk otel demosunu yapan kişi
 * varsayılan başlıklarla gönderirdi.
 *
 * Ayrıca burada `hizmetler` = ODALAR. Şemada ayrı bir "oda" tipi yok,
 * bilerek: oda da bir hizmet kartı gibi davranıyor (ad, özet, fiyat
 * aralığı). Sektör başına yeni şema açmak yerine başlığı değiştirmek
 * yetiyor — çerçevenin dar kalmasını sağlayan karar bu.
 *
 * Fotoğraf yok, alan adı `.example`, telefon `555 55 55` — gerekçeler
 * `kavakdere-tas-doseme.ts` başlığında.
 * ─────────────────────────────────────────────────────────────────────
 */
import { isletmeTaslakSemasi } from '@studio/data';

import type { Demo } from '@/tipler';

const demo: Demo = {
  vaat: 'Göl kıyısında, altı odalı bir konak',

  basliklar: {
    hizmetler: 'Odalar ve olanaklar',
    galeri: 'Konaktan',
    iletisim: 'Rezervasyon için arayın',
  },

  marka: {
    renkler: {
      ana: '#4a6572',
      vurgu: '#9c7a4a',
      arkaplan: '#f7f6f3',
      yuzey: '#ffffff',
      metin: '#191d20',
      soluk: '#626b70',
    },
    kose: 'keskin',
    ton: 'premium',
  },

  markaKoyu: {
    renkler: {
      ana: '#c3a06a',
      vurgu: '#c3a06a',
      arkaplan: '#0f1214',
      yuzey: '#181d20',
      metin: '#ebeae6',
      soluk: '#8e9498',
    },
    kose: 'keskin',
    ton: 'premium',
  },

  isletme: isletmeTaslakSemasi.parse({
    slug: 'golkoy-konagi',
    ad: 'Gölköy Konağı',
    sektor: 'butik otel',
    googleTurleri: ['lodging'],
    kurulusYili: 2018,

    ozet:
      'Göl kıyısında, restore edilmiş iki katlı ahşap bir konak. Altı oda, ' +
      'kahvaltı dahil. Ayakkabıyla girilmiyor, akşam sessizlik saati var — ' +
      'burası kalabalık bir tesis değil, sakin bir ev.',

    slogan: 'Altı oda, bir bahçe, göl manzarası',

    iletisim: {
      telefon: '0264 555 55 55',
      whatsapp: '+905555555555',
      eposta: 'rezervasyon@golkoykonagi.example',
    },

    adresler: [
      {
        sokak: 'Göl Caddesi No:7',
        ilce: 'Sapanca',
        il: 'Sakarya',
        postaKodu: '54600',
        ulke: 'TR',
        mapsUrl: 'https://maps.google.com/?q=golkoy-konagi',
        ziyaretEdilebilir: true,
      },
    ],

    hizmetVerilenBolgeler: [
      { ad: 'Sakarya', tur: 'il', il: 'Sakarya', sayfaAc: false },
      { ad: 'Sapanca', tur: 'ilce', il: 'Sakarya', sayfaAc: true },
    ],

    // ODALAR — şemada `hizmetler`, başlıkta "Odalar ve olanaklar".
    hizmetler: [
      {
        slug: 'gol-manzarali-oda',
        ad: 'Göl manzaralı oda',
        ozet:
          'Üst katta, balkonlu. Çift kişilik yatak, ahşap tavan, banyoda duş. ' +
          'Dört oda bu tipte.',
        anahtarKelimeler: ['sapanca göl manzaralı otel', 'butik otel sapanca'],
        oneCikan: true,
        fiyat: { min: 2800, max: 4200, birim: 'gece', paraBirimi: 'TRY' },
      },
      {
        slug: 'bahce-kati-oda',
        ad: 'Bahçe katı odası',
        ozet: 'Zemin katta, bahçeye açılan kapısı var. İki oda bu tipte.',
        anahtarKelimeler: ['bahçeli oda sapanca', 'zemin kat oda'],
        fiyat: { min: 2400, max: 3400, birim: 'gece', paraBirimi: 'TRY' },
      },
      {
        slug: 'kahvalti',
        ad: 'Kahvaltı ve bahçe',
        ozet:
          'Kahvaltı fiyata dahil, bahçede serpme olarak veriliyor. Akşam yemeği ' +
          'önceden söylenirse hazırlanıyor.',
        anahtarKelimeler: ['kahvaltı dahil otel sapanca'],
      },
      {
        slug: 'ozel-kullanim',
        ad: 'Konağın tamamı',
        ozet:
          'Altı oda birlikte kiralanabiliyor — aile buluşması ve küçük ekip ' +
          'çalışmaları için. Bu durumda bahçe ve salon da size kalıyor.',
        anahtarKelimeler: ['konak kiralama sapanca', 'tüm konak rezervasyon'],
      },
    ],

    galeri: [],

    referanslar: [
      {
        yazar: 'Deniz Ö.',
        metin:
          'Ahşabın korunmuş olması çok etkileyiciydi. Ayakkabıları çıkarıp giriyorsunuz ' +
          've bu gerçekten evinizde gibi hissettiriyor.',
        puan: 5,
        kaynak: 'musteri',
      },
      {
        yazar: 'Burak S.',
        metin:
          'Kahvaltı bahçede, göle karşı. Altı oda olduğu için kalabalık değil, ' +
          'sessizlik aradığımız için tam istediğimiz yerdi.',
        puan: 5,
        kaynak: 'musteri',
      },
      {
        yazar: 'Elif N.',
        metin: 'Konum merkeze yürüme mesafesinde ama gece hiç ses gelmiyor.',
        puan: 4,
        kaynak: 'musteri',
      },
    ],

    sss: [
      {
        soru: 'Kahvaltı dahil mi?',
        cevap: 'Evet, fiyata dahil. Bahçede serpme olarak veriliyor, 08:30-11:00 arası.',
      },
      {
        soru: 'Giriş ve çıkış saatleri?',
        cevap: 'Giriş 14:00, çıkış 12:00. Erken gelirseniz bagajınızı bırakabilirsiniz.',
      },
      {
        soru: 'Evcil hayvan kabul ediyor musunuz?',
        cevap:
          'Bahçe katı odalarında evet, önceden haber vermek şartıyla. Üst kat ahşap ' +
          'olduğu için orada kabul edemiyoruz.',
      },
      {
        soru: 'Akşam yemeği veriyor musunuz?',
        cevap:
          'Önceden söylerseniz evet. Menü sabit — o gün ne pişiyorsa, rezervasyonda ' +
          'söylüyoruz.',
      },
      {
        soru: 'Konağın tamamını kiralayabilir miyiz?',
        cevap:
          'Evet, altı oda birlikte veriliyor. Aile buluşması ve küçük ekip çalışmaları ' +
          'için sık tercih ediliyor; tarih için arayın.',
      },
    ],

    calismaSaatleri: [
      { gun: 1, acilis: '08:00', kapanis: '22:00' },
      { gun: 2, acilis: '08:00', kapanis: '22:00' },
      { gun: 3, acilis: '08:00', kapanis: '22:00' },
      { gun: 4, acilis: '08:00', kapanis: '22:00' },
      { gun: 5, acilis: '08:00', kapanis: '22:00' },
      { gun: 6, acilis: '08:00', kapanis: '22:00' },
      { gun: 0, acilis: '08:00', kapanis: '22:00' },
    ],

    // Panel bu iki alani okuyup puan ve yorum sayisini gosteriyor;
    // orneklerde bos kalinca panel ornekleri eksik gosteriyordu.
    gbpMetrikleri: { puan: 4.9, yorumSayisi: 52 },

    diller: { varsayilan: 'tr', destekli: ['tr'] },

    seo: {
      alanAdi: 'golkoykonagi.example',
      indekslenebilir: false,
    },

    /*
       BU ÖRNEK BİLEREK TASLAK — üçünden tek farkı bu.

       Diğer ikisi `musteriOnayli: true`, yani çerçevenin BİTMİŞ çıktısını
       gösteriyor. Üçü de öyle olsaydı, projenin amiral gemisi özelliği —
       sayfanın tepesindeki "bu bir taslak, bilgiler Google kaydınızdan
       alındı, doğrulanmadı" şeridi — kutudan çıkan hiçbir örnekte
       görünmezdi. Görünmeyen özellik yok sayılır.

       Gerçek prospect demolarında varsayılan budur; `true` yapmak
       müşteriyle konuştuktan sonraki adım.
    */
    kaynak: {
      tur: 'maps',
      taranmaTarihi: '2026-08-01',
      musteriOnayli: false,
    },
  }),
};

export default demo;
