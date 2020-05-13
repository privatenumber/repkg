const webpack = require('webpack');
const { Volume } = require('memfs');
const Keyv = require('keyv');
const UnpkgFs = require('unpkg-fs');
const gotUnpkg = require('unpkg-fs/lib/got-unpkg');

const cache = new Keyv({
	namespace: 'buildModule',
	store: new Map(),
	ttl: 1000 * 60 * 60,
});


const alias = {
	// https://github.com/webpack/node-libs-browser/blob/master/package.json#L10
	assert: 'assert@^1.1.1',
	buffer: 'buffer@^4.3.0',
	crypto: 'crypto-browserify@^3.11.0',
	events: 'events@^3.0.0',
	path: 'path-browserify@^1.0.1',
	process: 'process@^0.11.10',
	punycode: 'punycode@^1.2.4',
	querystring: 'querystring-es3@^0.2.0',
	stream: 'stream-browserify@^2.0.2',
	string_decoder: 'string_decoder@^1.0.0',
	http: 'stream-http@^2.7.2',
	https: 'https-browserify@^1.0.0',
	tty: 'tty-browserify@0.0.0',
	url: 'url@^0.11.0',
	util: 'util@^0.11.0',
	vm: 'vm-browserify@^1.0.1',
	zlib: 'browserify-zlib@^0.2.0',
};

const getVersion = (pkgJsn, pkgName) => {
	for (let pkgType of ['dependencies', 'devDependencies']) {
		if (pkgJsn[pkgType] && pkgJsn[pkgType][pkgName]) {
			return `${pkgName}@${pkgJsn[pkgType][pkgName]}`;
		}
	}
	return alias[pkgName];
};

const getPkgJsn = async (fs) => {
	return fs.$readFile('/package.json').then(pkgJsnStr => JSON.parse(pkgJsnStr));
};

const depNamePtrn = /^(@[^\/]+\/)?\w[^\/]*/;

async function buildModule(
	moduleName,
	{
		entry,
		output
	} = {}
) {
	const { resUrlParsed } = await gotUnpkg(moduleName);

	moduleName = resUrlParsed.pkgId;

	if (!entry) {
		entry = resUrlParsed.filePath
	}

	// Entry needs to be absolute
	else if (!(/^[\.\/]/.test(entry))) {
		entry = '/' + entry;
	}

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
			libraryTarget: 'amd',

			...output,

			// Non-overwritable
			filename: 'index.js',
			path: '/',
		},

		externals: [
			async function({ request, context }, callback) {
				const isBareSpec = request.match(depNamePtrn);
				if (isBareSpec) {
					const [depName] = isBareSpec;
					const version = getVersion(
						await getPkgJsn(compiler.inputFileSystem),
						depName,
					);

					if (version) {
						// console.log({
						// 	request,
						// 	depName,
						// 	version,
						// 	newReq: request.replace(depNamePtrn, version),
						// });
						return callback(null, '/' + request.replace(depNamePtrn, version));
					}
				}

				return callback();
			}
		],

		resolve: {
			alias,
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

	compiler.inputFileSystem = new UnpkgFs(moduleName);
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
				code: compiler.outputFileSystem.readFileSync('/index.js'),
			});
		});
	});

	building.then((built) => cache.set(cacheKey, built));

	return building;
}

module.exports = buildModule;
