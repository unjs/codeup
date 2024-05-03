import nypm from "nypm";
import type { PackageJson } from "pkg-types";
import { useContext } from "../context";
import { findUp } from "./fs";
import { readJSON, updateJSON } from "./json";

/**
 * Try to read the closest package.json file
 *
 * @group package.json
 */
export async function readPackageJSON() {
  const path = await findUp("package.json");
  if (!path) {
    return undefined;
  }
  return readJSON(path);
}

/**
 * Try to update the closest package.json file
 *
 * @group package.json
 */
export async function updatePackageJSON(
  fn: (
    json: PackageJson,
    // biome-ignore lint: lint/suspicious/noConfusingVoidType
  ) => void | PackageJson | Promise<PackageJson | void>,
) {
  const path = await findUp("package.json");
  if (!path) {
    return;
  }
  await updateJSON(path, fn);
}

/**
 * Add a dependency to the project using detected package manager
 *
 * @group package.json
 */
export async function addDependency(
  name: string | string[],
  opts?: nypm.OperationOptions & { log?: boolean },
) {
  const context = useContext();
  if (opts?.log !== false) {
    if (typeof name === "string") {
      context.logger.info(`Adding ${name} dependency`);
    } else {
      context.logger.info(`Adding ${name.join(", ")} dependencies`);
    }
  }
  await nypm.addDependency(name, {
    cwd: context.cwd,
    ...opts,
  });
}

/**
 * Add a dev dependency to the project using detected package manager
 *
 * @group package.json
 */
export async function addDevDependency(
  name: string | string[],
  opts?: Exclude<nypm.OperationOptions, "dev"> & { log?: boolean },
) {
  await addDependency(name, { dev: true, ...opts });
}

/**
 * Remove a dependency from the project using detected package manager
 *
 * @group package.json
 */
export async function removeDependency(
  name: string,
  opts?: nypm.OperationOptions & { log?: boolean },
) {
  const context = useContext();
  if (opts?.log !== false) {
    context.logger.info(`Removing ${name} dependency`);
  }
  await nypm.removeDependency(name, {
    cwd: context.cwd,
    ...opts,
  });
}

/**
 * Run a `package.json` script using detected package manager
 *
 * @group package.json
 */
export async function runScript(name: string) {
  const context = useContext();
  const pkgManager = await nypm.detectPackageManager(context.cwd);
  try {
    const { execa } = await import("execa");
    await execa(pkgManager?.name || "npm", ["run", ...name.split(" ")], {
      cwd: useContext().cwd,
      stdio: "inherit",
    });
  } catch (error) {
    context.logger.error(error);
  }
}
