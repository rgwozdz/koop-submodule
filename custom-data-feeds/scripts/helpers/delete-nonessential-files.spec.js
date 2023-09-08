const deleteNonEssentialFiles = require('./delete-nonessential-files');
const klaw = require('klaw-sync');
const del = require('del');
const path = require('path');

jest.mock('path');
path.join
  .mockReturnValueOnce('path/to/package/featureserver')

jest.mock('klaw-sync');
klaw.mockImplementationOnce((path, {filter}) => {
  const paths = [
    { path: 'path/to/package/featureserver/test' },
    { path: 'path/to/package/featureserver/test/some/file' },
    { path: 'path/to/package/featureserver/src/some/file'}
  ];

  return paths.filter(filter);
}).mockImplementationOnce((path, {filter}) => {
  const paths = [
    { path: 'path/to/package/featureserver/src/some/file' },
    { path: 'path/to/package/featureserver/src/some/file.spec.js' },
    { path: 'path/to/package/featureserver/src/README.md' },
    { path: 'path/to/package/featureserver/other' }
  ];
  return paths.filter(filter);
});;

jest.mock('del');
del.mockResolvedValue();

describe('delete-nonessential-files', () => {
  beforeEach(() => {
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  })
  
  test('should delete files', async () => {
    const packages = ['featureserver']
    await deleteNonEssentialFiles(packages);
    expect(klaw.mock.calls[0][0]).toBe(
      'path/to/package/featureserver'
    );
    expect(del.mock.calls[0]).toEqual([['path/to/package/featureserver/test']]);
    expect(del.mock.calls[1]).toEqual([['path/to/package/featureserver/src/some/file.spec.js', 'path/to/package/featureserver/other']]);
  });
});
