const fs = require('fs');
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

async function executePostgresScripts(ocli, product, paths) {
	let config = {
		user: 'postgres',
		password: 'hydrogen',
		host: 'localhost',
		port: '5432',
	};

	let script = await readScripts('postgre', pPostgres, product, paths);

	setTimeout(() => {
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
	}, 5000);
}

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
		scripts[1] = fs.readFileSync(path.join(process.cwd(), paths.am.pDBScripts, db)).toString();
		scripts[3] = fs.readFileSync(path.join(process.cwd(), paths.am.pMBStore, 'postgresql-mb.sql')).toString();
	}

	return scripts.join('\n');
}
