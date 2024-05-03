import { read, update, write } from "./fs";

// biome-ignore lint: lint/suspicious/noConfusingVoidType
type JSON = any;

/**
 * Try to read a JSON file
 *
 * @group json
 */
export async function readJSON(path: string): Promise<JSON | undefined> {
  const contents = await read(path);
  return contents ? JSON.parse(contents) : undefined;
}

/**
 * Write a JSON file
 *
 * @group json
 */
export async function writeJSON(
  path: string,
  json: Record<string, unknown>,
  opts?: Parameters<typeof write>[2],
): Promise<void> {
  await write(path, JSON.stringify(json, undefined, 2), opts);
}

/**
 * Try to update a JSON file using an updater function and return updated JSON
 *
 * @group json
 */
export async function updateJSON<T extends JSON>(
  path: string,
  // biome-ignore lint: lint/suspicious/noConfusingVoidType
  updater: (json: T) => void | T | Promise<T | void>,
): Promise<T | undefined> {
  let updated: T | undefined;
  await update(path, async (existing) => {
    const json = JSON.parse(existing || "{}");
    updated = (await updater(json)) || json;
    return JSON.stringify(updated, undefined, 2);
  });
  return updated;
}
