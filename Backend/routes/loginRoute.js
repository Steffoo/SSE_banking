const express = require('express');
const winston = require('winston');
const cookieSession = require('cookie-session');
const mysql = require('mysql');

const router = express.Router();

const logFile = '../data/log/server.log';

winston.configure({
	transports: [
		new (winston.transports.File)({filename: logFile}),
		new (winston.transports.Console)({timestamp: true})
	]
});

router.use(cookieSession({
	name: 'session',
	secret: createSecret(),
	maxAge: 10 * 60 * 1000 // 10 minutes 
}))

function createSecret(){
	var secret = "";
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for(var i = 0; i < 5; i++){
		var random = Math.floor(Math.random() * chars.length);
		secret += chars.charAt(random);
	}

	return secret;
}

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