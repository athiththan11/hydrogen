const fs = require('fs-extra');
const path = require('path');
const Docker = require('dockerode');
const Chance = require('chance');
const { Client } = require('pg');
const { createdb } = require('pgtools');
const { cli } = require('cli-ux');

const { logger } = require('../../../utils/logger');

let _confs = {
	postgres: {
		name: 'hydrogen-postgres',
		image: 'postgres',
		tag: '9.6.14',
		envs: ['POSTGRES_PASSWORD=hydrogen'],
		ports: {
			'5432/tcp': {},
		},
		host: {
			PortBindings: {
				'5432/tcp': [
					{
						HostPort: '5432',
					},
				],
			},
		},
	},
	am: {
		setup: [
			'apimgtdb',
			'userdb',
			'regdb',
		],
	},
};

let pPostgres = 'postgresql.sql';

// build postgres container
exports.buildPostgresContainer = async function (ocli, paths, product, opts) {
	let instance = new Docker();
	let chance = new Chance().animal().replace(/[^a-zA-Z]/g, '');

	instance.pull(`${_confs.postgres.image}:${_confs.postgres.tag}`, (err, stream) => {
		if (!err)
			instance.modem.followProgress(stream, onFinished, onProgress);

		function onFinished(err, output) {
			if (!err) {
				cli.action.stop();
				instance.createContainer({
					Image: _confs.postgres.image + ':' + _confs.postgres.tag,
					name: chance,
					Env: _confs.postgres.envs,
					ExposedPorts: _confs.postgres.ports,
					HostConfig: _confs.postgres.host,
				}).then(container => {
					ocli.log(`
A Docker container has been created for Postgres datasource : ${chance}`);
					container.start().then(() => {
						if (opts.generate) {
							cli.action.start('executing database scripts');
							if (opts.setup)
								executeSetupPostgresScripts(ocli, product, paths, opts);
							else
								executePostgresScripts(ocli, product, paths);
						}
					});
				});
			}
		}
		function onProgress(event) {
			cli.action.start('pulling docker image');
		}
	});
};

// execute postgres scripts for replace datasource
async function executePostgresScripts(ocli, product, paths) {
	let config = {
		user: 'postgres',
		password: 'hydrogen',
		host: 'localhost',
		port: '5432',
	};

	let script = await readScripts('postgre', pPostgres, product, paths);

	setTimeout(() => {
		if (product === 'is')
			createdb(config, 'wso2postgres').then(() => {
				config.database = 'wso2postgres';
				const client = new Client(config);
				client.connect();

				client.query(script, (err, res) => {
					if (err) {
						ocli.log('Something went wrong while executing DB scripts');
						logger.error(err);
					}

					client.end();
				});
			}).then(() => {
				cli.action.stop();
			}).catch(error => {
				if (error) logger.error(error);
			});
		if (product === 'am')
			createdb(config, 'wso2amdb').then(() => {
				config.database = 'wso2amdb';
				const client = new Client(config);
				client.connect();

				client.query(script, (err, res) => {
					if (err) {
						ocli.log('Something went wrong while executing DB scripts');
						logger.error(err);
					}

					client.end();
				});
			}).then(() => {
				cli.action.stop();
			}).catch(error => {
				if (error) logger.error(error);
			});
	}, 5000);
}

// read postgres sql scripts from file system
async function readScripts(sp, db, product, paths) {
	let scripts = [];

	if (product === 'is') {
		scripts[0] = fs.readFileSync(path.join(process.cwd(), paths.is.pDBScripts, db)).toString();
		scripts[1] = fs.readFileSync(path.join(process.cwd(), paths.is.pIdentity, db)).toString();
		scripts[2] = fs.readFileSync(path.join(process.cwd(), paths.is.pStoredProcedure, sp, db)).toString();
		scripts[3] = fs.readFileSync(path.join(process.cwd(), paths.is.pUma, db)).toString();
		scripts[4] = fs.readFileSync(path.join(process.cwd(), paths.is.pConsent, db)).toString();
	}

	if (product === 'am') {
		scripts[0] = fs.readFileSync(path.join(process.cwd(), paths.am.pApimgt, db)).toString();
		// scripts[1] = fs.readFileSync(path.join(process.cwd(), paths.am.pDBScripts, db)).toString();
		// scripts[2] = fs.readFileSync(path.join(process.cwd(), paths.am.pMBStore, 'postgresql-mb.sql')).toString();
	}

	return scripts.join('\n');
}

// execute postgres scripts for api manager setup datasource
async function executeSetupPostgresScripts(ocli, product, paths, opts) {
	let config = {
		user: 'postgres',
		password: 'hydrogen',
		host: 'localhost',
		port: '5432',
	};

	setTimeout(() => {
		if (product === 'am')
			traverseAMDatasource(ocli, config, paths, opts, 0);
	}, 5000);
}

// function to traverse through multiple different datasource configurations
// eslint-disable-next-line max-params
async function traverseAMDatasource(ocli, config, paths, opts, count) {
	if (count < _confs.am.setup.length) {
		cli.action.stop();
		let script = await readAMSetupScripts('postgre', pPostgres, opts, paths);
		cli.action.start(`creating and executing scripts for ${_confs.am.setup[count]}`);
		createdb(config, _confs.am.setup[count]).then(() => {
			config.database = _confs.am.setup[count];
			const client = new Client(config);
			client.connect();

			client.query(script[_confs.am.setup[count]], (err, res) => {
				if (err) {
					ocli.log('Something went wrong while executing DB scripts');
					logger.error(err);
				}

				client.end();
			});
		}).then(() => {
			cli.action.stop();
		}).then(() => {
			traverseAMDatasource(ocli, config, paths, opts, ++count);
		});
	}
}

// read postgres sql scripts of api manager from file system
async function readAMSetupScripts(sp, db, opts, paths) {
	let scripts = [];

	if (!opts['is-km'] && !opts.distributed) {
		scripts[0] = fs.readFileSync(path.join(process.cwd(), paths.am.pApimgt, db)).toString();
		scripts[1] = fs.readFileSync(path.join(process.cwd(), paths.am.pDBScripts, db)).toString();
	}

	if (opts['is-km'] || opts.distributed) {
		if (fs.existsSync(path.join(process.cwd(), '.DS_Store'))) {
			fs.removeSync(path.join(process.cwd(), '.DS_Store'));
		}

		let dir = fs.readdirSync(process.cwd());
		while (dir.length >= 0) {
			let pack = dir.shift();
			if (pack.startsWith('wso2am')) {
				scripts[0] = fs.readFileSync(path.join(process.cwd(), pack, paths.am.pApimgt, db)).toString();
				scripts[1] = fs.readFileSync(path.join(process.cwd(), pack, paths.am.pDBScripts, db)).toString();
				break;
			}
		}
	}

	let script = {
		apimgtdb: scripts[0],
		userdb: scripts[1],
		regdb: scripts[1],
	};

	return script;
}
