/**
 * Generates the shared webpack config template entry.
 */
export function webpackCommonConfigFile(): [string, string] {
  return [
    "config/webpack/common.cjs",
    `const path = require("path");
     const webpack = require("webpack");
     const CopyWebpackPlugin = require("copy-webpack-plugin");
     const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
     const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
     const ReactRefreshTypeScript = require("react-refresh-typescript").default;
     const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
     const dotenv = require("dotenv");

  dotenv.config({ path: path.resolve(__dirname, "../../.env") });

  function createCommonConfig({ env, name, entry, outputPath, publicPath, copyPatterns, withDevServer }) {
    const isServe = !!(process.env.WEBPACK_SERVE || process.env.WEBPACK_DEV_SERVER);
    const resolvedEnv = env || process.env.ENV || (isServe ? "dev" : "prod");
    const isDev = resolvedEnv === "dev" && isServe;
    const port = Number(process.env.PORT || 8080);

    const config = {
      name,
      target: "web",
      entry,
      output: {
        filename: "[name].js",
        path: outputPath,
        publicPath,
        clean: false
      },
      mode: isDev ? "development" : "production",
      devtool: isDev ? "inline-source-map" : "source-map",
      resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"],
        plugins: [
          new TsconfigPathsPlugin({
            configFile: path.resolve(__dirname, "../../tsconfig.json")
          })
        ]
      },
      module: {
        rules: [
          {
            test: /\\.tsx?$/,
            exclude: /node_modules/,
            use: [
              {
                loader: "ts-loader",
                options: {
                  transpileOnly: true,
                  getCustomTransformers: () => ({
                    before: isDev ? [ReactRefreshTypeScript()] : []
                  })
                }
              }
            ]
          },
          { test: /\\.css$/, use: ["style-loader", "css-loader"] },
          { test: /\\.scss$/, use: ["style-loader", "css-loader", "sass-loader"], exclude: /node_modules/ },
          { test: /\\.svg$/i, type: "asset/inline" },
          {
            test: /\\.(woff2?|eot|ttf|otf)$/i,
            type: "asset/resource",
            generator: { filename: "static/fonts/[name][ext]" }
          },
          {
            test: /\\.(png|jpe?g|gif|webp)$/i,
            type: "asset/resource",
            generator: { filename: "static/images/[name][ext]" }
          }
        ]
      },
      plugins: [
        new webpack.EnvironmentPlugin({
          ENV: resolvedEnv,
          HMR: isServe ? "true" : "false",
          PORT: String(port),
          SCOPE: process.env.SCOPE || "User"
        }),
        new CopyWebpackPlugin({ patterns: copyPatterns }),
        ...(isDev ? [new ReactRefreshWebpackPlugin({ overlay: false })] : []),
        ...(isDev ? [new ForkTsCheckerWebpackPlugin({ async: true })] : [])
      ]
    };

    if (withDevServer) {
      config.devServer = {
        server: { type: "https" },
        hot: true,
        liveReload: false,
        static: { directory: path.resolve(__dirname, "../../dist") },
        port,
        open: true,
        historyApiFallback: { index: "/app/App.html" },
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        },
        client: {
          overlay: { errors: true, warnings: false },
          webSocketURL: { protocol: "wss", hostname: "localhost", port }
        }
      };
    }

    return config;
  }

module.exports = { createCommonConfig };
`
  ];
}
