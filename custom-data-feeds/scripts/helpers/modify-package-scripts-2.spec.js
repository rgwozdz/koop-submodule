
describe('modify-package-scripts', () => {
  const modifyPackageScripts = require('./modify-package-scripts');
  const fs = require('fs-extra');
  const path = require('path');
  const pkg = require('path/to/core/package.json');
  const util = require('modify-json-file');
  
  jest.mock('modify-json-file');
  util.modifyJsonFile.mockResolvedValue({
    foo: 'bar'
  });
  
  jest.mock('path');
  path.join.mockReturnValue('path/to/core/package.json');
  
  jest.mock('path/to/core/package.json',
    () => {
      return { dependencies: {} };
    },
  { virtual: true }
  );
  
  jest.mock('fs-extra');
  fs.readdir.mockResolvedValue(['core']);
  
  test('should modify without node_modules copy', async () => {
    await modifyPackageScripts('path/to', '../../other/path');
    expect(util.modifyJsonFile.mock.calls[0]).toEqual([
      'path/to/core/package.json', {
        scripts: {
          "build": "shx mkdir ../../other/path/core && shx cp package.json ../../other/path/core && shx cp -r ./src ../../other/path/core",
          "clean": "shx rm -rf ../../other/path/core && shx rm package-lock.json"
        },
      },
      { ifFieldIsMissing: 'skip' }
    ]);
  });
});