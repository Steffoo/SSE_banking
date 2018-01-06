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

router.post('/', function(req, res){
	errorBody = null; 

	async.series([
        function(callback) {readSecretFile(callback);},
        function(callback) {readDatabaseFile(callback);},
        function(callback) {createNewIban(callback);}
    ], function(err) {
        if (err) {
            logger.log({
				level: 'error',
				message: err
			});
        }

        var encrypted = cryptoJS.AES.encrypt(req.body.password, aesKey);

		var newAccount = {
			iban: iban,
			firstName: req.body.firstName,
			lastName: req.body.name,
			username: req.body.username,
			address: req.body.address,
			telephonenumber: req.body.telephonenumber,
			email: req.body.email,
			pwd: encrypted.toString(),
			balance: req.body.balance,
			locked: 0,
			reasonForLock: null
		}

	    async.series([
	       	function(callback) {sendRequestToDatabase(newAccount, callback)}
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

			if(errorBody != null){
				var resBody = {
					status: false,
					code: errorBody.errorCode,
					message: errorBody.errorMessage
				}

				res.send(resBody);
			} else {
				var resBody = {
					status: true
				}

				res.send(resBody);
			}
		})
    });
})


/******************/
/* MISC functions */
/******************/
var ibanExists;

// Creates an IBAN-Number
function createNewIban(callback){
	ibanExists = true;

	async.series([
		function(callback) {generateIban(callback);},
		function(callback) {checkForIbans(callback);}
	], function (err){
		if (err) {
	        logger.log({
				level: 'error',
				message: err
			});
	    }

	    if(ibanExists === false){
			callback();
		}
	})
}

// Generates a random iban number
function generateIban(callback){
	iban  = "DE";
	var chars = "0123456789";

	for(var i = 0; i < 20; i++){
		var random = Math.floor(Math.random() * chars.length);
		iban += chars.charAt(random);

		if(i === 19){
			callback();
		}
	}
}

// Checks for already existing iban numbers
function checkForIbans(callback){
	var select = 'SELECT username FROM accounts ';
	var where = 'WHERE iban="' + iban + '";';

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

			console.log(result.length);

			if(result.length === 0){
				ibanExists = false;
			}

			callback();
		}
	})
}

// Sends an insert to the database to register a new account
function sendRequestToDatabase(newAccount, callback){
	var insert = 'INSERT INTO accounts (iban, firstName, lastName, username, address, telephonenumber, email, pwd, balance, locked, reasonForLock) ';
	var values = 'VALUES ("'
	+ newAccount.iban 
	+ '","' + newAccount.firstName 
	+ '","' + newAccount.lastName 
	+ '","' + newAccount.username 
	+ '","' + newAccount.address 
	+ '","' + newAccount.telephonenumber 
	+ '","' + newAccount.email 
	+ '","' + newAccount.pwd 
	+ '",' + newAccount.balance 
	+ ',' + newAccount.locked 
	+ ',"' + newAccount.reasonForLock + '");'

	var query = insert + values;

	connection.query(query, function(err, result, fields) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});

			errorBody = {
				errorCode: err.code,
			}

			if(err.sqlMessage.includes('PRIMARY')){
				errorBody.errorMessage = 'Es existiert ein Konto mit der IBAN-Nummer.';
			} else if (err.sqlMessage.includes('username')){
				errorBody.errorMessage = 'Es existiert ein Konto mit dem Benutzernamen.';	
			}
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

		callback();
	})
}

module.exports = router;