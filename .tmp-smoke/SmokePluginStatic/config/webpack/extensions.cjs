const path = require("path");
const { createCommonConfig } = require("./common.cjs");

function createExtensionsConfig(env) {
  const isDev = env === "dev";

  return createCommonConfig({
    env,
    name: "extensions",
    entry: {
      "delete-wi-with-children/index": "./src/extensions/delete-wi-with-children/index.ts"
    },
    outputPath: path.resolve(__dirname, "../../dist/extensions"),
    publicPath: isDev ? "/extensions/" : "./",
    withDevServer: false,
    copyPatterns: [
      {
        from: "src/extensions/delete-wi-with-children/index.html",
        to: "delete-wi-with-children/index.html"
      }
    ]
  });
}

module.exports = { createExtensionsConfig };
