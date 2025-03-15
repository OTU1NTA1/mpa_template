import CopyPlugin from "copy-webpack-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";
import fs from "fs";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import { dirname, resolve } from "path";
import postcssPresetEnv from "postcss-preset-env";
import TerserPlugin from "terser-webpack-plugin";
import { fileURLToPath } from "url";
import pkg, * as webpack from "webpack";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";
import "webpack-dev-server"; // dont remove this import, it's for webpack-dev-server type
const { DefinePlugin } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

const COMPRESS = isProduction ? true : false;

const OUT_DIR = "../public";

const getEntriesByParsingTemplateNames = (
  templatesFolderName,
  atRoot = true
) => {
  const folderPath = resolve(__dirname, `./src/${templatesFolderName}`);
  const entryObj = {};
  const templateRegx = /(.*)(\.)(ejs|html)/g;
  fs.readdirSync(folderPath).forEach((o) => {
    if (!o.match(templateRegx)) return;
    let entryName = o.replace(templateRegx, `$1`);
    const entryRegex = /(.*)(\.)(.*)/g;
    if (entryName.match(entryRegex)) {
      entryName = entryName.replace(entryRegex, `$3`);
    }

    const entryDependency = atRoot
      ? entryName
      : `${templatesFolderName}/${entryName}`;

    let entryPath = resolve(
      __dirname,
      `src/app/${entryDependency}.js`
    );
    // entry stylesheet
    let entryStyleSheetPath = resolve(
      __dirname,
      `./src/scss/${entryDependency}.scss`
    );

    entryPath = fs.existsSync(entryPath) ? entryPath : undefined;
    entryStyleSheetPath = fs.existsSync(entryStyleSheetPath)
      ? entryStyleSheetPath
      : undefined;

    // import es6-promise and scss util automatically
    entryObj[entryName] = [
      "es6-promise/auto",
      entryPath,
      "./src/scss/reset.scss",
      entryStyleSheetPath,
    ].filter(function (x) {
      return x !== undefined;
    });
  });
  return entryObj;
};

const getTemaplteInstancesByParsingTemplateNames = (
  templatesFolderName,
  atRoot = true
) => {
  const forderPath = resolve(__dirname, `./src/${templatesFolderName}`);
  return fs
    .readdirSync(forderPath)
    .map((fullFileName) => {
      const templateRegx = /(.*)(\.)(ejs|html)/g;
      const ejsRegex = /(.*)(\.ejs)/g;
      const entryRegex = /(.*)(\.)(.*)(\.)(ejs|html)/g;
      if (!fullFileName.match(templateRegx)) return;
      const isEjs = fullFileName.match(ejsRegex);
      let outputFileName = fullFileName.replace(templateRegx, `$1`);
      let entryName = outputFileName;
      if (fullFileName.match(entryRegex)) {
        outputFileName = fullFileName.replace(entryRegex, `$1`);
        entryName = fullFileName.replace(entryRegex, `$3`);
      }
      const ejsFilePath = resolve(forderPath, `${fullFileName}`);
      const data = fs.readFileSync(ejsFilePath, "utf8");
      if (!data) {
        fs.writeFile(ejsFilePath, " ", () => { });
        console.warn(`WARNING : ${fullFileName} is an empty file`);
      }

      return new HtmlWebpackPlugin({
        cache: false,
        chunks: [entryName],
        filename: `${atRoot ? "" : templatesFolderName + "/"
          }${outputFileName}.html`,
        template: isEjs
          ? ejsFilePath
          : ejsFilePath.replace(ejsRegex, `$1.html`),
        favicon: "src/assets/images/logo.svg",
        minify: COMPRESS
          ? {
            collapseWhitespace: true,
            keepClosingSlash: true,
            removeComments: true,
            removeRedundantAttributes: false,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true,
          }
          : false,
      });
    })
    .filter(function (x) {
      return x !== undefined;
    });
};

const pageEntries =
  getEntriesByParsingTemplateNames("pages");
//generate htmlWebpackPlugin instances
const pageEntryTemplates =
  getTemaplteInstancesByParsingTemplateNames("pages");

const config = (env, argv) => {
  const configObj = {
    entry: pageEntries,
    output: {
      filename: "assets/js/[name].[chunkhash:8].js",
      chunkFilename: "[id].[chunkhash:8].js",
      path: resolve(__dirname, OUT_DIR),
      chunkLoadingGlobal: 'self.vendor',
      clean: true,
    },
    target: ["web", "es5"],
    devServer: {
      historyApiFallback: true,
      open: true,
      compress: true,
      watchFiles: [
        "src/app/*.js",
        "src/app/**/*.js",
        "src/scss/*.scss",
        "src/scss/**/*.scss",
        "src/pages/*.html",
        "src/template/*.html",
        "src/template/**/*.html",
        "src/pages/*.ejs",
        "src/template/*.ejs",
        "src/template/**/*.ejs",
      ], // this is important
      port: 8080,
    },
    mode: isProduction ? 'production' : 'development',
    module: {
      rules: [
        {
          test: /\.html$/,
          use: [
            {
              loader: "html-loader",
              options: {
                minimize: COMPRESS,
              },
            },
          ],
        },
        {
          test: /\.ejs$/,
          use: [
            {
              loader: "html-loader",
              options: {
                minimize: COMPRESS,
              },
            },
            {
              loader: "template-ejs-loader",
              options: {
                data: {
                  mode: argv.mode,
                },
              },
            },
          ],
        },
        {
          test: /\.(jpe?g|png|gif|svg)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/images/[name][ext]",
          },
        },
        {
          test: /\.(sass|scss|css)$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                publicPath: "../",
              },
            },
            "css-loader",
            {
              loader: "postcss-loader",
              options: {
                postcssOptions: {
                  ident: "postcss",
                  plugins: [postcssPresetEnv()],
                },
              },
            },
            (() => {
              return COMPRESS
                ? "sass-loader"
                : {
                  loader: "sass-loader",
                  options: {

                    sourceMap: true,
                    sassOptions: { minimize: false, outputStyle: "expanded" },
                  },
                };
            })(),
          ],
        },
        {
          test: /\.(woff(2)?|eot|ttf|otf)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/fonts/[name][ext]",
          },
        },
      ],
    },
    resolve: {
      extensions: [".js", ".jsx", "json"],
      alias: {
        "@img": resolve(__dirname, "./src/assets/images/"),
        "@font": resolve(__dirname, "./src/assets/fonts/"),
      },
    },
    optimization: {
      minimize: COMPRESS,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
          },
          test: /\.js(\?.*)?$/i,
          extractComments: false,
        }),
        new CssMinimizerPlugin(),
      ],
      splitChunks: { name: "vendor", chunks: "all" },
    },
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    plugins: [
      new DefinePlugin({
        "PROCESS.MODE": JSON.stringify(argv.mode),
      }),
      new MiniCssExtractPlugin({
        filename: "assets/css/[name].css",
      }),
      (() => {
        if (argv.mode == "production") {
          return new BundleAnalyzerPlugin();
        } else {
          return undefined;
        }
      })(),

      new CopyPlugin({
        patterns: [
          {
            from: "src/static",
            to: "assets/static",
            globOptions: {
              dot: true,
              ignore: ["**/.DS_Store", "**/.gitkeep"],
            },
            noErrorOnMissing: true,
          },
          {
            from: "src/assets/images",
            to: "assets/images",
            globOptions: {
              dot: true,
              ignore: ["**/.DS_Store", "**/.gitkeep"],
            },
            noErrorOnMissing: true,
          },
        ],
      }),
      ...pageEntryTemplates,
    ].filter(function (x) {
      return x !== undefined;
    }),
  };
  return configObj;
};

export default config;
