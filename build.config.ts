import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  rollup: {
    output: {
      chunkFileNames() {
        return "_[name].mjs";
      },
    },
  },
});
