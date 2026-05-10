# Contributing to Selah.fm

Thanks for your interest in contributing. Selah.fm is a CPM marketplace for music promotion — artists create campaigns, creators make content, and we handle the payments and verification.

## How to Report Bugs

1. Check the [existing issues](https://github.com/robertjanmastenbroek/selah.fm/issues) to see if it's already reported.
2. If not, [open a new issue](https://github.com/robertjanmastenbroek/selah.fm/issues/new?template=bug_report.md) with:
   - A clear description of what went wrong
   - Steps to reproduce
   - What you expected to happen
   - Screenshots if relevant
   - Your browser/OS/device

You can also report bugs directly on the platform at https://selah.fm/report-bug.

## How to Suggest Features

Use the [feature request template](https://github.com/robertjanmastenbroek/selah.fm/issues/new?template=feature_request.md). Describe the problem you're trying to solve and your proposed solution.

## How to Submit Pull Requests

1. **Fork** the repository.
2. **Create a branch** for your change: `git checkout -b feature/your-feature-name`
3. **Make your changes.** Follow the existing code style:
   - TypeScript strict mode
   - Tailwind CSS for styling
   - shadcn/ui components where applicable
   - Glassmorphism design pattern (`bg-white/[0.03] backdrop-blur-xl border-white/[0.06]`)
4. **Write tests** if applicable. The project uses Playwright for E2E tests (`npm run test`).
5. **Commit** with a descriptive message: `feat: add X` or `fix: resolve Y`
6. **Push** and open a pull request against the `main` branch.
7. Wait for review. A maintainer will respond within a few days.

### Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `style:` — formatting, missing semicolons, etc.
- `refactor:` — code restructuring
- `test:` — adding or updating tests
- `chore:` — maintenance, dependencies

## Development Setup

```bash
git clone https://github.com/robertjanmastenbroek/selah.fm.git
cd selah.fm
npm install
cp .env.local.example .env.local
# Fill in .env.local with your database URL and API keys
npm run dev
```

See [README.md](./README.md) for full setup instructions and the [STATUS.md](./STATUS.md) for architecture details.

## Code Style

- TypeScript with strict null checks
- Prettier formatting (2-space indentation)
- Components use `'use client'` directive only when needed
- API routes use Next.js App Router conventions (`route.ts`)
- Tailwind utility classes over custom CSS
- Use `@/` path aliases for imports

## Community

- Be respectful and constructive in discussions
- Follow our [Code of Conduct](./CODE_OF_CONDUCT.md)
- Help others in issues and pull requests
- Celebrate contributions — every PR counts

Thank you for helping build Selah.fm.
