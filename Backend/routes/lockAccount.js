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
	password: 'sse_rulez'
});

module.exports = router;