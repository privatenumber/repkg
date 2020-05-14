const url = require('url');
const gotUnpkg = require('unpkg-fs/lib/got-unpkg');
const buildModule = require('../lib/build-module');
const isAMD = require('../lib/is-amd');

module.exports = async (req, res) => {
	const pkgPath = url.parse(req.url).pathname.slice(1);
	const fetchedPkg = await gotUnpkg(pkgPath, { throwHttpErrors: false  });
	const fetchedPkgUrl = url.parse(fetchedPkg.url);

	// Follow redirect
	if (fetchedPkg.redirectUrls.length > 0) {
		return res.writeHead(302, {
			Location: fetchedPkgUrl.path + (new URL(req.url, 'https://parse/').search),
		}).end();
	}

	// Not 200
	if (fetchedPkg.statusCode !== 200) {
		return res
			.status(fetchedPkg.statusCode)
			.end(fetchedPkg.body);
	}

	// Redirect to UNPKG
	if (
		// If Browse
		fetchedPkgUrl.path.startsWith('/browse')

		// If source map
		|| fetchedPkgUrl.path.endsWith('.map')

		// // If AMD (and has no CJS calls)
		// || isAMD(fetchedPkg.body)
	) {
		return res.writeHead(302, {
			Location: fetchedPkg.url,
		}).end();
	}

	const { pkgId, filePath } = fetchedPkg.resUrlParsed;
	const { err, warnings, code } = await buildModule(pkgId, {
		entry: filePath,
		options: {
			min: req.query && ('min' in req.query),
		},
	}).catch(err => ({ err }));

	if (err) {
		return res
			.status(422)
			.json(err.errors);
	}

	if (warnings.length) {
		console.log(pkgId, warnings.map(w => w.message));
	}

	res.setHeader('Cache-Control', fetchedPkg.headers['cache-control']);
	res.setHeader('Content-Type', fetchedPkg.headers['content-type']);
	res
		.status(200)
		.end(code);
};
