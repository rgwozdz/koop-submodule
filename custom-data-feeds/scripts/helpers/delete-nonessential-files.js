const path = require('path');
const klaw = require('klaw-sync');
const deleteAsync = require('del');

async function execute(packages) {  
  console.log('   - deleting non-essential files');
  const packageDirs = packages.map(pkg => path.join(__dirname, '..', '..', 'submodule', 'packages', pkg) )

  for (let i = 0; i < packageDirs.length; i++) {
    await stripTestDir(packageDirs[i])
    await stripDownPackage(packageDirs[i]);
  }
  return;
}

async function stripTestDir(packageDir) {
  const paths = klaw(packageDir, {
    filter: (item) => {
      return /test$/.test(item.path);
    }
  }).map(item => {
    return item.path
  });

  return deleteAsync(paths);
}

async function stripDownPackage(packageDir) {
  const paths = klaw(packageDir, {
    filter: (item) => {
      return isTestFile(item.path) || !isCriticalPackageFile(packageDir, item.path);
    }
  }).map(item => item.path);

  return deleteAsync(paths);
}

function isTestFile(path) {
  return /.spec.js$/.test(path);
}

function isCriticalPackageFile(packageDir, path) {
  const readmeRegex = new RegExp(`(README.md$|package.json$|LICENSE$|${packageDir}$)`)
  return /src/.test(path) || readmeRegex.test(path);
}

module.exports = execute;
