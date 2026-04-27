# zk.ly Contracts (Compact) — How the logic works

This folder contains the **Compact contracts** that implement the on-chain “source of truth” for zk.ly’s proof-first quest system.

> If you’re new to the project, start at the main `README.md` and then come back here.

---

## Quickstart (local)

### Compile all contracts

From `contracts/`:

```bash
npm install
npm run compile
```

This runs `compact compile` for each contract under `contracts/contracts/` and writes outputs under `contracts/managed/`.

### Run circuit unit tests (local, offline)

These tests execute the **compiled managed contracts** (under `contracts/contracts/managed/*`) using `@midnight-ntwrk/compact-runtime`, and assert both:

- happy paths (e.g. `create_quest`, `verify_completion`, escrow reservation), and
- expected circuit assertion failures (e.g. criteria commitment mismatch, escrow budget exhausted).

From `contracts/`:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

### Run the proof server

```bash
npm run proof-server:start
```

This starts `midnightntwrk/proof-server:8.0.3` on `http://127.0.0.1:6300`.

---

## Folder layout

- `contracts/contracts/*.compact` — Compact source files
- `contracts/managed/*` — build artifacts produced by `compact compile`
- `docker-compose.yml` — local proof server container
- `src/` — deploy/cli helpers (used by dev tooling)

---

## Contracts in this repo

### 1) `quest-registry.compact`

**Goal:** define quests with **private acceptance criteria** and public configuration metadata.

Key ideas:

- **Criteria commitment**: criteria bytes are private witness data; the contract discloses only
  `criteria_commitment = persistentHash(criteria_bytes)`.
- **Track + quest metadata**: `quest_type`, `track_tag`, `xp_value`, etc.
- **Reward mode**:
  - `XP_ONLY`
  - `ESCROW_AUTOMATIC` (requires `escrow_amount > 0`)
- **Anti-farming knobs**:
  - `freq_slots` (minimum time between completions)
  - `max_completions` (cap; can flip status to `CAP_REACHED`)

### 2) `completion-registry.compact`

**Goal:** mint a per-completion certificate whose **sensitive evidence stays private**, while still enabling public verification of “this completion exists”.

Key ideas:

- **Certificate lifecycle**: `PENDING_ADMIN → APPROVED/REJECTED → CLAIMED`
- **Identity binding without doxxing**:
  - `completer_key = hash(prefix + user_secret_key)`
  - prevents Sybil-by-email without exposing real identity on-chain
- **Proof boundary checks** (inside `verify_completion()`):
  - Criteria bytes hash must match `on_chain_commitment`
  - Evidence class must match required evidence class
  - Verification score must meet minimum threshold
  - Frequency gating must be respected (if configured)
- **Commitments instead of plaintext**:
  - `review_commitment = hash(review_payload)` (private payload, public commitment)
  - `commitment_commitment = hash(commitment_payload)` (binds off-chain action metadata)

### 3) `reward-escrow.compact`

**Goal:** model reserved rewards and user-initiated claims for quests in `ESCROW_AUTOMATIC` mode.

This keeps “reward payment” separate from “proof submission”.

---

## The ZK proof boundary (what’s private vs public)

### Private (witness / private ledger state)

- Full quest criteria bytes
- AI review payload details (dimension breakdown, notes, etc.)
- Verification score (raw), user secret key, admin secret key
- Any evidence details you don’t want public (URLs, content, etc.)

### Public (disclosed on-chain)

- `quest_id`, `space_id`, `sprint_id`
- `completer_key` (derived hash, not identity)
- Certificate `status`
- `xp_awarded`
- Commitment hashes (e.g., `criteria_commitment`, `review_commitment`)

> Design intent: the chain can answer “is this completion valid?” without exposing the full rubric, score breakdown, or user identity.

---

## Constraints & assumptions (hackathon scope)

- **Language version**
  - Contracts here use `pragma language_version >= 0.22;`
  - If the hackathon requires a pinned exact version, align all contracts consistently.
- **Criteria byte sizing**
  - The contracts use `Bytes<256>` for criteria and payload witnesses (fixed-size).
  - This implies criteria/payload must be serialized + padded/truncated to fit the fixed bound.

---

## How it ties back to the app

- Backend compiles/loads managed contracts from `contracts/managed/*`
- The local proof server (Docker) produces proofs for contract circuits
- Frontend drives user/admin actions + coordinates chain interactions

