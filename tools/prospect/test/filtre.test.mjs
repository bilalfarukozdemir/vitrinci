import { test } from 'node:test';
import assert from 'node:assert/strict';

import { adNormalize, NISLER } from '../src/config.mjs';
import { elemeSebebi, sosyalMedyaMi, tekillestir, hostCikar } from '../src/places.mjs';

const nis = NISLER.insaat;

/** Maps kaydi taklidi. */
const yer = (ad, turler = []) => ({ displayName: { text: ad }, types: turler });
const elenir = (ad, turler = []) => elemeSebebi(yer(ad, turler), nis) !== null;

/*
   PROSPECT OLARAK KALAN ISIMLER HAYALI, ELENENLER GERCEGE YAKIN.

   Ayrim bilerek: "kalmali" listesi bizim hedef listemizin nasil gorundugunu
   anlatir, o ticari bilgi. Elenen isimler ise tam tersini — MUSTERI OLMAYANI
   — anlatiyor ve Maps'in gercekte ne kadar dagink veri dondurdugunu
   belgeliyor. Kural: bir ad buraya girecekse once "bu bizim boru hattimizda
   mi" diye sor. Cevap evetse degistir.
*/

// ---------------------------------------------------------------- normalizasyon

test('adNormalize: Türkçe büyük harfleri ASCII küçüğe indirger', () => {
  // Bu fonksiyon olmadan regex `i` bayrağı Türkçe büyük harflerde çalışmıyor:
  // /inşaat/i.test("İNŞAAT") === false. Filtrelerin sessizce ölmesinin sebebi buydu.
  assert.equal(adNormalize('İNŞAAT'), 'insaat');
  assert.equal(adNormalize('inşaat'), 'insaat');
  assert.equal(adNormalize('İnşaat'), 'insaat');
  assert.equal(adNormalize('YAPI'), 'yapi');
  assert.equal(adNormalize('yapı'), 'yapi');
  assert.equal(adNormalize('IŞIKLAR ÇATI'), 'isiklar cati');
  assert.equal(adNormalize('Öztürk Müteahhitlik'), 'ozturk muteahhitlik');
  assert.equal(adNormalize('  ÇİFT   BOŞLUK  '), 'cift bosluk');
});

test('adNormalize: aksanlı ve aksansız yazım aynı sonuca iner', () => {
  // İşletmeler adlarını tutarsız yazıyor; ikisi de eşleşmeli.
  assert.equal(adNormalize('Işıklar'), adNormalize('Isiklar'));
  assert.equal(adNormalize('MÜTEAHHİT'), adNormalize('muteahhit'));
});

// ---------------------------------------------------------------- eleme

test('eleme: büyük harfli sektör dışı isimler de yakalanıyor', () => {
  // Regresyon: Maps adlarının çoğu tamamen büyük harf. Normalizasyon
  // olmadan bunların hiçbiri elenmiyordu.
  assert.ok(elenir('KAYNAŞLI BELEDİYESİ'));
  assert.ok(elenir('HAVUZLU BAHÇE RESTAURANT'));
  assert.ok(elenir('MEŞE KEBAP RESTAURANT'));
  assert.ok(elenir('SÜNNET GÖLÜ TABİAT PARKI'));
  assert.ok(elenir('DENİZ IŞIK STUDIO'));
  assert.ok(elenir('ANADOLU TESBİH KEHRİBAR EVİ'));
  assert.ok(elenir('ARSLAN KOLTUK DÖŞEME & TEKSTİL'));
  assert.ok(elenir('AKPINAR KONAĞI'));
});

test('eleme: gerçek inşaatçılar listede kalıyor', () => {
  const kalmali = [
    'ATA KUTLU YAPI',
    'ERGİN YAPI',
    'Düzce Komple Tadilat & Ergin Yapı',
    'Karahanlı Prefabrik',
    'BATUHAN İNŞAAT',
    'Sedir yapı dekorasyon tadilat iç mimarlık',
    'Yayla Hazır Beton Tesisi',
    'Sapanca Peyzaj & Çim & Bahçe',
    'KAVAKDERE TAŞ DÖŞEME',
    'Denizcioğlu İnşaat ve Yapı Malzemeleri',
  ];

  for (const ad of kalmali) {
    assert.equal(elenir(ad), false, `"${ad}" yanlışlıkla elendi`);
  }
});

test('eleme: "han" ile biten isimler elenmiyor', () => {
  // Bir önceki sürümde /han(ı)?\b/ kalıbı vardı ve Türkçe isimlerin
  // büyük kısmını (Oğuzhan, Batuhan, Serhan, Ceyhan) eliyordu.
  for (const ad of ['Batuhan Yapı', 'SERHAN İNŞAAT', 'Ceyhan Beton', 'Karahanlı Prefabrik']) {
    assert.equal(elenir(ad), false, `"${ad}" elenmemeliydi`);
  }
  // Ama gerçek tarihi yapı elenmeli.
  assert.ok(elenir('Kırkhan Kervansaray'));
});

test('eleme: inşaat terimleri yanlışlıkla tıbbi/tekstil kalıbına takılmıyor', () => {
  // "dış cephe" ASCII'de "dis cephe" oluyor — diş kliniği kalıbına
  // takılmamalı. "perde beton duvar" gerçek bir inşaat terimi.
  assert.equal(elenir('DIŞ CEPHE MANTOLAMA'), false);
  assert.equal(elenir('Perde Beton Duvar Uygulama'), false);
  assert.equal(elenir('KURŞUN GEÇİRMEZ CAM'), false);
  // Gerçek diş kliniği yine de elenmeli.
  assert.ok(elenir('Özel Deniz Diş Kliniği'));
});

test('eleme: niş bloğu sektör terimi varsa kurtarılıyor', () => {
  // Emlak tek başına elenir...
  assert.ok(elenir('ÖZKAN EMLAK'));
  // ...ama inşaat da yapıyorsa gerçek prospect.
  assert.equal(elenir('ÇINAR GRUP İNŞAAT EMLAK'), false);
  assert.equal(elenir('MERCEK YAPI EMLAK'), false);

  // Oto kurtarma inşaat değil, kurtarılmaz.
  assert.ok(elenir('Zümrüt Oto Kurtarma'));
});

test('eleme: genel kara listede kurtarma YOK', () => {
  // Adında "yapı" geçse bile lokanta lokantadır.
  assert.ok(elenir('YAPI RESTAURANT'));
  assert.ok(elenir('İnşaat Market'));
});

test('eleme: Google yer türü ad kalıbından önce geliyor', () => {
  const sebep = elemeSebebi(yer('Masum Görünen İsim', ['restaurant', 'food']), nis);
  assert.equal(sebep, 'tür:restaurant');
});

test('eleme: tür listesi boşsa ad kalıplarına düşüyor', () => {
  assert.equal(elemeSebebi(yer('Normal Yapı Ltd', []), nis), null);
});

// ---------------------------------------------------------------- sosyal medya

test('sosyalMedyaMi: profil adresleri gerçek site sayılmıyor', () => {
  assert.ok(sosyalMedyaMi('https://www.instagram.com/ornekbotanik'));
  assert.ok(sosyalMedyaMi('https://instagram.com/ornek.elektrikci/'));
  assert.ok(sosyalMedyaMi('https://ornekemlak81.sahibinden.com/'));
  assert.ok(sosyalMedyaMi('https://www.facebook.com/ornekinsaat'));

  assert.equal(sosyalMedyaMi('https://kavakderetas.example'), false);
  assert.equal(sosyalMedyaMi('http://www.yaylabeton.example/'), false);
  assert.equal(sosyalMedyaMi(null), false);
  assert.equal(sosyalMedyaMi('bozuk url'), false);
});

test('hostCikar: www ayıklanıyor, bozuk adres null', () => {
  assert.equal(hostCikar('https://www.Ornekdekor.EXAMPLE/urunler'), 'ornekdekor.example');
  assert.equal(hostCikar('bu bir url değil'), null);
});

// ---------------------------------------------------------------- tekilleştirme

test('tekillestir: aynı alan adı tek kayda iniyor, en çok yorumlu kalıyor', () => {
  const sonuc = tekillestir([
    { id: '1', ad: 'Demir İnşaat - Merkez', site: 'https://www.ornekdekor.example/', telefon: '0380 111', yorumSayisi: 65 },
    { id: '2', ad: 'Demir İnşaat - Şube', site: 'http://ornekdekor.example/', telefon: '0380 222', yorumSayisi: 76 },
    { id: '3', ad: 'Başka Firma', site: 'https://baska.example', telefon: '0380 333', yorumSayisi: 10 },
  ]);

  assert.equal(sonuc.length, 2);
  assert.equal(sonuc[0].ad, 'Demir İnşaat - Şube', '76 yorumlu kayıt temsilci olmalı');
});

test('tekillestir: aynı telefon da mükerrer sayılıyor', () => {
  const sonuc = tekillestir([
    { id: '1', ad: 'Şube A', site: null, telefon: '0380 555 55 55', yorumSayisi: 5 },
    { id: '2', ad: 'Şube B', site: null, telefon: '0380 5555555', yorumSayisi: 20 },
  ]);

  assert.equal(sonuc.length, 1);
  assert.equal(sonuc[0].ad, 'Şube B');
});

test('tekillestir: Instagram alan adı olarak sayılmıyor', () => {
  // Aksi halde Instagram'ı olan bütün işletmeler tek kayda inerdi.
  const sonuc = tekillestir([
    { id: '1', ad: 'Firma A', site: 'https://instagram.com/a', sosyalMedya: true, telefon: '111', yorumSayisi: 5 },
    { id: '2', ad: 'Firma B', site: 'https://instagram.com/b', sosyalMedya: true, telefon: '222', yorumSayisi: 8 },
    { id: '3', ad: 'Firma C', site: 'https://instagram.com/c', sosyalMedya: true, telefon: '333', yorumSayisi: 3 },
  ]);

  assert.equal(sonuc.length, 3, 'sosyal medya hostu tekilleştirmede kullanılmamalı');
});

test('tekillestir: telefonu ve sitesi olmayan kayıtlar birleşmiyor', () => {
  const sonuc = tekillestir([
    { id: '1', ad: 'Firma A', site: null, telefon: null, yorumSayisi: 5 },
    { id: '2', ad: 'Firma B', site: null, telefon: null, yorumSayisi: 3 },
  ]);

  assert.equal(sonuc.length, 2);
});

// ------------------------------------------------------- niş bazlı tür eleme

/*
   BU BLOK GERÇEK BİR HATAYI KİLİTLİYOR.

   Eskiden tek bir `IZINSIZ_TURLER` listesi vardı ve içeriği inşaata göre
   yazılmıştı: `restaurant`, `hotel`, `lodging` yasaklıydı. Liste niş
   bağımsız uygulandığı için TURİZM taraması tam olarak aradığı işletmeleri
   eliyordu — çöp geçerken hedef eleniyordu.

   İlk turizm taramasında ilk 10'un 6'sı müşteri değildi: Akşemseddin
   Türbesi (1676 yorum), Sünnet Gölü (1610), Mudurnu Saat Kulesi (1196),
   Düzce Seyir Terası (544), bir dinlenme tesisi (2797), bir öğretmenevi.
   Hepsinin yorumu çok ve sitesi yok — yani skor formülü onları mükemmel
   prospect sanıyordu.

   Eleme artık iki katmanlı ve aşağıdaki testler ikisini de bağlıyor:
   `ASLA_PROSPECT` (herkes için) ve `nis.blokTurler` (nişe göre).
*/

const turizm = NISLER.turizm;
const eler = (n, ad, turler = []) => elemeSebebi(yer(ad, turler), n) !== null;

test('eleme: park, türbe, kamu binası HER nişte eleniyor', () => {
  for (const [nisAd, n] of [['inşaat', nis], ['turizm', turizm]]) {
    for (const tur of ['park', 'tourist_attraction', 'place_of_worship',
                       'local_government_office', 'rest_stop', 'natural_feature']) {
      assert.ok(eler(n, 'Herhangi Bir Yer', [tur]), `${nisAd} · ${tur} elenmeliydi`);
    }
  }
});

test('eleme: TURİZM restoranı ve oteli ELEMİYOR — aradığı şey onlar', () => {
  // Bu testin varlık sebebi: bir zamanlar hepsi eleniyordu.
  for (const tur of ['restaurant', 'cafe', 'lodging', 'hotel',
                     'guest_house', 'bed_and_breakfast', 'campground']) {
    assert.equal(
      elemeSebebi(yer('Kavakdere Konukevi', [tur]), turizm),
      null,
      `turizm · ${tur} elenmemeliydi`,
    );
  }
});

test('eleme: İNŞAAT restoranı ve oteli eliyor — sektör dışı', () => {
  assert.equal(elemeSebebi(yer('Masum Görünen İsim', ['restaurant']), nis), 'tür:restaurant');
  assert.equal(elemeSebebi(yer('Masum Görünen İsim', ['lodging']), nis), 'tür:lodging');
});

test('eleme: TURİZM inşaat ve perakendeyi eliyor', () => {
  for (const tur of ['general_contractor', 'hardware_store', 'furniture_store',
                     'car_repair', 'beauty_salon']) {
    assert.ok(eler(turizm, 'Bir İşletme', [tur]), `turizm · ${tur} elenmeliydi`);
  }
});

test('eleme: kamu tesisleri tür etiketi olmasa da ad kalıbıyla eleniyor', () => {
  /*
     Türkiye'ye özgü boşluk: bu tesisler Google'da çoğu zaman düz
     `establishment` / `point_of_interest` olarak geliyor, yani tür
     süzgecinden geçiyorlar. İkinci savunma hattı ad kalıpları.
  */
  for (const ad of [
    'Gerede Millet Bahçesi',
    'Cumayeri Öğretmenevi ve ASO',
    'Yayla Dinlenme Tesisi',
    'Düzce Seyir Terası',
    '15 Temmuz Şehitleri Kültür Parkı',
    'Sünnet Gölü Tabiat Parkı',
    'Akşemseddin Hazretleri Türbesi',
    'Mudurnu Saat Kulesi',
  ]) {
    assert.ok(eler(turizm, ad, ['establishment', 'point_of_interest']), `${ad} elenmeliydi`);
  }
});

test('eleme: ad kalıbı gerçek konaklama işletmesini vurmuyor', () => {
  // "evleri", "köşk", "bungalov" gibi kelimeler kamu kalıplarına takılmamalı.
  for (const ad of ['Kavakdere Dağ Evleri', 'Meşe Bahçeli Köşk Bungalow',
                    'Gölköy Konukevi', 'Ceylan Bungalov']) {
    assert.equal(
      elemeSebebi(yer(ad, ['lodging']), turizm),
      null,
      `${ad} elenmemeliydi`,
    );
  }
});
