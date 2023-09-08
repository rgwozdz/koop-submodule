const modifyPackageFiles = require('./modify-package-files');
const util = require('modify-json-file');
const path = require('path');
const pkg = require('path/to/core/package.json')

jest.mock('modify-json-file');
util.modifyJsonFile.mockResolvedValue({
  foo: 'bar'
});

jest.mock('path');
path.join.mockReturnValue('path/to/core/package.json');

const packageFixture = {
  name: '@koopjs/koop-core',
  dependencies: {
    '@koopjs/logger': '9.0',
    'other': '6.2.1'
  },
  devDependencies: { test: 'test/npm'},
  scripts: {
    build: 'something'
  },
  other: 'unaffected'
};

jest.mock('path/to/core/package.json',
  () => {
    return packageFixture
  },
  { virtual: true }
);
describe('modify-package-files', () => {
  beforeEach(() => {
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  })
  
  test('should modify', async () => {
    const packages = ['core']
    await modifyPackageFiles(packages);
    expect(util.modifyJsonFile.mock.calls[0]).toEqual([
      'path/to/core/package.json', {
        name: 'core',
        author: undefined,
        description: undefined,
        keywords: undefined,
        dependencies: {
          other: '6.2.1'
        },
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
      { ifFieldIsMissing: 'skip' }
    ]);
  });
});
