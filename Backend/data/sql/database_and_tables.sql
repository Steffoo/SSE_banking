CREATE DATABASE IF NOT EXISTS sse_banking;
USE sse_banking;

CREATE TABLE IF NOT EXISTS accounts
                                  ( iban VARCHAR(22) NOT NULL UNIQUE,
                                    firstName VARCHAR(50) NOT NULL,
                                    lastName VARCHAR(50) NOT NULL,
                                    username VARCHAR(50) NOT NULL UNIQUE,
                                    address VARCHAR(100) NOT NULL,
                                    telephoneNumber VARCHAR(50) NOT NULL,
                                    email VARCHAR(50) NOT NULL,
                                    pwd VARCHAR(100) NOT NULL,
                                    balance DECIMAL(9,2) NOT NULL,
                                    locked BOOL DEFAULT FALSE,
                                    reasonForLock VARCHAR(100),
									triesLeft INT DEFAULT 3,
                                    isAdmin BOOL DEFAULT FALSE,
                                    PRIMARY KEY(iban)
                                  );

CREATE TABLE IF NOT EXISTS accountmovement (movement_id INT NOT NULL auto_increment,
											username_owner VARCHAR(50) NOT NULL,
                                            username_recipient VARCHAR(50) NOT NULL,
                                            amount DECIMAL(9,2) NOT NULL,
                                            purpose VARCHAR(50),
                                            movementDate Date,
                                            PRIMARY KEY(movement_id, username_owner, username_recipient),
                                            FOREIGN KEY(username_owner) REFERENCES accounts(username) ON DELETE CASCADE ON UPDATE CASCADE,
                                            FOREIGN KEY(username_recipient) REFERENCES accounts(username) ON DELETE CASCADE ON UPDATE CASCADE
                                          );

CREATE TABLE IF NOT EXISTS sessions (sessionId VARCHAR(50) NOT NULL UNIQUE,
									username VARCHAR(50) NOT NULL,
									expirationTime VARCHAR(255) NOT NULL,
									PRIMARY KEY(username),
									FOREIGN KEY(username) REFERENCES accounts(username) ON DELETE CASCADE ON UPDATE CASCADE);
