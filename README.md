# IronCrest Roofing & Exteriors — US Roofing Whop Website Template

A production-ready, white-label website template for US residential & storm-damage roofing contractors built on **Whop Websites** (TanStack Start + Vite + Cloudflare Workers) and deployed via the **Whop CLI**.

- **Live Whop Website:** https://ironcrest-roofing-usa.whop.site
- **App ID:** `app_FaELJvy0h04OtT`
- **Whop Business Account:** `biz_6dNl1FHaawaN37`

## Whop Features Implemented

1. **White-Label Template Config (`src/config/company.ts`)**
   Swap company name, phone, license number, service areas/ZIPs, reviews, services, and Whop `plan_`/`prod_` IDs in a single file with zero layout changes.
2. **Real Whop Plans (High-Ticket Deposit → Final Balance Flow)**
   - **21-Point Drone Roof Inspection ($149 one-time):** `plan_MWafPcByLgLKc` (`prod_DyJFcgtyJ1QK0`)
   - **Emergency Leak & Shingle Repair ($349 flat-rate):** `plan_zY6wbWqsVCpkP` (`prod_nH4CxXttc2F7R`)
   - **Full Roof Replacement Deposit ($500 deposit):** `plan_YRLcH94ZLH45R` (`prod_41HEQvDeCekKV`)
   - **Final Roof Project Balance ($2,450 invoice balance):** `plan_cPJ4wJpDHNhpt` (`prod_LsN9tYetPq46O`)
3. **Whop Payment Elements (`@whop/elements-react`)**
   - Embedded modal checkout (`src/components/roofing/PaymentElementsModal.tsx`) using `ExpressCheckoutElement` (Apple Pay / Google Pay) and `CheckoutElement`, automatically surfacing BNPL financing (Klarna, Affirm, Afterpay, Splitit) for approved merchants.
   - Dedicated full-page checkout (`src/routes/checkout.$planId.tsx`) using `<Payments>`, `<PaymentElement>`, `<EmailElement>`, `<AddressElement>`, Apple Pay / Google Pay wallets, and the required `<BrandingElement>`.
4. **Request an Estimate → Whop Leads API (`src/components/roofing/EstimateForm.tsx` & `src/lib/roofing.functions.ts`)**
   Server-side TanStack Start function posting homeowner quote requests directly to `POST /api/v1/leads` and `whop.events.create` (`lead` + `estimate_requested`).
5. **Card-on-File Setup Intent + Final Balance Billing (`src/components/roofing/DepositToInvoiceFlow.tsx`)**
   - **Step 1 (Setup Intent):** `<Payments mode="setup">` + `<PaymentElement>` + `<BrandingElement>` calling `whop.setupIntents.create` to vault a reusable `payt_` payment method.
   - **Step 3 (Final Balance Invoice):** Calls `whop.invoices.create`, `whop.invoices.send` (manual pay link), and `whop.invoices.issue` (auto-charge stored `payt_` method), plus live invoice listing via `whop.invoices.list`.
6. **Custom Pixel Tracking (`src/lib/tracking.ts` & `src/components/roofing/PixelInspector.tsx`)**
   Fires verifiable `whop.track` events: `service_viewed`, `deposit_started`, and `estimate_requested`, with a live on-page event monitor and console logging.

## Quick Start & Deploy

```bash
npm install
whop apps dev       # Run locally with Whop runtime env bindings
npm run typecheck   # TypeScript verification
whop apps deploy    # Build and ship live to *.whop.site
```
