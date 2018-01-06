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
router.get('/', function(req, res){
	var account = {
		iban: req.boby.iban,
		session: req.body.sessionId
	}

	async.series([
        function(callback) {readSecretFile(callback);},
        function(callback) {readDatabaseFile(callback);},
        function(callback) {getSession(iban, callback);},
        function(callback) {sendRequestToDatabase(, callback);}
    ], function(err) {
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
})


/******************/
/* MISC functions */
/******************/
// Sends an insert to the database to register a new account
function sendRequestToDatabase(account, callback){
	var select = 'SELECT username, password, iban FROM account ';
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
		}
	})
}

// Gets the sessionID
function getSession(iban, callback){
	var date = new Date();
	var time = date.getTime();

	var select = 'SELECT sessionId, expirationTime FROM session ';
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

			if(time < parseInt(result[0].expirationTime)){
				id = result[0].sessionId;
				callback();
			}
		}
	})
}

module.exports = router;