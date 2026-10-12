# V11 stock development

Read docs/data-policy.md before changing collection, financial validation, rendering or writing.
Keep account data, provider responses, screenshots and job artifacts in ignored workspaces/ or .runtime/.
Do not publish to Naver. Do not retry a save whose result is uncertain. Reopen the saved draft and compare its title, body, captions and five images before reporting draft_saved.
Do not substitute fixtures for live financial evidence. Missing evidence, permission, identity, dates or required legacy concept image provenance must stop with needs_user.
Run pnpm test, pnpm typecheck and pnpm build. Record live checks separately from offline tests.

New jobs use stock_sources_five_v1: five original-ratio source_screenshot assets. Keep financial verification separate from capture. Require current capture, image and manuscript reviews. Missing imageLayout means legacy_cards; preserve saved fingerprints.
