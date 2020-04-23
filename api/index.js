const gotUnpkg = require('../lib/got-unpkg');
const buildModule = require('../lib/build-module');

module.exports = async (req, res) => {
	const pkgPath = req.url.slice(1);

	if (!pkgPath) {
		return res.end(`
# REPKG
Pass in an UNPKG path to re-build as AMD

eg. \`/is-buffer\` to build the \`is-buffer\` package as AMD
`.trim());
	}

	const fetchedPkg = await gotUnpkg(pkgPath);

	// Follow redirect
	if (fetchedPkg.redirectUrls.length > 0) {
		return res.writeHead(302, {
			Location: fetchedPkg.url.replace('https://unpkg.com', ''),
		}).end();
	}

	// Not found
	if (fetchedPkg.statusCode !== 200) {
		return res
			.status(fetchedPkg.statusCode)
			.end(fetchedPkg.body);
	}

	const { err, warnings, built } = await buildModule(pkgPath).catch(err => ({ err }));

	if (err) {
		return res
			.status(422)
			.json(err.errors);
	}

	if (warnings) {
		console.log(warnings.map(w => w.message));
	}

	res.setHeader('cache-control', fetchedPkg.headers['cache-control']);
	res.setHeader('content-type', fetchedPkg.headers['content-type']);
	res
		.status(200)
		.end(built);
};
