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
var transferStatus;
var id;

router.post('/', function(req, res){
  errorBody = null;

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
    function(callback) {getSession(transfer.username_owner, transfer.sessionId, callback);},
    function(callback) {
      if(errorBody === null){
        checkIfAccountIsRecipient(transfer.username_owner, transfer.username_recipient, callback);
      } else {
        callback();
      }
    },
    function(callback) {
      if(errorBody === null){
        checkAmountOwner(transfer,callback);
      }else{
        callback();
      }
    },
    function(callback) {
      if(errorBody === null){
        checkAmountRecipient(transfer,callback);
      }else{
        callback();
      }
    },
    function(callback) {
      if(errorBody === null){
        sendRequestToDatabase(transfer, callback);
      }else{
        callback();
      }
    },
    function(callback) {
        if(errorBody === null){
          updateBalanceOwner(transfer, callback);
        } else {
          callback();
        }
    },
    function(callback) {
        if(errorBody === null){
          updateBalanceRecipient(transfer, callback);
        } else {
          callback();
        }
    }
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

      if(errorBody === null){
        var resBody = {
          status: transferStatus
        }

        res.send(resBody);
      } else{
        var resBody = {
          status: false,
          code: errorBody.errorCode,
          message: errorBody.errorMessage
        }

        res.send(resBody);
      }
    });
})

// Check if account is trying to benefit itself
function checkIfAccountIsRecipient(usernameOwner, usernameRecipient, callback){
  if(usernameOwner === usernameRecipient){
    errorBody = {
      errorCode: 'Netter Versuch',
      errorMessage: 'Sie können sich nichts selbst überweisen.'
    }
  }
  callback();
}

var currentAmountOwner;
function checkAmountOwner(transfer, callback){

  currentAmountOwner = null;

  var checkAmount = 'SELECT balance FROM accounts WHERE username ="'+transfer.username_owner+'";';

    logger.log({
    level: 'error',
    message: 'Query sent: ' + checkAmount
  });

  connection.query(checkAmount, function(err, result, fields) {
    if(err){
      logger.log({
        level: 'error',
        message: err
      });
      callback();
    } else{
      if(result.length != 0){
        currentAmountOwner = result;
        logger.log({
          level: 'info',
          message: 'Checked current amount in data base: '+JSON.stringify(currentAmountOwner[0].balance)
        });
        callback();
      } else {
        errorBody = {
          errorCode: 'User nicht vorhanden',
          errorMessage: 'Es gibt keinen Benutzer mit diesem Usernamen: ' + transfer.username_owner
        }
        callback();
      }
    }
})
}

var currentAmountRecipient;
function checkAmountRecipient(transfer, callback){

  currentAmountRecipient = null;

  var checkAmount = 'SELECT balance FROM accounts WHERE username ="'+transfer.username_recipient+'";';

  logger.log({
    level: 'error',
    message: 'Query sent: ' + checkAmount
  });

  connection.query(checkAmount, function(err, result, fields) {
    if(err){
      logger.log({
        level: 'error',
        message: err
      });
      callback();
    } else{
      if(result.length != 0){
        currentAmountRecipient = result;
        logger.log({
          level: 'info',
          message: 'Checked current amount in data base: '+JSON.stringify(currentAmountRecipient[0].balance)
        });
        callback();
      } else {
        errorBody = {
          errorCode: 'User nicht vorhanden',
          errorMessage: 'Es gibt keinen Benutzer mit diesem Usernamen: ' + transfer.username_recipient
        }
        callback();
      }
    }
})
}

function updateBalanceOwner(transfer, callback){

  var value = parseFloat(currentAmountOwner[0].balance) - parseFloat(transfer.amount);
  var updateBalance = 'UPDATE accounts SET balance ='+value+' WHERE username ="'+transfer.username_owner+'";';

  logger.log({
    level: 'error',
    message: 'Query sent: ' + updateBalance
  });

  connection.query(updateBalance, function(err, result, fields) {
    if(err){
      transferStatus = false;
      logger.log({
        level: 'error',
        message: err
      });
      callback();
    } else{
      if(result.affectedRows != 0){
        transferStatus = true;
        logger.log({
          level: 'info',
          message: 'Updated balance in data base.'
        });
        callback();
      }else {
        errorBody = {
          errorCode: 'Kontostand nicht verändert',
          errorMessage: 'Der Kontostand konnte nicht verändert werden.'
        }
        callback();
      }
    }

})

}

function updateBalanceRecipient(transfer, callback){

  var value = parseFloat(transfer.amount) + parseFloat(currentAmountRecipient[0].balance);
  var updateBalance = 'UPDATE accounts SET balance ='+value+' WHERE username ="'+transfer.username_recipient+'";';

  logger.log({
    level: 'error',
    message: 'Query sent: ' + updateBalance
  });

  connection.query(updateBalance, function(err, result, fields) {
    if(err){
      transferStatus = false;
      logger.log({
        level: 'error',
        message: err
      });
      callback();
    } else{
      if(result.affectedRows != 0){
        transferStatus = true;
        logger.log({
          level: 'info',
          message: 'Updated balance in data base.'
        });
        callback();
      }else {
        errorBody = {
          errorCode: 'Kontostand nicht verändert',
          errorMessage: 'Der Kontostand konnte nicht verändert werden.'
        }
        callback();
      }
    }

})

}

function sendRequestToDatabase(transfer, callback){
    var d = new Date();
    var m = new Date();
    var y = new Date();

    var date = y.getFullYear()+'/'+m.getMonth()+1+'/'+d.getDate();

    connection.query(('SELECT 1 FROM accounts WHERE username="' + transfer.username_recipient + '";'), function(err, results){
      if(err){

      }if(results.length > 0){
            var insert = 'INSERT INTO accountmovement (username_owner, username_recipient, amount, purpose, movementDate) '
    var values = 'VALUES ("'+transfer.username_owner+'","'+transfer.username_recipient+'",'+transfer.amount+',"'+transfer.purpose+'", "'+date+'");';

    var insertQuery = insert+values;

      logger.log({
    level: 'info',
    message: 'Query sent: ' + insertQuery
  });

    connection.query(insertQuery, function(err, result, fields) {
      if(err){
        transferStatus = false;
        logger.log({
          level: 'error',
          message: err
        });
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
    });

}

// Gets the sessionID
function getSession(username, sessionId, callback){
  var date = new Date();
  var time = date.getTime();

  var select = 'SELECT sessionId, expirationTime FROM sessions ';
  var where = 'WHERE username="' + username + '" AND sessionId="' + sessionId + '";';

  var query = select + where;

    logger.log({
    level: 'info',
    message: 'Query sent: ' + query
  });

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
        message: 'Session recieved.'
      });

      logger.log({
        level: 'info',
        message: result
      });
      
      if(result != null || result != undefined){
        if(result.length != 0){
                if(time <= parseInt(result[0].expirationTime)){
        async.series([
          function(callback) {increaseExpirationTime(username, sessionId, callback);}
        ], function(err){
          if (err) {
                  logger.log({
              level: 'error',
              message: err
            });
              }

              id = result[0].sessionId;
          callback();
        })
      } else {
        errorBody = {
          errorCode: 'Schlechte Session',
          errorMessage: 'Session ist abgelaufen.'
        }

        callback();
      }
        } else {
          callback();
        }
      }else{
        callback();
      }
    }
  })
}

// Increases the expiration time of a session
function increaseExpirationTime(username, sessionId, callback){
  var date = new Date();
  var time = date.getTime();
  var tenMinutesMiliS = 600000;
  var sessionTime = time+tenMinutesMiliS;

  var update = 'UPDATE sessions ';
  var set = 'SET expirationTime=' + sessionTime.toString() + ' ';
  var where = 'WHERE username="' + username + '" AND sessionId="' + sessionId + '";';

  var query = update + set + where;

    logger.log({
    level: 'info',
    message: 'Query sent: ' + query
  });

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
        message: 'Session time increased.'
      });

      logger.log({
        level: 'info',
        message: result
      });

      callback();
    }
  })
}

module.exports = router;
