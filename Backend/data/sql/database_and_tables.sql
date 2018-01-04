CREATE DATABASE IF NOT EXISTS sse_banking;

CREATE TABLE IF NOT EXISTS account ( iban VARCHAR(50) NOT NULL UNIQUE,
                                    firstName VARCHAR(50) NOT NULL,
                                    name VARCHAR(50) NOT NULL,
                                    username VARCHAR(50) NOT NULL,
                                    adress VARCHAR(100) NOT NULL,
                                    telephoneNumber VARCHAR(50) NOT NULL,
                                    email VARCHAR(50) NOT NULL,
                                    password VARCHAR(20) NOT NULL DEFAULT MD5('asdfg'),
                                    balance DECIMAL(9,2) NOT NULL,
                                    locked BIT DEFAULT 0,
                                    reasonForLock VARCHAR(100),
                                    PRIMARY KEY(iban)
                                  );

CREATE TABLE IF NOT EXISTS accountmovement (iban_sender VARCHAR(50) NOT NULL,
                                            iban_recipient VARCHAR(50) NOT NULL,
                                            amount DECIMAL(9,2) NOT NULL,
                                            purpose VARCHAR(50),
                                            date Date,
                                            PRIMARY KEY(iban_sender),
                                            PRIMARY KEY(iban_recipient),
                                            FOREIGN KEY(iban_sender) REFERENCES account(iban),
                                            FOREIGN KEY(iban_recipient) REFERENCES account(iban)
                                            )
