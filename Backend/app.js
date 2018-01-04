const express = require('express');
const path = require('path');
const winston = require('winston');
const cookieSession = require('cookie-session');

const app = express();

var frontendDir;
const logFile = './data/log/server.log';

const loginRoute = './routes/loginRoute.js';
const registerRoute = './routes/registerRoute.js';

winston.configure({
	transports: [
		new (winston.transports.File)({filename: logFile}),
		new (winston.transports.Console)({timestamp: true})
	]
});

app.use(cookieSession({
	name: 'session',
	secret: createSecret(),
	maxAge: 10 * 60 * 1000 // 10 minutes 
}));

function createSecret(){
	var secret = "";
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for(var i = 0; i < 5; i++){
		var random = Math.floor(Math.random() * chars.length);
		secret += chars.charAt(random);
	}

	return secret;
}

if(process.env['RUNNING_VIA_DOCKER']) {
	winston.log('Info', 'Running inside a docker environment');
	frontendDir = './public';
} else {
	winston.log('Info', 'Running outside a docker environment');
	frontendDir = '../frontend';
}

app.use(express.static(path.join(__dirname, frontendDir)));
app.use('/login', loginRoute);
app.use('/register', registerRoute);

app.set('port', 3000);

app.listen(app.get('port'), function(){
	winston.log('Info', 'Listening on port ' + app.get('port'));
})