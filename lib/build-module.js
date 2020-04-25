const webpack = require('webpack');
const { Volume } = require('memfs');
const Keyv = require('keyv');
const unpkgFs = require('./unpkg-fs');
const gotUnpkg = require('./got-unpkg');
const parseUnpkgPath = require('./parse-unpkg-path');


const cache = new Keyv({
	namespace: 'compile',
	store: new Map(),
	ttl: 1000 * 60 * 60,
});

async function compile(entry) {

	// TODO: WIth aliasing, this preliminary check is better left to unpkg-fs
	// Check UNPKG
	const fetchedPkg = await gotUnpkg(entry);

	if (fetchedPkg.statusCode !== 200) {
		throw new Error(`${fetchedPkg.statusCode} - Error fetching module "${entry}"`);
	}

	const { moduleName, filePath } = parseUnpkgPath(fetchedPkg.url);

	const cacheKey = [moduleName, filePath].join('-');

	const cacheHit = await cache.get(cacheKey);
	if (cacheHit) {
		console.log('[Cache hit]', cacheKey);
		return cacheHit;
	}

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
		moduleBuilder: buildModule,
	});

	const outputFs = new Volume();
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
				warnings: stats.hasWarnings() && stats.toJson().warnings,
				built: outputFs.readFileSync('/dist/index.js').toString(),
			});
		});
	});

	cache.set(cacheKey, data);

	return data;
}

const isResolved = $ => Promise.race([
    $,
    Promise.resolve()
]).then(_ => !!_);

const currentBuilds = new Map();
setInterval(async () => {
	const builds = Array.from(currentBuilds);
	const logMsg = await Promise.all(builds.map(async b => {
		return [b[0], await isResolved(b[1])];
	}));
	console.log(logMsg);
}, 1000)
function buildModule(entry) {
	if (currentBuilds.has(entry)) {
		console.log('Collision', entry);
		return currentBuilds.get(entry);
	}

	const build = compile(entry);
	currentBuilds.set(entry, build);

	build.then(() => {
		// console.log('Deleting', entry);
		// currentBuilds.delete(entry);
	});

	return build;
}

module.exports = buildModule;