# Functional vertical slice
## Simple social login
- [x] Google/Apple buttons, managed preview providers enabled; desktop/mobile UI and 4 session/error rules verified. External v4: 92 tests and Vercel build pass.
- [ ] External OAuth authorization/return needs owner provider credentials; preview consent not completed, no claim of end-to-end OAuth success.
- [ ] External workspace read error in screenshot: requires checking deployed schema/grants and runtime logs; not an OAuth failure.
## Welcome and non-Google account access
- [x] Prepare Vercel v3 delivery with profiles SQL and email/SMS setup instructions; 88 external tests and external build pass. Transfer and external settings are user-managed.
- [ ] Activate phone delivery: UI/code provided, deployment-gated off until user configures paid SMS provider and verifies OTP. Gmail/iCloud work as email addresses, not OAuth buttons.
- [x] Emphasize approved faceted logo and Manrope typography; concise audience/value and Scout/Sorter/Check context, desktop/mobile inspected.
- [x] Show the user the new welcome in the live preview (Inicio).
- [x] Create animated public welcome with account invitation and reduced-motion support.
- [x] Add email/password access and name/company profiles with owner-only policies and signup trigger; Cloud email enabled; external email settings need user configuration.
- [ ] Verify new-account confirmation and profile trigger end-to-end: preview signup rejected test registration (400); existing-session two-source search, signout and error states verified. External auth settings/SMTP remain unverified.
## Useful prospect discovery
- [x] Current request: connect and verify independent Cámara de Pereira + RNT in the same real restaurant search (Pereira): 16 + 24 records, 40 ICP matches, both successful, persisted after reload; prepare updated Vercel source. External transfer/deployment remains user-managed.
- [x] Connect useful RNT public/free lookup: actual signed-in Bogotá restaurant search returned 100 contactable establishments, 86 ICP matches and 10 with retained role-based business email plus phone/address; repeat lookup did not add duplicates and restaurant remained visible after reload. Covers registered Colombian restaurants/hotels only, latest published period; no universal or marketing-consent claim. Costs remain N/D until recorded. Not transferred to Vercel.
- [x] Useful second-source pilot: Cámara de Pereira BIC dataset hjhn-23mx, free public API and CC BY-SA 4.0 confirmed; 16 Pereira restaurants with published business phone in real authenticated combined search. Not all businesses, no current-active claim. Bogotá second-source coverage remains unverified; DENUE requires token and paid sources require opt-in.
- [x] Recheck Bogotá restaurants signed-in: both fixed global map instances remain unavailable. Bounded transport preserves honest failure; RNT and Cámara de Pereira subsequently verified requirement 1 for the Pereira pilot.
- [ ] Verify a useful independent second source: Bogotá IDT tourism GIS timed out and contact fields are unverified; Maicao/Calima APIs have different coverage and must not be shown as Bogotá results. A paid provider requires explicit user authorization/account/budget and cannot substitute for the two-free-source requirement.
- [x] Requirement 1 pilot evidence ready to report: two independent free sources returned useful restaurants in Pereira, 40 records, successful saved audits and reload. Do not claim general Bogotá/US/LatAm coverage or externally deployed readiness.
- [x] Resolve Bogotá/Bogota through Nominatim's verified city relation 7426387, avoiding the incorrect exact boundary name. Preserve geographic area evidence separately from postal city; failures remain errors and retry stays visible.
- [x] Obtain useful Bogotá business results through RNT instead of failed public Overpass; 100 contactable registered restaurants verified. A second Bogotá-specific useful source is still unavailable.
- [x] Expand to 16 sectors, prioritize supplied public phone/email, move DataSF/CSLB behind legacy controls without deleting records, and show Google Places as an unconnected paid option with official pricing and no automatic charges.
- [x] Test contact gating, new sectors, geographic evidence and failure UI; real signed-in Bogotá lookup still failed honestly; mobile has no overflow, automatic build OK. Paid lookup requires an authorized provider/account and budget; no universal coverage or two-source success is claimed.
- [x] Typed domain, conservative deduplication, ICP, metrics and tests.
- [x] Private Cloud persistence, source execution/import audit, authentication.
- [x] Existing UI connected to shared real/demo service; manual contact, costs, provenance and exports.
- [x] Browser end-to-end verification, tests, current build diagnostics and README.
## Guided discovery iteration
- [x] Guided provisional ICP, checked source catalog, query review and execution.
- [x] Import preview, field mapping, row errors and confirmation.
- [x] Persistent Scout/Sorter/Check audit with run detail and record links.
- [x] Unified records, contact activity and meaningful real metrics/exports.
- [x] Regression tests, browser checks and documentation.
## Product readiness iteration
- [x] Simplify profile selection and add explicit safe discovery-to-draft automation.
- [x] Correct chart, tablet, mobile and long-record alignment/overflow.
- [x] Verify real search, persistence and no-eligible draft state; test eligible preparation rules and document truthful delivery limits.
## External deployment iteration
- [x] Inspect existing https://github.com/angeldediosprado/capta-ia: main contains only README.md and .gitignore; no application code to overwrite.
- [x] User reported pushing the external delivery into capta-ia; later edits here still require user-managed transfer because Lovable sync targets a different repository.
- [x] External Vercel delivery opens publicly with user-owned project configuration; signed-in database functionality is not yet verified.
- [x] Deliver isolated source ZIP for Vercel/own Supabase without old credentials; explicit Vercel build succeeds and 51 tests pass. Google provider, target database setup, records migration and hosted verification remain external.
- [ ] Verify external sign-in, private workspace persistence and DataSF on the deployed site.
- [ ] After first deployment, simplify unused features and hard-to-understand text.
## Remaining external blockers
- [x] Second-source evidence: Cámara de Pereira replaces the file dependency for the verified Pereira restaurant pilot; CSLB stays optional.
- [ ] Automatic Dapta/provider contact: requires endpoint, credentials, request-response contract and explicit outreach authorization.
- [x] Public Vercel page renders at capta-ia-six.vercel.app (user screenshot); authentication, persistence and real external source flow remain unverified.
## Requirement-by-requirement delivery
- [x] 1. Two free public sources — verified here for Pereira restaurants: RNT 24 + Cámara de Pereira 16, all 40 with public phone/address and matching ICP; independent published provenance/terms. Broader coverage and hosted external verification remain separate open tasks.
- [ ] 2. One private place without duplicates: existing logic tested; external database setup and signed-in persistence verification still required.
- [ ] 3. Ideal-customer filtering: existing rules tested; verify on a real two-source search in the external deployment.
- [ ] 4. First message and response: drafts/manual logs exist; real sending requires a provider and explicit authorization. Drafts do not complete this requirement.
- [ ] 5. Leads and CPL by channel: calculation rules tested; verify actual channel events and known costs, never infer unknown costs as zero.
- [ ] 6. Public business data and compliance: preserve provenance and business-only import; review terms for each source, no blanket legal-compliance claim.
- [ ] 7. Dapta qualification: blocked on endpoint, credentials and request-response contract.
- [ ] 8. Channel CPL and qualification-rate comparison: blocked on actual qualification results and known costs.
- [ ] 9. Cost per qualified lead by channel: blocked on actual qualification results and known costs.
- [x] Simplify first-source flow language and hide technical details by default. Browser verified sector selection, source selection, technical-details disclosure, signed-out action gating and mobile overflow; 45 existing tests passed and automatic build reported OK. No two-source execution or hosted-data verification was claimed.
- [x] Add a file-free OpenStreetMap lookup path by country/city/sector for United States and Latin America, optional public phone/email completeness, source-scoped record dedup and source CPL costs. Existing DataSF and CSLB remain optional; no paid provider was connected.
- [ ] Verify successful OpenStreetMap results: live Bogotá restaurant lookup returned HTTP 502; error persisted through refresh, existing 257 leads were preserved and no demo fallback occurred. Public server availability blocks marking this source ready; official website enrichment is not implemented and two-source global coverage remains unverified.
- [x] Run 53 tests including 8 map lookup regressions; automatic build OK; signed-in real lookup failure and mobile no-overflow flow verified. No success, coverage completeness, contacts or zero cost were invented.
