# GitHub Deployment Preparation

1. Confirm the working tree contains only intentional changes.
2. Run frontend lint, tests, and build.
3. Run backend syntax checks and tests.
4. Validate Docker Compose configuration.
5. Push to `main` or open a pull request.

```powershell
git status
git add .
git commit -m "Prepare project for production release"
git push origin main
```

GitHub Actions validate frontend, backend, and Docker configuration on pushes and pull requests.
