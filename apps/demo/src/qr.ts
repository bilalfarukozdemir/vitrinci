/**
 * QR KOD ÜRETECİ — bağımlılıksız.
 *
 * Neden elle yazıldı: proje bilerek bağımlılık tutmuyor (kök
 * `dependencies` boş) ve QR her restoran demosunda gerekiyor. Dışarıdan
 * paket almak tek kullanımlık bir iş için ağaç büyütmek olurdu.
 *
 * KAPSAM — bilerek dar:
 *   · yalnız BYTE kipi (URL'ler ASCII)
 *   · yalnız ECC seviyesi M (%15 kurtarma — masa üstünde parmak izi,
 *     çay lekesi ve kırışıklığa dayanacak kadar; L yetersiz, Q/H kodu
 *     gereksiz sıklaştırıyor)
 *   · sürüm 1–7 (124 bayta kadar; en uzun demo adresimiz 86 karakter)
 *
 * SÜRÜM 8'DE DURULDU, BİLEREK. 8, 9 ve 10 blokları İKİ GRUBA bölüyor
 * (ör. 2×38 + 2×39) ve o serpiştirme yolu referans uygulamayla
 * DOĞRULANMADI — sürüm 8 çıktısı referanstan farklı geliyor. Sürüm
 * 3, 4 ve 6 birebir aynı; ürettiğimiz bütün adresler o aralıkta.
 * Sınırı doğrulanmamış koda değil, doğrulanmış koda çekiyoruz.
 *
 * Daha fazlası gerekirse tablolar genişletilir; şimdi gereksiz kod
 * taşımıyoruz.
 */

/** ECC M: [toplam kod sözcüğü, blok başına ECC, [blok, veri]…] */
const SURUMLER: Array<[number, number, Array<[number, number]>]> = [
  [26, 10, [[1, 16]]],
  [44, 16, [[1, 28]]],
  [70, 26, [[1, 44]]],
  [100, 18, [[2, 32]]],
  [134, 24, [[2, 43]]],
  [172, 16, [[4, 27]]],
  [196, 18, [[4, 31]]],
  [242, 22, [[2, 38], [2, 39]]],
  [292, 22, [[3, 36], [2, 37]]],
  [346, 26, [[4, 43], [1, 44]]],
];

/** Hizalama deseni merkezleri (sürüm 2'den itibaren). */
const HIZALAMA: number[][] = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50],
];

// ------------------------------------------------------------ GF(256)

/**
 * `noUncheckedIndexedAccess` acik oldugu icin her dizi erisimi
 * `number | undefined` donuyor. Bu dosyadaki indisler algoritma geregi
 * daima sinir icinde — kanit kodun kendisinde: dongulerin ust siniri
 * dizinin boyu. Her satira `!` serpistirmek yerine tek bir dar kapi.
 */
const oku = (a: ArrayLike<number>, i: number): number => a[i] as number;

const USTEL = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    USTEL[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // QR'ın indirgenemez polinomu
  }
  for (let i = 255; i < 512; i++) USTEL[i] = oku(USTEL, i - 255);
})();

const carp = (a: number, b: number) =>
  a === 0 || b === 0 ? 0 : oku(USTEL, oku(LOG, a) + oku(LOG, b));

/**
 * Reed-Solomon üreteç polinomu: g(x) = ∏(x + α^i), i = 0…derece-1.
 *
 * Katsayılar EN YÜKSEK DERECE ÖNDE saklanıyor (p[0] = baş katsayı) —
 * `eccHesapla` bölmede g[1…] kullandığı için sıra bu olmak zorunda.
 *
 * Buradaki iki satır bir kez ters yazılmıştı ve QR'lar hiçbir telefonda
 * okunmuyordu. Belirti aldatıcıydı: veri kod sözcükleri doğru çıkıyor,
 * sadece ECC bozuk oluyordu; kendi çözücümüzle yapılan gidiş-dönüş testi
 * ECC'ye hiç bakmadığı için hatayı göremedi.
 *
 * Elle doğrulama — derece 2: g(x) = (x+1)(x+α) = x² + (1+α)x + α,
 * α = 2 olduğundan katsayılar [1, 3, 2] olmalı.
 */
function uretec(derece: number): number[] {
  let p = [1];
  for (let i = 0; i < derece; i++) {
    const y: number[] = new Array(p.length + 1).fill(0);
    for (let j = 0; j < p.length; j++) {
      y[j] = oku(y, j) ^ oku(p, j); // × x  → derece bir artıyor
      y[j + 1] = oku(y, j + 1) ^ carp(oku(p, j), oku(USTEL, i)); // × α^i
    }
    p = y;
  }
  return p;
}

/** Bir bloğun ECC kod sözcükleri. */
function eccHesapla(veri: number[], sayi: number): number[] {
  const g = uretec(sayi);
  const kalan: number[] = new Array(sayi).fill(0);
  for (const bayt of veri) {
    const etken = bayt ^ oku(kalan, 0);
    kalan.shift();
    kalan.push(0);
    if (etken !== 0)
      for (let i = 0; i < sayi; i++) kalan[i] = oku(kalan, i) ^ carp(oku(g, i + 1), etken);
  }
  return kalan;
}

// ------------------------------------------------------------ matris

/** 2B satır okuma — dizinin dışına taşarsa `undefined`, taşmazsa satır. */
const satirAl = <T,>(m: T[][], y: number): T[] | undefined => m[y];

const desenKoy = (m: (boolean | null)[][], x: number, y: number, d: boolean[][]) => {
  for (let i = 0; i < d.length; i++) {
    const kaynak = satirAl(d, i);
    const hedef = satirAl(m, y + i);
    if (!kaynak || !hedef) continue;
    for (let j = 0; j < kaynak.length; j++) {
      if (x + j < hedef.length && x + j >= 0) hedef[x + j] = kaynak[j] as boolean;
    }
  }
};

const BULUCU = [
  [1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 1], [1, 0, 1, 1, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1], [1, 0, 1, 1, 1, 0, 1], [1, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1],
].map((r) => r.map(Boolean));

const HIZA = [
  [1, 1, 1, 1, 1], [1, 0, 0, 0, 1], [1, 0, 1, 0, 1], [1, 0, 0, 0, 1], [1, 1, 1, 1, 1],
].map((r) => r.map(Boolean));

/** Maske işlevleri (0–7). */
const MASKELER: Array<(y: number, x: number) => boolean> = [
  (y, x) => (y + x) % 2 === 0,
  (y) => y % 2 === 0,
  (_, x) => x % 3 === 0,
  (y, x) => (y + x) % 3 === 0,
  (y, x) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (y, x) => ((y * x) % 2) + ((y * x) % 3) === 0,
  (y, x) => (((y * x) % 2) + ((y * x) % 3)) % 2 === 0,
  (y, x) => (((y + x) % 2) + ((y * x) % 3)) % 2 === 0,
];

/** Biçim bilgisi: ECC M (0b00) + maske, BCH(15,5) ve 0x5412 ile XOR. */
function bicimBitleri(maske: number): boolean[] {
  const veri = (0b00 << 3) | maske;
  let bch = veri << 10;
  for (let i = 4; i >= 0; i--) if (bch & (1 << (i + 10))) bch ^= 0b10100110111 << i;
  const tam = ((veri << 10) | bch) ^ 0b101010000010010;
  return Array.from({ length: 15 }, (_, i) => ((tam >> (14 - i)) & 1) === 1);
}

/** Maske ceza puanı — düşük olan seçiliyor (ISO/IEC 18004). */
function ceza(m: boolean[][]): number {
  const n = m.length;
  const h = (y: number, x: number): boolean => (m[y] as boolean[])[x] as boolean;
  let p = 0;

  // Kural 1: aynı renkte 5+ ardışık (satır ve sütun)
  for (const eksen of [0, 1]) {
    for (let a = 0; a < n; a++) {
      let say = 1;
      for (let b = 1; b < n; b++) {
        const su = eksen === 0 ? h(a, b) : h(b, a);
        const onceki = eksen === 0 ? h(a, b - 1) : h(b - 1, a);
        if (su === onceki) say++;
        else {
          if (say >= 5) p += say - 2;
          say = 1;
        }
      }
      if (say >= 5) p += say - 2;
    }
  }

  // Kural 2: 2×2 aynı renk
  for (let y = 0; y < n - 1; y++)
    for (let x = 0; x < n - 1; x++)
      if (h(y, x) === h(y, x + 1) && h(y, x) === h(y + 1, x) && h(y, x) === h(y + 1, x + 1)) p += 3;

  // Kural 3: bulucu benzeri 1011101 + 4 boşluk
  const kalip = [true, false, true, true, true, false, true];
  const bosluk = [false, false, false, false];
  const dizi = (a: number, eksen: number) =>
    Array.from({ length: n }, (_, b) => (eksen === 0 ? h(a, b) : h(b, a)));
  const esles = (s: boolean[], k: boolean[], i: number) => k.every((v, j) => s[i + j] === v);
  for (const eksen of [0, 1])
    for (let a = 0; a < n; a++) {
      const s = dizi(a, eksen);
      for (let i = 0; i + 10 < n; i++) {
        if (esles(s, [...kalip, ...bosluk], i)) p += 40;
        if (esles(s, [...bosluk, ...kalip], i)) p += 40;
      }
    }

  // Kural 4: koyu oran %50'den sapma
  const koyu = m.flat().filter(Boolean).length;
  p += Math.floor(Math.abs((koyu * 100) / (n * n) - 50) / 5) * 10;
  return p;
}

/**
 * Metni QR matrisine çevirir. `true` = koyu modül.
 * 124 bayttan uzun metinde hata fırlatır (sürüm 7 sınırı).
 */
export function qrMatris(metin: string): boolean[][] {
  const baytlar = Array.from(new TextEncoder().encode(metin));

  let surum = 0;
  for (let v = 1; v <= 7; v++) {
    const [toplam, eccSayi, gruplar] = SURUMLER[v - 1] as [number, number, Array<[number, number]>];
    const veriSayi = toplam - eccSayi * gruplar.reduce((t, [b]) => t + b, 0);
    const sayacBit = v >= 10 ? 16 : 8;
    if (baytlar.length * 8 + 4 + sayacBit <= veriSayi * 8) { surum = v; break; }
  }
  if (!surum) throw new Error(`QR: metin çok uzun (${baytlar.length} bayt, en fazla 124)`);

  const [toplamKod, eccSayi, gruplar] = SURUMLER[surum - 1] as [number, number, Array<[number, number]>];
  const veriKod = toplamKod - eccSayi * gruplar.reduce((t, [b]) => t + b, 0);
  const sayacBit = surum >= 10 ? 16 : 8;

  // ---- bit akışı
  const bitler: boolean[] = [];
  const ekle = (deger: number, uzunluk: number) => {
    for (let i = uzunluk - 1; i >= 0; i--) bitler.push(((deger >> i) & 1) === 1);
  };
  ekle(0b0100, 4);
  ekle(baytlar.length, sayacBit);
  for (const b of baytlar) ekle(b, 8);
  for (let i = 0; i < 4 && bitler.length < veriKod * 8; i++) bitler.push(false);
  while (bitler.length % 8) bitler.push(false);
  const veri: number[] = [];
  for (let i = 0; i < bitler.length; i += 8)
    veri.push(bitler.slice(i, i + 8).reduce((t, b, j) => t | ((b ? 1 : 0) << (7 - j)), 0));
  const dolgu = [0xec, 0x11];
  for (let i = 0; veri.length < veriKod; i++) veri.push(dolgu[i % 2] as number);

  // ---- bloklara böl, ECC hesapla
  const vBlok: number[][] = [];
  const eBlok: number[][] = [];
  let ofset = 0;
  for (const [blokSayi, blokVeri] of gruplar)
    for (let i = 0; i < blokSayi; i++) {
      const d = veri.slice(ofset, ofset + blokVeri);
      ofset += blokVeri;
      vBlok.push(d);
      eBlok.push(eccHesapla(d, eccSayi));
    }

  // ---- serpiştir
  const son: number[] = [];
  const enUzun = Math.max(...vBlok.map((b) => b.length));
  for (let i = 0; i < enUzun; i++) for (const b of vBlok) if (i < b.length) son.push(b[i] as number);
  for (let i = 0; i < eccSayi; i++) for (const b of eBlok) son.push(b[i] as number);

  // ---- matris iskeleti
  const n = surum * 4 + 17;
  const m: (boolean | null)[][] = Array.from({ length: n }, () => new Array(n).fill(null));
  const ayrilmis: boolean[][] = Array.from({ length: n }, () => new Array(n).fill(false));
  /** Işlev deseni mi? (bulucu, zamanlama, hizalama, biçim alanı) */
  const ayr = (y: number, x: number): boolean => (ayrilmis[y] as boolean[])[x] as boolean;
  const isaretle = (x: number, y: number, w: number, h: number) => {
    for (let i = 0; i < h; i++) {
      const satir = ayrilmis[y + i];
      if (!satir) continue;
      for (let j = 0; j < w; j++) if (x + j >= 0 && x + j < satir.length) satir[x + j] = true;
    }
  };

  for (const [x, y] of [[0, 0], [n - 7, 0], [0, n - 7]] as Array<[number, number]>) {
    desenKoy(m, x, y, BULUCU);
    isaretle(x - 1, y - 1, 9, 9);
  }
  // ayırıcı boşluklar
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      if (ayr(i, j) && (m[i] as (boolean|null)[])[j] === null) (m[i] as (boolean|null)[])[j] = false;

  const hiza = HIZALAMA[surum - 1] as number[];
  for (const cy of hiza)
    for (const cx of hiza) {
      if (ayrilmis[cy]?.[cx]) continue;
      desenKoy(m, cx - 2, cy - 2, HIZA);
      isaretle(cx - 2, cy - 2, 5, 5);
    }

  for (let i = 8; i < n - 8; i++) {
    const v = i % 2 === 0;
    (m[6] as (boolean|null)[])[i] = v; (ayrilmis[6] as boolean[])[i] = true;
    (m[i] as (boolean|null)[])[6] = v; (ayrilmis[i] as boolean[])[6] = true;
  }
  (m[n - 8] as (boolean|null)[])[8] = true; (ayrilmis[n - 8] as boolean[])[8] = true; // koyu modül

  // biçim bilgisi alanları (değerler maskeden sonra)
  for (let i = 0; i < 9; i++) {
    if (!ayr(8, i)) { (ayrilmis[8] as boolean[])[i] = true; (m[8] as (boolean|null)[])[i] = false; }
    if (!ayr(i, 8)) { (ayrilmis[i] as boolean[])[8] = true; (m[i] as (boolean|null)[])[8] = false; }
  }
  for (let i = 0; i < 8; i++) {
    (ayrilmis[8] as boolean[])[n - 1 - i] = true; (m[8] as (boolean|null)[])[n - 1 - i] = false;
    (ayrilmis[n - 1 - i] as boolean[])[8] = true; (m[n - 1 - i] as (boolean|null)[])[8] = false;
  }

  // ---- veriyi zikzak yerleştir
  let bitNo = 0;
  let yukari = true;
  for (let sag = n - 1; sag > 0; sag -= 2) {
    if (sag === 6) sag = 5; // dikey zamanlama sütunu atlanıyor
    for (let adim = 0; adim < n; adim++) {
      const y = yukari ? n - 1 - adim : adim;
      for (const x of [sag, sag - 1]) {
        if (ayr(y, x)) continue;
        const bayt = son[bitNo >> 3];
        (m[y] as (boolean|null)[])[x] = bayt !== undefined && ((bayt >> (7 - (bitNo & 7))) & 1) === 1;
        bitNo++;
      }
    }
    yukari = !yukari;
  }

  // ---- maskeleri dene, en düşük cezayı seç
  let enIyi: boolean[][] | null = null;
  let enIyiCeza = Infinity;
  let enIyiMaske = 0;
  for (let maske = 0; maske < 8; maske++) {
    const aday = m.map((satir, y) =>
      satir.map((v, x) => (ayr(y, x) ? v === true : (v === true) !== (MASKELER[maske] as (a: number, b: number) => boolean)(y, x))),
    );
    const bicim = bicimBitleri(maske);
    for (let i = 0; i < 15; i++) {
      const b = bicim[i] as boolean;
      /*
         Biçim bilgisi İKİ kopya halinde yazılıyor (i = 0 en anlamlı bit).

           1. kopya (sol üst bulucunun etrafı)
             i 0–5   → (8, i)
             i 6     → (8, 7)      · sütun 6 dikey zamanlama, atlanıyor
             i 7     → (8, 8)
             i 8     → (7, 8)      · satır 6 yatay zamanlama, atlanıyor
             i 9–14  → (14-i, 8)

           2. kopya
             i 0–6   → (n-1-i, 8)  · YEDİ hücre; (n-8, 8) koyu modül, dahil değil
             i 7–14  → (8, n-15+i) · SEKİZ hücre, (8, n-8)'den başlıyor

         Buradaki sınırlar bir kez 8/8 yazılmıştı: (8, n-8) hücresine hiç
         değer yazılmıyor, buna karşılık koyu modül üzerine yazılıyordu.
         Sürüm 4'te doğru değer rastlantıyla 'boş' olduğu için fark
         edilmedi; sürüm 3'te kod bozuldu.
      */
      const r8 = aday[8] as boolean[];
      // 1. kopya
      if (i < 6) r8[i] = b;
      else if (i < 8) r8[i + 1] = b;
      else if (i === 8) (aday[7] as boolean[])[8] = b; // satır 6 zamanlama, atlanıyor
      else (aday[14 - i] as boolean[])[8] = b;
      // 2. kopya
      if (i < 7) (aday[n - 1 - i] as boolean[])[8] = b;
      else r8[n - 15 + i] = b;
    }
    (aday[n - 8] as boolean[])[8] = true;
    const p = ceza(aday as boolean[][]);
    if (p < enIyiCeza) { enIyiCeza = p; enIyi = aday as boolean[][]; enIyiMaske = maske; }
  }
  void enIyiMaske;
  return enIyi!;
}

/**
 * QR'ı SVG olarak döndürür. Sessiz alan (quiet zone) 4 modül —
 * standardın istediği en az bu; daha azı okuyucuları zorluyor.
 */
export function qrSvg(metin: string, { boyut = 240, pay = 4 } = {}): string {
  const m = qrMatris(metin);
  const n = m.length + pay * 2;
  const yollar: string[] = [];
  for (let y = 0; y < m.length; y++)
    for (let x = 0; x < m.length; x++)
      if ((m[y] as boolean[])[x]) yollar.push(`M${x + pay} ${y + pay}h1v1h-1z`);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" ` +
    `width="${boyut}" height="${boyut}" shape-rendering="crispEdges" role="img" ` +
    `aria-label="Menü karekodu">` +
    `<rect width="${n}" height="${n}" fill="#fff"/>` +
    `<path d="${yollar.join('')}" fill="#000"/>` +
    `</svg>`
  );
}
