const fs = require('fs');
const libxmljs = require('libxmljs');

let _comment = 'HYDROGENERATED:';
let _n = '\n\n';
let _t = '\t\t';

exports.parseXML = async function (ocli, path) {
	let jsonData = fs.readFileSync(path, 'utf8');
	jsonData = libxmljs.parseXml(jsonData);

	return jsonData;
};

exports.removeDeclaration = function (xml) {
	return xml.split('<?xml version="1.0" encoding="UTF-8"?>\n')[1];
};

// alter element
exports.alterElement = function (element, tag, description) {
	let alter = element.substring(0, element.indexOf(`<${tag}>`)) +
		commentElement(element.substring(element.indexOf(`<${tag}>`), element.lastIndexOf(`<${tag}>`))) +
		`${_t}<!-- ${_comment} ${description ? description : ''}-->\n${_t}` +
		element.substring(element.lastIndexOf(`<${tag}>`), element.length);
	return alter;
};

function commentElement(element) {
	return '<!-- ' + element + ` -->${_n}`;
}

// comment an element
exports.commentElement = commentElement;
