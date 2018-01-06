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

var transferError1;
var transferError2;
var transferError3;
var transferStatus;
router.post('/', function(req, res){
	var transfer = {
		username_owner: req.body.username_owner,
    username_recipient: req.body.username_recipient,
    amount: req.body.amount,
    purpose: req.body.purpose,
    sessionId: req.body.sessionId
	}

	async.series([
        function(callback) {readSecretFile(callback);},
        function(callback) {readDatabaseFile(callback);},
        function(callback) {checkAmount(transfer,callback);},
        //function(callback) {getSession(account.username_owner, callback);},
        function(callback) {sendRequestToDatabase(transfer, callback);},
        function(callback) {updateBalance(transfer, callback);}
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

		var resBody = {
			status: transferStatus,
      errorMessage: JSON.stringify(transferError1)+" "+JSON.stringify(transferError2)+" "+JSON.stringify(transferError3)
		}

		res.send(resBody);
    });
})

var currentAmount;
function checkAmount(transfer, callback){

  var checkAmount = 'SELECT (balance) FROM accounts WHERE username ='+transfer.username_owner+';';

  connection.query(checkAmount, function(err, result, fields) {
    if(err){
      logger.log({
        level: 'error',
        message: err
      });
      transferError1 = err;
      callback();
    } else{
      currentAmount = result;
      logger.log({
        level: 'info',
        message: 'Checked current amount in data base: '+JSON.stringify(currentAmount[0].balance)
      });
      callback();
    }
})
}

function updateBalance(transfer, callback){

  var value = parseFloat(transfer.amount) + parseFloat(currentAmount[0].balance);
  var updateBalance = 'UPDATE accounts SET balance ='+value+' WHERE username ='+transfer.username_owner+';';
  connection.query(updateBalance, function(err, result, fields) {
    if(err){
      transferStatus = false;
      logger.log({
        level: 'error',
        message: err
      });
      transferError3 = err;
      callback();
    } else{
      transferStatus = true;
      logger.log({
        level: 'info',
        message: 'Updated balance in data base.'
      });
      callback();
    }

})

}

function sendRequestToDatabase(transfer, callback){
  var d = new Date();
  var m = new Date();
  var y = new Date();
  var date = y.getFullYear()+'-'+m.getMonth()+1+'-'+d.getDay();

    var insert = 'INSERT INTO accountmovement (username_owner, username_recipient, amount, purpose, movementDate) '
    var values = 'VALUES ('+transfer.username_owner+','+transfer.username_recipient+','+transfer.amount+','+transfer.purpose+',"'+ date +'");';

    var insertQuery = insert+values;

    connection.query(insertQuery, function(err, result, fields) {
      if(err){
        transferStatus = false;
        logger.log({
  				level: 'error',
  				message: err
  			});
        transferError2 = err;
        callback();
  		} else{
        transferStatus = true;
  			logger.log({
  				level: 'info',
  				message: 'Inserted movement in data base.'
  			});
        callback();
  		}
	})

}

module.exports = router;
