const express = require('express');
const repkgRouter = require('..');

const { PORT = 3005 } = process.env;

const app = express();
app.disable('x-powered-by');
app.use(repkgRouter());

const listener = app.listen(PORT, () => {
	console.log(`REPKG listening on http://localhost:${listener.address().port}`);
});
