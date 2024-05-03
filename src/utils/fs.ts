import { existsSync } from "node:fs";
import fsp from "node:fs/promises";
import { resolve as _resolve } from "pathe";
import { findFile } from "pkg-types";
import { useContext } from "../context";

/**
 * Resolves a path relative to the current working directory.
 *
 * @group fileSystem
 */
export function resolve(path: string) {
  const ctx = useContext();
  return _resolve(ctx.cwd, path);
}

/**
 * Checks if a file or directory exists in path
 *
 * @group fileSystem
 */
export async function exists(
  path: string,
  opts?: { withAnyExt?: boolean },
): Promise<boolean> {
  if (opts?.withAnyExt) {
    const ctx = useContext();
    const files = await fsp.readdir(ctx.cwd);
    return files.some((file) => file.startsWith(path));
  }
  const resolvedPath = resolve(path);
  return existsSync(resolvedPath);
}

/**
 * Checks if a file or directory exists in path with any extension (input path should not contain extension)
 *
 * @group fileSystem
 */
export async function existsWithAnyExt(path: string): Promise<boolean> {
  return exists(path, { withAnyExt: true });
}

/**
 * Try to read a text file and returns its contents
 *
 * @group fileSystem
 */
export async function read(path: string): Promise<string | undefined> {
  const resolvedPath = resolve(path);
  try {
    return await fsp.readFile(resolvedPath, "utf8");
  } catch {
    return undefined;
  }
}

/**
 * Read a text file and return its contents as an array of lines
 *
 * @group fileSystem
 */
export async function readLines(path: string): Promise<string[] | undefined> {
  const contents = await read(path);
  return contents?.split("\n") || undefined;
}

/**
 * Write text contents to a file
 *
 * @group fileSystem
 */
export async function write(
  path: string,
  contents: string,
  opts?: { skipIfExists?: boolean; log?: boolean },
): Promise<void> {
  const ctx = useContext();
  const resolvedPath = resolve(path);
  if (opts?.skipIfExists && existsSync(resolvedPath)) return;
  if (opts?.log !== false) {
    ctx.logger.info(`Writing \`${path}\``);
  }
  await fsp.writeFile(resolvedPath, contents);
}

/**
 * Try to remove a file or directory
 *
 * @group fileSystem
 */
export async function remove(
  path: string,
  opts?: { log?: boolean },
): Promise<void> {
  const ctx = useContext();
  const resolvedPath = resolve(path);
  if (!existsSync(resolvedPath)) return;
  if (opts?.log !== false) {
    ctx.logger.info(`Removing \`${path}\``);
  }
  try {
    await fsp.rm(resolvedPath, { recursive: true });
  } catch {
    // ignore
  }
}

/**
 * Try to find a file in the current working directory or any parent directories
 *
 * @group fileSystem
 */
export async function findUp(name: string) {
  const ctx = useContext();
  try {
    return await findFile(name, { startingFrom: ctx.cwd });
  } catch {
    return undefined;
  }
}

/**
 * Read a file and update its contents
 *
 * Returns the updated contents or the old one
 *
 * @group fileSystem
 */
export async function update(
  path: string,
  fn: (contents: string) => string | Promise<string>,
  opts?: { log?: boolean },
) {
  const ctx = useContext();
  const contents = await read(path);
  if (!contents) return contents;
  const updatedContents = await fn(contents);
  if (contents === updatedContents) return contents;
  if (opts?.log !== false) {
    ctx.logger.info(`Updating \`${path}\``);
  }
  await write(path, updatedContents, { log: false });
  return updatedContents;
}

/**
 * Append text to a file (with a newline by default)
 *
 * @group fileSystem
 */
export async function append(
  path: string,
  contents: string,
  opts?: { newLine?: boolean },
) {
  const sep = opts?.newLine === false ? "" : "\n";
  return update(path, (existing) => existing + sep + contents);
}
