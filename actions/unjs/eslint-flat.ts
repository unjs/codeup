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
        ignores: eslintignore.filter((i) => !["", "node_modules", "dist", "coverage"].includes(i)),
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
    await utils.addDevDependency(["eslint@^9.0.0", "eslint-config-unjs@^0.3.0"]);

    // Run lint:fix script once
    await utils.runScript("lint:fix");
  },
});

function getConfigTemplate(opts: { rules: Record<string, unknown>; ignores: string[] }) {
  return /* js */ `
import unjs from "eslint-config-unjs";

// https://github.com/unjs/eslint-config
export default unjs({
  ignores: ${JSON.stringify(opts.ignores || [], undefined, 2)},
  rules: ${JSON.stringify(opts.rules || {}, undefined, 2)},
});
`.trim();
}
