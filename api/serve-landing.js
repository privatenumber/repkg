module.exports = (req, res) => {	
		return res.end(`
# REPKG
Pass in an UNPKG path to re-build as AMD

eg. \`/is-buffer\` to build the \`is-buffer\` package as AMD
`.trim());
};
