const fs = require('fs');
const libxmljs = require('libxmljs');

exports.parseXML = async function (log, path) {
	let jsonData = fs.readFileSync(path, 'utf8');
	jsonData = libxmljs.parseXml(jsonData);

	return jsonData;
};
