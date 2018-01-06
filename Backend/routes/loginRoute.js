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
var iban;
var id;

router.post('/', function(req, res){
	var account = {
		username: req.body.username,
		password: req.body.password
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

        if(iban !== null && iban != undefined){
        	var id;

        	async.series([
        		function(callback) {establishSession(iban, callback);},
        		function(callback) {getSession(iban, callback);}
        	], function(err){
        		if (err) {
            		logger.log({
						level: 'error',
						message: err
					});
        		}

        		connection.end(function(err) {
  					// The connection is terminated now
				});

        		var resBody = {
					status: true,
					sessionID: id
				}

				res.send(resBody);
        	});
        }
    });
})


/******************/
/* MISC functions */
/******************/
// Sends an insert to the database to register a new account
function sendRequestToDatabase(account, callback){
	var select = 'SELECT username, password, iban, triesLeft, lock FROM account ';
	var where = 'WHERE username="' + account.username + '";';

	var query = select + where;

	connection.query(query, function(err, result, fields) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});
		} else{
			logger.log({
				level: 'info',
				message: 'Query sent to data base.'
			});

			logger.log({
				level: 'info',
				message: result
			});

			if(result[0].lock === 0){
				var decrypted = cryptoJS.AES.decrypt(result[0].password, aesKey).toString(cryptoJS.enc.Utf8);

				if(account.password === decrypted){
					iban = result[0].iban;
					callback();
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
						})

						errorBody = {
							errorCode: 'Das Passwort in incorrect',
							errorMessage: 'Sie haben noch ' + (result[0].triesLeft-1) + ' Versuche.'
						}
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
						})

						errorBody = {
							errorCode: 'Account gesperrt',
							errorMessage: 'Sie haben es nicht geschafft sich nach drei versuchen anzumelden.'
						}
					}
				}
			} else {
				errorBody = {
					errorCode: 'Account gesperrt',
					errorMessage: 'Wenden Sie sich an einen Administrator.'
				}
			}
		}
	})
}

// Reduces the count for login tries
function reduceTries(iban, triesLeft, callback){
	var update = 'UPDATE account ';
	var set = 'SET triesLeft = ' + triesLeft + ' ';
	var where = 'WHERE iban="' + iban + '";';

	var query = update + set + where;

	connection.query(query, function(err, result, fields) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});
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

// Locks an account
function lockAccount(iban, callback){
	var update = 'UPDATE account ';
	var set = 'SET lock = ' + 1 + ', reasonForLock = "Failed to login after three attempts."';
	var where = 'WHERE iban="' + iban + '";';

	var query = update + set + where;

	connection.query(query, function(err, result, fields) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});
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
function establishSession(iban, callback){
	var date = new Date();
	var time = date.getTime();
	var tenMinutesMiliS = 600000;
	var sessionTime = time+tenMinutesMiliS;

	async.series([
		function (callback) {checkForExistingSessions(iban, callback);}
	], function(err){
		if (err) {
            logger.log({
				level: 'error',
				message: err
			});
        }

        if(tokenExists === true){
        	async.series([
        		function(callback) {renewSession(iban, sessionTime, callback);}
        	], function(err){
        		if (err) {
            		logger.log({
						level: 'error',
						message: err
					});
        		}
        	})
        }else {
        	async.series([
        		createNewSession(iban, sessionTime, callback)
        	], function(err){
        		if (err) {
            		logger.log({
						level: 'error',
						message: err
					});
        		}
        	})
        }
	})
}

// Checks for allready existing session
function checkForExistingSessions(iban, callback){
	var select = 'SELECT sessionId FROM session ';
	var where = 'WHERE iban="' + iban + '";';

	var query = select + where;

	connection.query(query, function(err, result, fields) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});
		} else{
			logger.log({
				level: 'info',
				message: 'Query sent to data base.'
			});

			logger.log({
				level: 'info',
				message: result
			});

			if(result != null || result != undefined){
				tokenExists = true;
				callback();
			}
		}
	})
} 

function renewSession(iban, sessionTime, callback){
	var update = 'UPDATE sessions ';
	var set = 'SET sessionTime=' + sessionTime.toString() + ' ';
	var where = 'WHERE iban="' + iban + '";';

	var query = update + set + where;

	connection.query(query, function(err, result, fields) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});
		} else{
			logger.log({
				level: 'info',
				message: 'Session renewed.'
			});

			logger.log({
				level: 'info',
				message: result
			});
		}
	})
}

// Creates a new session
function createNewSession(iban, sessionTime, callback){
	var id = createSessionID();

	var insert = 'INSERT INTO session (sessionId, iban, expirationTime) ';
	var values = 'VALUES ("'+ id + '","' + iban + '","' + sessionTime.toString() + '");'

	var query = insert + values;

	connection.query(query, function(err, result, fields) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});
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

// Gets the sessionID
function getSession(iban, callback){
	var select = 'SELECT sessionId FROM session ';
	var where = 'WHERE iban="' + iban + '";';

	var query = select + where;

	connection.query(query, function(err, result, fields) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});
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