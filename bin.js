#!/usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import run from "./index.js"

const argv = yargs(hideBin(process.argv))
  .option("pat", {
    type: "string",
    description:
      "GitHub Personal Access Token. Required if GITHUB_TOKEN env variable is not set",
  })
  .option("target", {
    type: "string",
    description: "This can be the name of a user, org or team",
  })
  .option("visibility", {
    type: "string",
    description: "all/public/private",
    default: "all",
  })
  .option("format", {
    type: "string",
    description: "Output format human/json",
    default: "human",
  })
  .option("group", {
    type: "string",
    description: "Group by repo/action",
    default: "repo",
  })
  .option("cache", {
    type: "string",
    description: "File to cache workflows in",
  })
  .option("show-workflow", {
    type: "boolean",
    description: "Show the workflow file when listing an action",
  })
  .demandOption(["target"]).argv;

(async function (argv) {
  run(argv);
})(argv);
