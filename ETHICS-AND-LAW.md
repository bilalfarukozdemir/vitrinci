# Ethics and law

This tool finds businesses that did not ask to be found, stores their contact
details, downloads photographs it does not own, and helps you message people
who never opted in. Every one of those is regulated.

Most scraping repositories ship without a document like this. That absence is
not neutral — it quietly transfers the whole problem to whoever runs the code.
This file exists so you can make informed decisions rather than discover them.

> **This is not legal advice.** It is a working summary written by a developer,
> not a lawyer, aimed at the Turkish market. Laws change, platform terms change
> more often, and your situation may differ. Treat every specific figure here
> as possibly stale and check the primary source. Where the stakes are real —
> a complaint, a takedown, an invoice — talk to a lawyer.

---

## The short version

| Obligation | Where it bites | Section |
|---|---|---|
| You may not keep Places API data indefinitely | `tools/prospect/out/` | [1](#1-google-places-api) |
| You become a data controller the moment you scan | Everything downstream | [2](#2-personal-data--kvkk-and-gdpr) |
| Commercial messages have rules even B2B | Every message you send | [3](#3-commercial-electronic-messages) |
| The photographs are not yours | `apps/demo/public/foto/` | [4](#4-photographs-and-reviews) |
| An unsolicited demo is a favour, not a right | The demo you just sent | [5](#5-unsolicited-demos) |
| Outputs must never be committed | Every commit | [6](#6-never-commit-outputs) |

---

## 1. Google Places API

**Read the current terms.** Google's Maps Platform Terms of Service and the
Places API policies are the binding document, not this file:
<https://cloud.google.com/maps-platform/terms>

Three constraints matter for how this tool is built:

**Caching is time-limited.** Google has long drawn a line between place IDs —
which may be stored indefinitely so you can re-fetch a record — and other
Places content, which may only be cached temporarily. The permitted window has
historically been expressed in days, and the number has changed. That is
precisely why `tools/prospect/out/` is a working directory and not a database:
a scan is a snapshot you act on within days, not an asset you accumulate.

If you find yourself thinking *"I'll keep every scan and build a searchable
archive"* — that is the design the terms are written to prevent, and it is also
the design that turns a sales tool into a data broker.

**Attribution.** Where you display Places content, Google requires attribution.
Reports and demos generated here are shown to the business the data is about,
which is a narrow case, but if you build anything public-facing on this data,
check the attribution requirements first.

**Reviews have extra rules.** Beyond copyright (see [section 4](#4-photographs-and-reviews)),
Google's structured-data policy forbids using reviews you did not collect on
your own site as `aggregateRating` markup. This repo enforces that in code:
reviews with `kaynak: 'google'` are excluded from the aggregate rating even
though they are displayed on the page. There is a test that fails if someone
removes that behaviour. Do not remove it — the penalty is a manual action
against the site you built for a paying customer.

## 2. Personal data — KVKK and GDPR

**Scanning makes you a data controller.** In Turkey that is *veri sorumlusu*
under KVKK (Law No. 6698). If you handle data of people in the EU, GDPR applies
too. The obligations attach when you collect, not when you use.

**"It's a business number" is not a complete answer.** For a sole trader, a
tradesperson, or any listing that carries a personal mobile or an owner's name,
the data identifies a natural person and is personal data. Much of what this
tool collects is exactly that.

**"It was already public" is a weaker argument than it sounds.** KVKK does
recognise data the person themselves made public (*alenileştirme*), and a
business that publishes its phone number on Google Maps has arguably done so.
But making something public is generally understood to be for a *purpose* — a
customer calling to book a table — and processing outside that purpose is not
automatically covered. Bulk collection into a prospect pipeline is a different
purpose from the one the number was published for. This is contested ground.
Do not build your whole justification on it.

**Legitimate interest is the usual basis, and it is conditional.** KVKK allows
processing necessary for the controller's legitimate interests provided it does
not harm the data subject's fundamental rights and freedoms. Practically that
means: keep the dataset small and targeted, keep it briefly, and stop
processing someone's data the moment they ask.

**Things you actually have to do:**

- **Be ready to inform.** KVKK Art. 10 requires telling people whose data you
  process who you are, what you collect, why, and what rights they have. In
  practice: when you make contact, say plainly where you got their details.
  A line like *"I found your business on Google Maps"* is honest, and it is
  also the thing that makes the message land better.
- **Honour requests.** Deletion, access and objection requests must be actioned.
  If someone says "delete my data", delete the scan rows, the generated demo
  and the downloaded photos — not just the demo page.
- **Check whether VERBİS registration applies to you.** Registration in the
  controllers' registry is required above certain thresholds and there are
  exemptions for small operations. Whether you fall inside is a question for a
  lawyer, not for this file.
- **Delete on a schedule.** Retention has to be justified. A prospect who said
  no eighteen months ago is not a legitimate interest, it is a liability.

## 3. Commercial electronic messages

Turkey regulates commercial electronic messages under Law No. 6563 and its
implementing regulation. This covers e-mail, SMS **and WhatsApp** — the channel
does not change the rules.

The headline for this tool's use case: **prior consent requirements are
different for merchants and tradespeople** (*tacir* and *esnaf*) than for
private individuals. Most prospects here are registered businesses, which is a
large part of why this workflow is viable at all.

That is not a free pass. Regardless of consent:

- **Opt-out must be easy and must work.** If someone says stop, you stop —
  and you record it so a later scan does not resurrect them.
- **Identify yourself properly.** Who you are and how to reach you.
- **İYS (İleti Yönetim Sistemi) is a separate obligation and it is not
  volume-dependent.** The *tacir/esnaf* exemption removes the requirement for
  **prior consent**. It does not remove the sender's İYS duties — registering
  messages and checking the rejection list before sending. An earlier draft of
  this file said İYS "may apply … before you send at volume", which wrongly
  implied both that it was optional and that it kicked in at scale. An
  independent review caught that; the correction is here because the mistake
  is easy to make and expensive to keep.

The rules around *tacir/esnaf* messaging have been amended repeatedly since
2020. Verify the current text of Law 6563 and its implementing regulation
before you rely on any paragraph above — including this one.

**A practical rule that outranks all of this:** send few, send relevant, send
personally. A hundred generic messages a week is both the behaviour the
regulations exist to curb and the behaviour that does not work. The reason this
repo makes you write the services by hand is partly ethical and partly that it
is the only version that converts.

## 4. Photographs and reviews

**The photographs on a Google Business Profile are not the business's to give
you, and they are certainly not yours.** They were taken by the owner, by a
customer, or by a photographer, and copyright sits with whoever pressed the
shutter. Downloading them and publishing them on a site you host is
reproduction and communication to the public.

`apps/demo/public/foto/` is gitignored for this reason, and there is not one
image in this repository that belongs to somebody else — including in the
example fixtures, which are deliberately photoless.

Working rules:

- Use downloaded photos **only** in the demo you show that specific business.
- **`noindex` is not "private".** A demo on a public URL is published, even if
  no search engine lists it. It is defensible as a proposal delivered to the
  subject; it is not defensible as a portfolio.
- **Delete promptly if they decline.** Not "eventually".
- **Never reuse someone's photographs in your own marketing** — case studies,
  landing pages, screenshots — without written permission. That is no longer a
  proposal to them, it is you profiting from their image.
- Once they are a customer, get the photo question settled in writing.

**Review text is somebody's writing, and the author's name is personal data.**
This tool copies both into demos. Displaying a business's own Google reviews
back to that business is a narrow use; republishing them elsewhere is not. See
also the `aggregateRating` rule in [section 1](#1-google-places-api).

## 5. Unsolicited demos

Building a working website for a business that never asked, using their name,
their photographs and their reviews, and then sending it to them, is unusual
enough to deserve its own rules. Done carelessly it is impersonation. Done
carefully it is the most useful cold message a small business will get all
year.

What this repo does by default:

- **The page says it is a draft** and states, in the owner's language, that the
  information came from their Google listing and has not been verified by them.
  It says so until you explicitly set `kaynak.musteriOnayli = true`.
- **Demos are never indexed** — `robots.ts` closes everything and each page
  also carries `noindex`. Two layers, because one gets edited by accident.
- **Nothing claims affiliation.** The demo is a proposal, not a launch.

What you must add:

- **Say who you are in the first line.** Not after the pitch.
- **Take it down on request, immediately and without argument.** Do not
  negotiate, do not send a follow-up asking why.
- **Never let a demo outrank or be confused with their real presence.** If they
  have a Facebook page or a listing that ranks, your unindexed demo must not
  compete with it.
- **Do not imply endorsement in either direction.** Their logo on your page
  does not mean they chose you.

The draft banner is not a defect to hide before sending. It is the opening —
*"if something here is wrong, tell me and I'll fix it"* — and it converts,
because it invites a reply that costs the owner nothing.

## 6. Never commit outputs

Every scan produces a file that must not reach a public repository:

| Path | What is in it |
|---|---|
| `tools/prospect/out/` | Business lists, phone numbers, addresses |
| `tools/panel/veri/` | Who was contacted, what was discussed, prices agreed |
| `apps/demo/src/veriler/` | Names, contact details, review text with author names |
| `apps/demo/public/foto/` | Photographs you do not own |

All are gitignored. Three commands defend the boundary:

```bash
npm run sizinti         # content: does any publishable file contain real data?
npm run temiz-clone     # structure: do the right files ship, and do they build?
npm run yayina-hazir    # both, in order — the gate before publishing
```

The leak auditor does not use a hand-written blacklist, because a hand-written
blacklist goes stale and is itself a file full of secrets. It reads the real
data on your disk, derives the forbidden terms, and searches the files git
would publish. Case and phone formatting are normalised, so `KAVAK DUVAR` and
`Kavak Duvar`, `0380 555 55 55` and `+903805555555`, are all one string to it.

It cannot catch everything. It reads text files only — a photograph is
invisible to it. That is why the structural test exists alongside it, and why
the gate runs both.

---

## A checklist before your first send

- [ ] Read the current Google Maps Platform terms, not just this summary
- [ ] Quota ceiling set in Google Cloud, so a bug cannot generate an invoice
- [ ] You can state where you got their details, in one honest sentence
- [ ] You have a way to record "do not contact" that survives the next scan
- [ ] The demo carries its draft banner and is closed to search engines
- [ ] You know which photographs you downloaded and can delete them on request
- [ ] `npm run yayina-hazir` is green before anything reaches a public commit
- [ ] You have decided how long you keep a scan, and you actually delete it

If you cannot tick the third and fourth boxes, do not send. Those two are what
separate this from spam, and they are also the cheapest to get right.
