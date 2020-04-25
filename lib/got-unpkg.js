const got = require('got');
const parseUnpkgPath = require('./util/parse-unpkg-path');
const { isFile, isDirectory } = require('./util/stat-result-shim');

const gotUnpkg = got.extend({
	prefixUrl: 'https://unpkg.com/',
	cache: new Map(),
	throwHttpErrors: false,
	timeout: 5000,
});

gotUnpkg.stat = async function (url) {
	const res = await gotUnpkg(url, { followRedirect: false });

	const result = {
		cacheHit: res.isFromCache,
		type: null,
		data: null,
	};

	switch (res.statusCode) {
		case 200:
			result.type = 'File';
			result.data = isFile;
			break;

		case 302:
			const reqUrl = parseUnpkgPath(url);
			const resUrl = parseUnpkgPath(res.headers.location);

			if (
				// Same file path, different semver
				reqUrl.filePath === resUrl.filePath

				// Same semver, resolved extension
				|| `${reqUrl.filePath}.js` === resUrl.filePath
			) {
				result.type = 'File';
				result.data = isFile;
			} else {
				result.type = 'Directory';
				result.data = isDirectory;
			}
			break;

		case 404:
			result.type = 404;
			break;
	}

	return result;
};

module.exports = gotUnpkg;
