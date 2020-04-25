const isFile = {
	isDirectory() { return false; },
	isFile() { return true; },
};

const isDirectory = {
	isDirectory() { return true; },
	isFile() { return false; },
};

module.exports = {
	isFile,
	isDirectory,
};
