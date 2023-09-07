const path = require('path');
const klaw = require('klaw');
const deleteAsync = require('del');
const packages = require('../submodule/package.json').workspaces.map((package) => {
  return package.split('/')[1];
});

async function execute() {  
  console.log('   - deleting non-essential files');
  const packageDirs = packages.map(package => path.join(__dirname, '..', 'submodule', 'packages', package) )

  for (let i = 0; i < packageDirs.length; i++) {
    await stripTestDir(packageDirs[i])
    await stripDownPackage(packageDirs[i]);
  }
  return;
}

async function stripTestDir(packageDir) {
  return new Promise((resolve, reject) => {
    const removes = [];
    klaw(packageDir)
    .on('data', async (item) => {
      if (/test$/.test(item.path)) {
        return removes.push(item.path)
      }
      return;
    })
    .on('end', async () => {
      await deleteAsync(removes)
      resolve()
    })
    .on('error', (err) => {
      reject(err)
    });
  });
}

async function stripDownPackage(packageDir) {
  return new Promise((resolve, reject) => {
    const removes = [];
    klaw(packageDir)
    .on('data', async (item) => {
      if (isTestFile(item.path)) {
        return removes.push(item.path)
      }
  
      if(!isCriticalPackageFile(packageDir, item.path)) {
        removes.push(item.path);
      }

      return;
    })
    .on('end', async () => {
      await deleteAsync(removes)
      resolve()
    })
    .on('error', (err) => {
      reject(err)
    });
  });
}

function isTestFile(path) {
  return /.spec.js$/.test(path);
}

function isCriticalPackageFile(packageDir, path) {
  const readmeRegex = new RegExp(`(README.md$|package.json$|LICENSE$|${packageDir}$)`)
  return /src/.test(path) || readmeRegex.test(path);
}

// if called directly, just call execute()
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
  // otherwise, the module was required (most likely the unit test), so just export the function
  module.exports = execute;
}
