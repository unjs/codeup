import * as _fs from "./fs";
import * as _json from "./json";
import * as _pkg from "./pkg";

export const utils = Object.freeze({
  ..._fs,
  ..._json,
  ..._pkg,
});
