/********************/
/* Required modules */
/********************/
const express = require('express');
const winston = require('winston');
const mysql = require('mysql');
var bodyParser = require('body-parser');

const router = express.Router();


/*********/
/* Files */
/*********/
const logFile = '../data/log/server.log';


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
	var account = {
		username: req.body.username,
		password: req.body.password
	}

	var success = sendRequestToDatabase(account);

	if(success === true){
		var resBody = {
			status: true,
		}
	}

	res.send(resBody);
	res.redirect();
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


module.exports = router;