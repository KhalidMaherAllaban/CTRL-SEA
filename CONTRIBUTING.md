# Contributing

Thank you for improving CTRL SEA.

## Workflow

1. Create a focused branch.
2. Keep changes scoped and reviewable.
3. Run frontend lint/build and backend compile checks before opening a pull request.
4. Do not commit `.env` files, secrets, database files, logs, tunnel URLs, or generated build artifacts.
5. Include screenshots for meaningful UI changes.

## Code Style

- Prefer clear domain naming over abbreviations.
- Keep API schemas explicit.
- Keep UI components small and reusable where practical.
- Put cross-cutting utilities in `src/lib`, `src/utils`, or backend `app/utils`.
- Avoid hardcoded credentials and environment-specific URLs.
