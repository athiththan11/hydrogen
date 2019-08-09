const fs = require('fs');
const libxmljs = require('libxmljs');

exports.parseXML = async function (ocli, path) {
	let jsonData = fs.readFileSync(path, 'utf8');
	jsonData = libxmljs.parseXml(jsonData);

	return jsonData;
};

exports.removeDeclaration = function (xml) {
	return xml.split('<?xml version="1.0" encoding="UTF-8"?>\n')[1];
};
