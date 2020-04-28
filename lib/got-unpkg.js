const got = require('got');

const gotUnpkg = got.extend({
	prefixUrl: 'https://unpkg.com/',
	cache: new Map(),
	throwHttpErrors: false,
	timeout: 5000,
});

module.exports = gotUnpkg;
