const path = require("path");
const webpack = require("webpack");
const metadata = require("./metadata");
const UserScriptMetaDataPlugin = require("userscript-metadata-webpack-plugin");

const baseConfig = (metadata) => ({
  resolve: {
    modules: ["node_modules"],
    extensions: [".ts", ".js"],
  },
  optimization: {
    minimize: false,
  },
  entry: {
    svgToDesmos: path.resolve(__dirname, "../src/index.ts"),
  },
  output: {
    filename: "[name].user.js",
    path: path.resolve(__dirname, "../dist"),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: ["ts-loader"],
      },
    ],
  },
  plugins: [
    new webpack.ids.HashedModuleIdsPlugin({
      context: __dirname,
    }),
    new UserScriptMetaDataPlugin({ metadata }),
  ],
});

module.exports = (env, argv) => {
  if (argv.mode === "development") {
    metadata.require.push(
      "file://" + path.resolve(__dirname, "../dist/svgToDesmos.user.js")
    );
    metadata.name += "-dev";
  }
  const config = baseConfig(metadata);
  if (argv.mode === "development") {
    config.watch = true;
    config.watchOptions = {
      ignored: /node_modules/,
    };
    config.entry["svgToDesmos-dev"] = path.resolve(__dirname, "./empty.js");
  }
  return config;
};
