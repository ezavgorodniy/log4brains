const path = require("path");
const fs = require("fs");

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true"
});

const packageJson = require(`${
  fs.existsSync(path.join(__dirname, "package.json")) ? "./" : "../"
}package.json`);

module.exports = withBundleAnalyzer({
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: true,
  serverRuntimeConfig: {
    PROJECT_ROOT: __dirname, // https://github.com/vercel/next.js/issues/8251
    VERSION: process.env.HIDE_LOG4BRAINS_VERSION ? "" : packageJson.version
  },
  webpack(config, { webpack, buildId }) {
    // For cache invalidation purpose (thanks https://github.com/vercel/next.js/discussions/14743)
    config.plugins.push(
      new webpack.DefinePlugin({
        "process.env.NEXT_BUILD_ID": JSON.stringify(buildId)
      })
    );

    // To avoid issues with fsevents during the build, especially on macOS
    config.externals.push("chokidar");

    return config;
  },
  future: {
    excludeDefaultMomentLocales: true
  }
});
