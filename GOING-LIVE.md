# Going live

Turning an accepted demo into the customer's real website.

This document was written by **doing it**, not by imagining it. The dry run
lives in [`apps/musteri-ornek/`](apps/musteri-ornek) — a real, building,
deployable customer site produced from a real demo fixture. Every step below
was executed at least once; the surprises are recorded rather than smoothed
over.

---

## What actually changes

A demo and a customer site are the **same page** with three differences. That
is the whole claim this repo makes, and it is now verified rather than
asserted:

| | Demo | Customer site |
|---|---|---|
| Data source | `DEMOLAR[slug]` — many businesses, one app | `SITE` — one business |
| `kaynak.musteriOnayli` | `false` | `true` |
| `seo.indekslenebilir` | `false` | `true` |
| Draft banner | rendered | **gone — no code change, the flag removes it** |
| `robots` meta | `noindex, nofollow` | `index, follow` |
| `robots.txt` | `Disallow: /` | `Allow: /` + `Sitemap:` |
| `sitemap.xml` | empty | real URLs |
| Canonical | `demo.example/slug` | the customer's own domain |
| Domain | a constant in the app | `isletme.seo.alanAdi` — in the data |
| Analytics | on (did the prospect open the link?) | **off** — see below |

Everything in that table except the last two rows is driven by **two boolean
flags in the data**. Nothing is edited by hand. That is the property worth
protecting when this code changes.

---

## The checklist

### 1 · Before anything — get it in writing

Money and permission first. A site that goes live before the customer has
agreed to pay is a gift you cannot take back politely.

- [ ] Price agreed, in a message you can scroll back to
- [ ] First payment received (setup fee)
- [ ] Customer has **read the page** and confirmed the text is correct

### 2 · Verify the data with the customer

The demo was built from a Google listing. Some of it is guessed. Before it
becomes the business's official site, every guessed field needs a human "yes":

- [ ] Business name, exactly as they write it
- [ ] Phone — and whether it takes WhatsApp
- [ ] Address, opening hours
- [ ] Menu items **and prices** (prices go stale fastest)
- [ ] Photos — are these theirs? Google listing photos are often uploaded by
      customers, and the business does not own them
- [ ] Anything about the business's history (founding year, "since 19xx")

Then set `kaynak.musteriOnayli: true`. **Not before.** That flag is a claim
that a human confirmed the content, and one day it may need to be defended.

### 3 · Photographs

- [ ] No third-party faces. Customers eating in a photo did not consent to
      appearing on a commercial page. Two demos in this repo had photos pulled
      for exactly this reason.
- [ ] Photos the business supplied are preferred over anything scraped
- [ ] Cover photo is horizontal and sharp — it fills the hero

### 4 · Domain

- [ ] Registered **in the customer's name**, not yours — registrant contact is
      the business, not the developer. Leaving it in your name turns a normal
      exit into a hostage negotiation.
- [ ] Domain written into `seo.alanAdi` in the site data
- [ ] DNS pointed at Vercel, certificate issued

⚠️ There is a 60-day ICANN transfer lock after registration. It does not
prevent the customer from owning the domain, but it does prevent moving it to
another registrar during that window. Say so up front.

### 5 · Create the app

```bash
cp -r apps/musteri-ornek apps/musteri-<isim>
```

Then in the new folder:

- [ ] `package.json` → new name, new dev port
- [ ] `src/site.ts` → the customer's data, `musteriOnayli: true`,
      `indekslenebilir: true`, `seo.alanAdi` set
- [ ] `vercel.musteri-<isim>.json` at the repo root

> **Known debt — read this before customer #2.**
> `apps/musteri-ornek` **copies** ~460 lines of `page.tsx`, plus the CSS and
> the components, from `apps/demo`. It does not share them. Every fix made on
> the demo side has to be repeated by hand in every customer site.
>
> With one customer that is cheaper than the abstraction. With two it is not.
> When the second customer signs, extract the page into `packages/site` and
> let both apps import it. Do it then — not now, and not later than that.

### 6 · Check the sitemap against reality

**This is where the dry run found a real bug, so it gets its own step.**

`sayfaTanimlari()` derives the page list from the *data*: one page per
service, plus `/sss`, `/hakkinda`, `/iletisim`. A one-page customer site
serves none of those. On the first build the sitemap advertised **eight URLs
for a site with two pages** — six guaranteed 404s, handed to Google
deliberately, which Search Console reports as an error against the site.

`sitemapUret` now takes an explicit `sayfalar` list so the **app** declares
what it publishes rather than the data guessing.

- [ ] `sitemap.xml` lists only routes that exist
- [ ] Every route that exists **is** in the sitemap (`/menu` was missing too)

```bash
npm run build --workspace=@studio/musteri-<isim>
cat apps/musteri-<isim>/.next/server/app/sitemap.xml.body
```

Compare that list against the route table the build prints. They must match.

### 7 · Build and inspect

```bash
npm run kontrol
npm run build --workspace=@studio/musteri-<isim>
```

Then open it and confirm, on the page itself:

- [ ] Draft banner **gone**
- [ ] `<meta name="robots">` says `index, follow`
- [ ] Canonical points at the customer's domain, not the demo domain
- [ ] `robots.txt` allows crawling and names the sitemap
- [ ] QR code points at the customer's own domain — **scan it with a phone**
- [ ] Brand colours applied
- [ ] Menu link is `/menu`

The dev server does **not** catch `noUncheckedIndexedAccess` violations.
`next build` does. Never ship on a green dev server alone.

### 8 · Deploy

`vercel link` **before** every `vercel deploy --local-config`. One repo holds
several Vercel projects; an unlinked deploy publishes the wrong app to the
wrong domain, and the customer's site 404s while looking fine locally.

```bash
vercel link
vercel deploy --prod --local-config vercel.musteri-<isim>.json
```

- [ ] `vercel link` run first
- [ ] Custom domain attached in the Vercel project
- [ ] `https://` works, certificate valid
- [ ] `www` redirects to the apex (or the reverse — pick one and be consistent)

### 9 · Retire the demo

The demo URL is in the customer's WhatsApp history and possibly forwarded to
other people. It should not stay alive as a second copy of the site — two
identical pages on two domains is a duplicate-content problem, and the demo
copy is the one Google may pick.

- [ ] `301` from `demo.<your-domain>/<slug>` to the customer's domain
- [ ] Demo fixture removed from `apps/demo/src/veriler/`
- [ ] Panel record set to sold

### 10 · Hand over

- [ ] Add the site to **their** Google Search Console — their account, not
      yours, using their own Google login
- [ ] Website field in their Google Business Profile updated
- [ ] Tell them what they own: the domain, the content, the right to leave
- [ ] Tell them how to ask for a change, and how fast you answer

### 11 · Analytics — deliberately off

`apps/musteri-ornek` ships **no** analytics script.

On a demo, analytics answers one question: *did the prospect open the link?*
That question disappears the moment they become a customer. What replaces it
is someone else's visitor data on someone else's website, collected by
default, without being asked for.

If measurement is wanted, set it up **in the customer's own account, with
their consent**. Do not leave your own analytics on a site you no longer own.

---

## What the dry run proved

Run in full on 2 August 2026 against the Meşe Bahçe fixture.

**Held up:**

- The draft banner really does disappear from `musteriOnayli` alone — 0
  occurrences in the built HTML, no code edited
- `robots.txt` flipped from `Disallow: /` to `Allow: /` from `indekslenebilir`
  alone
- Canonical, JSON-LD, sitemap and the QR code all followed `seo.alanAdi`
  automatically, from one field
- The menu, QR block and brand tokens carried over untouched

**Broke:**

- The sitemap advertised six pages that did not exist, and omitted one that
  did. Fixed in `packages/seo` — see step 6.

**Still owed:**

- The page is copied, not shared. Step 5 says when to pay that off.
