const fs = require('fs-extra');
const path = require('path');

let pNginxConf = '/nginx-conf';

let _p = process.cwd();

let _utf8 = 'utf-8';

let _p8243 = 8243;
let _p8280 = 8280;
let _p9443 = 9443;

exports.buildNginx = async function (args, conf) {
	if (process.env.NODE_ENV === 'mocha' && args.esb)
		_p = path.join(process.cwd(), process.env.MOCHA_ESBCLUSTERED);

	let pNginx = path.join(_p, pNginxConf);

	// create nginx-conf directory
	fs.mkdirSync(pNginx);

	if (args.cluster && args.esb) {
		await buildESBClusterConf(pNginx, conf);
	}
};

async function buildESBClusterConf(p, conf) {
	let http = `upstream wso2.ei.com {
	server 127.0.0.1:${_p8280};
	server 127.0.0.1:${_p8280 + 1};
}

server {
	listen 80;
	server_name ei.wso2.com;

	location / {
		proxy_set_header X-Forwarded-Host $host;
		proxy_set_header X-Forwarded-Server $host;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $http_host;
		proxy_read_timeout 5m;
		proxy_send_timeout 5m;
		proxy_pass http://wso2.ei.com;

		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
	}
}`;
	fs.writeFileSync(path.join(p, 'ei.http.conf'), http, _utf8);

	let https = `upstream ssl.wso2.ei.com {
	server 127.0.0.1:${_p8243};
	server 127.0.0.1:${_p8243 + 1};
}

server {
	listen 443;
	server_name ei.wso2.com;

    ssl on;
    ssl_certificate /etc/nginx/ssl/server.crt;
	ssl_certificate_key /etc/nginx/ssl/server.key;

    location / {
		proxy_set_header X-Forwarded-Host $host;
		proxy_set_header X-Forwarded-Server $host;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $http_host;
		proxy_read_timeout 5m;
		proxy_send_timeout 5m;
		proxy_pass https://ssl.wso2.ei.com;

		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
	}
}`;
	fs.writeFileSync(path.join(p, 'ei.https.conf'), https, _utf8);

	let ui = `server {
    listen 443;
	server_name ui.ei.wso2.com;

    ssl on;
    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;

    location / {
		proxy_set_header X-Forwarded-Host $host;
		proxy_set_header X-Forwarded-Server $host;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $http_host;
		proxy_read_timeout 5m;
		proxy_send_timeout 5m;
		proxy_pass https://127.0.0.1:9443/;

		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
	}
}`;
	fs.writeFileSync(path.join(p, 'ui.ei.https.conf'), ui, _utf8);
}
