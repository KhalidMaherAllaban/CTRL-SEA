# Security Policy

## Supported Versions

Security fixes target the current `main` branch until formal releases are created.

## Reporting a Vulnerability

Please report suspected vulnerabilities privately to the project maintainer before opening a public issue. Include:

- Affected component and route.
- Reproduction steps.
- Impact assessment.
- Suggested mitigation, if known.

Do not include real credentials, production tokens, private data, database dumps, or screenshots containing sensitive information.

## Security Baseline

- Real `.env` files are ignored and must not be committed.
- JWT secrets must be at least 32 characters in production.
- Authentication cookies are HTTP-only and forced secure in production.
- Browser-readable `NEXT_PUBLIC_*` variables must never contain secrets.
- SQL access should use parameterized queries through SQLAlchemy.
- Production deployments must configure explicit CORS origins.
