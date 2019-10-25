const { configure } = require('../generic');

exports.configure = async function (ocli, opts) {
	await configure(ocli, { 'multiple-gateway': true });
};
