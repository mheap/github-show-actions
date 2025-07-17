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
  const octokitConfig = {
    auth: token,
  };

  // Support for GitHub Enterprise
  if (argv.baseUrl) {
    octokitConfig.baseUrl = argv.baseUrl;
  }

  const octokit = new MyOctokit(octokitConfig);

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

  // Handle actions-only mode
  if (argv.actionsOnlyExternal) {
    let uniqueActions = [...new Set(data.map(item => item.action))]
      .filter(action => !action.startsWith('./'))  // Filter out local actions
      // .filter(action => !action.startsWith('.github/workflows'))  // Filter out workflow files
      .filter(action => !action.startsWith(`${owner}/`));  // Filter out organizational actions
    
    // Filter out excluded organizations
    if (argv.excludeOrgs) {
      const excludedOrgs = argv.excludeOrgs.split(',').map(org => org.trim());
      uniqueActions = uniqueActions.filter(action => {
        return !excludedOrgs.some(org => action.startsWith(`${org}/`));
      });
    }
    
    // Strip version numbers if requested
    if (argv.stripVersionNumber) {
      uniqueActions = uniqueActions
        .map(action => {
          // Strip version and add @v* wildcard
          const atIndex = action.lastIndexOf('@');
          if (atIndex !== -1) {
            return action.substring(0, atIndex) + '@v*';
          }
          return action;
        })
        .filter((action, index, arr) => arr.indexOf(action) === index);  // Remove duplicates after version stripping
    }
    
    uniqueActions.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    
    for (let action of uniqueActions) {
      console.log(action);
    }
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
