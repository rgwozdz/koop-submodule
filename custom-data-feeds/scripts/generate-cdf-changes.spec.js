const manageBranch = require('./generate-cdf-changes');
const { simpleGit } = require('simple-git');
const yargs = require('yargs');
const yargsHelpers = require('yargs/helpers')
const fs = require('fs-extra');
const helpers = require('./helpers');
jest.mock('simple-git');
jest.mock('./helpers');
jest.mock('fs-extra');
jest.mock('yargs');
jest.mock('yargs/helpers');

let gitMock;

describe('generate-cdf-changes', () => {
  beforeEach(() => {
    gitMock = {
      clean: jest.fn(),
      reset: jest.fn(),
      pull: jest.fn(),
      checkout: jest.fn(),
      branchLocal: jest.fn(() => {
        return { all: ['master'] }
      }),
      deleteLocalBranch: jest.fn()
    }
    helpers.modifyPackageFiles.mockResolvedValue();
    helpers.deleteNonEssentialFiles.mockResolvedValue();
    helpers.replaceInternalPackageReferences.mockResolvedValue();
    helpers.replaceCorePackageReferencesInTests.mockResolvedValue();
    helpers.runE2ETests.mockResolvedValue();
    
    fs.copy.mockResolvedValue();
    yargsHelpers.hideBin.mockReturnValue();
    yargs.mockReturnValue({ argv: { ['branch-point']: undefined } });
    
    simpleGit.mockImplementation((options) => {
      return gitMock;
    });
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  })
  
  test('should branch master of submodule', async () => {
    await manageBranch();
    expect(gitMock.clean.mock.calls[0]).toEqual(['f']);
    expect(gitMock.reset.mock.calls[0]).toEqual(['hard']);

    expect(gitMock.checkout.mock.calls[0]).toEqual(['master']);
    expect(gitMock.reset.mock.calls[1]).toEqual(['hard', ['origin/master']]);
    expect(gitMock.pull.mock.calls[0]).toEqual([]);

    expect(gitMock.checkout.mock.calls[1]).toEqual([['-b', 'cdf-modifications', 'master']]);

    expect(helpers.modifyPackageFiles.mock.calls.length).toEqual(1);
    expect(helpers.deleteNonEssentialFiles.mock.calls.length).toEqual(1);
    expect(helpers.replaceInternalPackageReferences.mock.calls.length).toEqual(1);
    expect(helpers.replaceCorePackageReferencesInTests.mock.calls.length).toEqual(1);

    expect(helpers.runE2ETests.mock.calls.length).toEqual(1);

    expect(fs.copy.mock.calls.length).toEqual(2);
  })

  test('should branch specific tag of submodule', async () => {
    yargs.mockReturnValue({ argv: { ['branch-point']: 'koop-tag' } });
    await manageBranch();
    expect(gitMock.clean.mock.calls[0]).toEqual(['f']);
    expect(gitMock.reset.mock.calls[0]).toEqual(['hard']);

    expect(gitMock.checkout.mock.calls[0]).toEqual([['-b', 'cdf-modifications', 'koop-tag']]);

    expect(helpers.modifyPackageFiles.mock.calls.length).toEqual(1);
    expect(helpers.deleteNonEssentialFiles.mock.calls.length).toEqual(1);
    expect(helpers.replaceInternalPackageReferences.mock.calls.length).toEqual(1);
    expect(helpers.replaceCorePackageReferencesInTests.mock.calls.length).toEqual(1);

    expect(helpers.runE2ETests.mock.calls.length).toEqual(1);

    expect(fs.copy.mock.calls.length).toEqual(2);
  })

  test('should clean-up old branch', async () => {
    const branchLocal = jest.fn(async () => {
      return { all: ['master', 'cdf-modifications']}
    });

    simpleGit.mockImplementationOnce((options) => {
      return { ...gitMock, branchLocal };
    });
    await manageBranch();
    expect(gitMock.clean.mock.calls[0]).toEqual(['f']);
    expect(gitMock.reset.mock.calls[0]).toEqual(['hard']);

    expect(gitMock.checkout.mock.calls[0]).toEqual(['master']);
    expect(gitMock.deleteLocalBranch.mock.calls[0]).toEqual(['cdf-modifications'])
    
    expect(gitMock.checkout.mock.calls[1]).toEqual(['master']);
    expect(gitMock.reset.mock.calls[1]).toEqual(['hard', ['origin/master']]);
    expect(gitMock.pull.mock.calls[0]).toEqual([]);

    expect(gitMock.checkout.mock.calls[2]).toEqual([['-b', 'cdf-modifications', 'master']]);
    expect(helpers.modifyPackageFiles.mock.calls.length).toEqual(1);
    expect(helpers.deleteNonEssentialFiles.mock.calls.length).toEqual(1);
    expect(helpers.replaceInternalPackageReferences.mock.calls.length).toEqual(1);
    expect(helpers.replaceCorePackageReferencesInTests.mock.calls.length).toEqual(1);

    expect(helpers.runE2ETests.mock.calls.length).toEqual(1);

    expect(fs.copy.mock.calls.length).toEqual(2);
  })
});
