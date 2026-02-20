/**
 * Generates the app webpack config template entry.
 */
export function webpackAppConfigFile(): [string, string] {
  return [
    "config/webpack/app.cjs",
    `const path = require("path");
     const { createCommonConfig } = require("./common.cjs");

      function createAppConfig(env) {
        const isDev = env === "dev";

        return createCommonConfig({
          env,
          name: "app",
          entry: { app: "./src/app/App.tsx" },
          outputPath: path.resolve(__dirname, "../../dist/app"),
          publicPath: isDev ? "/app/" : "./",
          withDevServer: true,
          copyPatterns: [
            { from: "src/app/App.html", to: "App.html" },
            { from: "static/images", to: "static/images", noErrorOnMissing: true },
            { from: "static/fonts", to: "static/fonts", noErrorOnMissing: true }
          ]
        });
      }

      module.exports = { createAppConfig };
      `
  ];
}
