module.exports = {
    transform: {'^.+\\.ts?$': 'ts-jest'},
    testEnvironment: 'node',
    testRegex: 'test/.*Test.ts',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleDirectories: ['node_modules', 'src', 'const', 'test'],
    modulePaths: ['<rootDir>'],
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/src/"
    }
  };