const got = require('got');

const gotUnpkg = got.extend({
	prefixUrl: 'https://unpkg.com/',
	cache: new Map(),
	throwHttpErrors: false,
	timeout: 5000,
});


const isFile = {
	isDirectory() { return false; },
	isFile() { return true; },
};

const isDirectory = {
	isDirectory() { return true; },
	isFile() { return false; },
};

gotUnpkg.stat = async function (url) {
	const res = await gotUnpkg(url, { followRedirect: false });

	const result = {
		cacheHit: res.isFromCache,
		type: null,
		data: null,
	};

	if (res.statusCode === 404) {
		result.type = 404;
	}

	if (res.statusCode === 302) {
		if (`/${url}.js` === res.headers.location) {
			result.type = 'File';
			result.data = isFile;
		} else {
			result.type = 'Directory';
			result.data = isDirectory;
		}
	}

	if (res.statusCode === 200) {
		result.type = 'File';
		result.data = isFile;
	}

	return result;
};


module.exports = gotUnpkg;
