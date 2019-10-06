const fs = require('fs');
const path = require('path');
const Docker = require('dockerode');
const Chance = require('chance');
const Client = require('mssql');
const { cli } = require('cli-ux');

const { logger } = require('../../../utils/logger');

let _confs = {
	mssql: {
		name: 'hydrogen-mssql',
		image: 'microsoft/mssql-server-linux',
		tag: '2017-latest',
		envs: [
			'ACCEPT_EULA=Y',
			'SA_PASSWORD=Hydr0g@n',
		],
		ports: {
			'1433/tcp': {},
		},
		host: {
			PortBindings: {
				'1433/tcp': [
					{
						HostPort: '1433',
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

let pMssql = 'mssql.sql';

// build mssql container
exports.buildMSSQLContainer = async function (ocli, paths, product, opts) {
	let instance = new Docker();
	let chance = new Chance().animal().replace(/[^a-zA-Z]/g, '');

	instance.pull(`${_confs.mssql.image}:${_confs.mssql.tag}`, (err, stream) => {
		if (!err)
			instance.modem.followProgress(stream, onFinished, onProgress);

		function onFinished(err, output) {
			if (!err) {
				cli.action.stop();
				instance.createContainer({
					Image: _confs.mssql.image + ':' + _confs.mssql.tag,
					name: chance,
					Env: _confs.mssql.envs,
					ExposedPorts: _confs.mssql.ports,
					HostConfig: _confs.mssql.host,
				}).then(container => {
					ocli.log(`
A Docker container has been created for MSSQL datasource : ${chance}`);
					container.start().then(() => {
						if (opts.generate) {
							cli.action.start('executing database scripts');
							if (opts.setup)
								executeSetupMSSQLScripts(ocli, product, paths);
							else
								executeMSSQLScripts(ocli, product, paths);
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

// execute mssql scripts for replace datasource
async function executeMSSQLScripts(ocli, product, paths) {
	let config = {
		user: 'sa',
		password: 'Hydr0g@n',
		server: 'localhost',
	};

	let script = await readScripts('mssql', pMssql, product, paths);

	setTimeout(() => {
		if (product === 'is')
			Client.connect(config, err => {
				if (err) {
					ocli.log('Something went wrong while connecting to MSSQL');
					return logger.error(err);
				}

				new Client.Request().query('create database wso2mssql;', (err, res) => {
					if (err) {
						ocli.log('Something went wrong while creating database');
						return logger.error(err);
					}

					Client.close();
					config.database = 'wso2mssql';
					Client.connect(config, err => {
						if (err) {
							return logger.error(err);
						}

						// eslint-disable-next-line max-nested-callbacks
						new Client.Request().query(script, (err, res) => {
							if (err) {
								ocli.log('Something went wrong while executing DB scripts');
								logger.error(err);
							}

							Client.close();
							cli.action.stop();
						});
					});
				});
			});
		if (product === 'am')
			Client.connect(config, err => {
				if (err) {
					ocli.log('Something went wrong while connecting to MSSQL');
					return logger.error(err);
				}

				new Client.Request().query('create database wso2amdb;', (err, res) => {
					if (err) {
						ocli.log('Something went wrong while creating database');
						return logger.error(err);
					}

					Client.close();
					config.database = 'wso2amdb';
					Client.connect(config, err => {
						if (err) {
							return logger.error(err);
						}

						// eslint-disable-next-line max-nested-callbacks
						new Client.Request().query(script, (err, res) => {
							if (err) {
								ocli.log('Something went wrong while executing DB scripts');
								logger.error(err);
							}

							Client.close();
							cli.action.stop();
						});
					});
				});
			});
	}, 10000);
}

// read mssql sql scripts from file system
async function readScripts(sp, db, product, paths) {
	let scripts = [];

	if (product === 'is') {
		scripts[0] = fs.readFileSync(path.join(process.cwd(), paths.is.pDBScripts, db)).toString();
		scripts[1] = fs.readFileSync(path.join(process.cwd(), paths.is.pIdentity, db)).toString();
		// scripts[2] = fs.readFileSync(path.join(process.cwd(), paths.is.pStoredProcedure, sp, 'oauth2-token-cleanup.sql')).toString();
		scripts[2] = fs.readFileSync(path.join(process.cwd(), paths.is.pUma, db)).toString();
		scripts[3] = fs.readFileSync(path.join(process.cwd(), paths.is.pConsent, db)).toString();
	}

	if (product === 'am') {
		scripts[0] = fs.readFileSync(path.join(process.cwd(), paths.am.pApimgt, db)).toString();
		// scripts[1] = fs.readFileSync(path.join(process.cwd(), paths.am.pDBScripts, db)).toString();
		// scripts[2] = fs.readFileSync(path.join(process.cwd(), paths.am.pMBStore, 'mssql-mb.sql')).toString();
	}

	return scripts.join('');
}

// execute mssql scripts for api manager setup datasource
async function executeSetupMSSQLScripts(ocli, product, paths) {
	let config = {
		user: 'sa',
		password: 'Hydr0g@n',
		server: 'localhost',
	};

	setTimeout(() => {
		if (product === 'am')
			traverseAMDatasource(ocli, config, paths, 0);
	}, 10000);
}

// function to traverse through multiple different datasource configurations
async function traverseAMDatasource(ocli, config, paths, count) {
	if (count < _confs.am.setup.length) {
		cli.action.stop();
		let script = await readAMSetupScripts('mssql', pMssql, paths);
		cli.action.start(`creating and executing scripts for ${_confs.am.setup[count]}`);

		Client.connect(config, err => {
			if (err) {
				ocli.log('Something went wrong while connecting to MSSQL');
				return logger.error(err);
			}

			let query = `create database ${_confs.am.setup[count]};`;
			new Client.Request().query(query.toString(), (err, res) => {
				if (err) {
					ocli.log('Something went wrong while creating database');
					return logger.error(err);
				}

				Client.close();
				config.database = _confs.am.setup[count];
				Client.connect(config, err => {
					if (err) {
						return logger.error(err);
					}

					// eslint-disable-next-line max-nested-callbacks
					new Client.Request().query(script[_confs.am.setup[count]], (err, res) => {
						if (err) {
							ocli.log('Something went wrong while executing DB scripts');
							logger.error(err);
						}

						Client.close();
						cli.action.stop();
						traverseAMDatasource(ocli, config, paths, ++count);
					});
				});
			});
		});
	}
}

// read mssql sql scripts of api manager from file system
async function readAMSetupScripts(sp, db, paths) {
	let scripts = [];

	scripts[0] = fs.readFileSync(path.join(process.cwd(), paths.am.pApimgt, db)).toString();
	scripts[1] = fs.readFileSync(path.join(process.cwd(), paths.am.pDBScripts, db)).toString();

	let script = {
		apimgtdb: scripts[0],
		userdb: scripts[1],
		regdb: scripts[1],
	};

	return script;
}
