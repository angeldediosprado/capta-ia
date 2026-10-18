## Architecture rules
- UI reads data only through `src/lib/data-service.ts` (demo data in `src/lib/demo-data.ts`) — so a real backend can replace demo data without touching components.
- All demo-derived states must be visibly labeled as demo in the UI — product must not imply live integrations.
- Agent visuals come from `src/components/agents` (shared definitions + per-agent renders) — keeps the three agents a consistent, reusable family.

- Prospecting domain rules live in `src/lib/prospecting`; UI reads projections through data-service and mutations through the prospecting context — keeps business rules independent of visuals.
- Real workspaces are private Supabase JSON documents with RLS and optimistic revisions; demo stays local and separate — avoids unauthenticated writes and lost concurrent updates.
- External source reads use authenticated server functions and fixed source URLs; imports are validated before committing — prevents CORS/SSRF and silent synthetic fallback.
- Channel/provider states are validated server-side; Dapta adapter fails closed until a contract exists — prevents fake sends and qualification.

- Source runs own immutable deterministic stage audits and ICP snapshots; historical runs are not reconstructed — preserves evidence without inventing agent activity.
- XLSX preview uses browser-only read-excel-file with numeric text preservation; imports commit only after whole-file validation — avoids vulnerable general-purpose workbook parsing and partial imports.
- Mount the session-selected workspace behind ClientOnly while preserving route head metadata — private browser state must not race SSR hydration or leak between requests.
- Discovery presets and draft preparation live in the pure prospecting automation module; live consultation commits optional drafts in the same optimistic save — keeps deterministic automation idempotent, with no fake outreach or partial writes.

- External delivery uses explicit Vite/TanStack/Nitro plugins with the Vercel preset and platform-neutral auth modules in src/lib/backend; this keeps SSR, bearer authentication and CSRF protection without a Lovable OAuth broker.
- Google sign-in is configured in the owner’s Supabase project; no Lovable sign-in is advertised externally because that provider is not transferred.
