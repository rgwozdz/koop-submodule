const replaceCorePackageReferences = require('./replace-core-package-references-in-tests');
const findInFiles = require('find-in-files');
const replace = require('replace');
const path = require('path');

jest.mock('path');
path.join
  .mockReturnValueOnce('path/to/test')
  .mockReturnValueOnce('path/to/package/core');

jest.mock('find-in-files');
findInFiles.find.mockResolvedValue({
  'path/to/test/some.spec.js': {
    matches: [
      '@koopjs/koop-core'
    ]
  }
});

jest.mock('replace')
replace.mockReturnValue()

describe('replace-core-package-references', () => {
  beforeEach(() => {
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  })
  
  test('should modify', async () => {
    await replaceCorePackageReferences();
    expect(findInFiles.find.mock.calls[0]).toEqual([
      '@koopjs/koop-core',
      'path/to/test',
      '.js$'
    ]);
    expect(replace.mock.calls[0]).toEqual([{
      paths: ['path/to/test/some.spec.js'],
      recursive: false,
      regex: '@koopjs/koop-core',
      recursive: false,
      silent: true
    }])
  });
});
