const runE2ETests = require('./run-e2e-tests');
const child_process = require('child_process');

jest.mock('child_process')
child_process.exec.mockImplementation((cmd, cb) => {
  cb()
});

describe('run-e2e-tests', () => {
  afterEach(() => {
    jest.resetAllMocks();
  })
  
  test('should npm install and run e2e tests', async () => {
    await runE2ETests();
    expect(child_process.exec.mock.calls[0][0]).toBe('cd submodule && npm install');
    expect(child_process.exec.mock.calls[1][0]).toBe('cd submodule && npm run test:e2e');
  });

  test('should npm install and throw error on failed e2e tests', async () => {
    child_process.exec.mockImplementationOnce((cmd, cb) => {
      cb();
    }).mockImplementationOnce((cmd, cb) => {
      cb(new Error('failed test'));
    });
    try {
      await runE2ETests();
      throw new Error('should have thrown');
    } catch (err) {
      expect(child_process.exec.mock.calls[0][0]).toBe('cd submodule && npm install');
      expect(child_process.exec.mock.calls[1][0]).toBe('cd submodule && npm run test:e2e');
      expect(err.message).toBe('\nE2E TEST(S) FAILED: Something went wrong with branch modification for CDF.')
    }
  });
});
