const path = require('path');
const fs = require('fs-extra');
const findInFiles = require('find-in-files');
const replace = require('replace');

async function replaceKoopCoreRefs() {
  console.log('   - replacing koop-core references in demo and e2e test files');
  const directories = ['test', 'demo'];
  for (let i = 0; i < directories.length; i++) {
    const found = await findInFiles.find(
      '@koopjs/koop-core',
      path.join(__dirname, '..', '..','submodule', directories[i]),
      '.js$',
    );

    Object.entries(found).forEach(([filePathForReplacement, { matches }]) => {
      const targetPackages = matches.map((referencedPackage) => {
        return referencedPackage.replace('@koopjs/koop-core', 'packages/core');
      });

      const from = path.dirname(filePathForReplacement);

      targetPackages.forEach((targetPackage, j) => {
        const to = path.join(__dirname, '..', '..','submodule', targetPackage);
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

module.exports = replaceKoopCoreRefs;
