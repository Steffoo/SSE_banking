/********************/
/* Required modules */
/********************/
const express = require('express');
const jsonFile = require('jsonfile');
const winston = require('winston');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cryptoJS = require('crypto-js');

const router = express.Router();


/*********/
/* Files */
/*********/
const logFile = './data/log/server.log';
const secret = './data/secret/secret.json';
const databaseInfo = './data/secret/database_info.json';


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
	var encrypted = cryptoJS.AES.encrypt(req.body.password, aesKey);

	var newAccount = {
		iban: req.body.iban,
		firstName: req.body.firstName,
		name: req.body.name,
		username: req.body.username,
		address: req.body.address,
		telephonenumber: req.body.telephonenumber,
		email: req.body.email,
		password: encrypted.toString(),
		balance: req.body.balance,
		locked: req.body.locked,
		reasonForLock: req.body.reasonForLock
	}

	readSecretFile(newAccount);

	var resBody = {
		status: true
	}

	res.send(resBody);
})


/******************/
/* MISC functions */
/******************/
// Sends an insert to the database to register a new account
function sendRequestToDatabase(newAccount){
	var insert = 'INSERT INTO account (iban, firstName, name, username, address, telephonenumber, email, password, balance, locked, reasonForLock) ';
	var values = 'VALUES ("'
	+ newAccount.iban 
	+ '","' + newAccount.firstName 
	+ '","' + newAccount.name 
	+ '","' + newAccount.username 
	+ '","' + newAccount.address 
	+ '","' + newAccount.telephonenumber 
	+ '","' + newAccount.email 
	+ '","' + newAccount.password 
	+ '",' + newAccount.balance 
	+ ',' + newAccount.locked 
	+ ',"' + newAccount.reasonForLock + '");'

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

module.exports = router;