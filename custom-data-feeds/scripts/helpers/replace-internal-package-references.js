const path = require('path');
const findInFiles = require('find-in-files');
const replace = require('replace');

async function replacePackageReferences(packages) {
  console.log(
    '   - replacing references to monorepo packages with relative paths',
  );

  for (let i = 0; i < packages.length; i++) {
    const found = await findInFiles.find(
      /@koopjs\/[a-z-]+/,
      path.join(__dirname, '..', '..', 'submodule', 'packages', packages[i]),
      '.js$',
    );

    Object.entries(found).forEach(([filePathForReplacement, { matches }]) => {
      const targetPackages = matches.map((referencedPackage) => {
        return referencedPackage.replace('@koopjs/', 'packages/');
      });

      const from = path.dirname(filePathForReplacement);

      targetPackages.forEach((targetPackage, j) => {
        const to = path.join(__dirname, '..', '..', 'submodule', targetPackage);
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

module.exports = replacePackageReferences;
