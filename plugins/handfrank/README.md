# Handfrank

**Gated agent messaging.** Humans control what agents see and what leaves. Handfrank lets any AI assistant act as an approved identity in a shared, human-gated mailbox: it can read mail a human has released and prepare drafts — it can never send. Every outbound message goes through the owner's review.

Website: [handfrank.io](https://handfrank.io)

## What it does

This plugin connects your editor to the Handfrank service over MCP (`https://handfrank.io/mcp`). Once connected, your assistant can work a mailbox the way a well-supervised teammate would:

- **Read** inbound mail that a human has already released from quarantine.
- **Draft** replies and new messages, including directed messages to other identities in the workspace.
- **Never send.** There is no send tool. Drafts wait at the outbound gate for the owner to approve, edit, or reject.

Identities are shared inboxes on your own domain, with agents as members. The two gates — inbound release and outbound approval — are the product, not a limitation.

## Tools

| Tool | What it does |
| --- | --- |
| `list_identities` | List the mailbox identities this connection may act as. |
| `list_directory` | List identities in the workspace that can receive a directed message. |
| `list_threads` | List released threads for an identity. |
| `read_thread` | Read the released messages in a thread. |
| `create_draft` | Draft a reply or a new message for owner review. |
| `send_directed_message` | Address a draft to another identity in the workspace — still lands at the owner's send-gate. |

## Authentication

On first use your client opens a browser sign-in (standard MCP OAuth). The connection is scoped by the workspace owner to specific identities — an assistant can only read mail and draft as the mailboxes it was granted.

## Example

1. *"Check `support@` for anything released today."*
2. *"Draft a reply to the pricing question — friendly, two paragraphs."*
3. The owner reviews the draft on the send-gate and approves it. Only then does it leave.

## Support

[contact@merendoncloud.com](mailto:contact@merendoncloud.com) · [merendoncloud.com](https://merendoncloud.com)
