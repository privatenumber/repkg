const { VM } = require('vm2');

let defineCalledNoDeps;

const define = function() {
	defineCalledNoDeps = arguments.length === 1;
};
define.amd = true;

const vm = new VM({
	timeout: 500,
	sandbox: { define },
});

function isAMD(code) {
	defineCalledNoDeps = false;
	try {
		vm.run(code);
		return defineCalledNoDeps;
	} catch (err) {
		return false;
	}
};

module.exports = isAMD;
