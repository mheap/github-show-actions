import { Octokit } from "@octokit/rest";
import fetchAllRepos from "octokit-fetch-all-repos";
const MyOctokit = Octokit.plugin(fetchAllRepos);

import fs from "fs";
import chalk from "chalk";
import debugMod from "debug";
const debug = debugMod("gsa:entrypoint");
import groupBy from "lodash.groupby";

import actionExtractor from "./action-extractor.js";
import loadWorkflows from "./load-workflows.js";

export default async function (argv) {
  // Set up auth
  const token = argv.pat || process.env.GITHUB_TOKEN;

  // Cache useful args
  const owner = argv.target;

  // Fetch list of repos
  const octokit = new MyOctokit({
    auth: token,
  });

  let data;
  const cache = argv.cache;

  if (cache) {
    debug(`Fetching repo list from cache [${cache}]`);
    try {
      data = JSON.parse(fs.readFileSync(cache));
    } catch (e) {
      debug(`Unable to load cache [${cache}]`);
    }
  }

  if (!data) {
    debug("Fetching repo list");
    let repos = await octokit.fetchAllRepos({
      owner,
      visibility: argv.visibility || "all",
      minimum_access: "pull",
      include_forks: false,
      include_archived: false,
      include_templates: false,
    });

    let workflows = [];
    for (let repo of repos) {
      workflows = workflows.concat(await loadWorkflows(octokit, repo));
    }

    data = workflows.flatMap((workflow) => {
      const actions = [];
      for (let action of actionExtractor(workflow.content)) {
        delete workflow.content;
        actions.push({
          ...workflow,
          action,
        });
      }
      return actions;
    });

    if (cache) {
      debug(`Writing to cache [${cache}]`);
      fs.writeFileSync(cache, JSON.stringify(data));
    }
  }

  // Grouping
  const allowedGroups = ["action", "repo"];
  const group = argv.group || "repo";
  const otherKey = group == "repo" ? "action" : "repo";

  if (!allowedGroups.includes(group)) {
    throw new Error(
      `The [group] argument must be one of: ${allowedGroups.join(",")}`
    );
  }
  const grouped = groupBy(data, group);

  if (argv.format == "json") {
    console.log(JSON.stringify(grouped));
    return;
  }

  // Insert actions in an ordered fashion
  const output = {};
  for (let k of Object.keys(grouped).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  )) {
    output[k] = output[k] || {};

    for (let workflowKey of Object.keys(grouped[k]).sort()) {
      const workflow = grouped[k][workflowKey];
      const actionOrRepo = workflow[otherKey];
      output[k][actionOrRepo] = output[k][actionOrRepo] || [];
      output[k][actionOrRepo].push(workflow.name);
    }
  }

  for (let key in output) {
    console.log(chalk.underline(key));
    for (let actionOrRepo of Object.keys(output[key]).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    )) {
      if (argv.showWorkflows) {
        const uniqueActions = [...new Set(output[key][actionOrRepo])];
        actionOrRepo += ` [${uniqueActions.join(", ")}]`;
      }
      console.log(actionOrRepo);
    }
    console.log();
  }
};
