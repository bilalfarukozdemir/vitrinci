import { BULGULAR, SKOR } from './config.mjs';

/**
 * Isletmenin ne kadar "canli" oldugu (0-100).
 * Amac: olu/terk edilmis kayitlari elemek. Kotu siteli ama musterisi olmayan
 * bir isletme prospect degildir — parasi yoktur, ilgilenmez.
 */
export function canlilikPuani(isletme) {
  let puan = 0;

  // Yorum sayisi en guclu sinyal. Doygunluga kadar logaritmik olceklendiriyoruz,
  // cunku 5 -> 25 yorum arasindaki fark, 200 -> 400 arasindakinden cok daha anlamli.
  const yorum = Math.min(isletme.yorumSayisi ?? 0, SKOR.yorumDoygunluk);
  puan += (Math.log10(yorum + 1) / Math.log10(SKOR.yorumDoygunluk + 1)) * 60;

  // Puan ortalamasi: 4.0 uzeri saglikli bir isletme demek.
  if (isletme.puan != null) {
    if (isletme.puan >= 4.5) puan += 25;
    else if (isletme.puan >= 4.0) puan += 20;
    else if (isletme.puan >= 3.5) puan += 12;
    else puan += 5;
  }

  // Telefon kayitliysa aktif olarak is aliyor.
  if (isletme.telefon) puan += 15;

  return Math.round(Math.min(puan, 100));
}

/** Bulgu listesinden zayiflik puani (0-100). */
export function zayiflikPuani(bulgular) {
  const toplam = bulgular.reduce((acc, kod) => acc + (BULGULAR[kod]?.puan ?? 0), 0);
  return Math.min(Math.round(toplam), 100);
}

/**
 * Firsat skoru: canlilik bir kapi gorevi goruyor, zayiflik carpan.
 * Canli isletme + kotu site = en yuksek skor. Bu siralama, hangi 20 kisiye
 * elle demo hazirlayacagini soyler.
 */
export function firsatSkoru({ canlilik, zayiflik }) {
  const kapi = SKOR.canlilikTabani + (1 - SKOR.canlilikTabani) * (canlilik / 100);
  return Math.round(kapi * zayiflik);
}

/** Skoru insan diline cevirir. */
export function oncelikEtiketi(skor) {
  if (skor >= 70) return 'ÇOK YÜKSEK';
  if (skor >= 50) return 'YÜKSEK';
  if (skor >= 32) return 'ORTA';
  if (skor >= 18) return 'DÜŞÜK';
  return 'ATLA';
}

const kacir = (deger) => {
  const metin = String(deger ?? '');
  return /[";\n\r]/.test(metin) ? `"${metin.replace(/"/g, '""')}"` : metin;
};

/**
 * Excel'in Turkce yerelinde sorunsuz acilan CSV uretir:
 * noktali virgul ayirac + UTF-8 BOM.
 */
export function csvUret(kayitlar) {
  const basliklar = [
    'Öncelik',
    'Fırsat Skoru',
    'İşletme',
    'Şehir',
    'Sorgu',
    'Telefon',
    'Site',
    'Puan',
    'Yorum',
    'Canlılık',
    'Zayıflık',
    'Mobil Hız',
    'Bulgular',
    'Maps',
    'Rapor Dosyası',
  ];

  const satirlar = kayitlar.map((k) =>
    [
      k.oncelik,
      k.firsat,
      k.ad,
      k.sehir,
      k.sorgu,
      k.telefon ?? '',
      k.site ?? 'YOK',
      k.puan ?? '',
      k.yorumSayisi,
      k.canlilik,
      k.zayiflik,
      k.hiz?.skor ?? '',
      k.bulgular.map((b) => BULGULAR[b]?.baslik ?? b).join(' | '),
      k.mapsUrl,
      k.raporDosyasi ?? '',
    ]
      .map(kacir)
      .join(';'),
  );

  return '﻿' + [basliklar.join(';'), ...satirlar].join('\r\n');
}
