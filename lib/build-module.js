const webpack = require('webpack');
const { Volume } = require('memfs');
const Keyv = require('keyv');
const unpkgFs = require('./unpkg-fs');
const gotUnpkg = require('./got-unpkg');
const parseUnpkgPath = require('./util/parse-unpkg-path');
const consolidatePromises = require('./util/consolidate-promises');

const cache = new Keyv({
	namespace: 'compile',
	store: new Map(),
	ttl: 1000 * 60 * 60,
});

async function getEntry(moduleName) {
	const pkg = await gotUnpkg(moduleName);
	return parseUnpkgPath(pkg.url).filePath;
}


async function compile(
	moduleName,
	{
		entry,
		output
	} = {}
) {

	if (!entry) {
		entry = await getEntry(moduleName);
	}

	// Needs to be absolute
	if (!(/^[\.\/]/.test(entry))) {
		entry = '/' + entry;
	}

	// TODO: WIth aliasing, this preliminary check is better left to unpkg-fs
	// Check UNPKG
	// const fetchedPkg = await gotUnpkg(entry);

	// if (fetchedPkg.statusCode !== 200) {
	// 	throw new Error(`${fetchedPkg.statusCode} - Error fetching module "${entry}"`);
	// }

	// const { moduleName, filePath } = parseUnpkgPath(fetchedPkg.url);

	console.log({
		moduleName,
		entry,
		output,
	});

	const cacheKey = [moduleName, entry, JSON.stringify(output)].join('-');

	const cacheHit = await cache.get(cacheKey);
	if (cacheHit) {
		console.log('[Cache hit]', cacheKey);
		return cacheHit;
	}

	const compiler = webpack({
		mode: 'production',
		context: '/',
		entry,
		output: {
			// Ovewritable
			libraryTarget: 'umd',

			...output,

			// Non-overwritable
			filename: 'index.js',
			path: '/dist/', // Remove
		},
		resolve: {
			alias: {
				// https://github.com/webpack/node-libs-browser/blob/master/package.json#L10
				events: 'events@^3.0.0',
				process: 'process@^0.11.10',
				crypto: 'crypto-browserify@^3.11.0',
				vm: 'vm-browserify@^1.1.2',
				// zlib: 'browserify-zlib@0.2.0',
				// tty: 'tty-browserify@0.0.0',
				buffer: 'buffer@^4.9.2',
				stream: 'stream-browserify@^2.0.2',
				// http: 'stream-http@2.7.2',
				// https: 'https-browserify@1.0.0',
				// console: 'console-browserify@1.1.0',
				// constants: 'constants-browserify@1.0.0',
				// _stream_duplex: 'readable-stream@2.3.3/duplex.js',
				// 'readable-stream@2.3.3'
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

	compiler.inputFileSystem = unpkgFs({
		moduleName,
		moduleBuilder: module.exports,
	});

	const outputFs = new Volume(); // Remove
	compiler.outputFileSystem = outputFs; // eslint-disable-line no-param-reassign

	const data = await new Promise((resolve, reject) => {
		compiler.run((err, stats) => {
			if (err) {
				return reject(err);
			}

			if (stats.hasErrors()) {
				return reject(stats.toJson());
			}

			resolve({
				warnings: stats.hasWarnings() ? stats.toJson().warnings : [],
				code: outputFs.readFileSync('/dist/index.js'),
			});
		});
	});

	cache.set(cacheKey, data);

	return data;
}

module.exports = consolidatePromises(compile);