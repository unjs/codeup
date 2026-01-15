import { defineBuildConfig } from "obuild/config";

export default defineBuildConfig({
  entries: ["src/index.ts", "src/cli/index.ts", "src/utils/index.ts"],

  hooks: {
    rolldownOutput(cfg) {
      cfg.chunkFileNames = () => {
        return "_[name].mjs";
      };
    },
  },
});
