const express = require('express');
const winston = require('winston');
const mysql = require('mysql');

const router = express.Router();

const logFile = '../data/log/server.log';

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

router.post('/', function(req res){
	var resBody = {
		status: true,
		session-id: 'abcdf'
	}

	res.send(resBody);
})


module.exports = router;