import { defineAction } from "codeup";
import type { TSConfig } from 'pkg-types';

const TS_CHECK_COMMAND = "tsc --noEmit";

export default defineAction({
  meta: {
    name: "tsgo",
    description: "Switch to tsgo for type checking",
    date: "2026-01-15",
  },
  async filter({ utils }) {
    const packageJson = await utils.readPackageJSON();
    const scripts = Object.values(packageJson?.scripts || {}) as string[];

    // Only apply if tsconfig.json exists and tsc is used for type checking
    return (
      (await utils.exists("tsconfig.json")) &&
      scripts.some((script) => script.includes(TS_CHECK_COMMAND))
    );
  },
  async apply({ utils }) {
    // update script to use tsgo
    await utils.updatePackageJSON((pkg) => {
      for (const name in pkg.scripts) {
        if (pkg.scripts[name]?.includes(TS_CHECK_COMMAND)) {
          pkg.scripts[name] = pkg.scripts[name].replace("tsc", "tsgo");
        }
      }
    });

    // ensure tsgo is installed
    await utils.addDevDependency("@typescript/native-preview@latest"); // latest because version changes every single day

    // update tsconfig.json to remove baseUrl
    await utils.updateJSON<TSConfig>("tsconfig.json", (tsconfig) => {
      delete tsconfig?.compilerOptions?.baseUrl;
    });
  },
});
