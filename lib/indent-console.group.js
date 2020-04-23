const kGroupIndent = Object.getOwnPropertySymbols(console).find(s => s.description === 'kGroupIndent');
const increaseIndentBy = '   ';
const { group, groupEnd } = console;
console.group = function () {
	group.apply(this, arguments);
	this[kGroupIndent] += increaseIndentBy;
};
console.groupEnd = function () {
	groupEnd.apply(this, arguments);
	this[kGroupIndent] = this[kGroupIndent].slice(0, this[kGroupIndent].length - increaseIndentBy.length);
};
