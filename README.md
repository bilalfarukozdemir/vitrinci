# vitrinci

**Build the shopfront a local business never had.**

Half the tradespeople, restaurants and small hotels in a Turkish town have a
Google Maps pin, four photos, thirty reviews — and no website. `vitrinci` is
the whole pipeline for turning that into a paying job:

```
find businesses without a site  →  audit what they have  →  score the opportunity
     →  generate a real demo site  →  send it  →  track the reply
```

The demo is not a mockup. It is the site. When the owner says yes you fill in
the missing data and connect a domain — there is no rewrite. That single
decision is what makes the economics work.

> **Read [ETHICS-AND-LAW.md](ETHICS-AND-LAW.md) before your first scan.**
> This tool collects contact details of people who did not ask to hear from
> you, and downloads photographs you do not own. Both are regulated. That
> document is the part tools like this usually skip.

---

## What it is

A narrow, finished system rather than a broad framework:

| Stage | Command | Output |
|---|---|---|
| **Find** | `npm run tara` | Businesses matching a niche in a city, filtered down to real prospects |
| **Audit** | same run | Does the site exist, resolve, load, rank? Weighted findings and a priority score |
| **Generate** | `npm run ekle --workspace=@studio/demo` | An editable demo site per prospect, from a sector template |
| **Send & track** | `npm run panel` | Message drafts, QR menu codes, reply tracking |

Everything reads one canonical business schema (`packages/data`). The audit
report, the demo, the customer's live site and the sitemap are all projections
of the same object — so an improvement to the JSON-LD generator reaches all of
them at once.

## What it is not

- **Not a general website builder.** It builds one shape of thing well.
- **Not a scraper you point at the world.** The filters, phone normalisation,
  sector vocabulary and city lists are Turkish. Using it elsewhere means
  rewriting `tools/prospect/src/config.mjs`, not adding a locale.
- **Not multi-source.** Google Places only. Abstracting over a second data
  source before a second source exists is how tools like this die.
- **Not on npm, and it has no plugin system.** Deliberately. Small and working
  beats large and half-finished.

## Quick start

```bash
npm install
npm run kontrol
npm run ornek
npm run build --workspace=@studio/demo
```

That sequence is not advice, it is verified: `npm run temiz-clone` extracts
only the files git would publish into a throwaway directory outside the repo
and runs exactly those four commands from scratch. If the README is wrong, that
test fails.

Scanning needs a Google Places API key. Full instructions in [SETUP.md](SETUP.md).
To see the whole chain run without a key or a single API call:

```bash
npm run tara:kuru
```

## Two rules the code enforces for you

**Generated service descriptions are guesses.** The templates produce plausible
text about somebody else's business. An earlier version read the search term
and wrote services from it, which made a garden *furniture shop* claim it laid
turf. The generator now leaves `hizmetler` empty on purpose. Open the file,
read the reviews it prints, and write what they actually do.

**A demo carries a visible draft banner until you clear it.** Until
`kaynak.musteriOnayli` is true the page says, in the owner's language, that the
information came from their Google listing and has not been verified by them.
The banner is not a defect to hide — it is the conversation opener: *"if
something is wrong, tell me and I'll fix it."* Demos are also never indexed:
`robots.ts` closes everything and each page carries `noindex`. Two layers,
because one gets edited by accident.

## Language

Code and comments are **Turkish**. Documentation is **English**.

This is deliberate and will not be "fixed". The comments carry the expensive
part of this repo: why a filter exists, what it cost to learn, which false
positives made an earlier version useless. Translating them would smooth them
into generic advice — and generic advice is already free everywhere.

If you do not read Turkish, be realistic about what that costs. The test
names are full sentences describing behaviour and the fixtures are written to
be read — but they are written in Turkish too, so machine translation is part
of the workflow rather than an optional aid. An independent reviewer checked
this claim and it did not survive in its earlier, more optimistic form.

What genuinely helps: the docs you are reading are English, the commands are
self-describing, and the error messages tell you what to do next. Reading the
scanner's scoring internals without Turkish is real work.

## Safety rails

Real customer data lives in this repo's working directories and must never
reach a commit. Three commands enforce that:

| Command | Question it answers |
|---|---|
| `npm run sizinti` | **Content** — does any publishable file contain real business data? |
| `npm run temiz-clone` | **Structure** — do the right files ship, and is that enough to build? |
| `npm run yayina-hazir` | Both, in order. The gate before publishing. |

The leak auditor keeps no hand-written blacklist. It reads the real data on
your disk, derives the forbidden terms itself, and looks for them in the files
git would publish. Add a demo and it is protected the moment it exists.

Both checks are needed and neither covers the other. Removing one `.gitignore`
line once let 380 copyrighted photographs into the publish list while the leak
auditor reported a clean run — it only reads text files, so a `.jpg` is
invisible to it. The structural test caught it.

> **On the CI badge.** Continuous integration can only run *half* the leak
> audit. Forbidden terms are derived from local scan output, panel state and
> demo files, all of which are gitignored and therefore absent in CI. A green
> badge means the pattern rules passed — phone numbers, e-mail addresses, API
> keys, Maps identifiers. It does **not** mean real business names were
> checked. That half only means something on the machine holding the data, and
> the tooling says so in its own output rather than hiding it behind a colour.

## Documentation

| File | Contents |
|---|---|
| [SETUP.md](SETUP.md) | Install, API key, first scan, first demo |
| [ETHICS-AND-LAW.md](ETHICS-AND-LAW.md) | Places API terms, KVKK/GDPR, photo copyright, unsolicited outreach |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Why the layers are ordered the way they are |
| [GOING-LIVE.md](GOING-LIVE.md) | Turning an accepted demo into the customer's real site — written by doing it |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Current status — contributions are not being sought yet, and why |

## Status

Working, and in daily use by its author. It has produced real demos and real
conversations. It has **one** user, which is the honest number. The next thing
worth proving is that it runs for a second person — not that it scales to a
hundred.

## Licence

MIT — see [LICENSE](LICENSE).

The licence covers this source code. It says nothing about the data you
collect with it, the photographs you download, or the messages you send. Those
are governed by Google's API terms, by data protection law, by copyright and by
the rules on unsolicited commercial contact.
[ETHICS-AND-LAW.md](ETHICS-AND-LAW.md) walks through each.

---

## Support

[![GitHub Sponsors](https://img.shields.io/github/sponsors/bilalfarukozdemir?label=sponsor&logo=githubsponsors&color=ea4aaa)](https://github.com/sponsors/bilalfarukozdemir)

This is free and will stay free. If it is useful to you, you can
[sponsor the work](https://github.com/sponsors/bilalfarukozdemir) — a star or a
good bug report is worth just as much.
