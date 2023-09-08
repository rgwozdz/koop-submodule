module.exports = {
  modifyPackageFiles: require('./modify-package-files'),
  deleteNonEssentialFiles: require('./delete-nonessential-files'),
  replaceInternalPackageReferences: require('./replace-internal-package-references'),
  replaceCorePackageReferencesInTests: require('./replace-core-package-references-in-tests'),
  runE2ETests: require('./run-e2e-tests'),
  modifyPackageScripts: require('./modify-package-scripts')
};