CREATE DATABASE IF NOT EXISTS sse_banking;
USE sse_banking;

CREATE TABLE IF NOT EXISTS account
                                  ( iban VARCHAR(50) NOT NULL UNIQUE,
                                    firstName VARCHAR(50) NOT NULL,
                                    name VARCHAR(50) NOT NULL,
                                    username VARCHAR(50) NOT NULL UNIQUE,
                                    address VARCHAR(100) NOT NULL,
                                    telephoneNumber VARCHAR(50) NOT NULL,
                                    email VARCHAR(50) NOT NULL,
                                    password VARCHAR(100) NOT NULL,
                                    balance DECIMAL(9,2) NOT NULL,
                                    locked BIT DEFAULT 0,
                                    reasonForLock VARCHAR(100),
									triesLeft INT DEFAULT 3,
                                    PRIMARY KEY(iban)
                                  );

CREATE TABLE IF NOT EXISTS accountmovement (username_owner VARCHAR(50) NOT NULL,
                                            iban_recipient VARCHAR(50) NOT NULL,
                                            amount DECIMAL(9,2) NOT NULL,
                                            purpose VARCHAR(50),
                                            date Date,
                                            PRIMARY KEY(username_owner, iban_recipient),
                                            FOREIGN KEY(username_owner) REFERENCES account(username),
                                            FOREIGN KEY(iban_recipient) REFERENCES account(iban)
                                          );

CREATE TABLE IF NOT EXISTS sessions (sessionId VARCHAR(5) NOT NULL UNIQUE,
									username VARCHAR(50) NOT NULL, 
									expirationTime VARCHAR(255) NOT NULL, 
									PRIMARY KEY(username),
									FOREIGN KEY(username) REFERENCES account(username));