const url = require('url');

function parseUnpkgPath(unpkgUrl) {
	const unpkgUrlParsed = url.parse(unpkgUrl);
	let { pathname } = unpkgUrlParsed;

	if (pathname.startsWith('/')) {
		pathname = pathname.slice(1);
	}

	const unpkgUrlParts = pathname.split('/');
	const moduleName = unpkgUrlParts.splice(0, unpkgUrlParts[0].startsWith('@') ? 2 : 1).join('/');
	const filePath = '/' + unpkgUrlParts.join('/');

	return {
		moduleName,
		filePath,
	};
}

module.exports = parseUnpkgPath;
