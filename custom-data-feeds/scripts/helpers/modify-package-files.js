const path = require('path');
const { modifyJsonFile } = require('modify-json-file');

async function modifyPackageFiles(packages) {
  console.log('   - modifying package.json files');

  const packageFilePaths = packages.map(package => path.join(__dirname, '..', '..', 'submodule', 'packages', package, 'package.json') )
  
  for (let i = 0; i < packageFilePaths.length; i++) {
    const packageFile = require(packageFilePaths[i]);
    const name = packageFile.name.replace('@koopjs/', '').replace('koop-', '');
    const dependencies = stripKoopDeps(packageFile.dependencies);

    await modifyJsonFile(
      packageFilePaths[i],
      {
        name,
        author: undefined,
        description: undefined,
        keywords: undefined,
        dependencies,
        devDependencies: undefined,
        files: undefined,
        contributors: undefined,
        bugs: undefined,
        homepage: undefined,
        repository: undefined,
        directories: undefined,
        types: undefined,
        scripts: {},
      },
      { ifFieldIsMissing: 'skip' },
    );
  }
}

function stripKoopDeps(dependencies) {
  return Object.entries(dependencies)
    .filter(([key]) => {
      return !/^@koopjs/.test(key);
    })
    .reduce((acc, cur) => {
      const [key, value] = cur;
      acc[key] = value;
      return acc;
    }, {});
}

module.exports = modifyPackageFiles;
