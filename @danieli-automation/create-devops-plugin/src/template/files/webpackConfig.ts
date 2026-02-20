/**
 * Generates the webpack root config template entry.
 */
export function webpackConfigFile(): [string, string] {
  return [
    "webpack.config.cjs",
    `const { createAppConfig } = require("./config/webpack/app.cjs");

module.exports = (env = {}) => {
  const configEnv = env.ENV || process.env.ENV;
  return [createAppConfig(configEnv)];
};
`
  ];
}
