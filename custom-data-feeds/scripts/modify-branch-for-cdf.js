const path = require('path');
const fs = require('fs-extra');
const deleteNonEssentialFiles = require('./helpers/delete-nonessential-files')
const findInFiles = require('find-in-files');
const { modifyJsonFile } = require('modify-json-file');
const replace = require('replace');
const packages = require('../submodule/package.json').workspaces.map((package) => {
  return package.split('/')[1];
});

async function execute() {
  await deleteNonEssentialFiles();
  await modifyPackageFiles();
  await replacePackageReferences();
  return replaceKoopCoreRefs();
}

async function modifyPackageFiles() {
  console.log('   - modifying package.json files');

  const packageFiles = packages.map(package => path.join(__dirname, '..', 'submodule', 'packages', package, 'package.json') )
  for (let i = 0; i < packageFiles.length; i++) {
    const packageFile = require(packageFiles[i]);
    const name = packageFile.name.replace('@koopjs/', '').replace('koop-', '');
    const buildDest = `../../customdata/framework/${name}`;
    const dependencies = stripKoopDeps(packageFile.dependencies);

    await modifyJsonFile(
      packageFiles[i],
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
        scripts: {
          // clean: `shx rm -rf ${buildDest} && shx rm package-lock.json`,
          // build: generateBuildCmd(buildDest, dependencies),
        },
      },
      { ifFieldIsMissing: 'skip' },
    );
  }
}

function generateBuildCmd(buildDest, dependencies) {
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

async function replacePackageReferences() {
  console.log(
    '   - replacing references to monorepo packages with relative paths',
  );

  for (let i = 0; i < packages.length; i++) {
    const found = await findInFiles.find(
      /@koopjs\/[a-z-]+/,
      path.join(__dirname, '..', 'submodule', 'packages', packages[i]),
      '.js$',
    );

    Object.entries(found).forEach(([filePathForReplacement, { matches }]) => {
      const targetPackages = matches.map((referencedPackage) => {
        return referencedPackage.replace('@koopjs/', 'packages/');
      });

      const from = path.dirname(filePathForReplacement);

      targetPackages.forEach((targetPackage, j) => {
        const to = path.join(__dirname, '..', 'submodule', targetPackage);
        const relPath = path.relative(from, to);

        replace({
          regex: matches[j],
          replacement: relPath,
          paths: [filePathForReplacement],
          recursive: false,
          silent: true,
        });
      });
    });
  }
}

async function replaceKoopCoreRefs() {
  console.log('   - replacing koop-core references in demo and e2e test files');
  const directories = ['test', 'demo'];
  for (let i = 0; i < directories.length; i++) {
    const found = await findInFiles.find(
      '@koopjs/koop-core',
      path.join(__dirname, '..', 'submodule', directories[i]),
      '.js$',
    );

    Object.entries(found).forEach(([filePathForReplacement, { matches }]) => {
      const targetPackages = matches.map((referencedPackage) => {
        return referencedPackage.replace('@koopjs/koop-core', 'packages/core');
      });

      const from = path.dirname(filePathForReplacement);

      targetPackages.forEach((targetPackage, j) => {
        const to = path.join(__dirname, '..', 'submodule', targetPackage);
        const relPath = path.relative(from, to);

        replace({
          regex: matches[j],
          replacement: relPath,
          paths: [filePathForReplacement],
          recursive: false,
          silent: true
        });
      });
    });
  }
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
