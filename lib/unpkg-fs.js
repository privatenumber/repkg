const { Volume } = require('memfs');
const fsRouterPatch = require('fs-router-patch');
const gotUnpkg = require('./got-unpkg');
const url = require('url');
const path = require('path');

const isFile = {
	isDirectory() { return false; },
	isFile() { return true; },
};

const isDirectory = {
	isDirectory() { return true; },
	isFile() { return false; },
};

async function getVersion(fs, pkgName) {
	let pkg = await new Promise((resolve, reject) => fs.readFile('/package.json', (err, file) => err ? reject(err) : resolve(file)));

	pkg = JSON.parse(pkg);

	const depType = ['dependencies', 'devDependencies', 'peerDependencies'].find(d => pkg[d] && pkg[d][pkgName]);
	if (depType) {
		const pkgVersion = pkg[depType][pkgName].replace(/^[~^]/, '');
		pkgName += `@${pkgVersion}`;
	}
	return pkgName;
}

const unpkgFs = ({ moduleName, moduleBuilder }) => {
	const fs = new Volume();

	new fsRouterPatch(fs)

		.stat('/node_modules', (req, res) => res.end(isDirectory))

		.stat('/node_modules/:moduleName', async (req, res) => {
			// TODO: What about paths within modules?
			const { moduleName } = req.params;
			if (moduleName === 'package.json') {
				throw new Error(4041);
			}

			const versionedPkg = await getVersion(fs, moduleName);
			const fetched = await gotUnpkg(versionedPkg);

			if (fetched.statusCode === 200) {
				return res.end(isFile);
			}
		})

		.readFile('/node_modules/:moduleName', async (req, res, next) => {
			const { moduleName } = req.params;
			if (moduleName === 'package.json') {
				throw new Error(4042);
			}

			const versionedPkg = await getVersion(fs, moduleName);
			const { built } = await moduleBuilder(versionedPkg);
			res.end(built);
		})

		.stat('/(.*)', async (req, res) => {
			const fetched = await gotUnpkg(`${moduleName}${req.path}`);
			const fetchedPath = '/' + url.parse(fetched.url).pathname.split(path.sep).slice(2).join(path.sep);

			if (
				fetchedPath === req.path
				|| (fetchedPath === req.path + '.js')
			) {
				return res.end(isFile);
			}

			if (fetchedPath === req.path + '/index.js') {
				return res.end(isDirectory);
			}

			console.log({ fetchedPath, reqPath: req.path });
			throw new Error(4043);
		})

		.readFile('/(.*)', async (req, res) => {
			const unpkgPath = `${moduleName}${req.path}`;
			const fetched = await gotUnpkg(unpkgPath);

			if (fetched.statusCode === 200) {
				return res.end(fetched.body);
			}

			throw new Error(`${fetched.statusCode} - ${unpkgPath}`);
		});

	return fs;
};

module.exports = unpkgFs;
