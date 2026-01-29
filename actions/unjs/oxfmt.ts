import { defineAction } from "codeup";

// https://prettier.io/docs/configuration
const PRETTIER_CONFIG_FILES = [
  ".prettierrc",
  ".prettierrc.json",
  ".prettierrc.yml",
  ".prettierrc.yaml",
  ".prettierrc.json5",
  ".prettierrc.js",
  ".prettierrc.mjs",
  ".prettierrc.cjs",
  ".prettierrc.toml",
  "prettier.config.js",
  "prettier.config.mjs",
  "prettier.config.cjs",
  ".prettierignore",
];

export default defineAction({
  meta: {
    name: "oxfmt",
    description: "Switch from Prettier to oxfmt",
    date: "2026-01-29",
  },
  async filter({ utils }) {
    // Only apply if .prettierrc (with any extension) exists
    return await utils.existsWithAnyExt(".prettierrc");
  },
  async apply({ utils }) {
    // Remove prettier from devDependencies
    const packageJson = await utils.readPackageJSON();
    if (packageJson?.devDependencies?.prettier) {
      await utils.removeDependency("prettier");
    }

    // Remove all prettier config files
    for (const file of PRETTIER_CONFIG_FILES) {
      await utils.remove(file);
    }

    // Create .oxfmtrc.json (only if not exists)
    await utils.write(
      ".oxfmtrc.json",
      JSON.stringify(
        {
          $schema: "https://unpkg.com/oxfmt/configuration_schema.json",
        },
        null,
        2,
      ),
      { skipIfExists: true },
    );

    // Install oxfmt as dev dependency
    await utils.addDevDependency("oxfmt");

    // Update npm scripts to replace prettier with oxfmt
    await utils.updatePackageJSON((pkg) => {
      if (pkg.scripts) {
        for (const [name, script] of Object.entries(pkg.scripts)) {
          if (typeof script === "string" && script.includes("prettier")) {
            pkg.scripts[name] = script
              // prettier -c / prettier --check → oxfmt --check
              .replace(/\bprettier\s+(-c|--check)\b/g, "oxfmt --check")
              // prettier -w / prettier --write → oxfmt
              .replace(/\bprettier\s+(-w|--write)\b/g, "oxfmt");
          }
        }
      }
    });

    // Run oxfmt to format the codebase
    await utils.runPackageManagerCommand("oxfmt --write .");
  },
});
