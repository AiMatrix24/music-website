# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# OPYNX Project Rules

Project-specific rules that extend the four principles above. These come from real friction we've hit on this codebase.

## DB-tied identifiers are sacred

Never rename these in any sweep, refactor, or "consistency" pass:

- DB column names: `artist_id`, `user_id`, `creator_id`, etc.
- TypeScript identifiers tied to columns: `artistId`, `artistName`, `artistAvatar`
- String literals that match a TypeScript union type or DB enum (e.g. `'artist'` in `MasterOwnership.type = 'artist' | 'label' | 'coowned'`, `'creator'` in user role enums)

**Rule:** before rewriting any string literal, grep for the surrounding type definition. If the literal appears in a `type X = 'a' | 'b' | 'c'` union, leave it alone.

## Preserved route paths

The `/artist/[id]` URL route and the `apps/web/app/artist/` directory are public-facing and must not be renamed. Internal variables that happen to be named `artist` *inside* that directory are also preserved (they match the route).

When sweeping variable names elsewhere, watch for URL templates like `` `/artist/${artist.id}` `` — the route segment must stay literal but the variable inside `${...}` must match the surrounding scope.

## User-facing copy

- **No branded platform names**: never write Spotify, YouTube, Apple Music, Tidal, Amazon Music, etc. Use generic descriptors ("major streaming services", "video-audio hybrid platforms").
- **No "guaranteed" language** anywhere — legal/compliance. Use "direct", "transparent", "verifiable on-chain", "~/year direct".
- **Use "Creator" not "Artist"** in user-facing copy. Exception: the `/artist/[id]` route, the `apps/web/app/artist/` folder, and DB columns (see above).

## Verification before claiming done

Per principle #4 — for any change that touches more than one file, the verify step is:

```
npm run build → must exit 0
```

If you wrote a sweep script or did a cross-cutting refactor, you do not get to say "done" until the build passes. Type errors caught after a commit cost more to fix than running the build once locally.

## Payment & infra constants

- Payments: **NOWPayments** (crypto, 0.5% flat fee) and **Helio Protocol** (USDC recurring). Stripe was removed — do not reintroduce it.
- Wallet (NOWPayments Polygon): `0x24099Ccea35BcC3c25E8F97CBa8D59852F145992`
- Subscription tiers: Premium $8.73/mo, Superfan Bundle $12.73/mo, Studio $16.00/mo
- Revenue split: Creator 85% / Facilitator 5% / Platform 10% (per-stream and per-ticket)
- Domain: opynx.com on Vercel; DNS via Vercel nameservers; MX via Microsoft 365

## Before starting a multi-step plan

Per principle #1 — if a request would create more than ~5 new files or touch more than ~10 existing files, stop and confirm scope before writing code. The plan in `~/.claude/plans/peaceful-strolling-biscuit.md` (Music Creation Suite + Podcast Suite, 28 new files) is the kind of thing that needs explicit go-ahead per phase, not all-at-once execution.
