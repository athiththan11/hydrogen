const fs = require('fs-extra');
const path = require('path');

const { logger } = require('../../utils/logger');

let _p = process.cwd();
let _c = ['keymanager', 'trafficmanager', 'gateway', 'store', 'publisher'];

// TODO: unzip tar and make configurations

exports.configure = async function () {
	logger.info(fs.readdirSync(_p).length + ' starting ' + _p);

	if (fs.readdirSync(_p).length === 1) {
		fs.readdirSync(_p).forEach(d => {
			let p = path.join(_p, d);

			fs.mkdirSync(path.join(p, 'distributed'));
			_c.forEach(s => {
				logger.info(s);
				fs.copySync(p, path.join(_p, 'distributed', s));
			});
		});
	}
};
