const url = require('url');
const gotUnpkg = require('unpkg-fs/lib/got-unpkg');
const buildModule = require('../lib/build-module');

module.exports = async (req, res) => {
	const pkgPath = url.parse(req.url).pathname.slice(1);

	if (!pkgPath) {
		return res.end(`
# REPKG
Pass in an UNPKG path to re-build as AMD

eg. \`/is-buffer\` to build the \`is-buffer\` package as AMD
`.trim());
	}

	const fetchedPkg = await gotUnpkg(pkgPath, { throwHttpErrors: false  });
	const fetchedPkgUrl = url.parse(fetchedPkg.url);

	// Follow redirect
	if (fetchedPkg.redirectUrls.length > 0) {
		return res.writeHead(302, {
			Location: fetchedPkgUrl.path,
		}).end();
	}

	// Not 200
	if (fetchedPkg.statusCode !== 200) {
		return res
			.status(fetchedPkg.statusCode)
			.end(fetchedPkg.body);
	}

	// If Browse, redirect to UNPKG
	if (fetchedPkgUrl.path.startsWith('/browse')) {
		return res.writeHead(302, {
			Location: fetchedPkg.url,
		}).end();
	}

	const { pkgId, filePath } = fetchedPkg.resUrlParsed;
	const { err, warnings, code } = await buildModule(pkgId, {
		entry: filePath,
		output: req.query,
	}).catch(err => ({ err }));

	if (err) {
		return res
			.status(422)
			.json(err.errors);
	}

	if (warnings.length) {
		console.log(pkgId, warnings.map(w => w.message));
	}

	res.setHeader('cache-control', fetchedPkg.headers['cache-control']);
	res.setHeader('content-type', fetchedPkg.headers['content-type']);
	res
		.status(200)
		.end(code);
};
