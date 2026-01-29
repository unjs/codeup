import { defineAction } from "codeup";

// https://eslint.org/docs/latest/use/configure/configuration-files
const ESLINT_CONFIG_FILES = [
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.cjs",
  "eslint.config.ts",
  "eslint.config.mts",
  "eslint.config.cts",
  ".eslintrc",
  ".eslintrc.js",
  ".eslintrc.cjs",
  ".eslintrc.yaml",
  ".eslintrc.yml",
  ".eslintrc.json",
  ".eslintignore",
];

export default defineAction({
  meta: {
    name: "oxlint",
    description: "Switch from ESLint to oxlint",
    date: "2026-01-29",
  },
  async filter({ utils }) {
    // Only apply if an eslint config exists
    return (
      (await utils.existsWithAnyExt("eslint.config")) || (await utils.existsWithAnyExt(".eslintrc"))
    );
  },
  async apply({ utils }) {
    // Remove eslint from devDependencies
    const packageJson = await utils.readPackageJSON();
    if (packageJson?.devDependencies?.eslint) {
      await utils.removeDependency("eslint");
    }

    // Remove all eslint config files
    for (const file of ESLINT_CONFIG_FILES) {
      await utils.remove(file);
    }

    // Create oxlint.json config
    await utils.write(
      "oxlint.json",
      JSON.stringify(
        {
          $schema: "https://unpkg.com/oxlint/configuration_schema.json",
          plugins: ["unicorn", "typescript", "oxc"],
        },
        null,
        2,
      ),
      { skipIfExists: true },
    );

    // Install oxlint as dev dependency
    await utils.addDevDependency("oxlint");

    // Update package.json scripts to use oxlint instead of eslint
    await utils.updatePackageJSON((pkg) => {
      if (!pkg.scripts) {
        return;
      }
      for (const name of ["lint", "lint:fix", "format"]) {
        if (pkg.scripts[name]) {
          // Replace eslint --fix with oxlint --fix
          pkg.scripts[name] = pkg.scripts[name].replace(/eslint\s+--fix\b/g, "oxlint --fix");
          // Replace eslint with oxlint (for non --fix cases)
          pkg.scripts[name] = pkg.scripts[name].replace(/eslint(?!\s+--fix)\b/g, "oxlint");
        }
      }
    });
  },
});
