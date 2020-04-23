const buildModule = require('../lib/build-module');

(async () => {
	// const built = await buildModule('parse-ms@2.1.0');
	// console.log({ built });

	// const built = await buildModule('vue@latest');
	// console.log({ built });

	// const built = await buildModule('pretty-ms@6.0.1');
	// console.log({ built });

	// const built = await buildModule('is-buffer@2.0.4');
	// console.log({ built });

	const built = await buildModule('lodash@4.17.15/camelCase.js');
	console.log({ built });

})().catch(console.log);