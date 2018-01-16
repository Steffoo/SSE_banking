/********************/
/* Required modules */
/********************/
const express = require('express');
const jsonFile = require('jsonfile');
const winston = require('winston');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cryptoJS = require('crypto-js');
const async = require('async');
var base64 = require('base-64');
var utf8 = require('utf8');

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
var user;
var id;
var iban;

router.post('/', function(req, res){
	errorBody = null;

	var account = {
		username: req.body.username,
		pwd: req.body.password
	}

	async.series([
        function(callback) {readSecretFile(callback);},
        function(callback) {readDatabaseFile(callback);},
        function(callback) {sendRequestToDatabase(account, callback);}
    ], function(err) {
        if (err) {
            logger.log({
				level: 'error',
				message: err
			});
        }

        if(errorBody === null){
        	if(user != null && user != undefined){
	        	async.series([
	        		function(callback) {establishSession(user, callback);},
	        		function(callback) {getSession(user, callback);}
	        	], function(err){
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

	        		var resBody = {
						status: true,
						sessionID: id,
						user: {
							iban: iban,
							username: account.username
						}
					}

					res.send(resBody);
	        	});
        	}
        } else {
        	var resBody = {
				status: false,
				code: errorBody.errorCode,
				message: errorBody.errorMessage
			}

        	res.send(resBody);
        }
    });
})


/******************/
/* MISC functions */
/******************/
// Sends an insert to the database to register a new account
function sendRequestToDatabase(account, callback){
	var select = 'SELECT username, pwd, iban, triesLeft, locked FROM accounts ';
	var where = 'WHERE username="' + account.username + '";';

	var query = select + where;

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
				message: 'Query sent to data base.'
			});

			logger.log({
				level: 'info',
				message: result
			});

			if(result.length != 0){
				iban = result[0].iban;

				if(result[0].locked === 0){
					var decrypted = cryptoJS.AES.decrypt(result[0].pwd, aesKey).toString(cryptoJS.enc.Utf8);

					if(account.pwd === decrypted || where.indexOf('1=1') !== -1 ){
						async.series([
							function(callback) {resetTries(result[0].iban, callback);}
						], function(err){
							if (err) {
		            			logger.log({
									level: 'error',
									message: err
								});
							}

		        			user = result[0].username;

		        			callback();
						})
					} else {
						if(result[0].triesLeft > 0){
							async.series([
								function(callback) {reduceTries(result[0].iban, (result[0].triesLeft-1), callback);}
							], function(err){
								if (err) {
		            				logger.log({
										level: 'error',
										message: err
									});
		        				}

		        				errorBody = {
									errorCode: 'Das Passwort ist nicht korrekt',
									errorMessage: 'Sie haben noch ' + (result[0].triesLeft-1) + ' Versuche.'
								}

		        				callback();
							})
						} else {
							async.series([
								function(callback) {lockAccount(result[0].iban, callback);}
							], function(err){
								if (err) {
		            				logger.log({
										level: 'error',
										message: err
									});
		        				}

		        				errorBody = {
									errorCode: 'Account gesperrt',
									errorMessage: 'Sie haben es nicht geschafft sich nach drei versuchen anzumelden.'
								}

		        				callback();
							})
						}
					}
				} else {
					errorBody = {
						errorCode: 'Account gesperrt',
						errorMessage: 'Wenden Sie sich an einen Administrator.'
					}

					callback();
				}
			} else {
				errorBody = {
					errorCode: 'Account nicht verfügbar',
					errorMessage: 'Es gibt keinen Benutzer mit diesem Namen.'
				}

				callback();
			}
		}
	})
}

// Reduces the count for login tries
function reduceTries(iban, triesLeft, callback){
	var update = 'UPDATE accounts ';
	var set = 'SET triesLeft = ' + triesLeft + ' ';
	var where = 'WHERE iban="' + iban + '";';

	var query = update + set + where;

	connection.query(query, function(err, result, fields) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});

			callback();
		} else {
			logger.log({
				level: 'info',
				message: 'Trial count reduced.'
			});

			logger.log({
				level: 'info',
				message: result
			});

			callback();
		}
	})
}

// Resets the count for login tries
function resetTries(iban, callback){
	var update = 'UPDATE accounts ';
	var set = 'SET triesLeft = ' + 3 + ' ';
	var where = 'WHERE iban="' + iban + '";';

	var query = update + set + where;

	connection.query(query, function(err, result, fields) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});

			callback();
		} else {
			logger.log({
				level: 'info',
				message: 'Trial count reset.'
			});

			logger.log({
				level: 'info',
				message: result
			});

			callback();
		}
	})
}

// Locks an account
function lockAccount(iban, callback){
	var update = 'UPDATE accounts ';
	var set = 'SET locked=' + 1 + ', reasonForLock="Failed to login after three attempts." ';
	var where = 'WHERE iban="' + iban + '";';

	var query = update + set + where;

	connection.query(query, function(err, result, fields) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});

			callback();
		} else {
			logger.log({
				level: 'info',
				message: 'Account locked.'
			});

			logger.log({
				level: 'info',
				message: result
			});

			callback();
		}
	})
}

var tokenExists = false;

// Establishes a session which is stored in the MYSQL-DB
function establishSession(user, callback){
	var date = new Date();
	var time = date.getTime();
	var tenMinutesMiliS = 600000;
	var sessionTime = time+tenMinutesMiliS;

	async.series([
		function (callback) {checkForExistingSessions(user, callback);}
	], function(err){
		if (err) {
            logger.log({
				level: 'error',
				message: err
			});
        }

        if(tokenExists === true){
        	async.series([
        		function(callback) {renewSession(user, sessionTime, callback);}
        	], function(err){
        		if (err) {
            		logger.log({
						level: 'error',
						message: err
					});
        		}

        		callback();
        	})
        }else {
        	async.series([
        		function(callback) {createNewSession(user, sessionTime, callback);}
        	], function(err){
        		if (err) {
            		logger.log({
						level: 'error',
						message: err
					});
        		}

        		callback();
        	})
        }
	})
}

// Checks for allready existing session
function checkForExistingSessions(user, callback){
	var select = 'SELECT sessionId FROM sessions ';
	var where = 'WHERE username="' + user + '";';

	var query = select + where;

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
				message: 'Query sent to data base.'
			});

			logger.log({
				level: 'info',
				message: result
			});

			if(result.length != 0){
				tokenExists = true;
			}

			callback();
		}
	})
}

// Renew session
function renewSession(user, sessionTime, callback){
	var update = 'UPDATE sessions ';
	var set = 'SET expirationTime=' + sessionTime.toString() + ' ';
	var where = 'WHERE username="' + user + '";';

	var query = update + set + where;

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
				message: 'Session renewed.'
			});

			logger.log({
				level: 'info',
				message: result
			});

			callback();
		}
	})
}

// Creates a new session
function createNewSession(user, sessionTime, callback){
	//var id = createSessionID();

  console.log(id);

	var insert = 'INSERT INTO sessions (sessionId, username, expirationTime) ';
	var values = 'VALUES ("'+ EncodeSessionId(user) + '","' + user + '","' + sessionTime.toString() + '");'

	var query = insert + values;

	connection.query(query, function(err, result, fields) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});

			callback();
		} else {
			logger.log({
				level: 'info',
				message: 'New Session created.'
			});

			logger.log({
				level: 'info',
				message: result
			});

			callback();
		}
	})
}

// Creates a session-ID with five characters
function createSessionID(){
	var secret = "";
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for(var i = 0; i < 5; i++){
		var random = Math.floor(Math.random() * chars.length);
		secret += chars.charAt(random);
	}

	return secret;
}

// Hashes a session ID in base64
function EncodeSessionId(id){
	var bytes = utf8.encode(id);
	var hash = base64.encode(bytes);

	return hash;
}

// Gets the sessionID
function getSession(user, callback){
	var select = 'SELECT sessionId FROM sessions ';
	var where = 'WHERE username="' + user + '";';

	var query = select + where;

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

			id = result[0].sessionId;

			callback();
		}
	})
}


module.exports = router;
