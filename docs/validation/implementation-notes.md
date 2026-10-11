# Implementation decisions

The attachment is retained as reference. Its suggestions to create DS-8305/v11_stock and change privacy were superseded by the user's explicit target DS-8305/N_Blog_V11_stock main. The user supplied an architectural design and requested implementation; work continued inline in a fresh target checkout.

Modules ported from the pinned V10: browser session/owned pages/locks, generic region readiness and screenshot engine, atomic JSON/hash helpers, text/image/caption input, session probe, input progress, receipts and saved-list verifier. The draft runner replaces sheet rechecks with stock source checkpoints and adds durable pre-input dispatch records. Financial identity, facts, assets, editorial claims and CLI are stock-specific.

Keep the V10 endpoint lock namespace intentionally: V10 and V11 must not operate on the same CDP endpoint simultaneously. No profile, cookie, token, user workspace or spreadsheet snapshot was copied.

The first provider is an explicit reviewed export. A generic interface without licensed endpoints/keys cannot honestly claim live collection; the CLI presents missing dependencies and persists no fabricated financial success. The concept provider similarly imports reviewed model output rather than relabeling an arbitrary photo as generated.

Cards use native OS Korean fonts with an availability check. Text is escaped/wrapped and overflow stops rendering. Numeric strings preserve source precision; graph position is deterministic and never clamps inconsistent data. Pixel tests cover bar/marker rendering, and QA PNGs were generated for visual inspection.

The article generator is a deterministic beginner template whose fact claims map exactly to a supported source representation. Caption strings are deterministic too; matching an approved image manifest alone cannot authorize new numeric caption claims. Source URLs remain internal, while readable source names and dates appear in the post.

Collection, capture, render, image review and compiled draft are all bound to the current approved source fingerprint. A recapture failure after changing a source cannot reuse an earlier image approval. A job already entered/saved is immutable for collection/render; use a new job for changed content.

Code-review findings were handled with targeted regressions and a fresh full-suite run. Temporary artifacts and logs are ignored; implementation/operation docs remain in Git.

Confirmed receipts are checked on initial confirmation and both already-confirmed return paths. A changed body, image list, caption list or source list cannot be reported as saved just because the stored fingerprint and title match. Verified receipts are also persisted separately from state, before the confirmed state transition.
