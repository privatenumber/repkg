const buildModule = require('../lib/build-module');
const assert = require('assert');

(async () => {
	const modules = [
		'parse-ms@2.1.0',
		'vue@latest',
		'pretty-ms@6.0.1',
		'is-buffer@2.0.4',
		'lodash@4.17.15/camelCase.js',
		'@babel/code-frame',
		// 'better-ajv-errors@0.6.7/lib/modern/index.js',
		// 'uuid@3.2.1/v1'
	];

	for (const moduleName of modules) {
		const built = await buildModule(moduleName);
		assert(built.built.length > 100, `${moduleName} build is too small`);
		console.log('Built', moduleName);
	}

})().catch(console.log);