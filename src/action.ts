import fsp from "node:fs/promises";
import { fileURLToPath } from "node:url";
import consola from "consola";
import { createJiti } from "jiti";
import { dirname, extname, join, resolve } from "pathe";
import { filename } from "pathe/utils";
import { resolveSourceDir } from "./_giget";
import { createContext, runWithContext } from "./context";
import type { Action } from "./types";

/**
 * Apply an action within context and working directory.
 */
export async function applyAction(action: Action, cwd: string) {
  const context = createContext(cwd || ".", action.meta?.name);
  try {
    const start = performance.now();
    await runWithContext(context, async () => {
      if (action.filter && !(await action.filter(context))) {
        consola.info(`Skipping action \`${getActionName(action)}\`...`);
        return;
      }
      consola.info(`Applying action \`${getActionName(action)}\``);
      await action.apply(context);
      consola.success(
        `Action \`${getActionName(action)}\` applied in ${(
          performance.now() - start
        ).toFixed(2)}ms`,
      );
    });
  } catch (error) {
    consola.error(
      `Failed to apply action \`${getActionName(action)}\`:\n`,
      error,
    );
  }
}

/**
 * Apply multiple actions within context and working directory.
 *
 * If `opts.sort` is true, actions will be sorted by date or name otherwise in the order they are provided.
 */
export async function applyActions(
  actions: Action[],
  cwd: string,
  opts?: { sort: boolean },
) {
  const _actions = opts?.sort ? sortActions(actions) : actions;
  const _cwd = resolve(cwd || ".");
  consola.info(
    `Applying ${_actions.length} action${
      actions.length > 1 ? "s" : ""
    } to \`${_cwd}\`:\n\n${_actions
      .map((a) => {
        const name = a.meta?.name || a._path || a.apply?.name || "?";
        const parts = [
          `\`${name}\``,
          a.meta?.description && `: ${a.meta?.description}`,
          a.meta?.date && `(${a.meta?.date})`,
        ].filter(Boolean) as string[];
        return `  - ${parts.join(" ")}`;
      })
      .join("\n")}\n`,
  );
  for (const action of _actions) {
    await applyAction(action, _cwd);
  }
}

/**
 * Sort actions by date or name.
 */
export function sortActions(actions: Action[]) {
  return [...actions].sort((a, b) => {
    if (a.meta?.date && b.meta?.date) {
      return a.meta.date.localeCompare(b.meta.date);
    }
    const aName = a.meta?.name || a._path || a.apply?.name || "";
    const bName = b.meta?.name || b._path || b.apply?.name || "";
    return aName.localeCompare(bName);
  });
}

/**
 * Load and apply action from file.
 */
export async function applyActionFromFile(path: string, workingDir: string) {
  const _path = resolve(path);
  let action: Action;
  try {
    action = await loadActionFromFile(path);
  } catch (error) {
    consola.error(`Failed to load action from \`${_path}\`:\n`, error);
    return;
  }
  return await applyAction(action, workingDir);
}

/**
 * Load action from file.
 */
export async function loadActionFromFile(path: string) {
  const _path = resolve(path);
  const actionDir = dirname(_path);
  const _pkgDir = fileURLToPath(new URL("..", import.meta.url));
  const jiti = createJiti(actionDir, {
    alias: {
      codeup: join(_pkgDir, "dist/index.mjs"),
      "codeup/utils": join(_pkgDir, "dist/utils/index.mjs"),
    },
  });
  const action = (await jiti.import(_path, { default: true })) as Action;
  if (!action || typeof action.apply !== "function") {
    throw new Error(
      `File \`${_path}\` does not export a valid object with \`apply\` method!`,
    );
  }
  action._path = _path;
  return action;
}

const supportedExtensions = new Set([".js", ".ts", ".mjs", ".cjs"]);

/**
 * Load actions from a directory.
 */
export async function loadActionsFromDir(actionsDir: string) {
  const actionFiles = (await fsp.readdir(actionsDir)).filter((path) =>
    supportedExtensions.has(extname(path)),
  );
  const actions = await Promise.all(
    actionFiles.map(async (actionFile) =>
      loadActionFromFile(resolve(actionsDir, actionFile)),
    ),
  );
  return actions;
}

/**
 * Load and apply actions from directory.
 */
export async function applyActionsFromDir(actionsDir: string, cwd: string) {
  const actions = await loadActionsFromDir(actionsDir);
  return await applyActions(actions, cwd, { sort: true });
}

/**
 * Load and apply actions from a remote or local source.
 */
export async function applyActionsFrom(source: string, cwd: string) {
  const sourceDir = await resolveSourceDir(source, cwd);
  return await applyActionsFromDir(sourceDir, cwd);
}

/**
 * Get action name from action object.
 */
export function getActionName(action: Action): string {
  return (
    action.meta?.name ||
    (action._path && filename(action._path)) ||
    action.apply?.name ||
    ""
  );
}
