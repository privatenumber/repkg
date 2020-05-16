const { Router } = require('express');
const serveLanding = require('./api/serve-landing');
const buildModule = require('./api/build-module');

function repkgRouter() {
	const router = Router();

	router.get('/', serveLanding);

	router.get('/favicon.ico', (req, res) => res.end());

	router.use((req, res, next) => {
		res.header('Access-Control-Allow-Origin', '*');
		next();
	});

	router.get('/:path(*)?', buildModule);

	return router;
}

module.exports = repkgRouter;
