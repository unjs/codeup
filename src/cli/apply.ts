#!/usr/bin/env node

import { defineCommand } from "citty";
import { applyActionsFrom } from "../action";

export default defineCommand({
  meta: {
    name: "apply",
    description: "Apply code actions",
  },
  args: {
    cwd: {
      type: "string",
      description: "Project directory",
    },
    actions: {
      type: "string",
      description: "Actions directory",
      required: true,
    },
  },
  async run({ args }) {
    await applyActionsFrom(args.actions, args.cwd || ".");
  },
});
