# Ube Halaya Shopify theme

The Shopify source is in `shopify-theme/`. The existing static storefront at the repository root is the visual reference. Make theme changes in `shopify-theme/` and run the checks from the repository root.

```sh
shopify theme check --path shopify-theme
shopify theme package --path shopify-theme
```

## Preview setup

1. Upload the ZIP as an unpublished theme in the Ube Halaya Shopify store, or use `shopify theme dev --path shopify-theme --store <your-store>.myshopify.com` for development.
2. Use French as the storefront language and EUR for the mainland France market. Create the Éclat d’Ube product with handle `eclat-dube`. Create the three variants below and use the exact SKU values. The theme uses the SKUs to connect the existing format cards, product images, and picker to Shopify variant IDs. Set the featured product under **Theme settings → Boutique** if its handle differs.

   | Format | SKU | Reference price |
   | --- | --- | --- |
   | Éclat d’Ube, 50 g | `canette-1` | €17.90 |
   | Coffret découverte, 150 g | `coffret-3` | €46.90 |
   | Coffret à partager, 300 g | `coffret-6` | €84.90 |

3. Create the following Shopify pages and assign the theme template with the same name. The theme sections supply the page design and copy. Add the page titles and SEO descriptions in Shopify.

   | Page | Handle and template suffix |
   | --- | --- |
   | Découvrir l’ube | `decouvrir-ube` |
   | Recettes | `recettes` |
   | Notre histoire | `notre-histoire` |
   | Livraison et retours | `livraison` |
   | Contact | `contact` |
   | Mentions légales | `mentions-legales` |
   | CGV | `cgv` |
   | Confidentialité | `confidentialite` |

   If the page template selector shows only the published theme’s templates, use a development store with this theme active to create and verify the assignments.
4. Configure the mainland France rate of €5.90 below €45 and free shipping from €45. The storefront shows those amounts as estimates. Shopify checkout calculates the actual rate for the address and discounts.
5. Create the `BIENVENUE10` discount and verify eligibility for a first order and one use per customer. Test a footer signup and a welcome signup, then verify their customer tags and marketing subscription in Shopify Admin. Verify that Shopify delivers the Contact form to the store’s configured email address.
6. Set the logo, colors, and available typefaces in the Shopify checkout and accounts editor. The existing static order form is a design reference for branding. Shopify supplies the checkout layout.

## Before publishing

Preview the homepage, product page, cart drawer, cart page, and content pages on desktop and mobile. Place a test order to verify product inventory, the welcome discount, shipping, payment, and the order confirmation. Complete the outstanding content and photo items tracked in [PENDING.md](PENDING.md).
