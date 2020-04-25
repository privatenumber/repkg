const url = require('url');

// function parseUnpkgPath(unpkgUrl) {
// 	const unpkgUrlParsed = url.parse(unpkgUrl);
// 	const unpkgUrlParts = unpkgUrlParsed.pathname.split('/');

// 	const moduleName = unpkgUrlParts.splice(1, unpkgUrlParts[1].startsWith('@') ? 2 : 1).join('/');
// 	const filePath = unpkgUrlParts.join('/');

// 	console.log({ unpkgUrl, moduleName, filePath })
// 	return {
// 		moduleName,
// 		filePath,
// 	};
// }

function parseUnpkgPath(unpkgUrl) {
	const unpkgUrlParsed = url.parse(unpkgUrl);
	let { pathname } = unpkgUrlParsed;

	if (pathname.startsWith('/')) {
		pathname = pathname.slice(1);
	}

	const unpkgUrlParts = pathname.split('/');
	const moduleName = unpkgUrlParts.splice(0, unpkgUrlParts[0].startsWith('@') ? 2 : 1).join('/');
	const filePath = '/' + unpkgUrlParts.join('/');

	// console.log({ unpkgUrl, moduleName, filePath })
	return {
		moduleName,
		filePath,
	};
}

module.exports = parseUnpkgPath;
