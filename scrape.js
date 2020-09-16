const { Octokit } = require("@octokit/rest");
const { ReadmeBox } = require("readme-box");

const ISSUE_NUMBER = 1; // TODO: take env var
const issuedetails = {
  owner: process.env.GITHUB_REPOSITORY_OWNER,
  repo: process.env.GITHUB_REPOSITORY_NAME,
  issue_number: ISSUE_NUMBER,
  token: process.env.ENV_GITHUB_TOKEN,
};

const octokit = new Octokit({ auth: `token ${process.env.ENV_GITHUB_TOKEN}` });
(async function main() {
  const data = await getData();
  try {
    const images = await generateImages(data);
    await ReadmeBox.updateSection(images, {
      ...issuedetails,
      section: "signed-people",
    });
    const reasons = await generateReasons(data);
    await ReadmeBox.updateSection(reasons, {
      ...issuedetails,
      section: "sign-reasons",
    });
    console.log({images, reasons})
  } catch (err) {
    console.error(err);
  }
})();

/**
 *
 *
 *
 *
 */

function generateReasons(data) {
  const renderedList = data.comments.slice(0,5)
    .map(
      (comment) => `"${comment.body}" *- ${user.login}* <img src=${comment.user.avatar_url}&s=20 height=20 />`
    )
    .join("\n");
  return renderedList;
}

function generateImages(data) {
  const renderedList = data.reactions
    .map(
      (reaction) => `<img src=${reaction.user.avatar_url}&s=20 height=20 />` // use github image api s=20 to size smaller
    )
    .join("\n");
  return renderedList; 
}

async function getData() {
  let reactions = await octokit.reactions.listForIssue(issuedetails);
  let comments = await octokit.issues.listComments(issuedetails);
  return {
    reactions: reactions.data,
    comments: comments.data,
  };
}
