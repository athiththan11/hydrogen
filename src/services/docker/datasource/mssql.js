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
};

let pMssql = 'mssql.sql';

// build postgres container
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

async function executeMSSQLScripts(ocli, product, paths) {
	let config = {
		user: 'sa',
		password: 'Hydr0g@n',
		server: 'localhost',
	};

	let script = await readScripts('mssql', pMssql, product, paths);

	setTimeout(() => {
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
	}, 10000);
}

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
		scripts[1] = fs.readFileSync(path.join(process.cwd(), paths.am.pDBScripts, db)).toString();
		scripts[3] = fs.readFileSync(path.join(process.cwd(), paths.am.pMBStore, 'mssql-mb.sql')).toString();
	}

	return scripts.join('');
}
