# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.1.x (alpha) | ✅ Active development |

As this is an alpha release, security fixes will be applied to the latest version only.

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please report it responsibly by emailing:

**[rohittiwari.me](https://rohittiwari.me)**

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix (optional)

You can expect an acknowledgement within **48 hours** and a resolution timeline within **7 days** for critical issues.

## Security Considerations for Users

`ocpp-smart-charge-engine` is a **pure calculation library** with no network I/O, no WebSocket connections, and no external dependencies. The attack surface is minimal. However, as it controls EV charging power limits:

- **Validate all session inputs** before passing them to `addSession()`. The engine trusts the values you provide.
- **Protect your dispatcher** — it executes privileged OCPP commands directly on charger hardware. Ensure only authenticated sessions can trigger dispatch.
- **Sanitize `transactionId`** — ensure transaction IDs come from authenticated OCPP handshakes and cannot be spoofed by external actors.
- **Guard `setGridLimit()`** — if you expose this to external signals (e.g., utility APIs), validate the source to prevent malicious grid limit manipulation.
