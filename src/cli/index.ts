#!/usr/bin/env node

import { createMain } from "citty";
import { description, name, version } from "../../package.json";

const main = createMain({
  meta: {
    name,
    description,
    version,
  },
  subCommands: {
    apply: () => import("./apply").then((m) => m.default),
  },
});

main();
