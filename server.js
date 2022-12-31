// const express = require('express');
// const fetch = require('node-fetch');
// const bodyParser = require('body-parser');
// const session = require('express-session');
// const path = require('path');
// const mysql = require('mysql');
// const { getPassword } = require('./getPassword.js');
import express, { response } from 'express';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import session from 'express-session';
import path from 'path';
import mysql from 'mysql';
import crypto from "crypto";
import { fileURLToPath } from 'url';
import { getPassword } from './getPassword.js';
const app = express();
const port = 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, 'static')));
app.use(express.static(__dirname+ '/public'));
app.use(bodyParser.urlencoded({ extended: false }));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: getPassword(),
    database: 'rankings'
});

//encryption source: https://code-boxx.com/simple-javascript-password-encryption-decryption/
function createHash(password) {
    // (B1) GENERATE RANDOM SALT
    let length = 16;
    let salt = crypto.randomBytes(Math.ceil(length / 2))
        .toString("hex")
        .slice(0, length);

    // (B2) SHA512 HASH
    let hash = crypto.createHmac("sha512", salt);
    hash.update(password);
    return {
        salt: salt,
        hash: hash.digest("hex")
    };
}

function validatePassword(password, hashedPassword, salt) {
    let hash = crypto.createHmac("sha512", salt);
    hash.update(password);
    userpassword = hash.digest("hex");
    return userpassword == hashedPassword;
}

function addUser(username, password) {
    connection.query('SELECT * FROM accounts WHERE username = ?;', [username], function(error, results) {
        if (error) throw error;
        if (results.length > 0) {
            return false;
        }
        else {
            const encryption = createHash(password);
            connection.query('INSERT INTO accounts (username, password, salt) VALUES (?, ?, ?);', [username, encryption['hash'], encryption['salt']], function(error, results) {
                if (error) throw error;
            });
        }			
        return true;
    });
}

app.get('/signup.js', (req, res) => {
    res.sendFile('./signup.js', { root: __dirname });
});

app.get('/main.css', (req, res) => {
    res.sendFile('./main.css', { root: __dirname });
});

app.get('/logout', async (req, res) => {
    req.loggedin = false;
    req.username = null;
    res.sendFile(path.join(__dirname + '/login.html'));
});

app.post('/userExists', function (req, res) {
    const username = req.user;
    connection.query('SELECT * FROM accounts WHERE username = ?;', [username], function(error, results) {
        if (error) throw error;
        if (results.length > 0) {
            res.json({'exists': true});
        }
        else {
            res.json({'exists': false});
        }			
    });
});

//authentication, sourced from https://codeshack.io/basic-login-system-nodejs-express-mysql/
app.post('/auth', function (req, res) {
    // Capture the input fields
    let username = req.body.username;
    let password = req.body.password;
    // Ensure the input fields exists and are not empty
    if (username && password) {
        // Execute SQL query that'll select the account from the database based on the specified username and password
        connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function (error, results) {
            // If there is an issue with the query, output the error
            if (error) throw error;
            // If the account exists
            if (results.length > 0) {
                // Authenticate the user
                req.session.loggedin = true;
                req.session.username = username;
                // Redirect to home page
                res.redirect('/home');
            } else {
                res.send('Incorrect Username and/or Password!');
            }
            res.end();
        });
    } else {
        res.send('Please enter Username and Password!');
        res.end();
    }
});

//sourced from https://codeshack.io/basic-login-system-nodejs-express-mysql/
//will be replaced at some point
app.get('/home', async function (req, res) {
    // If the user is loggedin
    if (req.session.loggedin) {
        // Output username
        const url = 'https://api.letterboxd.com/api/v0';
        const film = "Star Wars";
        const response = await fetch(url + `/search?input=${film}&searchMethod=Autocomplete&include=FilmSearchItem`);
        if (response.ok) {
            let film = await response.json();
            console.log(film);
        }
        res.send('Welcome back, ' + req.session.username + '! <a href="/logout">Logout</a>');
    } else {
        // Not logged in
        res.send('Please login to view this page!');
    }
    res.end();
});

app.post('/createAccount', async (req, res) => {
    const username = req.body.user;
    const password = req.body.password;
    const userAdded = addUser(username, password);
    if (userAdded) {
        res.redirect('/login');
    }
    else {
        res.redirect('/signup');
    }
})

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname + '/signup.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/login.html'));
});

app.listen(port, () => {
    console.log(`Success! Your application is running on port ${port}.`);
});