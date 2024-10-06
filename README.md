# codeup

<!-- automd:badges color=yellow -->

[![npm version](https://img.shields.io/npm/v/codeup?color=yellow)](https://npmjs.com/package/codeup)
[![npm downloads](https://img.shields.io/npm/dm/codeup?color=yellow)](https://npm.chart.dev/codeup)

<!-- /automd -->

Automated codebase updater.

> [!IMPORTANT]
> This project a proof of concept in the current state.

## Why?

Manually applying a change across multiple repositotires can become tiresome.

Codeup exposes conventional utils and a CLI to make it easier to migrate code and apply changes automatically and programmatically.

## Defining actions

You can define shared actions using codeup. See [./actions](./actions/) dir for some examples.

```ts
import { defineAction } from "codeup";

export default defineAction({
  meta: {
    name: "",
    description: "",
    date: "",
  },
  async filter({ utils, logger }) {},
  async apply({ utils, logger }) {},
});
```

**Example:**

<!-- <details>
<summary>Example:</summary> -->

<!-- automd:file code src="./actions/unjs/eslint-flat.ts" -->

```ts [eslint-flat.ts]
import { defineAction } from "codeup";

export default defineAction({
  meta: {
    name: "eslint-flat",
    description: "Upgrade to eslint flat config with unjs preset",
    date: "2024-05-03",
  },
  async filter({ utils }) {
    // Only apply if legacy eslint config is found
    return (
      (await utils.existsWithAnyExt(".eslintrc")) &&
      !(await utils.existsWithAnyExt("eslint.config"))
    );
  },
  async apply({ utils }) {
    // Migrate to new eslint config
    const eslintRC = await utils.readJSON(".eslintrc");
    const eslintignore = (await utils.readLines(".eslintignore")) || [];
    await utils.write(
      "eslint.config.mjs",
      getConfigTemplate({
        rules: eslintRC?.rules || {},
        ignores: eslintignore.filter(
          (i) => !["", "node_modules", "dist", "coverage"].includes(i),
        ),
      }),
    );

    // Remove legacy eslint config files
    await utils.remove(".eslintrc");
    await utils.remove(".eslintignore");

    // Update package.json scripts
    await utils.updatePackageJSON((pkg) => {
      if (!pkg.scripts) {
        return;
      }
      for (const name in pkg.scripts) {
        if (pkg.scripts[name].includes("eslint")) {
          pkg.scripts[name] = pkg.scripts[name].replace(/--ext\s+\S+\s/, "");
        }
      }
    });

    // Ensure latest eslint and preset versions are installed
    await utils.addDevDependency([
      "eslint@^9.0.0",
      "eslint-config-unjs@^0.3.0",
    ]);

    // Run lint:fix script once
    await utils.runScript("lint:fix");
  },
});

function getConfigTemplate(opts: {
  rules: Record<string, unknown>;
  ignores: string[];
}) {
  return /* js */ `
import unjs from "eslint-config-unjs";

// https://github.com/unjs/eslint-config
export default unjs({
  ignores: ${JSON.stringify(opts.ignores || [], undefined, 2)},
  rules: ${JSON.stringify(opts.rules || {}, undefined, 2)},
});
`.trim();
}
```

<!-- /automd -->

<!-- </details> -->

## Apply Actions

You can use `codeup apply` CLI to apply actions from a local directory or remote source (powered by [unjs/giget](https://giget.unjs.io)).

By default actions order will be sorted by date and name.

```sh
# Run all actions from local dir
npx codeup apply --actions path/to/actions/dir

# Run actions from a github source
npx codeup apply --actions gh:unjs/codeup/actions/unjs
```

## Utils

You can directly use codeup utils as a library use use them within actions context.

```js
import { readJSON, runScript } from "codeup/utils";
```

<!-- automd:jsdocs src="./src/utils/fs.ts" -->

## File System

### `append(path, contents, opts?: { newLine? })`

Append text to a file (with a newline by default)

### `exists(path, opts?: { withAnyExt? })`

Checks if a file or directory exists in path

### `existsWithAnyExt(path)`

Checks if a file or directory exists in path with any extension (input path should not contain extension)

### `findUp(name)`

Try to find a file in the current working directory or any parent directories

### `read(path)`

Try to read a text file and returns its contents

### `readLines(path)`

Read a text file and return its contents as an array of lines

### `remove(path, opts?: { log? })`

Try to remove a file or directory

### `resolve(path)`

Resolves a path relative to the current working directory.

### `update(path, fn, opts?: { log? })`

Read a file and update its contents

Returns the updated contents or the old one

### `write(path, contents, opts?: { skipIfExists?, log? })`

Write text contents to a file

<!-- /automd -->

<!-- automd:jsdocs src="./src/utils/json.ts" -->

## Json

### `readJSON(path)`

Try to read a JSON file

### `updateJSON(path, updater)`

Try to update a JSON file using an updater function and return updated JSON

### `writeJSON(path, json, opts?)`

Write a JSON file

<!-- /automd -->

<!-- automd:jsdocs src="./src/utils/pkg.ts" -->

## Package Json

### `addDependency(name, opts?)`

Add a dependency to the project using detected package manager

### `addDevDependency(name, opts?)`

Add a dev dependency to the project using detected package manager

### `detectPackageManager()`

Detect current package manager

### `readPackageJSON()`

Try to read the closest package.json file

### `removeDependency(name, opts?)`

Remove a dependency from the project using detected package manager

### `runPackageManagerCommand(command, opts?: { ignoreErrors? })`

Run a command with the detected package manager

### `runScript(script)`

Run a `package.json` script using detected package manager

### `updatePackageJSON()`

Try to update the closest package.json file

<!-- /automd -->

## Programmatic API

You can integrate codeup in your workflows using programmatic API instead of CLI.

```js
import { applyActionsFrom } from "codeup";
```

<!-- automd:jsdocs src="./src/index.ts" -->

### `applyAction(action, cwd)`

Apply an action within context and working directory.

### `applyActionFromFile(path, workingDir)`

Load and apply action from file.

### `applyActions(actions, cwd, opts?: { sort })`

Apply multiple actions within context and working directory.

If `opts.sort` is true, actions will be sorted by date or name otherwise in the order they are provided.

### `applyActionsFrom(source, cwd)`

Load and apply actions from a remote or local source.

### `applyActionsFromDir(actionsDir, cwd)`

Load and apply actions from directory.

### `createContext(cwd, name?)`

Create an action context from a working directory.

### `defineAction(action)`

### `getActionName(action)`

Get action name from action object.

### `loadActionFromFile(path)`

Load action from file.

### `loadActionsFromDir(actionsDir)`

Load actions from a directory.

### `runWithContext(context, fn)`

Run a function within a context.

### `sortActions(actions)`

Sort actions by date or name.

### `useContext()`

Get the current action context or create a new one from the working directory.

<!-- /automd -->

## Development

<details>

<summary>local development</summary>

- Clone this repository
- Install latest LTS version of [Node.js](https://nodejs.org/en/)
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable`
- Install dependencies using `pnpm install`
- Enable stub mode using `pnpm build --stub`

</details>

## License

<!-- automd:contributors author="pi0" license=MIT -->

Published under the [MIT](https://github.com/unjs/codeup/blob/main/LICENSE) license.
Made by [@pi0](https://github.com/pi0) and [community](https://github.com/unjs/codeup/graphs/contributors) 💛
<br><br>
<a href="https://github.com/unjs/codeup/graphs/contributors">
<img src="https://contrib.rocks/image?repo=unjs/codeup" />
</a>

<!-- /automd -->

<!-- automd:with-automd -->

---

_🤖 auto updated with [automd](https://automd.unjs.io)_

<!-- /automd -->
