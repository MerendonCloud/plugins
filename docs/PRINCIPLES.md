# Marketplace principles

The rules this repo is maintained against. A change that violates one of these is wrong even if every schema validates. The daily maintenance review checks the repo against this file, the upstream formats, and the live endpoints.

## 1. One catalog, two formats, zero drift

- Every plugin ships **both** manifests: `.claude-plugin/plugin.json` (Claude Code) and `.cursor-plugin/plugin.json` (Cursor), and both marketplace catalogs list the same plugin set.
- `name`, `displayName`, `description`, and `author` must say the same thing in both manifests. Formats differ; the story may not.
- Catalog entries carry the same `description` byte-for-byte as the plugin manifest they point at. The catalog blurb is the first copy a user or model sees; it is not a place to abbreviate — the validator fails on drift.
- MCP endpoints are declared twice because the formats differ deliberately: `.mcp.json` uses Claude Code's `{"type": "http", "url": …}` (an entry with `url` but no `type` is a configuration error there), `mcp.json` uses Cursor's bare `{"url": …}`. Keep the URLs identical between the two files.
- Follow the upstream conventions: [cursor/plugin-template](https://github.com/cursor/plugin-template) for the Cursor side, [code.claude.com/docs/en/plugin-marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) and [plugins-reference](https://code.claude.com/docs/en/plugins-reference) for the Claude side. When upstream conventions change, this repo follows.

## 2. Public surface only — no internals, no providers

- Never name hosting, database, cache, auth, or email infrastructure vendors, internal architecture, schema details, or environment variables — here, in manifests, in READMEs, or in logos. The validator enforces a deny-list.
- Authentication is described as "browser sign-in" / "standard MCP OAuth", nothing more specific.
- The MCP configs carry a URL and nothing else. No headers, no tokens, no secrets — ever. Auth is the server's job via OAuth discovery.

## 3. Product truths that must survive every edit

**stashrelay** (lowercase, one word):

- It is a **clipboard, not storage**: transit semantics, slot-limited, entries expire. Copy must not promise a notes or memory product.
- The description must say items are retrievable *"from any connected client, including your other devices"* — the cross-device phrase is what routes assistants to the tool instead of `git stash`.
- The description must state **copy-not-move**: stashing copies content and never modifies the user's files.
- The tools are `stash`, `pop`, `read`, `list`, `discard`, `clear`. Tool names are the product's; never rename them in copy.

**Handfrank** (capitalized):

- **Agents never send.** No copy may imply an agent-triggered send. `send_directed_message` still lands at the owner's send-gate — say so wherever it is mentioned.
- The two human gates (inbound release, outbound approval) are the product, not a caveat to apologize for.
- Identities live on the customer's domain. Never present a Handfrank brand domain as a mailbox.

## 4. Versioning

- **Claude manifests omit `version`** on purpose: the marketplace serves from git, so the commit SHA is the version and users pick up every push. Do not add a `version` field there — it would pin users to a stale copy.
- **Cursor manifests carry `version`** per Cursor's convention. Bump a plugin's Cursor `version` (and the catalog's `metadata.version`) whenever that plugin's content changes.

## 5. Endpoints

- `https://stashrelay.io/mcp` and `https://handfrank.io/mcp`, HTTPS only. An unauthenticated request must answer `401` with OAuth discovery metadata; if one stops doing so, that is an incident to report, not a config to work around.

## 6. Change discipline

- `node scripts/validate.mjs` must pass before any commit.
- Routine maintenance commits only when something is genuinely out of alignment. A quiet day produces no commit.
