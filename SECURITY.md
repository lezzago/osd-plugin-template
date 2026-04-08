# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in this project, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, email the maintainers directly with:

1. A description of the vulnerability
2. Steps to reproduce
3. The potential impact
4. Any suggested fix (optional)

We will acknowledge receipt within 48 hours and provide an initial assessment within
5 business days.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x (latest) | Yes |
| < 1.0 | No |

Only the latest release receives security updates. We recommend always running
the most recent version.

## Security Update Process

1. The vulnerability is confirmed and a fix is developed privately
2. A new release is published with the fix
3. A security advisory is posted on the GitHub repository
4. The reporter is credited (unless they request anonymity)

## General Security Practices

- All dependencies are reviewed before inclusion
- `npm audit` is run as part of the CI pipeline
- No secrets or credentials are committed to the repository
- OSD plugin routes use `@osd/config-schema` for input validation
