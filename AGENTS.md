## Architecture rules
- UI reads data only through `src/lib/data-service.ts` (demo data in `src/lib/demo-data.ts`) — so a real backend can replace demo data without touching components.
- All demo-derived states must be visibly labeled as demo in the UI — product must not imply live integrations.
- Agent visuals come from `src/components/agents` (shared definitions + per-agent renders) — keeps the three agents a consistent, reusable family.

- Prospecting domain rules live in `src/lib/prospecting`; UI reads projections through data-service and mutations through the prospecting context — keeps business rules independent of visuals.
- Real workspaces are private Cloud JSON documents with RLS and optimistic revisions; demo stays local and separate — avoids unauthenticated writes and lost concurrent updates.
- External source reads use authenticated server functions and fixed source URLs; imports are validated before committing — prevents CORS/SSRF and silent synthetic fallback.
- Channel/provider states are validated server-side; Dapta adapter fails closed until a contract exists — prevents fake sends and qualification.

- Source runs own immutable deterministic stage audits and ICP snapshots; historical runs are not reconstructed — preserves evidence without inventing agent activity.
- XLSX preview uses browser-only read-excel-file with numeric text preservation; imports commit only after whole-file validation — avoids vulnerable general-purpose workbook parsing and partial imports.
- Mount the session-selected workspace behind ClientOnly while preserving route head metadata — private browser state must not race SSR hydration or leak between requests.
- Keep the prospecting React context in a component-free module separate from its provider — hot updates must retain the same context identity for mounted consumers.
- Discovery presets and draft preparation live in the pure prospecting automation module; live consultation commits optional drafts in the same optimistic save — keeps deterministic automation idempotent, with no fake outreach or partial writes.
- Source discovery exposes everyday controls first and keeps query syntax, detailed source conditions and execution audits behind expandable details — reduces reading without removing evidence or changing processing rules.
- File-free map discovery resolves city relations through fixed Nominatim lookups (cached and serialized per invocation, never autocomplete), then runs bounded Overpass queries with source-native sector tags and optional public contact filters; preserve checked area evidence separately from absent postal city and never infer NAICS or active status — avoids synthetic evidence and exact-name boundary failures. Public-instance limits are not production-wide quotas; scaled deployment requires a compliant hosted geocoder.
- Acquisition source metrics and cost targets enumerate shared source definitions, and deduplication matches source-scoped record IDs — keeps new sources in reporting without double-counting repeat lookups.
- Map transport uses at most two fixed global public instances for availability, stops on rate limiting and rejects incomplete payloads — improves resilience without bypassing quotas or turning partial results into valid leads; alternate instances remain the same source, not two sources.
- RNT lookup projects establishment-only fields from the latest published period and maps explicit native categories; exclude personal/notification emails and preserve published geography/status evidence — supplies useful Colombian tourism contacts without implying universal coverage, live verification or marketing consent.
- Pereira lookup uses fixed official Socrata endpoints, explicit CIIU categories and published municipality coverage; combined categories stay uncertain and BIC registration never implies active status — enables independent business discovery without fabricated geography, industry or contacts.

- External delivery uses Nitro Vercel and src/lib/backend auth, without the Lovable OAuth broker — preserves session-scoped RLS and CSRF on the user-owned backend.

- Public welcome/account screens use email auth with bounded name/company profiles; phone access is deployment-gated until an SMS provider exists — preserves private leads and avoids unsupported-provider claims.
