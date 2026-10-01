# Vehicle acquisition agreements

Admin → 合同库 → 收车合同 → 使用这个合同. INNO GROUP LTD is the buyer; the external client is the seller. Fill seller and vehicle details, acquisition/settlement terms and the buyer signature. Save drafts freely; publishing a signing link or sending an email requires complete settlement details and valid amounts. Print / 导出 PDF opens the browser print dialog; choose Save as PDF and A4. The standard bilingual agreement uses two pages; long disclosures continue naturally instead of being clipped.

The balance is calculated in integer cents: purchase price − deposit already paid to seller − direct lender payout. A negative balance blocks sending. The default private-seller status does not add GST. A GST-registered seller may be selected, with the entered total including any GST chargeable. This is an agreement, not a GST tax invoice.

## Storage compatibility

The domain type is `vehicle-acquisition`. The existing database purchase category (`contract_type = vehicle-purchase`) stores its full direction/type and acquisition schedule in JSON `payload`. On reading, `rowToContract` restores the acquisition type before consumers see the contract. Existing purchase, deposit and consignment contracts are unchanged. Acquisition contracts are consequently excluded from AdminInvoices' retail-purchase picker. No database migration, permission change or signing-service deployment is needed. Any external report that relies only on `contract_type` must also inspect `payload.contractType` to distinguish acquisition from retail sale. Deploy the frontend together so older clients do not interpret the subtype as a retail purchase.

The existing external-signature slots (`signatures.purchaser*`) hold the counterparty signature, as they already do for consignments. Acquisition views label that counterparty Seller. Six legacy acknowledgement fields are mapped to acquisition-specific declarations; they do not assert CIN delivery or deposit forfeiture. The current signing service preserves the payload and counterparty signature. Signed-contract storage and access rules are unchanged.

## Verification

- `npm exec -- vitest run src/app/lib/acquisitionAgreement.test.ts`
- `node scripts/verify-acquisition-contract.mjs` against local Vite on port 5186 with dummy Supabase URL/key configured. All remote API calls are intercepted; no real customer record or email is created. Covers create, invalid-send prevention, calculation, save/reload, mobile layout, PDF export and seller signing.
- Typecheck, lint and production build.

The PDF and screenshots in `output/pdf` and `tmp/acquisition-review` use clearly marked sample details, not a real transaction. Legal wording is a business template and has not been reviewed by a New Zealand lawyer.

## Official references checked 1 October 2026

- NZTA selling a vehicle: https://www.nzta.govt.nz/vehicles/buying-or-selling-a-vehicle/selling-a-vehicle
- NZTA registration versus ownership: https://nzta.govt.nz/vehicles/buying-or-selling-a-vehicle
- PPSR checks and security interests: https://ppsr.companiesoffice.govt.nz/help-centre/information-for-debtors-and-consumers/how-the-ppsr-can-help-when-buying-used-goods/
