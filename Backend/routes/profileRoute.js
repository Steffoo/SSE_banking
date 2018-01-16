/********************/
/* Required modules */
/********************/
const express = require('express');
const jsonFile = require('jsonfile');
const winston = require('winston');
const mysql = require('mysql');
var bodyParser = require('body-parser');
const cryptoJS = require('crypto-js');
const async = require('async');

const router = express.Router();


/*********/
/* Files */
/*********/
const logFile = './data/log/server.log';
const secretFile = './data/secret/secret.json';
const databaseFile = './data/secret/database_info.json';


/*********/
/* Fields*/
/*********/
var errorBody = null;
var body = null;
var info = null;


/*********************************/
/* Key and data base information */
/*********************************/
var aesKey;
var connection;


/******************/
/* Configurations */
/******************/
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false })); 

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

// Reads the secret file
function readSecretFile(callback){
	jsonFile.readFile(secretFile, function(err, obj) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});
		}else{
			aesKey = obj.passphrase;

			logger.log({
				level: 'info',
				message: 'Successfully read secret file.'
			});

			callback();
		}
	})
}

// Reads the data base file
function readDatabaseFile(callback){
	jsonFile.readFile(databaseFile, function(err, obj) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});
		}else{
			var decrypted = cryptoJS.AES.decrypt(obj.password, aesKey).toString(cryptoJS.enc.Utf8);

			logger.log({
				level: 'info',
				message: 'Successfully read data base file.'
			});

			connection = mysql.createConnection({
				host: obj.host,
				user: obj.user,
				password: decrypted,
				database: obj.database
			});

			// Open connection and send query to database
			connection.connect(function(err){
				if(err){
					logger.log({
						level: 'error',
						message: err
					});
					throw err;
				}

				logger.log({
					level: 'info',
					message: 'Connection established.'
				});
			});

			callback();
		}
	})
}


/********************/
/* Request handling */
/********************/
var id;

router.post('/', function(req, res){
	info = null;
	body = null;
	errorBody = null;

	var account = {
		username: req.body.username,
		sessionId: req.body.sessionId
	}

	async.series([
        function(callback) {readSecretFile(callback);},
        function(callback) {readDatabaseFile(callback);},
        function(callback) {getSession(account.username, account.sessionId, callback);},
        function(callback) {
        	if(errorBody === null){
        		sendRequestToDatabase(account.username, callback);
        	} else {
        		callback();
        	}
        }
    ], function(err) {
        if (err) {
            logger.log({
				level: 'error',
				message: err
			});
        }

        connection.end(function(err) {
  			logger.log({
				level: 'info',
				message: 'Data base connection terminated.'
			});
		});

		if(errorBody === null && info === null && body != null){
			var resBody = {
				status: true,
				iban: body.iban,
				firstName: body.firstName,
     			lastName: body.lastName, 
				username: body.username,
				address: body.address,
				telephonenumber: body.telephonenumber,
				email: body.email,
				balance: body.balance
			}

			res.send(resBody);
		}else if(errorBody === null && info === null && body === null){
			var resBody = {
				status: true,
				iban: 'Not There',
				firstName: 'Not There',
     			lastName: 'Not There', 
				username: 'Not There',
				address: 'Not There',
				telephonenumber: 'Not There',
				email: 'Not There',
				balance: 'Not There'
			}

			res.send(resBody);
		} else if(errorBody != null && info === null){
			var resBody = {
				status: false,
				code: errorBody.errorCode,
				message: errorBody.errorMessage
			}

			res.send(resBody);
		} else if(errorBody === null && info != null){
			var resBody = {
				status: true,
				message: info
			}

			res.send(resBody);
		}
    });
})

// Gets the sessionID
function getSession(username, sessionId, callback){
	var date = new Date();
	var time = date.getTime();

	var select = 'SELECT sessionId, expirationTime FROM sessions ';
	var where = 'WHERE username="' + username + '" AND sessionId="' + sessionId + '";';

	var query = select + where;

	logger.log({
		level: 'error',
		message: 'Query sent: ' + query
	});

	connection.query(query, function(err, result, fields) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});

			callback();
		} else{
			logger.log({
				level: 'info',
				message: 'Session recieved.'
			});

			logger.log({
				level: 'info',
				message: result
			});

			if(result != undefined && result != null){
				if(result.length != 0){
								if(time <= parseInt(result[0].expirationTime)){
				async.series([
					function(callback) {increaseExpirationTime(username, sessionId, callback);}
				], function(err){
					if (err) {
			            logger.log({
							level: 'error',
							message: err
						});
			        }

			        id = result[0].sessionId;
					callback();
				})
			} else {
				errorBody = {
					errorCode: 'Schlechte Session',
					errorMessage: 'Session ist abgelaufen.'
				}

				callback();
			}
				}
			} else {
				callback();
			}
		}
	})
}

// Increases the expiration time of a session
function increaseExpirationTime(username, sessionId, callback){
	var date = new Date();
	var time = date.getTime();
	var tenMinutesMiliS = 600000;
	var sessionTime = time+tenMinutesMiliS;

	var update = 'UPDATE sessions ';
	var set = 'SET expirationTime=' + sessionTime.toString() + ' ';
	var where = 'WHERE username="' + username + '" AND sessionId="' + sessionId + '";';

	var query = update + set + where;

	logger.log({
		level: 'error',
		message: 'Query sent: ' + query
	});

	connection.query(query, function(err, result, fields) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});

			callback();
		} else{
			logger.log({
				level: 'info',
				message: 'Session time increased.'
			});

			logger.log({
				level: 'info',
				message: result
			});

			callback();
		}
	})
}

// Send request to database
function sendRequestToDatabase(username, callback){
	var select = 'SELECT iban, firstName, lastName, username, address, telephonenumber, email, balance FROM accounts ';
	var where = 'WHERE username="' + username + '";';

	var query = select + where;

	logger.log({
		level: 'error',
		message: 'Query sent: ' + query
	});

	connection.query(query, function(err, result, fields) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});

			callback();
		} else{
			logger.log({
				level: 'info',
				message: 'Query sent.'
			});

			logger.log({
				level: 'info',
				message: result
			});

			if (result.length === 0){
				info = 'Es gibt keinen Benutzer mit diesem Usernamen.';
				callback();
			// else if(){

			} else {
				body = {
					iban: result[0].iban,
					firstName: result[0].firstName,
					lastName: result[0].lastName,
					username: result[0].username,
					address: result[0].address,
					telephonenumber: result[0].telephonenumber,
					email: result[0].email,
					balance: result[0].balance
				}
				callback();
			}
		}
	})
}


module.exports = router;