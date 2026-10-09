# Pending client feedback

Everything from the client's review that is not finished yet: first what is blocked by the
real product photos (she is sharing a zip via Google Drive), then what has to be set up or
provided before launch. Done items are listed at the bottom for reference.

## Waiting on photos

### 1. Cans must show the purple logo sticker on the lid

The real cans have a purple sticker with the Ube Halaya logo on top of the lid. The current
photos are generated and show a plain silver lid. In France the photos must show exactly
what the customer receives, so every photo of a can has to be replaced.

Affected images (in `assets/img/`):

| Image | Where it is used |
| --- | --- |
| `hero-bg.webp`, `hero-scene.webp` | Home page hero (desktop / mobile) |
| `format-1.webp`, `format-3.webp`, `format-6.webp` | "Choisissez votre format" cards (home, product page, cart) |
| `product-main.webp` | Product page main photo, cart drawer |
| `gift-trio.webp`, `gift-pyramid.webp` | "Faites découvrir l'ube à vos proches" |
| `history-band.webp` | Notre histoire, bottom banner |
| `recipe-band.webp` | Recettes, bottom banner |
| `contact-hero.webp` | Contact, top photo |
| `livraison-hero.webp` | Livraison, top photo |

Temporary fix: the "Prêt à préparer votre premier latte ?" banner on Découvrir l'ube and
Livraison now shows the iced latte on its tray (`cta-latte.webp`), with no can, because the
old photo was cropped, blurry and showed the fake label. Put a real can back in that banner
once the photos arrive.

Fallback if some shots are missing from the Drive: retouch the existing photos to add the
lid sticker and the real logo on the label.

### 2. Fake label on the can ("dot in the B")

The label on the generated cans is not the real logo: the "b" of "Ube" has a small dot and
the text under the logo is garbled. Same images as item 1; fixed by the same real photos.

### 3. Pixelated photos on large screens

These banners come from images only ~1,250–1,400 px wide and look soft on a big monitor.
Replacements should be at least 2,500 px wide, with empty space around the product for the
page title.

| Image | Page |
| --- | --- |
| `hero-bg.webp` (stretched from 1,376 px) | Home |
| `product-main.webp` (glass, can and powder; client says it is the first thing she notices) | Product page, first photo |
| `history-hero.webp` | Notre histoire |
| `ube-hero.webp` | Découvrir l'ube |
| `contact-hero.webp` | Contact |
| `livraison-hero.webp` | Livraison |
| `recettes-hero.webp` | Recettes |

### What we need from the client

- Drive access to the photo zip.
- At minimum: one can alone (front, lid sticker visible), the trio of cans, the box of six,
  and a can on the tray with a latte, all high resolution.

## Before launch (not photo-related)

### -10 % welcome popup: make the code and emails real

The popup is live on the site (6 s after arriving, once per visitor, never on cart,
checkout or 404). Two things still have to be set up outside the website:

- **Create the code `BIENVENUE10`** (-10 %, limited to the first order, one use per customer)
  in the payment platform once checkout is connected. The site only displays the code; it
  cannot check whether an order is someone's first.
- **Connect the email capture** to a mailing tool (Brevo, Mailchimp, Shopify Email…). Right
  now the emails typed in the popup and in the footer newsletter form are not saved anywhere.
- **Suggested:** add the offer's conditions to the CGV (first order only, one use per
  customer, not combinable with other offers), worded to match how the code is set up.

### Low-stock notice: switch on by hand

The product page can show "Plus que quelques exemplaires en stock" under the format picker.
It is off for every format. To turn it on, set `lowStock: true` for that format in
`PRODUCTS` at the top of `assets/js/main.js`. Only do it when stock is really low (false
scarcity claims are illegal in France). Once a shop platform with real stock is connected,
this can be driven automatically.

### Nutrition values and food business operator (removed from the product page for now)

The client asked to remove the "Valeurs nutritionnelles" and "Responsable" rows. Under EU
rule 1169/2011 (art. 14), a site selling prepacked food must show the same mandatory
information as the label before purchase, which includes the nutrition declaration and the
name and address of the food business operator. Before launch:

- **Nutrition values per 100 g:** get them from the supplier's technical sheet, or have them
  calculated from an official database (Ciqual). The client suggested estimating them with
  ChatGPT; an AI estimate is not a valid source for a legal declaration.
- **Operator name and address:** check with the client whether it can be shown (it is
  usually already on the label or the importer's documents).

### Customer reviews (homepage, "Vous l'avez goûté.")

The review cards are on the homepage, right after "Choisissez votre format", but hidden
until real reviews arrive. Only the "Vous avez commandé ? Laissez-nous votre avis"
invitation shows for now.

- **Need from the client:** 3 real reviews (or more), each with the text, first name and
  initial, date, and the customer's OK to publish.
- **Verification line (French law, art. L111-7-2 Code de la consommation):** a site showing
  reviews must say whether and how they are checked. The line under the cards is a
  placeholder; the client must confirm the wording is true.
- **To switch on:** in `src/pages/index.html`, fill the three cards and the note, remove
  `hidden` from `<div class="reviews-block" hidden>`, then run `python3 build.py`.
- **Later, with the shop platform:** send an automatic review request a few days after
  delivery, so only real buyers are asked (e.g. Shopify + Judge.me, which also marks reviews
  as verified).

### Still a placeholder (shown in yellow on the site)

Information only the client can provide:

- **Livraison:** carrier and delivery time.
- **CGV:** company name, payment provider, indicative delivery time, who pays return
  shipping (client or seller), consumer mediator's name and contact details.
- **Mentions légales:** company name, legal form, share capital, RCS city, SIREN, registered
  address, VAT number, publication director's name, host name and address.
- **Confidentialité:** company name and address.

Once the domain is known, make `og:image` in `src/partials/head.html` a full URL
(`https://…/assets/img/og-image.jpg`), otherwise some apps won't show the link preview.

## Done

- Official logo used everywhere (header, footer, favicon), replacing the redrawn one.
- Product name written "Éclat d'Ube" (no accent on the e) across the whole site.
- Shipping fee changed from 4,90 € to 5,90 € (FAQ, product page, Livraison, CGV, cart and
  checkout totals). Still free from 45 € in mainland France.
- Footer links: Instagram [@ubehalaya](https://www.instagram.com/ubehalaya/), TikTok
  [@ubehalaya.fr](https://www.tiktok.com/@ubehalaya.fr).
- Contact email `contact@ubehalaya.fr` on the footer, Contact page (and its form), Mentions
  légales, CGV and Confidentialité.
- -10 % first-order popup with email capture and code `BIENVENUE10` (see "Before launch").
- Single-can format renamed from "Une canette" to "Éclat d'Ube" (cart, product page, format
  cards). The three formats are now Éclat d'Ube, Coffret découverte, Coffret à partager.
- Product page: removed "Disponibilité : [à relier au stock Shopify]", replaced by the
  manual low-stock notice above.
- Shipping time "Expédition sous 48 h" on the product page, Livraison page and CGV.
- Product page specs: removed the "Allergènes" row (the powder is made in a lab that doesn't
  handle nuts), "Valeurs nutritionnelles" and "Responsable" (see the note above).
- "Prêt à préparer votre premier latte ?" banner (Découvrir l'ube, Livraison): the cropped,
  blurry photo with the fake can is replaced by the uncropped latte photo. The old
  `offer-band*.webp` and `cta-tray.webp` were deleted.
- Notre histoire: Marilou is no longer "le personnage de notre récit". The story now says
  we met her in the United Arab Emirates and she passed on her love of ube.
- Reviews moved from Notre histoire to the homepage (after the formats), with a "Laisser un
  avis" button that opens the Contact form with the new "Laisser un avis" subject selected.
- Product page, under "Ajouter au panier": "Livraison offerte dès 45 € d'achat · Expédition
  sous 48 h · Service client : réponse sous 24 h" (links to Contact). The client asked for
  "SAV 24h/24"; we chose "réponse sous 24 h" so the promise matches reality. The team must
  answer contact@ubehalaya.fr within 24 h. The Contact page states the same promise.

Found and fixed during the final review:

- Link preview image (`og-image.jpg`, shown when the site is shared on WhatsApp, Facebook,
  Instagram) still had the redrawn logo, "Éclat d'Ubé" and a generated can. Rebuilt with
  the official logo, "Éclat d'Ube" and the latte photo (no can).
- Footer newsletter said "Une recette par mois, rien de plus" while the popup promised
  offers too. Both now say "Une recette par mois et nos offres".
- README flow and asset map updated (recipe link, format cards, popup, official logo).
- `docs/screenshots/` regenerated from the current site (they showed the old design).
