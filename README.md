<h1 align='center'>hydrogen</h1>

<p align='center'>An interactive CLI tool for WSO2 Servers</p>

<br>

<br>

<p align="center">
  <img width="200" src="src/img/hydrogen.png">
</p>

<br>

<br>

[![CircleCI](https://circleci.com/gh/athiththan11/hydrogen.svg?style=svg&circle-token=bf27e3287ab3c738b05245a3e62f57b965929aa1)](https://circleci.com/gh/athiththan11/hydrogen)	[![codecov](https://codecov.io/gh/athiththan11/hydrogen/branch/master/graph/badge.svg?token=hW0h8hmvra)](https://codecov.io/gh/athiththan11/hydrogen)

[:construction: Work In Progress]

## Intro

A command line tool to alter and configure fresh packs of WSO2 products for different requirements. The `hydrogen` supports to perform the following alterations and configurations ...

* Replace H2 databases of WSO2 IS with other supported databases
* Configure API manager for distributed deployment
* Configure API manager and IS as Keymanager

## Commands

Below listed are the available commands and descriptions of `hydrogen`.

> All altered configurations are commented with `HYDROGENERATED:` keyword. If you want to list all the applied alterations, open a configured node and search for the keyword `HYDROGENERATED:` to list all the altered configurations.

### Datasource

To list available commands of `Datasource`, either run `hydrogen datasource` or execute `hydrogen datasource --help`.

```shell
Alter datasources of WSO2 products (fresh-pack) with supported datasource vendors

USAGE
  $ hydrogen [COMMAND]

DESCRIPTION
  ...
  Alter datasource configurations of WSO2 products based on your preference.

  List all available datasource commands using
  $ hydrogen datasource --help

EXAMPLE
  $ hydrogen datasource:is [FLAGS] [ARGS]

COMMANDS
  datasource:is  Alter datasources of WSO2 IS products (fresh-pack) with supported datasource models
```

`Datasource` commands are used to replace the default shipped H2 databases with other supported databases.

**NOTE** : As present the `hydrogen` only supports replacing the H2 databases of WSO2 IS packs (v5.7) and later will be expanded to cover other supported versions and products.

To go to the WSO2 IS related `datasource` commands, click [here](#datasourceis).

> For more information on changing the H2 databases and configurations of WSO2 Packs, visit [here](https://docs.wso2.com/display/ADMIN44x/Changing+the+Carbon+Database).

#### datasource:is

To list available commands of `datasource:is`, run `hydrogen datasource:is --help`.

```shell
Alter datasources of WSO2 IS products (fresh-pack) with supported datasource models

USAGE
  $ hydrogen datasource:is [FLAGS] [ARGS]

OPTIONS
  -R, --replace                           replace h2 datasource
  -c, --container                         create docker container for datasource
  -d, --datasource=postgres|mysql|oracle  (required) datasource type
  -g, --generate                          generate databases and tables in the container
  -v, --version=5.7                       (required) [default: 5.7] wso2is product version

DESCRIPTION
  ...
  Alter datasource configurations of WSO2 IS products based on your preference.

  As of now, Hydrogen only supports replacing the default H2 datasource with a variety
  of available supported datasource models. To replace the default shipped H2 datasource,
  use --replace (-R) and pass supported datasource with --datasource flag (--datasource mysql).

EXAMPLES
  Replace H2 with Postgres
  $ hydrogen datasource:is -R -v 5.7 -d postgres
  Replace H2 with Postgres and generate a container for database
  $ hydrogen datasource:is -R -v 5.7 -d postgres --container --generate
```

`datasource:is` commands are used to replace the default shipped H2 databases of WSO2 IS packs with other supported databases.

As present the `hydrogen` only supports replacing the H2 databases of WSO2 IS packs (v5.7) with

* Postgres
* MySQL
* Oracle

databases, and later will be expanded to cover other supported databases and versions.

The `datasource:is` commands also do support to generate Docker containers with databases and tables while configuring the WSO2 packs. Below are the supported databases to generate Docker containers

* Posgres : `v9.6`

For usages and examples, navigate to [here](#datasource-examples).

### Distribute

To list available commands of `Distribute`, either run `hydrogen distribute` or execute `hydrogen distribute --help`.

```shell
Configure WSO2 products for distributed deployments

USAGE
  $ hydrogen [COMMAND]

DESCRIPTION
  ...
  Configure WSO2 products for supported distributed deployment setups.

  As of now, Hydrogen only supports WSO2 APIM products to distribute it in either 5 nodes
  distributed setup or as publish through multiple gateway setup.

  List all available distribute commands using
  $ hydrogen distribute --help

EXAMPLE
  $ hydrogen distribute:am [FLAGS] [ARGS]

COMMANDS
  distribute:am  Configure WSO2 APIM products (fresh-pack) for distributed deployments
```

`Distribute` commands are used to configure the WSO2 packs for distributed deployment setups.

**NOTE** : As present the `hydrogen` only supports distributed WSO2 APIM packs (v2.6) and later will be expanded to cover other supported versions and distributions.

To go to the WSO2 APIM related `distribute` commands, click [here](#distributeam).

> For more information on configuring WSO2 APIM for distributed environments, visit [here](https://docs.wso2.com/display/AM260/Deploying+WSO2+API+Manager).

#### distribute:am

```shell
Configure WSO2 APIM products (fresh-pack) for distributed deployments

USAGE
  $ hydrogen distribute:am

OPTIONS
  -D, --distributed       5 node distributed setup
  -I, --is-km             IS as Keymanager setup
  -M, --multiple-gateway  publish through multiple gateway

DESCRIPTION
  ...
  Configure WSO2 APIM products for distributed deployments setup based on your preference.

  As of now, Hydrogen only supports configurations for 5 node distributed deployment setup,
  and publish through multiple-gateway node setup. For 5 node distribution, use --distributed (-D)
  flag, and for multiple-gateway node, use --multiple-gateway (-M) flag.

EXAMPLES
  Configure APIM for 5 node distributed setup
  $ hydrogen distribute:am -D -v 2.6
  Configure APIM for publish through multiple-gateway setup
  $ hydrogen distribute:am -M -v 2.6
```

`distribute:am` commands are used to configure the WSO2 APIM packs for distributed deployment setups.

As present the `hydrogen` only supports configuring distributed setups for WSO2 APIM (v2.6) packs with

* 5 node distributed deployment
* Publish through multiple gateways
* IS as Keymanager

setups, and later will be expanded to cover other supported deployment patterns and configurations.

> **NOTE** : The `distribute:am` commands **are not** enhanced to create databases and to generate containers for databases and tables for the distributed environments.

For usages and examples, navigate to [here](#distribute-examples).

---

## Examples

### Datasource Examples

* Need to configure WSO2 IS v5.7 with `Postgres` by replacing the default shipped H2 Carbon database
  * Download and extract a fresh pack of WSO2 IS v5.7
  * Open a terminal and navigate to the root of the extracted WSO2 IS pack
  * Execute the following
	```shell
	# inside wso2is-5.7
	hydrogen datasource:is --replace --datasource postgres --version 5.7
	```

* Need to configure WSO2 IS v5.7 with `Postgres` by replacing the default shipped H2 Carbon database and also to generate a Docker container with databases
  * Download and extract a fresh pack of WSO2 IS v5.7
  * Start the Docker service in your environment (if you don't have Docker intalled, install Docker before executing the command to work without any errors)
  * Open a terminal and navigate to the root of the extracted WSO2 IS pack
  * Execute the following
	```shell
	# inside wso2is-5.7
	hydrogen datasource:is --replace --datasource postgres --version 5.7 --container --generate
	```
	The above command will create a `Postgres` Docker container with a random name (an animal name) with the databases and tables.

### Distribute Examples

* Need to configure a 5 node distributed setup with WSO2 APIM v2.6 pack
  * Download and extract a fresh pack of WSO2 APIM v2.6 inside a new directory (only containing the extracted WSO2 APIM pack)
	```tree
	- MyNewFolder
    	|- wso2am-2.6
	```
  * Open terminal and navigate to the parent folder of the extracted WSO2 APIM pack
  * Execute the following
	```shell
	# inside MyNewFolder
	hydrogen distribute:am --distributed --version 2.6
	```
	The above command will create a new folder named `distributed` and places all configured 5 nodes within it.

* Need to configure WSO2 APIM v2.6 for [publish through multiple-gateway](https://docs.wso2.com/display/AM260/Publish+through+Multiple+API+Gateways) setup.
  * Download and extract a fresh pack of WSO2 APIM v2.6 inside a new directory (only containing the extracted WSO2 APIM pack)
	```tree
	- MyNewFolder
    	|- wso2am-2.6
	```
  * Open terminal and navigate to the parent folder of the extracted WSO2 APIM pack
  * Execute the following
	```shell
	# inside MyNewFolder
	hydrogen distribute:am --multiple-gateway --version 2.6
	```
	The above command will create a new folder named `distributed` and places all configured nodes within it.

* Need to configure WSO2 APIM v2.6 with IS-KM v5.7
  * Download and extract both WSO2 APIM v2.6 and IS-KM v5.7 inside a new directory (only containing the extracted WSO2 APIM pack & the IS-KM pack)
  * Open a terminal and navigate to the parent folder of the extracted packs
  * Execute the following
	```shell
	hydrogen distribute:am --is-km --version 2.6
	```

---

## TODO

- [ ] datasource:is
  - [ ] container support and database generation
  - [ ] support other databases
    - [ ] MSSQL
    - [ ] DB2
- [ ] distribute:am
  - [ ] support other deployment patterns

& more...
