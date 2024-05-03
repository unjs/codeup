import { AsyncLocalStorage } from "node:async_hooks";
import { consola } from "consola";
import { resolve } from "pathe";
import type { ActionContext } from "./types";
import { utils } from "./utils";

const asyncContext = new AsyncLocalStorage<ActionContext>();

/**
 * Get the current action context or create a new one from the working directory.
 */
export function useContext(): ActionContext {
  const ctx = asyncContext.getStore();
  if (!ctx) {
    return createContext(".", "codeup");
  }
  return ctx;
}

/**
 * Run a function within a context.
 */
export function runWithContext<T = void>(context: ActionContext, fn: () => T) {
  return asyncContext.run(context, fn);
}

/**
 * Create an action context from a working directory.
 */
export function createContext(cwd = ".", name?: string): ActionContext {
  const context: ActionContext = {
    cwd: resolve(cwd || "."),
    utils,
    logger: name ? consola.withTag(name) : consola,
  };
  return context;
}
