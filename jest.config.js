module.exports = {
  preset: "ts-jest",
  setupFilesAfterEnv: [
    "<rootDir>/src/initTestProviders.ts"
  ]
};
