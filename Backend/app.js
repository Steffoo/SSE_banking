/********************/
/* Required modules */
/********************/
const express = require('express');
const path = require('path');
const winston = require('winston');
const cookieSession = require('cookie-session');
var bodyParser = require('body-parser');

const app = express();


/*********/
/* Files */
/*********/
var frontendDir;
const logFile = './data/log/server.log';


/****************************/
/* Account functions routes */
/****************************/
const loginRoute = require('./routes/loginRoute.js');
const registerRoute = require('./routes/registerRoute.js');
const changePassword = require('./routes/changePassword.js');
const lockAccount = require('./routes/lockAccount.js');
const deleteAccount = require('./routes/deleteAccount.js');


/**************************************************/
/* Account transfer and movement functions routes */
/**************************************************/
const accountMovement = require('./routes/accountMovement.js');
const accountTransfer = require('./routes/accountTransfer.js');


/******************/
/* Configurations */
/******************/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

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

app.use(cookieSession({
	name: 'session',
	secret: createSecret(),
	maxAge: 10 * 60 * 1000 // 10 minutes 
}));

if(process.env['RUNNING_VIA_DOCKER']) {
	logger.log({
		level: 'info',
		message: 'Running inside a docker environment.'
	});

	frontendDir = './public/src';
} else {
	logger.log({
		level: 'info',
		message: 'Running outside a docker environment.'
	});

	frontendDir = '../frontend/src';
}


/******************/
/* MISC functions */
/******************/
// Creates a secret session-ID with five characters
function createSecret(){
	var secret = "";
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for(var i = 0; i < 5; i++){
		var random = Math.floor(Math.random() * chars.length);
		secret += chars.charAt(random);
	}

	return secret;
}


/********************/
/* Request handling */
/********************/
app.use(express.static(path.join(__dirname, frontendDir)));
app.use('/login', loginRoute);
app.use('/register', registerRoute);


/************/
/* Listener */
/************/
app.set('port', 3000);

app.listen(app.get('port'), function(){
	logger.log({
		level: 'info',
		message: 'Listening on port ' + app.get('port')
	});
})