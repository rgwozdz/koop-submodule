const replaceInternalPackageReferences = require('./replace-internal-package-references');
const findInFiles = require('find-in-files');
const replace = require('replace');
const path = require('path');

jest.mock('path');
path.join
  .mockReturnValueOnce('path/to/package/featureserver')
  .mockReturnValueOnce('path/to/package/logger');

jest.mock('find-in-files');
findInFiles.find.mockResolvedValue({
  'path/to/package/featureserver/src/logger/index.js': {
    matches: [
      '@koopjs/logger'
    ]
  }
});

jest.mock('replace');
replace.mockReturnValue();

describe('replace-internal-package-references', () => {
  beforeEach(() => {
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  })
  
  test('should modify', async () => {
    const packages = ['core']
    await replaceInternalPackageReferences(packages);
    expect(findInFiles.find.mock.calls[0]).toEqual([
      /@koopjs\/[a-z-]+/,
      'path/to/package/featureserver',
      '.js$'
    ]);
    expect(replace.mock.calls[0]).toEqual([{
      paths: ['path/to/package/featureserver/src/logger/index.js'],
      recursive: false,
      regex: '@koopjs/logger',
      recursive: false,
      silent: true
    }])
  });
});
