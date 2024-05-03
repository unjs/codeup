import { normalize } from "pathe";
import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  rollup: {
    output: {
      chunkFileNames(chunk) {
        return "_[name].mjs";
      },
    },
  },
});
