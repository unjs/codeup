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

    // Run oxfmt to format the codebase
    await utils.runScript("oxfmt --write .");
  },
});
