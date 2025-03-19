# github-show-actions

This CLI allows you to audit which GitHub Actions are being used by a user / org / team.

> **Warning**: It will make a _lot_ of API calls as it has to list your repos, then list the workflows directory, then fetch the contents of each workflows

## Installation

### NPM

```bash
npm install -g github-show-actions
```

### Docker

```bash
alias github-show-actions="docker run --rm -e GITHUB_TOKEN mheap/github-show-actions"
```

## Example output

![Example Output](https://user-images.githubusercontent.com/59130/101267633-a92bd480-3752-11eb-952c-d3df031572fb.png)

## Usage

You'll need to authenticate to use this tool. You can either set the `GITHUB_TOKEN` environment variable, or pass the `--pat` flag. Generate a new Personal Access Token [on GitHub](https://github.com/settings/tokens).

The simplest usage of this tool is to pass the `--target` parameter. This will return a list of actions used in all public and private repos, grouped by `repo`

```bash
github-show-actions --target <org>
```

> You can pass the `--format json` flag to see the raw data

To get the same information, but group by the action name/version instead you can use the `--group` flag:

```bash
github-show-actions --target <org> --group action
```

The action takes quite a while to run, so you may want to cache the data returned. You can do so with the `--cache` flag (this will **always** return the same data, ignoring any flags you pass except `group` and `show-workflow`):

```bash
github-show-actions --target <org> --group action --cache /tmp/cache.json
```

If you'd like to show actions used in public repos only you can pass the `--visibility` parameter:

```bash
github-show-actions --target <org> --group action  --cache /tmp/cache.json --visibility public
```

Finally, if you'd like to see the workflow name that uses each action you can pass `--show-workflow`:

```bash
github-show-actions --target <org> --group action  --cache /tmp/cache.json --visibility public  --show-workflow
```

See `github-show-actions --help` for a full list of options

## FAQ

**Why doesn't this use the /search API to find workflows?**

The search API has [a timeout](https://developer.github.com/changes/2014-04-07-understanding-search-results-and-potential-timeouts/) which means that it can not be relied on to return all workflows
