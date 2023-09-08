const path = require('path');
const fs = require('fs-extra')
const { modifyJsonFile } = require('modify-json-file');


async function modifyPackageScripts(parentPath, cpDestDir) {
  const dirs = await fs.readdir(parentPath);

  const packageFilePaths = dirs.map(dir => path.join(parentPath, dir, 'package.json'));

  for (let i = 0; i < dirs.length; i++) {
    const packageFile = require(packageFilePaths[i]);
    const buildDestRelativeToPackageFile = `${cpDestDir}/${dirs[i]}`;

    await modifyJsonFile(
      packageFilePaths[i],
      {
        scripts: {
          clean: `shx rm -rf ${buildDestRelativeToPackageFile} && shx rm package-lock.json`,
          build: generateBuildCmd(buildDestRelativeToPackageFile, packageFile.dependencies),
        },
      },
      { ifFieldIsMissing: 'skip' },
    );
  }
}

function generateBuildCmd(buildDest, dependencies = {}) {
  const mkDir = `shx mkdir ${buildDest}`;
  const cpPackage = `shx cp package.json ${buildDest}`;
  const cpSrc = `shx cp -r ./src ${buildDest}`;

  const build = `${mkDir} && ${cpPackage} && ${cpSrc}`;

  if (Object.keys(dependencies).length === 0) {
    return build;
  }

  const cpNodeModules = `shx cp -r ./node_modules ${buildDest}`;
  return `${build} && ${cpNodeModules}`;
}
module.exports = modifyPackageScripts;
