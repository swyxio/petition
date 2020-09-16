const { Octokit } = require("@octokit/rest");
// const { ReadmeBox } = require("readme-box");
require('dotenv').config() // for local .env files
const fs = require('fs')
const ISSUE_NUMBER = 1; // TODO: take env var
const issuedetails = {
  owner: process.env.GITHUB_REPOSITORY_OWNER,
  repo: process.env.GITHUB_REPOSITORY_NAME,
  branch: process.env.GITHUB_REF_NAME,
  issue_number: ISSUE_NUMBER,
  token: process.env.ENV_GITHUB_TOKEN,
};

console.log({issuedetails})
const octokit = new Octokit({ auth: `token ${process.env.ENV_GITHUB_TOKEN}` });
(async function main() {
  const data = await getData(); // uses issuedetails

  const _readme = await getReadme(octokit);
  let readme = _readme.content
  try {
    const images = await generateImages(data);
    readme = replaceSection({
      sectionName:"signed-people",
      readme,
      newContents: images
    })
    const reasons = await generateReasons(data);
    readme = replaceSection({
      sectionName:"sign-reasons",
      readme,
      newContents: reasons
    })
    console.log({images, reasons})
    
    // for dev
    // fs.writeFileSync('README.md', readme)

    await octokit.repos.createOrUpdateFileContents({
      ...REPO_DETAILS,
      content: Buffer.from(readme).toString("base64"),
      path: "README.md",
      message: `petitionaction ${new Date().toISOString()}`,
      sha: _readme.sha,
      branch: issuedetails.branch,
    });
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


async function getReadme(octokit) {
  const res = await octokit.repos.getReadme(REPO_DETAILS);
  const encoded = res.data.content;
  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  return {
    content: decoded,
    sha: res.data.sha,
  };
}

function generateReasons(data) {
  const renderedList = data.comments.slice(0,5)
    .map(
      (comment) => `"${comment.body}" *- ${comment.user.login}* <img src="${comment.user.avatar_url}&s=20" height=20 />`
    )
    .join("\n");
  return renderedList;
}

function generateImages(data) {
  const renderedList = data.reactions
    .map(
      (reaction) => `${reaction.user.login}<img src="${reaction.user.avatar_url}&s=20" height=20 />` // use github image api s=20 to size smaller
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

function replaceSection({
  sectionName,
  readme,
  newContents
}) {
const START_COMMENT = `<!--START_SECTION:${sectionName}-->`;
const END_COMMENT = `<!--END_SECTION:${sectionName}-->`;
const listReg = new RegExp(`${START_COMMENT}[\\s\\S]+${END_COMMENT}`);
// let oldFences = listReg.exec(readme)
return readme.replace(listReg, START_COMMENT + '\n' + newContents + '\n' + END_COMMENT);
}