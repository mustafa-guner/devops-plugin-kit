# devops-plugin-kit

Monorepo for reusable Azure DevOps plugin packages.

## Packages

- `@danieli-automation/devops-plugin-state`: shared state/store helpers
- `@danieli-automation/devops-plugin-core`: core plugin utilities and API wrappers
- `@danieli-automation/create-devops-plugin`: template/bootstrap utility

## Development

```bash
npm install
npm run build
```

## Publish

```bash
npm publish --workspace @danieli-automation/devops-plugin-state
npm publish --workspace @danieli-automation/devops-plugin-core
npm publish --workspace @danieli-automation/create-devops-plugin
```