/********************/
/* Required modules */
/********************/
const express = require('express');
const fs = require('fs');
const winston = require('winston');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const CryptoJS = require('crypto-js');

const router = express.Router();


/*********/
/* Files */
/*********/
const logFile = '../data/log/server.log';
const secret = '../data/secret/key.txt';


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

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'gruppe6',
	password: 'sse_rulez',
	database: 'sse_banking'
});


/********************/
/* Request handling */
/********************/
router.post('/', function(req, res){
	var newAccount = {
		iban: req.body.iban,
		firstName: req.body.firstName,
		name: req.body.name,
		username: req.body.username,
		address: req.body.address,
		telephonenumber: req.body.telephonenumber,
		email: req.body.email,
		password: req.body.password,
		balance: req.body.balance,
		locked: req.body.locked,
		reasonForLock: req.body.reasonForLock
	}

	sendRequestToDatabase(newAccount);

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