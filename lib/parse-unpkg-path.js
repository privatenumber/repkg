const url = require('url');

function parseUnpkgPath(unpkgUrl) {
	const unpkgUrlParsed = url.parse(unpkgUrl);
	const unpkgUrlParts = unpkgUrlParsed.pathname.split('/');

	const moduleName = unpkgUrlParts.splice(1, unpkgUrlParts[1].startsWith('@') ? 2 : 1).join('/');
	const filePath = unpkgUrlParts.join('/');

	return {
		moduleName,
		filePath,
	};
}

module.exports = parseUnpkgPath;
