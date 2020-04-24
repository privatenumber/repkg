const { Volume } = require('memfs');
const fsRouterPatch = require('fs-router-patch');
const gotUnpkg = require('./got-unpkg');
const parseUnpkgPath = require('./parse-unpkg-path');
const url = require('url');
const path = require('path');
const chalk = require('chalk');
const logReactive = require('log-reactive');

const formatter = function ({ namespace, key, message, result }) {
	return `${namespace} ${chalk.bold.magenta(key)} ${chalk.yellow(message)} ${result ? `... ${chalk.green(result)}` : '' }`;
};

const isFile = {
	isDirectory() { return false; },
	isFile() { return true; },
};

const isDirectory = {
	isDirectory() { return true; },
	isFile() { return false; },
};

const getPkg = async (fs) => {
	const pkg = await new Promise((resolve, reject) => fs.readFile('/package.json', (err, file) => err ? reject(err) : resolve(file)));
	return JSON.parse(pkg);
};

function getVersion(pkg, pkgName) {
	const depType = ['dependencies', 'devDependencies', 'peerDependencies'].find(d => pkg[d] && pkg[d][pkgName]);

	if (!depType) {
		console.warn(`Couldn't find version for package "${pkgName}" in "${pkg.name}"`);
		return pkgName;
	}

	const pkgVersion = pkg[depType][pkgName].replace(/^[~^]/, '');
	return `${pkgName}@${pkgVersion}`;
}

const unpkgFs = ({ moduleName, moduleBuilder }) => {
	const fs = new Volume();

	let pkg;

	new fsRouterPatch(fs)

		.stat('/node_modules', (req, res) => res.end(isDirectory))

		.stat('/node_modules/:moduleName(.+)', async (req, res) => {
			const status = logReactive({
				namespace: moduleName,
				key: '📦 📊 stat',
				message: req.path,
				result: '',
			}, formatter);

			// TODO: What about paths within modules?
			const { moduleName } = req.params;

			if (moduleName === 'package.json') {
				status.result = 'Ignoring';
				throw new Error();
			}

			if (moduleName.startsWith('@') && moduleName.indexOf('/') === -1) {
				status.result = 'Directory';
				return res.end(isDirectory);
			}

			const versionedPkg = getVersion(
				pkg || (pkg = await getPkg(fs)),
				moduleName,
			);

			status.message += ` → ${versionedPkg}`;
			const fetched = await gotUnpkg(versionedPkg);

			if (fetched.statusCode !== 200) {
				status.result = `Failed - ${fetched.statusCode} - ${unpkgPath}`;
				throw new Error();
			}

			status.result = 'File';
			res.end(isFile);
		})

		.readFile('/node_modules/:moduleName(.+)', async (req, res) => {
			const status = logReactive({
				namespace: moduleName,
				key: '📦 📖 readFile',
				message: req.path,
				result: '',
			}, formatter);

			const { moduleName } = req.params;

			if (moduleName === 'package.json') {
				status.result = 'Ignoring';
				throw new Error();
			}

			const versionedPkg = getVersion(
				pkg || (pkg = await getPkg(fs)),
				moduleName,
			);

			status.message += ` → Building "${versionedPkg}"`;
			const { built } = await moduleBuilder(versionedPkg);
			res.end(built);

			status.result = 'Built';
		})

		.stat('/(.*)', async (req, res) => {
			const unpkgPath = `${moduleName}${req.path}`;
			const status = logReactive({
				namespace: moduleName,
				key: '📊 stat',
				message: unpkgPath,
				result: '',
			}, formatter);

			const fetched = await gotUnpkg(unpkgPath);
			const { filePath } = parseUnpkgPath(fetched.url);

			if (
				filePath === req.path
				|| (filePath === req.path + '.js')
			) {
				status.result = 'File';
				return res.end(isFile);
			}

			if (filePath === req.path + '/index.js') {
				status.result = 'Directory';
				return res.end(isDirectory);
			}

			status.result = `Error ${fetched.statusCode}`;
			throw new Error(`${fetched.statusCode} - ${unpkgPath}`);
		})

		.readFile('/(.*)', async (req, res) => {
			const unpkgPath = `${moduleName}${req.path}`;
			const status = logReactive({
				namespace: moduleName,
				key: '📖 readFile',
				message: unpkgPath,
				result: '',
			}, formatter);

			const fetched = await gotUnpkg(unpkgPath);

			if (fetched.statusCode !== 200) {
				status.result = `Failed - ${fetched.statusCode} - ${unpkgPath}`;
				throw new Error();
			}

			status.result = 'Read';
			res.end(fetched.body);
		});

	return fs;
};

module.exports = unpkgFs;
