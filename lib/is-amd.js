const { VM } = require('vm2');

let defineCalled;

const define = function() {
	defineCalled = true;
};
define.amd = true;

const vm = new VM({
	timeout: 500,
	sandbox: { define },
});

function isAMD(code) {
	defineCalled = false;
	try {
		vm.run(code);
		return defineCalled;
	} catch (err) {
		return false;
	}
};

module.exports = isAMD;
