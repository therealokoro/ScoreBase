# Report Card Template Builder — implementation summary

Branch: `feat/report-card-template` (from `main`). Phases 1–5 landed; Phase 6 (print styles) pending.
Spec followed: `C:\Users\PC\Downloads\report-card-builder-prompt-v2.md`.
Execution ledger with per-task rulings: `C:\Users\PC\AppData\Local\Temp\opencode\scorebase-report-card-ledger.md`.

## Commits

| Commit    | Scope                                                           |
| --------- | --------------------------------------------------------------- |
| `f967a65` | Phase 1 — shared types, Zod schema, KV helper, `hub.blob: true` |
| `4274ee2` | Phase 2 — oRPC contract + router, class-wide `allStudentTotals` |
| `4a0662d` | Open item — server-side `ensureBlob` on `uploadAsset`           |
| `5667e2b` | Phase 3 — composables + settings nav entry                      |
| `2bfb6ab` | Phase 4 — builder page, section components, ColorPicker         |
| `b0eeded` | Phase 5 — template renderer, blob serving route, viewer update  |

Verification at the end of Phase 5: `pnpm lint` 0/0 · `pnpm typecheck` 0 · `pnpm test` 171 passed ·
`pnpm build` success.

## What was built

An admin-only template builder that turns the previously hard-coded report card
(`ReportCard/Document.vue`) into a data-driven document. The template lives in KV, logo/signature
images live in NuxtHub Blob, and a single renderer (`ReportCard/TemplatePreview.vue`) is shared by
the builder preview and the real report card viewer.

### Data model and storage (Phase 1)

- `shared/constants/kv-settings.ts` — `ReportCardTemplate` type, `InfoField`, `LogoPlacement`,
  `TextAlign`, `ReportCardAssetKey`, and `DEFAULT_REPORT_CARD_TEMPLATE`.
- `shared/validators/settings.ts` — `ReportCardTemplateSchema` (validates on read).
- `server/kv/report-card-template.ts` — `getReportCardTemplate`, `setReportCardTemplate`,
  `resetReportCardTemplate`, `uploadReportCardAsset`; key `settings:report-card-template`.
- `nuxt.config.ts` — `hub.blob: true`.
- Tests: 6 schema cases + 7 KV-helper cases.

### API (Phase 2)

- `server/contracts/settings.contract.ts` — `reportCardTemplate` block with
  `getTemplate` / `setTemplate` / `resetTemplate` / `uploadAsset`.
- `server/routers/settings.router.ts` — four handlers; `requireAdmin` on set/reset/upload,
  `requireSession` on get (teachers need to read it).
- `server/queries/reportCard.query.ts` — now returns `allStudentTotals` for the class-summary block.
- `shared/utils/report-card.ts` — `computeScoresheetTotal` extracted and `computeStudentTotals`
  exported, reused by ranking; +3 tests.

### Client data layer (Phase 3)

- `app/composables/useSettings.ts` — `useGetReportCardTemplate` (with
  `placeholderData: () => DEFAULT_REPORT_CARD_TEMPLATE`), `useUpdateReportCardTemplate`,
  `useResetReportCardTemplate`, `useUploadReportCardAsset`.
- `app/pages/dashboard/settings.vue` — `adminNav` converted to an array; added a "Report card" entry
  pointing at `/dashboard/settings/report-card`.

### Builder UI (Phase 4)

- `app/pages/dashboard/settings/report-card.vue` — admin-only page,
  `grid-cols-1 lg:grid-cols-[1fr_380px]`, controls first on mobile via `order-1`/`order-2`, sticky
  control panel, status badge, `UiTabs` for Header / Body / Footer, `UiAlertDialog` reset.
- `app/components/ReportCardBuilder/HeaderSection.vue` — logo placement preset picker (four tiny
  flex diagrams), logo uploads, watermark switch + opacity slider, heading/sub-heading inputs,
  paragraph list (add/delete/reorder, font size, colour, bold, alignment), student-info fields with
  ordering.
- `app/components/ReportCardBuilder/BodySection.vue` — score-table column toggles; `subject` is
  disabled and tooltipped.
- `app/components/ReportCardBuilder/FooterSection.vue` — summary placement + field toggles, teacher
  and principal remarks with labels/signatures, class summary, custom info blocks.
- `app/components/ReportCardBuilder/AssetUpload.vue` — reusable upload widget (hidden file input,
  2MB client check, thumbnail, remove, spinner) used by all four asset slots.
- `app/components/Ui/ColorPicker/*` + `app/utils/color-picker.context.ts` — generated via
  `pnpm dlx ui-thing@latest add color-picker` (pulls `colord`).
- `shared/constants/icons.ts` — added `alignLeft`, `alignCenter`, `alignRight`, `image`.

### Renderer and viewing (Phase 5)

- `app/components/ReportCard/TemplatePreview.vue` — A4 canvas (210mm × 297mm) scaled to the
  container, watermark overlay, four logo-placement layouts, `visibleColumns` computed table,
  remarks, class summary, custom blocks. Normalises builder placeholder data and real
  `ReportCardData` into one view model.
- `app/components/ReportCard/SummaryRow.vue` — shared summary block, rendered once depending on
  `summary.placement`.
- `server/routes/images/[...pathname].get.ts` — serves blobs for the `report-card/` prefix only,
  with a restrictive CSP.
- `app/pages/dashboard/results/[resultId]/report-card/[scoresheetId].vue` — now template-driven,
  with a Print button, an admin-only "Customize template" link, and `print:hidden` action chrome.
- `app/components/ReportCard/Document.vue` — **deleted**.
- `AGENTS.md` — renderer note and convention log updated.

## Decisions we made

### Pre-flight (agreed before any code)

1. **Blob without a new package.** Enable `hub.blob: true` only. `@nuxthub/core` `0.10.8` generates
   `@nuxthub/blob` and the `hub:blob` alias itself (verified in its `module.mjs`). Import as
   `@nuxthub/blob`.
2. **IDs via `typeid-js`,** not `nanoid` (AGENTS.md prohibits `nanoid`). Paragraph and custom-block
   ids use `typeid("para")` / `typeid("block")`.
3. **Print CSS stays as-is.** Keep `print:hidden` + `@page { size: A4 }`. The prompt's Phase 6
   `#__nuxt { display: none }` rule was rejected because the report card is a descendant of
   `#__nuxt`, so it would print a blank page.
4. **Auth through the existing helpers.** `requireAdmin` / `requireSession` from
   `server/utils/auth-guard.ts`, never inline role checks.
5. **Merge via `mergeSettings`,** the array-replacing `defu` in `server/kv/merge-settings.ts`, plus a
   `ReportCardTemplateSchema.safeParse` fallback — not plain `defu`, which would concatenate
   `gradeBoundaries` / `caMaxScores`.
6. **Normalise data in the renderer,** not at the call sites.
7. **`window.print()` as a method** (`initPrintAction`), not an inline template global.
8. **Generate `UiColorPicker` before Phase 4,** since it was not in the project.

### Corrections to the spec

9. **`allStudentTotals` had to be added to `ReportCardOutputSchema`,** not just to
   `fetchReportCardData`. oRPC validates handler output against the contract schema, so the field
   would have been stripped before reaching the client. Caught during Phase 2 planning.
10. **Dropped the prompt's `input.assetKey as ReportCardAssetKey` cast** — the contract enum already
    narrows to the same union.
11. **The prompt's `app/pages/dashboard/settings/results.vue` doesn't exist;** the real result-settings
    page is `app/pages/dashboard/results/settings.vue`.
12. **Placeholder `scoreConfig` corrected** to `20/20/20 + 40 = 100`; the prompt's sample summed to 120.

### Judgement calls

13. **Server-side upload validation added** (`ensureBlob(file, { maxSize: "2MB", types: ["image"] })`
    mapped to a typed `BAD_REQUEST`) after you authorised it. The 2MB check therefore exists on both
    sides of the wire.
14. **Reverted the UI Thing CLI's collateral edits.** `pnpm dlx ui-thing add color-picker` overwrote
    project-customised primitives — notably `Ui/Select/Select.vue`, which lost its custom
    `options`/`placeholder` API used by the FormKit select — plus `Select/Trigger.vue`, `Input.vue`,
    and `translucent.ts` reformats. All reverted; only ColorPicker + `colord` kept.
15. **Inline text controls use `UiInput`/`UiTextarea`,** not FormKit. Every FormKit usage in this repo
    is nested inside a `<FormKit type="form">` or `type="group"`, and the builder is an auto-saving
    editor with no FormKit context (the prompt's own paragraph rows are specified as "inline, not a
    form"). Easy to change if you prefer FormKit consistency.
16. **No mutation invalidation in the builder composables.** Invalidation would refetch and clobber
    in-flight edits, since the builder holds a local working copy. Trade-off: the viewer has a 5-minute
    `staleTime`, so a freshly saved template can take up to 5 minutes to appear there. Flag if you'd
    rather I add a targeted cache write instead.
17. **An `applyingServerValue` guard** prevents loading the page (or resetting) from immediately
    writing the value just read back to the server.
18. **The `student` info field renders both Name and ID,** because the schema has a single `student`
    toggle and no separate ID field.
19. **The image route is locked down:** only the `report-card/` prefix is served, and responses carry
    `Content-Security-Policy: default-src 'none'`.
20. **Screen scaling uses a CSS variable** (`--rc-scale` + `[transform:scale(var(--rc-scale))]` with
    `print:transform-none`) rather than an inline `transform`, so the inline scale cannot override the
    print reset.
21. **The KV key is a local const** (`REPORT_CARD_TEMPLATE_KV_KEY`) inside the helper, matching the
    other `server/kv/*` helpers, rather than a new constant in `shared/constants/kv-settings.ts`.
22. **The interface uses `subject: true`** to structurally match `z.literal(true)`.

## Known gaps and follow-ups

- **Phase 6 (print styles) is not done.** Print output is unverified. It will keep the existing
  `print:hidden` + `@page { size: A4 }` approach rather than the prompt's `#__nuxt` rule.
- **No live click-through yet.** Everything above is verified by lint, typecheck, unit tests, and a
  production build — not by clicking through in a browser. The untested-by-machine paths are the oRPC
  `File` upload, ColorPicker runtime, and the dynamic-key `v-model` switches.
- **Stale-template window** in the viewer (see decision 16).
- **`pnpm fmt:check` repo-wide still reports pre-existing issues** in 1000+ files; only changed files
  were formatted.
- **`server/queries/result.query.ts` picked up an incidental oxfmt line-wrap** in commit `2bfb6ab`;
  harmless, but it is unrelated to this feature.
- **Blob is the local fs driver in dev.** R2/S3 binding only matters at deploy time.
