const hash = require('hash-sum');

// const isResolved = $ => Promise.race([
//     $,
//     Promise.resolve()
// ]).then(_ => !!_);

function consolidatePromises(fn) {
	const running = new Map();

	// setInterval(async () => {
	// 	const builds = Array.from(running);
	// 	const logMsg = await Promise.all(builds.map(async b => {
	// 		return [b[0], await isResolved(b[1])];
	// 	}));
	// 	console.log(logMsg);
	// }, 1000);

	return function() {
		const id = hash(arguments);
		if (running.has(id)) {
			return running.get(id);
		}

		const invoke = fn.apply(this, arguments);
		running.set(id, invoke);

		invoke.then(() => {
			running.delete(id);
		});

		return invoke;
	};
}

module.exports = consolidatePromises;
