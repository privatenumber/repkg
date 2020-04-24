const { Volume } = require('memfs');
const fsRouterPatch = require('fs-router-patch');
const gotUnpkg = require('./got-unpkg');
const parseUnpkgPath = require('./parse-unpkg-path');
const url = require('url');
const path = require('path');
const chalk = require('chalk');
const logReactive = require('log-reactive');

const formatter = function ({ namespace, key, message, result, cacheHit }) {
	const cache = cacheHit ? (' ' + chalk.gray('(Cache)')) : '';
	return `${chalk.cyan(namespace)} ${chalk.bold.magenta(key)} ${chalk.yellow(message)} ${result ? `... ${result + cache}` : '' }`;
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

const parseDepPath = (nmPath) => {
	const pathComps = nmPath.split('/');
	const orgName = pathComps[0].startsWith('@') ? pathComps.shift() : false;
	const moduleName = pathComps.shift();
	const filePath = pathComps.join('/');
	return {
		get depName() {
			return `${this.orgName ? `${this.orgName}/` : ''}${this.moduleName}`;
		},
		orgName, 
		moduleName,
		filePath,
		get fullPath() {
			return `${this.depName}${this.filePath ? `/${this.filePath}` : ''}`;
		},
	};
};

function getVersion(pkg, pkgName) {
	const depType = ['dependencies', 'devDependencies', 'peerDependencies'].find(d => pkg[d] && pkg[d][pkgName]);

	if (!depType) {
		console.warn(`Couldn't find version for package "${pkgName}" in "${pkg.name}"`);
		return null;
	}

	return pkg[depType][pkgName].replace(/^[~^]/, '');
}

const unpkgFs = ({ moduleName, moduleBuilder }) => {
	const namespace = moduleName;
	const fs = new Volume();

	let pkg;

	new fsRouterPatch(fs)

		.stat('/node_modules', (req, res) => res.end(isDirectory))

		.stat('/node_modules/:moduleName(.+)', async (req, res) => {
			const status = logReactive({
				namespace,
				key: '📦 📊 stat',
				message: req.path,
				result: '',
			}, formatter);

			const reqModule = parseDepPath(req.params.moduleName);

			if (reqModule.orgName && !reqModule.moduleName && !reqModule.filePath) {
				status.result = chalk.green('Directory');
				return res.end(isDirectory);
			}

			if (reqModule.moduleName === 'package.json') {
				status.result = chalk.red('Ignoring');
				throw new Error();
			}

			if (reqModule.filePath === 'BUILT') {
				return res.end(isFile);
			}

			// No version set
			if (reqModule.moduleName.indexOf('@') === -1) {
				const version = getVersion(
					pkg || (pkg = await getPkg(fs)),
					reqModule.depName,
				);

				if (version) {
					reqModule.moduleName += `@${version}`;
					status.message += ` → ${reqModule.depName}`;
				}
			}

			const fetched = await gotUnpkg.stat(reqModule.fullPath);
			status.cacheHit = fetched.cacheHit;

			if (!fetched.data) {
				status.result = chalk.red(fetched.type);
				throw new Error();
			}

			status.result = chalk.green(fetched.type);
			res.end(fetched.data);
		})

		.readFile('/node_modules/:moduleName(.+)', async (req, res) => {
			const id = Math.random().toString(36).slice(2, 4);
			const status = logReactive({
				namespace,
				key: `📦 📖 readFile (${id})`,
				message: req.path,
				result: '🏃‍♂️',
			}, formatter);

			const reqModule = parseDepPath(req.params.moduleName);

			if (reqModule.moduleName === 'package.json') {
				status.result = chalk.red('Ignoring');
				throw new Error();
			}

			// No version set - THIS SHOULD BE CATCHED FROM STAT
			if (reqModule.moduleName.indexOf('@') === -1) {
				const version = getVersion(
					pkg || (pkg = await getPkg(fs)),
					reqModule.depName,
				);

				if (version) {
					reqModule.moduleName += `@${version}`;
					status.message += ` → ${reqModule.depName}`;
				}
			}

			if (reqModule.filePath === 'package.json') {
				const fetched = await gotUnpkg(reqModule.fullPath);
				if (fetched.statusCode === 200) {
					return res.end(fetched.body);
				} else {
					throw new Error();
				}
			}

			if (reqModule.filePath.endsWith('package.json')) {
				status.result = chalk.red('Ignoring');
				throw new Error();
			}

			status.message += chalk.keyword('orange')(` → Building "${reqModule.fullPath}"`);
			const { err, built } = await moduleBuilder(reqModule.fullPath).catch(err => ({ err }));

			if (err) {
				throw new Error('Failed to build');
			}

			status.result = chalk.green('Built');
			res.end(built);
		})

		.stat('/(.*)', async (req, res) => {
			const id = Math.random().toString(36).slice(2, 4);
			const unpkgPath = `${moduleName}${req.path}`;
			const status = logReactive({
				namespace,
				key: `📊 stat (${id})`,
				message: unpkgPath,
				result: '',
			}, formatter);

			const fetched = await gotUnpkg.stat(unpkgPath);
			status.cacheHit = fetched.cacheHit;

			if (!fetched.data) {
				status.result = chalk.red(fetched.type);
				throw new Error();
			}

			status.result = chalk.green(fetched.type);
			res.end(fetched.data);
		})

		.readFile('/(.*)', async (req, res) => {
			const unpkgPath = `${moduleName}${req.path}`;
			const status = logReactive({
				namespace,
				key: '📖 readFile',
				message: unpkgPath,
				result: '',
			}, formatter);

			if (req.path.match(/.+\/package\.json$/)) {
				status.result = chalk.red('Ignoring');
				throw new Error();
			}

			const fetched = await gotUnpkg(unpkgPath);
			status.cacheHit = fetched.isFromCache;

			if (fetched.statusCode !== 200) {
				status.result = chalk.red(`${fetched.statusCode}: ${unpkgPath}`);
				throw new Error();
			}

			status.result = chalk.green('Read');
			res.end(fetched.body);
		});

	return fs;
};

module.exports = unpkgFs;
