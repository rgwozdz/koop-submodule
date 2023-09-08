const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function runE2ETests() {
  await exec('cd submodule && npm install');
  try {
    await exec('cd submodule && npm run test:e2e')
  } catch (error) {
    console.log(`E2E TEST(S) FAILED: Something went wrong with branch modification for CDF.\n`);
    console.log(error.stderr);
    throw new Error('\nE2E TEST(S) FAILED: Something went wrong with branch modification for CDF.');
  }
}

module.exports = runE2ETests;
