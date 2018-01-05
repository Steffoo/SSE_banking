/********************/
/* Required modules */
/********************/
const express = require('express');
const path = require('path');
const winston = require('winston');
const bodyParser = require('body-parser');
const ip = require('ip');
const jsonFile = require('jsonfile');

const app = express();


/*********/
/* Files */
/*********/
var frontendDir;
const logFile = './data/log/server.log';
const databaseFile = './data/secret/database_info.json';


/**********/
/* Fields */
/**********/
var databaseInformation;
var ipAddress = ip.address();


/****************************/
/* Account functions routes */
/****************************/
const loginRoute = require('./routes/loginRoute.js');
const registerRoute = require('./routes/registerRoute.js');
const changePassword = require('./routes/changePassword.js');
const lockAccount = require('./routes/lockAccount.js');
const deleteAccount = require('./routes/deleteAccount.js');


/**************************************************/
/* Account transfer and movement functions routes */
/**************************************************/
const accountMovement = require('./routes/accountMovement.js');
const accountTransfer = require('./routes/accountTransfer.js');


/******************/
/* Configurations */
/******************/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const levels = { 
  error: 0, 
  warn: 1, 
  info: 2, 
  verbose: 3, 
  debug: 4, 
  silly: 5 
} 

const logger = winston.createLogger({
	transports: [
		new winston.transports.File({filename: logFile}),
		new winston.transports.Console({timestamp: true})
	]
});

if(process.env['RUNNING_VIA_DOCKER']) {
	logger.log({
		level: 'info',
		message: 'Running inside a docker environment.'
	});

	frontendDir = './public/src';
} else {
	logger.log({
		level: 'info',
		message: 'Running outside a docker environment.'
	});

	frontendDir = '../frontend/src';
}


/******************/
/* MISC functions */
/******************/
// Reades data bade file
(function readDataBaseFile(){
	jsonFile.readFile(databaseFile, function(err, obj) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});
		}else{
			databaseInformation = {
				user: obj.user,
				password: obj.password,
				port: obj.port,
				database: obj.database,
				ip: ipAddress
			}

			writeToDataBaseFile();

			logger.log({
				level: 'info',
				message: 'Successfully read data base file.'
			});
		}
	})
})();

// Writes to data base file
function writeToDataBaseFile(){
	jsonFile.writeFile(databaseFile, databaseInformation, function (err) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});
		} else {
			logger.log({
				level: 'info',
				message: 'Added current IP address to data base file.'
			});
		}
	})
}


/********************/
/* Request handling */
/********************/
app.use(express.static(path.join(__dirname, frontendDir)));
app.use('/login', loginRoute);
app.use('/register', registerRoute);


/************/
/* Listener */
/************/
app.set('port', 3000);

app.listen(app.get('port'), function(){
	logger.log({
		level: 'info',
		message: 'Listening on port ' + app.get('port')
	});
})