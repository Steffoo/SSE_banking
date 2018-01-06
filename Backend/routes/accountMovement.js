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
		username: req.body.username,
	}

	async.series([
        function(callback) {readSecretFile(callback);},
        function(callback) {readDatabaseFile(callback);},
        function(callback) {sendRequestToDatabase(, callback);}
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

			var decrypted = cryptoJS.AES.decrypt(result[0].password, aesKey).toString(cryptoJS.enc.Utf8);

			if(account.password === decrypted){
				iban = result[0].iban;
				callback();
			}
		}
	})
}

var tokenExists = false;

// Establishes a session which is stored in the MYSQL-DB
function establishSession(iban, callback){
	var date = new Date();
	var time = date.getTime();
	var tenMinutesMiliS = 600000;
	var id = createSessionID();

	async.series([
		function (callback) {checkForExistingSessions(callback);}
	], function(err){
		if (err) {
            logger.log({
				level: 'error',
				message: err
			});
        }
	})

	var insert = 'INSERT INTO session (sessionId, iban, expirationTime) ';
	var values = 'VALUES ("'+ id + '","' + iban + '","' + (time+tenMinutesMiliS).toString() + '");'

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
				message: 'Query sent to data base.'
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