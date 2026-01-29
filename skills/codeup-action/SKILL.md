---
name: codeup-action
description: Create a new codeup action with filter and apply steps
argument-hint: "[action-name]"
---

# Codeup Action Skill

Create a new codeup action based on user-provided filter and steps.

## Instructions

When user provides:

- **filter**: Condition for when the action should run
- **steps**: What the action should do

Generate a new action file in `actions/` directory.

## Action Structure

```ts
import { defineAction } from "codeup";

export default defineAction({
  meta: {
    name: "action-name", // kebab-case name
    description: "Description", // Short description of what it does
    date: "YYYY-MM-DD", // Today's date
  },
  async filter({ utils }) {
    // Return true if action should run, false otherwise
    return await utils.exists("some-file");
  },
  async apply({ utils }) {
    // Perform the action steps
  },
});
```

## Available Utilities (`utils`)

### File System

| Method                         | Description                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| `resolve(path)`                | Resolve path relative to cwd                                                         |
| `exists(path)`                 | Check if file/directory exists                                                       |
| `existsWithAnyExt(path)`       | Check if file exists with any extension (e.g., `.eslintrc` matches `.eslintrc.json`) |
| `read(path)`                   | Read file contents as string                                                         |
| `readLines(path)`              | Read file as array of lines                                                          |
| `write(path, contents, opts?)` | Write file. Options: `{ skipIfExists?: boolean, log?: boolean }`                     |
| `remove(path)`                 | Remove file or directory                                                             |
| `findUp(name)`                 | Find file in cwd or parent directories                                               |
| `update(path, fn)`             | Read file, transform with fn, write back                                             |
| `append(path, contents)`       | Append to file                                                                       |

### JSON

| Method                        | Description                              |
| ----------------------------- | ---------------------------------------- |
| `readJSON(path)`              | Read and parse JSON file                 |
| `writeJSON(path, obj, opts?)` | Write object as JSON                     |
| `updateJSON<T>(path, fn)`     | Read JSON, transform with fn, write back |

### Package.json

| Method                          | Description                                   |
| ------------------------------- | --------------------------------------------- |
| `readPackageJSON()`             | Read closest package.json                     |
| `updatePackageJSON(fn)`         | Update package.json with transformer function |
| `addDependency(name)`           | Add dependency (string or array)              |
| `addDevDependency(name)`        | Add dev dependency (string or array)          |
| `removeDependency(name)`        | Remove dependency                             |
| `detectPackageManager()`        | Detect npm/yarn/pnpm/bun                      |
| `runPackageManagerCommand(cmd)` | Run command with detected package manager     |
| `runScript(script)`             | Run package.json script                       |

## Common Filter Patterns

```typescript
// File exists
await utils.exists("tsconfig.json");

// File with any extension exists
await utils.existsWithAnyExt(".eslintrc");

// File exists AND another doesn't
(await utils.exists("old.config")) && !(await utils.exists("new.config"));

// Check package.json for dependency
const pkg = await utils.readPackageJSON();
return !!pkg?.devDependencies?.["some-package"];

// Check package.json scripts
const pkg = await utils.readPackageJSON();
const scripts = Object.values(pkg?.scripts || {}) as string[];
return scripts.some((s) => s.includes("some-command"));
```

## Common Apply Patterns

```typescript
// Remove files
await utils.remove(".oldconfig");
await utils.remove(".oldignore");

// Write new config (skip if exists)
await utils.write("new.config.json", JSON.stringify({ key: "value" }, null, 2), {
  skipIfExists: true,
});

// Update package.json scripts
await utils.updatePackageJSON((pkg) => {
  for (const name in pkg.scripts) {
    if (pkg.scripts[name]?.includes("old-cmd")) {
      pkg.scripts[name] = pkg.scripts[name].replace("old-cmd", "new-cmd");
    }
  }
});

// Add/remove dependencies
await utils.addDevDependency("new-package@^1.0.0");
await utils.removeDependency("old-package");

// Update JSON config
await utils.updateJSON<SomeType>("config.json", (config) => {
  delete config.oldOption;
  config.newOption = true;
});

// Run script after changes
await utils.runScript("lint:fix");
```

## Example Actions

### Migration Action (eslint-flat style)

```typescript
import { defineAction } from "codeup";

export default defineAction({
  meta: {
    name: "migrate-config",
    description: "Migrate from old config to new config",
    date: "2026-01-29",
  },
  async filter({ utils }) {
    return (
      (await utils.existsWithAnyExt(".oldrc")) && !(await utils.existsWithAnyExt("new.config"))
    );
  },
  async apply({ utils }) {
    // Read old config
    const oldConfig = await utils.readJSON(".oldrc");

    // Write new config
    await utils.write("new.config.mjs", getTemplate(oldConfig));

    // Remove old files
    await utils.remove(".oldrc");
    await utils.remove(".oldignore");

    // Update dependencies
    await utils.addDevDependency("new-tool@^2.0.0");
    await utils.removeDependency("old-tool");
  },
});
```

### Tool Switch Action (tsgo style)

```typescript
import { defineAction } from "codeup";

export default defineAction({
  meta: {
    name: "switch-tool",
    description: "Switch from tool-a to tool-b",
    date: "2026-01-29",
  },
  async filter({ utils }) {
    const pkg = await utils.readPackageJSON();
    return !!pkg?.devDependencies?.["tool-a"];
  },
  async apply({ utils }) {
    // Update scripts
    await utils.updatePackageJSON((pkg) => {
      for (const name in pkg.scripts) {
        if (pkg.scripts[name]?.includes("tool-a")) {
          pkg.scripts[name] = pkg.scripts[name].replace("tool-a", "tool-b");
        }
      }
    });

    // Swap dependencies
    await utils.removeDependency("tool-a");
    await utils.addDevDependency("tool-b@latest");
  },
});
```

## Task

1. Ask for action **name** if not provided
2. Ask for **filter** condition (when should this action run?)
3. Ask for **steps** (what should the action do?)
4. Determine appropriate directory under `actions/` (use `actions/unjs/` for unjs-related actions)
5. Generate the action file with proper structure
6. Use today's date for the `meta.date` field
