const express = require('express');
const path = require('path');
const winston = require('winston');

const app = express();

var frontendDir;
const logFile = './data/log/server.log';

const loginRoute = './routes/loginRoute.js';

winston.configure({
	transports: [
		new (winston.transports.File)({filename: logFile}),
		new (winston.transports.Console)({timestamp: true})
	]
});

if(process.env['RUNNING_VIA_DOCKER']) {
	winston.log('Info', 'Running inside a docker environment');
	frontendDir = './public';
} else {
	winston.log('Info', 'Running outside a docker environment');
	frontendDir = '../frontend';
}

app.use(express.static(path.join(__dirname, frontendDir)));
app.use('/login', loginRoute);

app.set('port', 3000);

app.listen(app.get('port'), function(){
	winston.log('Info', 'Listening on port ' + app.get('port'));
})