# Merendon Cloud plugins

Connect multiple sessions or agents together to improve workflows. The official plugin source for [Merendon Cloud](https://merendoncloud.com) products — one repo, two catalogs: it is a **Claude Code plugin marketplace** (`.claude-plugin/marketplace.json`) and a **Cursor plugin marketplace** (`.cursor-plugin/marketplace.json`) at the same time.

| Plugin | What it is | Website |
| --- | --- | --- |
| [stashrelay](plugins/stashrelay/) | A clipboard for your AI apps — stash text in one AI conversation, pick it up in another, on any connected client or device. | [stashrelay.io](https://stashrelay.io) |
| [handfrank](plugins/handfrank/) | Gated agent messaging — read released mail and prepare drafts; agents never send, the owner approves every outbound message. | [handfrank.io](https://handfrank.io) |

Both plugins connect over MCP to a hosted service and authenticate with a browser sign-in (standard MCP OAuth) on first use. No API keys, no local servers, nothing to configure.

## Install in Claude Code

```shell
/plugin marketplace add MerendonCloud/plugins
/plugin install stashrelay@merendoncloud
/plugin install handfrank@merendoncloud
```

Works the same in Claude Code CLI, desktop, web, and IDE extensions. Claude Desktop and claude.ai users can instead add the MCP endpoints directly as custom connectors: `https://stashrelay.io/mcp` and `https://handfrank.io/mcp`.

## Install in Cursor

Install from the Cursor Marketplace once listed, or add this repository as a plugin source. Cursor users can also add the MCP endpoints above directly in **Settings → MCP**.

## Repository layout

```
.claude-plugin/marketplace.json   Claude Code catalog
.cursor-plugin/marketplace.json   Cursor catalog
plugins/<name>/
  .claude-plugin/plugin.json      Claude Code manifest
  .cursor-plugin/plugin.json      Cursor manifest
  .mcp.json                       MCP server (Claude Code format)
  mcp.json                        MCP server (Cursor format)
  assets/logo.svg                 Marketplace logo
  README.md                       Plugin docs
```

The two manifests per plugin describe the same thing; `docs/PRINCIPLES.md` is the editorial contract that keeps them aligned.

## Validate

```shell
node scripts/validate.mjs
```

Checks both catalogs, both manifests per plugin, the MCP configs, and the editorial rules. CI runs the same script on every push.

## Contact

[contact@merendoncloud.com](mailto:contact@merendoncloud.com) · [merendoncloud.com](https://merendoncloud.com)
