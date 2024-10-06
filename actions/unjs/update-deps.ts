import { defineAction } from "codeup";
import { updatePackageJSON } from "../../src/utils/pkg";

export default defineAction({
  meta: {
    name: "update-deps",
    description: "Upgrade dependencies to latest versions",
    date: "2025-10-06",
  },
  async apply({ utils }) {
    await utils.runPackageManagerCommand('upgrade')
    await updatePackageJSON(async (pkg) => {
      if (pkg.devDependencies) {
        await Promise.allSettled(Object.keys(pkg.devDependencies).map(async (name) => {
          const info = await getRegistryInfo(name);
          const latest = info["dist-tags"].latest
          pkg.devDependencies![name] = `^${latest}`;
        }));
      }
      if (pkg.packageManager) {
        const name = pkg.packageManager.split('@')[0];
        const info = await getRegistryInfo(name);
        const latest = info["dist-tags"].latest
        pkg.packageManager = `${name}@${latest}`;
      }
    })
    const pm = await utils.detectPackageManager();
    for (const lockfileName of [pm?.lockFile].flat().filter(Boolean)) {
      // await utils.remove(lockfileName)
      console.log(`Removing ${lockfileName}`)
    }
    await utils.runPackageManagerCommand('outdated', { ignoreErrors: true })
  },
});


interface RegistryInfo {
  name: string;
  "dist-tags": Record<string, string>;
  versions: Record<string, any>;
}

async function getRegistryInfo(name: string) {
  return await fetch(`https://registry.npmjs.org/${name}`).then(res => res.json()) as RegistryInfo;
}
