# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Keyward, please report it responsibly.

**Do not open a public issue.** Instead, email **info@daflan.com** with:

- Description of the vulnerability
- Steps to reproduce
- Affected package(s) and version(s)
- Impact assessment (if possible)

We will acknowledge your report within 48 hours and aim to provide a fix or mitigation plan within 7 days.

## Supported Versions

| Version | Supported |
|---|---|
| 0.x (latest) | Yes |

## Scope

The following are in scope for security reports:

- Key leakage between user scopes
- Bypass of scope isolation (user accessing another user's keys)
- Insecure storage on any platform (Keychain, Keystore, IndexedDB)
- Codegen producing unsafe or injectable output
- Dependency vulnerabilities that affect Keyward

## Disclosure

We follow coordinated disclosure. Once a fix is released, we will credit the reporter (unless they prefer anonymity) and publish a security advisory via GitHub.
