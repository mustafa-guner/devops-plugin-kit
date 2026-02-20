const { createAppConfig } = require("./config/webpack/app.cjs");
const { createExtensionsConfig } = require("./config/webpack/extensions.cjs");

module.exports = (env = {}) => {
  const configEnv = env.ENV || process.env.ENV;
  return [createAppConfig(configEnv), createExtensionsConfig(configEnv)];
};
