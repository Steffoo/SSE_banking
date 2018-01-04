/********************/
/* Required modules */
/********************/
const express = require('express');
const winston = require('winston');
const mysql = require('mysql');

const router = express.Router();


/*********/
/* Files */
/*********/
const logFile = '../data/log/server.log';


/******************/
/* Configurations */
/******************/
winston.configure({
	transports: [
		new (winston.transports.File)({filename: logFile}),
		new (winston.transports.Console)({timestamp: true})
	]
});

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'gruppe6',
	password: 'sse_rulez'
});


/********************/
/* Request handling */
/********************/
router.post('/', function(req res){
	var newAccount = {
		firstName = req.body.firstName,
		name = req.body.name,
		username = req.body.username,
		address = req.body.address,
		telephonenumber = req.body.telephonenumber,
		email = req.body.email,
		password = req.body.password,
		balance = req.body.balance,
		locked = req.body.locked,
		reasonForLock = req.body.reasonForLock
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
	var insert = 'INSERT INTO account (firstName, name, username, address, telephonenumber, email, password, balance, locked, reasonForLock) ';
	var values = 'VALUES (' 
	+ newAccount.firstName 
	+ ',' + newAccount.name 
	+ ',' + newAccount.username 
	+ ',' + newAccount.address 
	+ ',' + newAccount.telephonenumber 
	+ ',' + newAccount.email + ',' 
	+ newAccount.password + ',' 
	+ newAccount.balance + ',' 
	+ newAccount.locked + ',' 
	+ newAccount.reasonForLock ');'

	var query = inser + values;

	// Open connection and send query to database
	connection.connect(function(err){
		if(err){
			winston.log('Fatal', err);
			throw err;
		}

		winston.log('Info', 'Connection established.');

		connection.query(query, function(err, result, fields) {
			if(err){
				winston.log('Fatal', err);
				throw err;
			}

			winston.log('Info', 'Query sent to data base.');

			winston.log('Info', result);
		})
	})
}

module.exports = router;