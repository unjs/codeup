// Duplicated from unjs/c12 resolve config (https://github.com/unjs/c12/blob/main/src/loader.ts#L259)
// TODO: To move to giget upstream

import { existsSync } from "node:fs";
import fsp from "node:fs/promises";
import { homedir } from "node:os";
import type { DownloadTemplateOptions } from "giget";
import { hash } from "ohash";
import { basename, dirname, join, resolve } from "pathe";

const GIGET_PREFIXES = ["gh:", "github:", "gitlab:", "bitbucket:", "https://", "http://"];

export interface ResolveOptions {
  install?: boolean;
}

export async function resolveSourceDir(
  source: string,
  cwd: string,
  gigetOpts?: DownloadTemplateOptions,
) {
  if (!GIGET_PREFIXES.some((prefix) => source.startsWith(prefix))) {
    return resolve(cwd, source);
  }

  // Download giget URIs and resolve to local path
  const cloneName = `${source
    .replace(/\W+/g, "_")
    .split("_")
    .splice(0, 3)
    .join("_")}_${hash(source)}`;
  let cloneDir: string;

  const localNodeModules = resolve(cwd, "node_modules");
  const parentDir = dirname(cwd);

  if (basename(parentDir) === ".giget") {
    cloneDir = join(parentDir, cloneName);
  } else if (existsSync(localNodeModules)) {
    cloneDir = join(localNodeModules, ".giget", cloneName);
  } else {
    cloneDir = process.env.XDG_CACHE_HOME
      ? resolve(process.env.XDG_CACHE_HOME, "giget", cloneName)
      : resolve(homedir(), ".cache/giget", cloneName);
  }

  if (existsSync(cloneDir) && !gigetOpts?.install) {
    await fsp.rm(cloneDir, { recursive: true });
  }

  const { downloadTemplate } = await import("giget");
  const cloned = await downloadTemplate(source, {
    dir: cloneDir,
    ...gigetOpts,
  });

  return cloned.dir;
}
