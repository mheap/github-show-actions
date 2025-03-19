export default async function (octokit, r) {
  const owner = r.owner.login;
  const repo = r.name;

  const workflows = [];

  try {
    const { data: files } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: ".github/workflows",
    });

    // Load the file contents for each repo
    for (let file of files) {
      const { data: workflow } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: file.path,
      });

      // Skip anything that isn't a file
      if (workflow.type !== "file") {
        continue;
      }

      workflows.push({
        repo: r.full_name,
        name: workflow.name,
        content: Buffer.from(workflow.content, workflow.encoding).toString(),
      });
    }

    return workflows;
  } catch (e) {
    if (e.status === 404) {
      return [];
    }
    throw e;
  }
};
