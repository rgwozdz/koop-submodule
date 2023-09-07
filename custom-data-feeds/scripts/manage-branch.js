const path = require('path');
const fs = require('fs-extra');
const { simpleGit } = require('simple-git');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const modifyBranch = require('./modify-branch-for-cdf');
const MAIN_BRANCH = 'master';
const CDF_BRANCH = 'cdf-modifications'

const options = {
   baseDir: path.join(__dirname, '..', 'submodule'),
   binary: 'git',
   maxConcurrentProcesses: 6,
   trimmed: false,
};

// when setting all options in a single object
const git = simpleGit(options);

async function execute() {
  const targetBranch = CDF_BRANCH;
  const branchPoint = argv['branch-point'] || MAIN_BRANCH;

  console.log(`\n1. Preparing local submodule branch "${targetBranch}"...`);
  await cleanAnyUncommitedChanges();

  if(await branchExists(targetBranch)) {
    await deleteExistingLocalBranch(targetBranch)
  }

  if (branchPoint === MAIN_BRANCH) {
    await updateMainBranch()
  }

  await git.checkout(['-b', targetBranch, branchPoint])
  console.log(`\n   ...Completed`);

  console.log(`\n2. Modifying local submodule branch "${targetBranch}"...\n`);
  await modifyBranch();
  console.log(`\n   ...Completed`);
  
  console.log(`\n3. Running framework E2E tests on local submodule branch "${targetBranch}"...`);
  await runE2ETests();
  console.log(`\n   ...Completed`);

  console.log(`\n4. Copying modified framework files from submodule to SDK...`);
  await fs.copy(path.join(__dirname, '..', 'submodule', 'packages'), path.join(__dirname, '..', 'framework'));
  console.log(`\n   ...Completed`);
  return;
}

async function cleanAnyUncommitedChanges() {
  await git.clean('f');
  await git.reset('hard');
}

async function branchExists(targetBranch) {
  const { all } = await git.branchLocal();
  return all.includes(targetBranch);
}

async function deleteExistingLocalBranch (targetBranch) {
  await git.checkout(MAIN_BRANCH)
  return git.deleteLocalBranch(targetBranch)
}

async function updateMainBranch () {
  await git.checkout(MAIN_BRANCH)
  await git.reset('hard', [`origin/${MAIN_BRANCH}`])
  await git.pull();
}

async function runE2ETests () {
  await exec('cd submodule && npm install');
  try {
    await exec('cd submodule && npm run test:e2e')
  } catch (error) {
    console.log(`E2E TEST(S) FAILED: Something went wrong with branch modification for CDF.\n`);
    console.log(error.stderr);
    throw new Error('\nE2E TEST(S) FAILED: Something went wrong with branch modification for CDF.');
  }
}

execute()
  .then((res) => {
    process.exitCode = 0;
  })
  .catch((err) => {
    console.log(err)
    process.exitCode = 1;
  });