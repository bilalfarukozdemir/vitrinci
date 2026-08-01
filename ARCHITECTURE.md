# Architecture

This document explains **why things are ordered the way they are**. It exists
for one reason: to avoid doing the same work twice.

---

## 1. The observation everything rests on

Every artefact this project produces comes out of the same shape:

| Artefact | Data in | Presentation | Built? |
|---|---|---|---|
| Audit report | A business (partial — from Maps) | Report template | ✅ |
| Demo homepage | A business (partial + template defaults) | Block library | ✅ (components live in `apps/demo`; library pending) |
| The customer's real site | A business (complete) | Block library | ◐ same code path, not yet used in anger |
| Proposal document | A business + scope + price | Report template | ⬜ |

The input is always *a business*. The output is always *a page that ranks*.
The thing in the middle is identical.

Written as separate projects, you write the JSON-LD generator four times, the
hero block four times, the metadata logic four times — and an improvement to
one never reaches the other three.

So there is one canonical schema (`packages/data`) and everything else is a
projection of it.

## 2. The central rule: the demo *is* the site

The demo is not a mockup generator. When a prospect says yes, the work is
**completing the data and connecting a domain** — not rewriting.

```
Maps scan  →  IsletmeTaslak (partial)  →  demo is live
                        ↓  customer says yes
                    Isletme (complete)  →  real site, same code
```

One schema, two validation levels. `yayinaHazirMi()` reports, in plain
language, exactly what still has to be collected from the customer before the
draft can go live.

This single decision removes two to three days of rewriting per sale. It also
raises what you can charge, because delivery is fast.

## 3. The expensive decisions

These are the ones that are painful to reverse. Spend the thinking here.

**a) The business schema.** Everything reads it. Get `hizmetler`, `bolgeler`
or `diller` wrong and you touch every app later. → `packages/data`

**b) Multilingual from the first line.** Retrofitting hreflang and localised
routes onto a single-language Next.js app is genuinely painful. The solution
had to add capability without adding friction for the common single-language
case: the `Yerelli<T>` type accepts either `"text"` or `{tr: "...", en: "..."}`
and normalises the simple form automatically. A free option, taken early.

**c) Content source — hybrid.** *Decided, not yet built.*

| What | Where | Why |
|---|---|---|
| Structure: routes, service list, schema | In the repo, as code | Rarely changes, type-safe, customers can't break it |
| Volatile content: gallery, reviews, blog, FAQ, prices | External store | The customer edits it without a deploy |

Put everything in the repo and every text change becomes your work. Put
everything in a database and you lose type safety and structure. The hybrid is
both correct and the hardest thing to retrofit — which is why it is decided
now even though it is not implemented yet.

**d) The boundary that protects design difference.** The sales argument is
"your site will not look like a template". A naive shared component library
destroys exactly that. The correct shape:

```
shared blocks  +  per-site token/theme layer  +  escape hatch for bespoke sections
```

Blocks never hardcode colour or type; they read tokens. Each site has its own
token set. Anything that does not fit the library is written for that site
alone and does not pollute the library. Sites look different; the
infrastructure stays shared.

## 4. The cheap decisions

Easy to change later. Do not agonise:

- Which blocks exist
- Colour palettes
- Analytics provider
- How the report template looks
- Finding weights in the audit scorer

## 5. Layer order

Dependencies point downwards. A lower layer never knows about a higher one.

```
Layer 0   packages/data      Canonical business schema + validation      ✅
              ↓
Layer 1   packages/seo       metadata, JSON-LD, sitemap, hreflang        ✅
          packages/ui        brand tokens (block library pending)        ◐
              ↓
Layer 2   apps/demo          draft data → site                           ✅
              ↓
Layer 3   customer sites     (cheap by this point)                       ⬜

Alongside tools/prospect     scan + audit engine, feeds Layer 0          ✅
          tools/panel        outreach and reply tracking                 ✅
          tools/denetim      leak audit + clean-clone test               ✅
          tools/gsc          Search Console reader                       ◐
```

`packages/ui` currently holds the tokens; the block library is the next real
piece of work. `apps/demo` renders its own components in the meantime, which is
fine — extracting them once there are two consumers is easy, and guessing the
right abstraction from one consumer is not.

## 6. Why the block library is not built yet

This is a sequencing decision, not a backlog item that slipped.

**Designing the block library before twenty real sales conversations means
writing the wrong forty blocks.** Whether a contractor's page converts better
with a price list, a reference gallery or a service-area map is not knowable
from a desk. The conversations *are* the requirements document for Layer 1.

So outbound does not pause while the architecture is built. The engine already
works and demos can be produced by hand:

| Now | In parallel |
|---|---|
| Layers 0 → 1 → 2 | Messages out, demos by hand, real conversations |

The yeses become the first customer sites. The conversations become the spec.

## 7. Case studies must be fed by data

A hand-written case study goes stale in three months and then you maintain it
forever. Pull the Search Console numbers and store them; the case pages update
themselves. Nothing goes stale, and "currently ranking first" stays true
because it is measured rather than asserted.

`tools/gsc` is the beginning of this. It is also the sales argument for a
retainer: the customer watches their own ranking, live.

---

## Directory layout

```
.
├── packages/
│   ├── data/         Layer 0 — schema, validation, adapters
│   ├── seo/          Layer 1 — metadata, JSON-LD, sitemap, hreflang
│   └── ui/           Layer 1 — brand tokens
├── apps/
│   └── demo/         Draft data → demo/real site
└── tools/
    ├── prospect/     Scan + audit engine
    ├── panel/        Outreach and reply tracking
    ├── gsc/          Search Console reader
    └── denetim/      Leak audit, clean-clone test, publish gate
```

Gitignored working directories — real customer data, never committed — are
listed in [ETHICS-AND-LAW.md](ETHICS-AND-LAW.md#6-never-commit-outputs).

## Tooling decisions

| Decision | Choice | Reason |
|---|---|---|
| Monorepo | npm workspaces | Already using npm; no extra tool |
| Schema validation | Zod | Types and runtime validation from one source |
| Build step | None | Node runs `.ts` directly; Next.js compiles workspace packages itself |
| Hosting | Vercel | Same stack already in use |
| Data store | Not yet chosen | Needed only for decision 3c, which is not built |

The absence of a build step is worth defending. It means a clean clone runs
`npm install` and then works — which `npm run temiz-clone` verifies on every
publish, from a directory containing only the files git would ship. Every build
step you add is a step that can break for someone whose machine is not yours.
