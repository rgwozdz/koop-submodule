const path = require('path');
const fs = require('fs-extra');
const { simpleGit } = require('simple-git');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const {
  modifyPackageFiles,
  deleteNonEssentialFiles,
  replaceInternalPackageReferences,
  replaceCorePackageReferencesInTests,
  runE2ETests,
  modifyPackageScripts
} = require('./helpers');
const MAIN_BRANCH = 'master';
const CDF_BRANCH = 'cdf-modifications';
const FRAMEWORK_DESTINTION_1 = path.join(__dirname, '..', '..', 'framework-1');
const FRAMEWORK_DESTINTION_2 = path.join(__dirname, '..', '..', 'framework-2');
const FRAMEWORK_1_BUILD_DESTINATION = '../../customdata/framework';
const submodulePackages = require('../submodule/package.json').workspaces.map((pkg) => {
  return pkg.replace('packages/', '');
});

const options = {
   baseDir: path.join(__dirname, '..', 'submodule'),
   binary: 'git',
   maxConcurrentProcesses: 6,
   trimmed: false,
};

let git;

async function execute() {
  const argv = yargs(hideBin(process.argv)).argv;
  git = simpleGit(options);
  const targetBranch = CDF_BRANCH;
  const branchPoint = argv['branch-point'] || MAIN_BRANCH;

  console.log(`\n1. Preparing local submodule branch "${targetBranch}" from "${branchPoint}"...`);
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
  await copyFramework();
  console.log(`\n   ...Completed`);

  console.log(`\n5. Adding clean and build script to framework packages in ${FRAMEWORK_DESTINTION_1}...`);
  await modifyPackageScripts(FRAMEWORK_DESTINTION_1, FRAMEWORK_1_BUILD_DESTINATION);
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

async function deleteExistingLocalBranch(targetBranch) {
  await git.checkout(MAIN_BRANCH)
  return git.deleteLocalBranch(targetBranch)
}

async function updateMainBranch() {
  await git.checkout(MAIN_BRANCH)
  await git.reset('hard', [`origin/${MAIN_BRANCH}`])
  await git.pull();
}

async function modifyBranch() {
  await modifyPackageFiles(submodulePackages);
  await deleteNonEssentialFiles(submodulePackages);
  await replaceInternalPackageReferences(submodulePackages);
  return replaceCorePackageReferencesInTests(submodulePackages);
}

async function copyFramework() {
  await fs.copy(path.join(__dirname, '..', 'submodule', 'packages'), FRAMEWORK_DESTINTION_1);
  return fs.copy(path.join(__dirname, '..', 'submodule', 'packages'), FRAMEWORK_DESTINTION_2);
}

if (require.main === module) {
  execute()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
} else {
  module.exports = execute;
}
