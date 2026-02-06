export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.ts', '.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  preset: undefined,
};
