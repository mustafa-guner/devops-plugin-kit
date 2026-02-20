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

## Create DevOps Plugin

Run from this monorepo workspace:

```bash
npm run build --workspace @danieli-automation/create-devops-plugin
npx create-devops-plugin CapacityPlanner --publisher danieli-automation --target-dir ./generated --extension-id capacity-planner --no-install --force
```

Install and use in another project:

```bash
npm i -D @danieli-automation/create-devops-plugin
npx create-devops-plugin MyPlugin --publisher danieli-automation --target-dir ./plugins
```

`npm create` style (after publish):

```bash
npm create @danieli-automation/devops-plugin -- MyPlugin --publisher danieli-automation --target-dir ./plugins
```

Example parameters for `createPluginTemplate(...)`:

- `targetDir`: parent folder where the plugin folder will be created
- `pluginName`: project/plugin folder name and display name
- `publisher`: Azure DevOps publisher id
- `extensionId` (optional): manifest id (defaults from `pluginName`)
- `installDependencies` (optional): runs `npm install` in generated plugin (default `true`)
- `force` (optional): allows writing into non-empty target folder (default `false`)

## Publish

```bash
npm publish --workspace @danieli-automation/devops-plugin-state
npm publish --workspace @danieli-automation/devops-plugin-core
npm publish --workspace @danieli-automation/create-devops-plugin
```
