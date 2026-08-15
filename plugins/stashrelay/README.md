# stashrelay

**A clipboard for your AI apps.** Stash text in one AI conversation and pick it up in another — no downloading, no re-uploading. Items are retrievable from any connected client, including your other devices.

Website: [stashrelay.io](https://stashrelay.io)

## What it does

This plugin connects your editor to the stashrelay service over MCP (`https://stashrelay.io/mcp`). Once connected, your assistant can move snippets, diffs, drafts, and prompts between surfaces — Claude Code, Cursor, Claude Desktop, claude.ai, ChatGPT, or any other MCP-capable client — through one shared, per-user stack.

Stashing **copies** content. It never modifies or removes your files, and it is not `git stash`: your working tree is untouched.

## Tools

| Tool | What it does |
| --- | --- |
| `stash` | Save a copy of content under a key. Re-stashing a key replaces it and moves it to the top. |
| `pop` | Retrieve an item and remove it. With no key, pops the top of the stack. |
| `read` | Retrieve an item and leave it in place. With no key, reads the top of the stack. |
| `list` | List items in stack order, newest first — keys and summaries only, never bodies. |
| `discard` | Delete one item without retrieving it. |
| `clear` | Delete every stashed item. |

Items are transit, not storage: the stack is slot-limited and entries expire. Treat it like a clipboard, not a notebook.

## Authentication

On first use your client opens a browser sign-in (standard MCP OAuth). The same account resolves to the same stash on every client, which is what makes the cross-surface handoff work. No API keys or configuration required.

## Example

1. In Claude Code: *"stash this diff as `auth-fix`"*
2. On your laptop, in Claude Desktop: *"pop `auth-fix` and apply it"*

## Support

[contact@merendoncloud.com](mailto:contact@merendoncloud.com) · [merendoncloud.com](https://merendoncloud.com)
