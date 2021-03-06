/********************/
/* Required modules */
/********************/
const express = require('express');
var cors = require('cors');
const path = require('path');
const winston = require('winston');
const bodyParser = require('body-parser');
const ip = require('ip');
const jsonFile = require('jsonfile');

const app = express();


/*********/
/* Files */
/*********/
var frontendDir;
const logFile = './data/log/server.log';
const databaseFile = './data/secret/database_info.json';
const secretFile = './data/secret/secret.json';


/**********/
/* Fields */
/**********/
var databaseInformation;
// var ipAddress = ip.address();
var ipAddress = '127.0.0.1';

/****************************/
/* Account functions routes */
/****************************/
const loginRoute = require('./routes/loginRoute.js');
const registerRoute = require('./routes/registerRoute.js');
const profileRoute = require('./routes/profileRoute.js');
const changePasswordRoute = require('./routes/changePasswordRoute.js');
const lockAccountRoute = require('./routes/lockAccountRoute.js');
const unlockAccountRoute = require('./routes/unlockAccountRoute.js');
const deleteAccountRoute = require('./routes/deleteAccountRoute.js');


/**************************************************/
/* Account transfer and movement functions routes */
/**************************************************/
const accountMovementRoute = require('./routes/accountMovementRoute.js');
const accountTransferRoute = require('./routes/accountTransferRoute.js');


/******************/
/* Configurations */
/******************/
// app.use(cors());
app.use(cors({credentials: true, origin: 'http://localhost:4200'}));
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

// var originsWhitelist = [
//   'http://localhost:4200',
// ];

// var corsOptions = {
//   	origin: function(origin, callback){
//         var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
//         callback(null, isWhitelisted);
//   	},
//   	credentials:true,
//   	optionsSuccessStatus: 200
// }

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });


// app.use(cors({credentials: true, origin: 'http://141.19.152.95:4200'}));
// app.use(cors({credentials: true, origin: 'http://localhost:4200'}));


/******************/
/* MISC functions */
/******************/
// Reades data bade file
(function readDataBaseFile(){
	jsonFile.readFile(databaseFile, function(err, obj) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});
		}else{
			databaseInformation = {
				user: obj.user,
				password: obj.password,
				port: obj.port,
				database: obj.database,
				ip: ipAddress
			}

			writeToDataBaseFile();

			logger.log({
				level: 'info',
				message: 'Successfully read data base file.'
			});
		}
	})
})();

// Writes to data base file
function writeToDataBaseFile(){
	jsonFile.writeFile(databaseFile, databaseInformation, function (err) {
		if(err){
			logger.log({
				level: 'error',
				message: err
			});
		} else {
			logger.log({
				level: 'info',
				message: 'Added current IP address to data base file.'
			});
		}
	})
}


/********************/
/* Request handling */
/********************/
app.use(express.static(path.join(__dirname, frontendDir)));
app.use('/accountMovement', accountMovementRoute);
app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use('/profile', profileRoute);
app.use('/changePassword', changePasswordRoute);
app.use('/lockAccount', lockAccountRoute);
app.use('/unlockAccount', unlockAccountRoute);
app.use('/deleteAccount', deleteAccountRoute);
app.use('/accountTransfer', accountTransferRoute);
app.use('/accountMovement', accountMovementRoute);

app.get('/mainMenu', (req, res) => {
	logger.log({
		level: 'info',
		message: 'Redirecting to ' + req.query.fwd
	});
	res.redirect(req.query.fwd);
})



/************/
/* Listener */
/************/
app.set('port', 3000);

process.on('uncaughtException', function (err) {
    console.log("--- ERROR ---");
});

app.listen(app.get('port'), ipAddress, function(){
	logger.log({
		level: 'info',
		message: 'Listening on ip ' + ipAddress + ' and port ' + app.get('port')
	});
})