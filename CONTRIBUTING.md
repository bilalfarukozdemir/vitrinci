# Contributing

## Current status: not looking for contributors yet

This is deliberate, and saying so is more useful than a generic "PRs welcome"
that goes unanswered for six months.

`vitrinci` has exactly one user. Before it makes sense to accept features, the
next thing to prove is that it runs end to end for a **second** person — that
the setup instructions are complete, that the assumptions baked into the
filters are not purely local, and that someone else can close a job with it.
Accepting a plugin architecture before that would be building for users who do
not exist yet.

So the roadmap is short and it is not a feature list:

1. A second person runs it and gets a real reply from a real prospect
2. Whatever broke on the way gets fixed
3. *Then* the question of contributions is worth reopening

## What genuinely helps right now

**Tell us it broke.** An issue saying "the setup steps do not work on macOS,
here is where it stopped" is worth more than a feature branch. Same for a
filter that eliminated a business it should have kept, or kept one it should
have eliminated — that is the part that is hardest to get right from one
person's market.

**Tell us where the legal summary is wrong.** [ETHICS-AND-LAW.md](ETHICS-AND-LAW.md)
was written by a developer, not a lawyer. If you know that a rule has been
amended, or that a jurisdiction works differently, that correction is the most
valuable thing you can send. Cite the source and it goes straight in.

**Tell us if the docs lie.** The README claims a four-command install works
from a clean clone. If it does not work for you, that is a bug in the project,
not in your setup.

Please do not send: plugin systems, additional data sources, a web UI, or an
npm release. Those are explicit non-goals until there is a second user asking
for them by name.

---

## If you do send a patch

### Language

**Code and comments in Turkish. Documentation in English.**

This is a fixed decision, not an accident. The comments carry the reasoning —
why a filter exists, what it cost to learn, which false positive made an
earlier version useless — and that reasoning was worked out in Turkish about a
Turkish market. Keep new comments in Turkish and in the same register as the
ones around them: concrete, specific about consequences, no hedging.

A comment that says *what* the code does is noise. A comment that says why it
is not the obvious thing is the point.

### Tell the case, don't name the business

This is the single rule that protects everything above.

An independent pre-publication review found a dozen leaks of real business
identities in this repo. Every one of them came out of these comments — not
from data files, not from fixtures, but from the narratives that make the
comments worth keeping. Someone documenting a genuine lesson naturally writes
down which customer taught it.

The lesson survives anonymisation completely:

> ✗ *"X Ltd's best photo was a PNG with a .jpg extension"*
> ✓ *"one demo's best photo was a PNG with a .jpg extension"*

The second sentence teaches exactly as much. The first also publishes a
customer relationship.

The leak auditor cannot save you here — it only knows names that are still in
your local data. A record you deleted last month is invisible to it, and one of
the leaks found in review was exactly that. So this is a writing rule, enforced
by the writer.

### The gate

Every change must pass:

```bash
npm run kontrol         # tests + typecheck
npm run yayina-hazir    # leak audit + clean-clone test
```

`yayina-hazir` takes about ninety seconds. Run it before you open a pull
request, not after review.

If it reports **partial audit**, the content half did not run — that happens
wherever the local data is absent, including CI. A partial pass is not a green
light for anything that touches the leak boundary.

### Fixtures

Test fixtures and example demos must be fictional, and fiction here is
**machine-checkable**:

| Field | Rule | Why |
|---|---|---|
| Domain | `.example` | RFC 2606 reserves it; nobody can register it, so it can belong to nobody |
| Phone | ends in `555 55 55` | Obviously invented, and the auditor recognises it |

Anything else is treated as real data and blocks publication. If you need a
fixture that looks realistic — and you often do, because schema validation and
title-length thresholds are tested against realistic data — keep the shape and
change the identity.

If a fixture's name encodes something the test measures, preserve the
structure. `tools/prospect/test/alanadi.test.mjs` derives domain candidates
from company names, so the *word types* in a fixture name (brand / city /
sector / legal suffix) are what the rules read. Change the name and keep the
pattern, or the test quietly starts measuring something else.

### Reference values

Some tests assert fingerprints produced by an independent implementation —
`apps/demo/test/qr.test.mjs` compares the QR encoder against `npm qrcode` at
error-correction level M, module for module.

If you change the input strings, **do not regenerate those hashes with our own
encoder.** That turns the test into "the encoder agrees with itself", which is
exactly the failure it was written to catch: an earlier version had the
generator polynomial reversed, passed every round-trip test, and produced codes
no phone could read. Install the reference implementation and regenerate from
it. The method is documented in a comment beside the table.

### Never commit outputs

`tools/prospect/out/`, `tools/panel/veri/`, `apps/demo/src/veriler/` and
`apps/demo/public/foto/` contain third parties' personal data and photographs
you do not own. They are gitignored. If you find yourself using `git add -f` on
any of them, stop.

## Reporting a security or privacy problem

If you find a way that real business data can escape into a published commit,
please open an issue **without including the leaked data itself** — describe
the path, not the payload.
