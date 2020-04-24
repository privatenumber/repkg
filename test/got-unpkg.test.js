const gotUnpkg = require('../lib/got-unpkg');

describe('Stat', () => {
	test('Not found', async () => {
		const res = await gotUnpkg.stat('vueasdfasdfsasd@2.6.11');
		expect(res.type).toBe('Not found');
	});

	test('Resolve module', async () => {
		const res = await gotUnpkg.stat('vue@2.6.11');
		expect(res.type).toBe('Directory');
	});

	test('Resolve extension', async () => {
		const res = await gotUnpkg.stat('vue@2.6.11/dist/vue');
		expect(res.type).toBe('File');
	});
});
