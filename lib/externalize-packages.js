
const depNamePtrn = /^(@[^\/]+\/)?\w[^\/]*/;

// https://github.com/webpack/node-libs-browser/blob/master/package.json#L10
const nodeLibs = {
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
	return nodeLibs[pkgName];
};

const getPkgJsn = async (fs) => fs.$readFile('/package.json').then(pkgJsnStr => JSON.parse(pkgJsnStr));

function externalizePackages(fs) {
	return async function({ request, context }, callback) {
		const isBareSpec = request.match(depNamePtrn);
		if (isBareSpec) {
			const [depName] = isBareSpec;
			const version = getVersion(
				await getPkgJsn(fs),
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
	};
}

module.exports = externalizePackages;
