import { defineBuildConfig } from "obuild/config";

export default defineBuildConfig({
  entries: ["src/index.ts", "src/cli/index.ts", "src/utils/index.ts"],
});
