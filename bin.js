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
  .option("base-url", {
    type: "string",
    description: "GitHub Enterprise base URL (e.g., https://github.enterprise.com/api/v3)",
  })
  .option("show-workflow", {
    type: "boolean",
    description: "Show the workflow file when listing an action",
  })
  .option("actions-only-external", {
    type: "boolean",
    description: "List only unique external actions without repository details, skipping local and current organization actions",
  })
  .option("strip-version-number", {
    type: "boolean",
    description: "Strip version numbers from actions and show @v* wildcard",
  })
  .option("exclude-orgs", {
    type: "string",
    description: "Comma-separated list of organizations to exclude from actions list",
  })
  .demandOption(["target"]).argv;

(async function (argv) {
  run(argv);
})(argv);
