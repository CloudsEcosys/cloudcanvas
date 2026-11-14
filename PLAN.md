<!-- Written by Richard Christopher, Copyright 2026 NeoTec, LLC -->
# CloudCanvas main consolidation

## Approved scope

The owner approved upstream migration and Momentum compatibility on 2026-10-13.
Consolidate published 0.6.0 with the committed UI-kit branch, retaining both
histories. No remote push or deployment is authorized. The original working
checkout and all nested component histories are backed up and unchanged.

## Frozen interfaces

- The core remains upstream's native `blit` and `type`; no Pin/session shim.
- `cloudcanvas-lib/ui` and `cloudcanvas-lib/ui/testing` retain the existing control
  contract. The kit exports the shared DOM keyed-list reconciler and control-target helper.
- `cloudcanvas-lib/ui` remains in its existing encapsulated scope. Modern `cloudcanvas`,
  `cloudcanvas-lib` and `cloudcanvas-site` architecture is retained, including all upstream exports.
- Build produces the existing modern distribution, the self-contained UI kit,
  and a standalone public graphics module for no-build clients.

## Expected versus actual

| Phase | Expected deliverable and success metric | Actual |
|---|---|---|
| Research | Verified local/upstream ancestry and non-destructive recovery | Complete: parent/core histories preserved; upstream removes the legacy runtime |
| Development | Merge core and parent; preserve controls and migrate consumers | Candidate core merged; UI preserved; parent conflicts resolved; Momentum uses native blits and public graphics |
| Consolidated QA | Unit/integration, UI browser, dist, size, security and code-quality gates pass | Verified: 1,675 unit/integration and 88 UI browser tests passed; dist and size checks passed. Final history scan follows corrected commits; no live GPU stress test |
| Local promotion | Verified local main, correct nested pins, original refs retained | Actual promotion and retained-WIP locations are recorded in the project-wide consolidation plan below |
| Publication | Dependency-first pushes after separate approval | Not authorized; original parent push URL remains disabled |

## Migration decisions

Development measurements: the UI row is 298,944 minified bytes / 80,751 gzip
(the prior kit was 298,695 / 80,660). Preserved menu fixes add 889 minified
bytes / 241 gzip to upstream's menu entry; summary key ownership adds 10 / 7
to keyboard. Baselines record these scoped compatibility changes, not an
unexplained budget relaxation. Momentum's three vendored CloudCanvas bundles
total 505,339 bytes versus 851,964 previously, a 346,625-byte reduction.

The core merge retains local summary-key ownership, native menu Space-release
activation and flyout placement fixes. Upstream's retired Pin files stay deleted.
Historical changelog/source remains in the merged ancestry, not in a second
runtime. Modern root API, packaging and browser harness take upstream's versions;
UI-specific tests and fixtures remain alongside them.

See the project-wide consolidation record in
[Mindfull plans](../../plans/2026-10-13_branch-consolidation.md).

QA corrections port retired disposal fixtures to native trait cleanup, keep the
UI subpaths and module boundary explicit, and test that domain pinning controls
do not exempt removed runtime constructors. Existing dependencies audit clean.
Final signed-head secret scans and pin verification remain before promotion.

## Activity mailbox motion extension 2026-10-16

Owner requests vertical collapse into the top bar rather than shrinking toward
an icon. The drawer gains optional `collapseDirection: 'up'`: translateY only,
constant width; the existing anchor mode stays the default. Controlled state,
reversal, reduced motion, shared anchors and focus return keep the same owner.
Invalid directions are refused. Production placement/clipping belongs to the
host. New regression observed the old scale frames before implementation;
component QA passes all 1,676 tests; consumer desktop/mobile browser checks, dist drift and the size gate pass. The UI-only baseline grows by 287 minified / 98 gzip bytes; other entries are unchanged.
No remote push, deployment or runner work is authorized by this UI task.
