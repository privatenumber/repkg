const webpack = require('webpack');
const unpkgFs = require('./unpkg-fs');
const gotUnpkg = require('./got-unpkg');
const { Volume } = require('memfs');
const parseUnpkgPath = require('./parse-unpkg-path');

async function buildModule(entry) {

	// Check UNPKG
	const fetchedPkg = await gotUnpkg(entry);
	if (fetchedPkg.statusCode !== 200) {
		throw new Error(`${fetchedPkg.statusCode} - Error fetching module "${entry}"`);
	}

	const { moduleName, filePath } = parseUnpkgPath(fetchedPkg.url);

	const compiler = webpack({
		mode: 'production',
		context: '/',
		entry: filePath,
		output: {
			filename: 'index.js',
			path: '/dist/',
			libraryTarget: 'umd',
		},
		resolve: {
			alias: {
				crypto: 'crypto-browserify',
			},
			extensions: [/* extensions resolved by unpkg */],
		},
		optimization: {
			// Too slow
			minimize: false,

			// https://github.com/webpack/webpack/issues/10347#issuecomment-598054933
			usedExports: false,
		},

		plugins: [
			// https://github.com/webpack/changelog-v5/blob/master/README.md#automatic-nodejs-polyfills-removed
			new webpack.ProvidePlugin({
				process: ['process/browser'],
			}),
		],
	});

	const fs = unpkgFs({
		moduleName,
		moduleBuilder: buildModule,
	});

	compiler.inputFileSystem = fs; // eslint-disable-line no-param-reassign

	const outputFs = new Volume();
	compiler.outputFileSystem = outputFs; // eslint-disable-line no-param-reassign

	return new Promise((resolve, reject) => {
		compiler.run((err, stats) => {
			if (err) {
				return reject(err);
			}

			if (stats.hasErrors()) {
				return reject(stats.toJson());
			}

			resolve({
				warnings: stats.hasWarnings() && stats.toJson().warnings,
				built: outputFs.readFileSync('/dist/index.js').toString(),
			});
		});
	});
}

module.exports = buildModule;