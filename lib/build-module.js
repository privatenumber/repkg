const webpack = require('webpack');
const { Volume } = require('memfs');
const Keyv = require('keyv');
const UnpkgFs = require('unpkg-fs');
const gotUnpkg = require('unpkg-fs/lib/got-unpkg');
const externalizePackages = require('./externalize-packages');
const TerserPlugin = require('terser-webpack-plugin');

const cache = new Keyv({
	namespace: 'buildModule',
	store: new Map(),
	ttl: 1000 * 60 * 60,
});

async function buildModule(
	moduleName,
	{
		entry,
		options = {}
	} = {}
) {
	// const { resUrlParsed } = await gotUnpkg(moduleName);

	// moduleName = resUrlParsed.pkgId;

	// if (!entry) {
	// 	entry = resUrlParsed.filePath
	// }

	// // Entry needs to be absolute
	// else if (!(/^[\.\/]/.test(entry))) {
	// 	entry = '/' + entry;
	// }

	const cacheKey = [moduleName, entry, JSON.stringify(options)].join('-');
	const cacheHit = await cache.get(cacheKey);

	if (cacheHit) {
		console.log('[Cache hit]', cacheKey);
		return cacheHit;
	}

	const unpkgFs = new UnpkgFs(moduleName);

	const compiler = webpack({
		mode: 'production',
		context: '/',
		entry,
		output: {
			library: options.name || moduleName.split('@')[0],
			libraryTarget: options.type || 'umd',
			filename: 'index.js',
			path: '/',
		},

		externals: [
			externalizePackages(unpkgFs),
		],

		resolve: {
			extensions: [/* extensions resolved by unpkg */],
		},
		optimization: {
			// https://github.com/webpack/webpack/issues/10347#issuecomment-598054933
			usedExports: false,

			minimize: options.min,
			minimizer: [
				new TerserPlugin({
					// https://terser.org/docs/api-reference.html#terser-fast-minify-mode
					terserOptions: {
						compress: false,
						mangle: true,
					},
					extractComments: false,
				}),
			],
		},

		plugins: [
			// https://github.com/webpack/changelog-v5/blob/master/README.md#automatic-nodejs-polyfills-removed
			new webpack.ProvidePlugin({
				process: ['process/browser'],
				Buffer: ['buffer', 'Buffer'],
			}),
		],
	});

	compiler.inputFileSystem = unpkgFs;
	compiler.outputFileSystem = new Volume();

	const building = new Promise((resolve, reject) => {
		compiler.run((err, stats) => {
			if (err) {
				return reject(err);
			}

			if (stats.hasErrors()) {
				return reject(stats.toJson());
			}

			resolve({
				warnings: stats.hasWarnings() ? stats.toJson().warnings : [],
				code: '/* Built by REPKG */\n' + compiler.outputFileSystem.readFileSync('/index.js'),
			});
		});
	});

	building.then((built) => cache.set(cacheKey, built));

	return building;
}

module.exports = buildModule;
