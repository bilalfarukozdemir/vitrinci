# Setup

From a fresh clone to a demo site you can open in a browser. Everything up to
"Scanning for real" works offline and costs nothing.

> Before you scan anything real, read [ETHICS-AND-LAW.md](ETHICS-AND-LAW.md).
> It is short, and it covers obligations that attach the moment you make your
> first API call.

---

## Requirements

| | |
|---|---|
| Node.js | **22.18 or newer** (24 LTS recommended) |
| npm | Ships with Node. Workspaces are used, so npm 7+ |
| OS | Developed on Windows; CI runs Linux |

The Node floor is not arbitrary. There is no build step — `node --test` runs
the `.ts` files directly, with no flag. Stripping types without a flag landed in
Node 22.18; on 22.6 through 22.17 the same command needs
`--experimental-strip-types` and will fail as written.

No database, no Docker, no global installs.

## 1. Install and verify

```bash
npm install
npm run kontrol
```

`kontrol` runs the test suite and the typechecker. It touches no network and no
API key. If it passes, the toolchain is sound.

## 2. Get a demo running

The demo app reads `apps/demo/src/veriler/`. That directory is gitignored —
it holds real businesses' names, phone numbers and reviews, so it is not in the
repo and a fresh clone does not have it. Create it from the bundled fictional
fixtures:

```bash
npm run ornek
```

Three imaginary businesses are copied into place: a paving contractor, a
restaurant with a QR menu, and a small hotel. They exist to exercise three
different templates. They have no photographs, on purpose — there is not one
image in this repo that belongs to somebody else.

```bash
npm run dev --workspace=@studio/demo
```

Open <http://localhost:3001/kavakdere-tas-doseme>. Also worth a look:

- `/mese-bahce-restoran/menu` — the QR menu route
- `/golkoy-konagi` — section headings adapt to the sector ("Rooms and
  facilities", not "What we do")

`npm run ornek` never overwrites a file that already exists, so you can edit a
copied fixture and run it again safely.

## 3. Try the whole pipeline without an API key

```bash
npm run tara:kuru
```

This runs the complete chain — filter, audit, score, report, canonical JSON —
against a fixed fictional dataset. No Places API call, no quota spent. Use it
after any change to the scoring or filtering logic.

One caveat, stated because it matters: the fixtures use `.example` domains,
which by design do not resolve. Every audit therefore reports "unreachable" and
every record scores as top priority. The chain is exercised end to end, but the
*upper end* of the score scale is not calibrated. If you want to calibrate it
against real, healthy sites, create `tools/prospect/src/fixtures.yerel.mjs`
exporting a `KURU_ISLETMELER` array in the same shape; it takes precedence and
is gitignored.

---

## Scanning for real

Everything below this line contacts Google, costs money, and collects other
people's contact details.

### 4. API key

```bash
cp tools/prospect/.env.example tools/prospect/.env
```

Then:

1. [console.cloud.google.com](https://console.cloud.google.com) → create a project
2. **APIs & Services → Enable APIs** → enable both:
   - `Places API (New)`
   - `PageSpeed Insights API` (free, no billing required)
3. **Credentials → Create credentials → API key**
4. Put it in `tools/prospect/.env` as `GOOGLE_API_KEY`

Fill in the `SAHIP_*` values too — they are printed in the contact block at the
bottom of every report you send.

### 5. Cap the bill before your first scan

Do this now, not after. Google Cloud → **APIs & Services → Places API (New) →
Quotas & System Limits** → set a daily request limit (200 is generous). Over
the cap, requests are refused and no charge is incurred. A quota ceiling is the
only mechanism that physically prevents a forgotten loop from producing an
invoice; a budget alert only tells you afterwards.

Also set a small budget alert under **Billing → Budgets & alerts**.

Rough cost at the time of writing: the fields this engine needs fall into the
Text Search Enterprise + Atmosphere tier, which has a monthly free allowance,
after which requests are billed per thousand. One request returns twenty
businesses, and a city sweep is roughly a hundred requests. Google changes
pricing — check the current SKU page rather than trusting this paragraph. Every
run prints how many requests it spent.

`tools/prospect/README.md` has the detailed cost breakdown, in Turkish.

### 6. First scan

```bash
npm run tara -- --nis=insaat --sehir=Düzce
```

Output lands in `tools/prospect/out/<date>-<niche>-<cities>/`:

| File | What it is |
|---|---|
| `panel.html` | Start here. **Internal only — do not share.** |
| `prospects.csv` | The full list |
| `raporlar/` | One sendable report per business |
| `isletmeler.json` | Canonical data; the demo generator reads this |
| `ham.json` | Unfiltered raw results |

**`out/` is gitignored and must stay that way.** It contains business lists and
contact details — commercial information and, under KVKK, personal data.

### 6b. Know what "supported sector" means

Two lists decide how much you get out of the box, and they are not the same
length.

**Scanner niches** — `tools/prospect/src/config.mjs`:
`insaat` · `ihracatci` · `klinik` · `otomotiv` · `turizm`

**Demo templates** — `apps/demo/src/sablonlar.ts`:
landscaping · stone & paving · construction & renovation · building-materials
retail · lodging · food & drink

A niche with no matching template still scans, scores and produces an audit
report perfectly well. What you do not get is a pre-filled demo: the page comes
out with no services and no FAQ, on a neutral palette, and you write those
sections yourself.

That is by design — the generator never invents claims about somebody else's
business. But it means *"my sector is in the niche list"* and *"I get a
ready-made demo"* are different statements. A dental clinic scan works; the
dental demo is a skeleton you fill.

The niches also differ in filter maturity. `insaat` and `turizm` have their own
elimination and rescue patterns tuned against real scans; the others have query
lists but thinner noise filters, so expect more junk in the results.

### 7. Generate a demo

```bash
npm run ekle --workspace=@studio/demo -- <scan-folder> <slug-or-name-fragment>
```

This writes an editable file into `apps/demo/src/veriler/` with contact
details, address, rating, real review text and downloaded photographs — all
verifiable data.

It deliberately does **not** invent services. `hizmetler` comes back empty.
Open the file, read the reviews it printed for you, work out what the business
actually does, and write it. Five to ten minutes. An earlier version guessed
from the search term and made a garden *furniture shop* claim it laid turf;
making a false claim about someone else's business is the one thing here that
must not be automated.

The generated page carries a visible draft banner and is closed to search
engines until you set `kaynak.musteriOnayli = true`.

### 8. Search Console verisi (optional)

Once a customer's site is live, `tools/gsc` turns a Search Console export into
the numbers that make a case study honest — it splits queries by *intent*,
because impressions alone say nothing about whether the right people found you.

Search Console → Performance → **Export** → download CSV, then place it:

```
veri/gsc/<site-name>/Sorgular.csv
```

```bash
node tools/gsc/oku.mjs               # every site under veri/gsc
node tools/gsc/oku.mjs <site-name>   # one site
```

`veri/` is gitignored — externally sourced raw data does not enter the repo.

### 9. Track replies

```bash
npm run panel
```

Message drafts, QR codes, and reply state. `tools/panel/veri/` is gitignored —
it records who was contacted, what was discussed and what price was agreed.

---

## Before you publish anything from this repo

```bash
npm run yayina-hazir
```

Two checks in order: a content audit (does any publishable file contain real
business data?) and a structural test (do the right files ship, and is that
enough for a stranger to build?). It takes about ninety seconds and it is the
gate before a commit that goes public.

If it reports **partial audit**, the content half did not really run — that
happens wherever the local data is absent, such as CI. A partial pass is not a
publishing decision. Run it once on the machine that holds the real data.

### Don't rely on remembering

```bash
npm run kanca-kur
```

Sets `core.hooksPath` so that **every commit runs the leak scan first** and
refuses the commit if anything is found.

Git will not enable a repository's hooks by itself — a repo that could run
arbitrary code the moment you cloned it would be a security hole. So this is
one command per clone, and it is worth running on the first day.

The hook runs the scan **only** (about six seconds), not the full
`yayina-hazir`. That is deliberate: the full gate takes around two minutes,
and a two-minute wait on every commit gets bypassed with `--no-verify` within
a week. A check that survives is worth more than a thorough one that doesn't.
Run `yayina-hazir` before pushing.

If the hook ever blocks something you are certain is a false positive:

```bash
git commit --no-verify
```

Ask yourself twice before typing that.
