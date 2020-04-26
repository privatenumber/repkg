const buildModule = require('../lib/build-module');

describe('No dependencies', () => {
	test('parse-ms', async () => {
		const built = await buildModule('parse-ms@2.1.0');
		expect(built.warnings.length).toBe(0);
		expect(built.code.toString().length).toBeGreaterThan(100);
	});

	test('is-buffer', async () => {
		const built = await buildModule('is-buffer@2.0.4');
		expect(built.warnings.length).toBe(0);
		expect(built.code.toString().length).toBeGreaterThan(100);
	});

	test('vue', async () => {
		const built = await buildModule('vue@2.6.11');
		expect(built.warnings.length).toBe(3);
		expect(built.code.toString().length).toBeGreaterThan(100);
	});

	test('core-util-is', async () => {
		const built = await buildModule('core-util-is@1.0.0');
		expect(built.warnings.length).toBe(0);
		expect(built.code.toString().length).toBeGreaterThan(100);
	});


	test('lodash', async () => {
		const built = await buildModule('lodash@4.17.15', {
			entry: '/camelCase.js',
		});
		expect(built.warnings.length).toBe(0);
		expect(built.code.toString().length).toBeGreaterThan(100);
	});
});


describe('Multiple dependencies', () => {
	test('pretty-ms', async () => {
		const built = await buildModule('pretty-ms@6.0.1');
		expect(built.warnings.length).toBe(0);
		expect(built.code.toString().length).toBeGreaterThan(100);
	});

	// test('@babel/code-frame', async () => {
	// 	const built = await buildModule('@babel/code-frame');
	// 	expect(built.warnings.length).toBe(0);
	// 	expect(built.code.toString().length).toBeGreaterThan(100);
	// });



});



// (async () => {
// 	const modules = [
// 		// 'randomfill@1.0.3',
// 		// 'randombytes@2.0.0',
// 		// 'create-hash@1.1.0',
// 		// 'readable-stream@3.6.0',
// 		// 'readable-stream@3.5.0',
// 		// 'readable-stream@2.0.2',
// 		// 'stream-browserify@2.0.1',
// 		// 'readable-stream@2.0.2/duplex.js',
// 		// 'readable-stream@2.0.2/passthrough.js',
// 		// 'readable-stream@2.0.2/writable.js',
// 		// 'readable-stream@2.0.2/transform.js',
// 		// 'readable-stream@2.0.2/readable.js',
// 		// 'better-ajv-errors@0.6.7/lib/modern/index.js', // Super slow but compiles

// 		// 'brorand@^1.0.1',
// 		// 'crypto-browserify@^3.11.0',
// 		// 'uuid@3.2.1/v1',
// 		// 'miller-rabin@^4.0.0',
// 		// 'parse-asn1@^5.0.0'
// 	];

// 	for (const moduleName of modules) {
// 		const built = await buildModule(moduleName);
// 		assert(built.built.length > 100, `${moduleName} build is too small`);
// 		console.log('✅ Built', moduleName);
// 	}

// })().catch((err) => {

// 	console.log(err)
// });