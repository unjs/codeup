import type { ConsolaInstance } from "consola";
import type { utils } from "./utils";

export interface ActionContext {
  cwd: string;
  utils: typeof utils;
  logger: ConsolaInstance;
}

export interface Action {
  _path?: string;
  meta?: {
    name?: string;
    date?: string;
    description?: string;
  };
  filter?: (context: ActionContext) => boolean | Promise<boolean>;
  apply: (context: ActionContext) => void | Promise<void>;
}

export function defineAction(action: Exclude<Action, "_path">) {
  return action;
}
