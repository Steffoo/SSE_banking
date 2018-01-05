/********************/
/* Required modules */
/********************/
const express = require('express');
const winston = require('winston');
const mysql = require('mysql');
var bodyParser = require('body-parser');
const cryptoJS = require('crypto-js');

const router = express.Router();


/*********/
/* Files */
/*********/
const logFile = '../data/log/server.log';


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
function readSecretFile(newAccount){
	jsonFile.readFile(secret, function(err, obj) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});
		}else{
			aesKey = obj.passphrase;

			readDatabaseFile(newAccount);

			logger.log({
				level: 'info',
				message: 'Successfully read secret file.'
			});
		}
	})
}

// Reads the data base file
function readDatabaseFile(newAccount){
	jsonFile.readFile(databaseInfo, function(err, obj) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});
		}else{
			var decrypted = cryptoJS.AES.decrypt(obj.password, aesKey).toString(cryptoJS.enc.Utf8);

			connection = mysql.createConnection({
				host: obj.host,
				user: obj.user,
				password: decrypted,
				database: obj.database
			});

			sendRequestToDatabase(newAccount);

			logger.log({
				level: 'info',
				message: 'Successfully read data base file.'
			});
		}
	})
}


/********************/
/* Request handling */
/********************/
router.post('/', function(req, res){
	var account = {
		username: req.body.username,
		password: req.body.password
	}

	var success = sendRequestToDatabase(account);

	if(success === true){
		establishSession();
		var id = getSessionID();
		
		var resBody = {
			status: true,
			sessionID: id
		}

		res.send(resBody);
	}
})


/******************/
/* MISC functions */
/******************/
// Sends an insert to the database to register a new account
function sendRequestToDatabase(account){
	var success = false;
	var select = 'SELECT username, password FROM account ';
	var where = 'WHERE username="' + account.username + '";';

	var query = select + where;

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

				if(account.password === result[0].password){
					success = true;
				}
			}
		})
	})

	return success;
}

// Establishes a session which is stored in the MYSQL-DB
function establishSession(){
	var date = new Date();
	var time = date.getTime();
	var tenMinutesMiliS = 600000;
	var id = createSessionID();

	var insert = 'INSERT INTO session (id, expirationTime) ';
	var values = 'VALUES ("'+ id + '",' + (time+tenMinutesMiliS) + ');'

	var query = insert + values;

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

		connection.query(query, function(err, result, fields) {
			if(err){
				logger.log({
					level: 'error',
					message: err
				});
			} else {
				logger.log({
					level: 'info',
					message: 'Query sent to data base.'
				});

				logger.log({
					level: 'info',
					message: result
				});
			}
		})
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


module.exports = router;