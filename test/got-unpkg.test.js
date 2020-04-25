const gotUnpkg = require('../lib/got-unpkg');

describe('Stat', () => {
	test('Not found', async () => {
		const res = await gotUnpkg.stat('vueasdfasdfsasd@2.6.11');
		expect(res.type).toBe(404);
	});

	test('Resolve module', async () => {
		const res = await gotUnpkg.stat('vue@2.6.11');
		expect(res.type).toBe('Directory');
	});

	test('Resolve extension', async () => {
		const res = await gotUnpkg.stat('vue@2.6.11/dist/vue');
		expect(res.type).toBe('File');
	});

	test('Resolve extension', async () => {
		const res = await gotUnpkg.stat('string_decoder@0.10.x/index.js');
		expect(res.type).toBe('File');
	});

});
