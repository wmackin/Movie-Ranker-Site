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
import { getPassword, key } from './getPassword.js';
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
app.use(express.static(__dirname + '/public'));
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
    const userpassword = hash.digest("hex");
    return userpassword == hashedPassword;
}

async function addUser(username, password) {
    const results = await connection.query('SELECT * FROM accounts WHERE username = ?;', [username]);
    if (results.length > 0) {
        return false;
    }
    else {
        const encryption = createHash(password);
        connection.query('INSERT INTO accounts (username, password, salt) VALUES (?, ?, ?);', [username, encryption['hash'], encryption['salt']], function (error, results) {
            if (error) throw error;
        });
    }
    return true;
}

app.get('/signup.js', (req, res) => {
    res.sendFile('./signup.js', { root: __dirname });
});

app.get('/search.js', (req, res) => {
    res.sendFile('./search.js', { root: __dirname });
});

app.get('/userLists.js', (req, res) => {
    res.sendFile('./userLists.js', { root: __dirname });
});

app.get('/rank.js', (req, res) => {
    res.sendFile('./rank.js', { root: __dirname });
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
    const username = req.session.username;
    connection.query('SELECT * FROM accounts WHERE username = ?;', [username], function (error, results) {
        if (error) throw error;
        if (results.length > 0) {
            res.json({ 'exists': true });
        }
        else {
            res.json({ 'exists': false });
        }
    });
});

app.get('/getUnranked', function (req, res) {
    const username = req.session.username;
    const listName = req.session.list;
    connection.query('SELECT * FROM unranked WHERE username = ? AND list = ? ORDER BY RAND();', [username, listName], function (error, results) {
        if (error) throw error;
        res.json(results);
    });
});

app.get('/userLists', function (req, res) {
    const username = req.session.username;
    connection.query('SELECT list FROM list_names WHERE username = ?;', [username], function (error, results) {
        if (error) throw error;
        res.json(results);
    });
});

app.post('/createList', function (req, res) {
    const username = req.session.username;
    const listName = req.body.listName;
    connection.query('INSERT INTO list_names VALUES(?, ?);', [username, listName], function (error, results) {
        if (error) throw error;
        res.json({ 'success': true, 'msg': 'Successfully created ' + listName });
    })
});

app.post('/deleteList', function (req, res) {
    const username = req.session.username;
    const listName = req.body.listName;
    connection.query('DELETE FROM list_names WHERE username = ? AND list = ?;', [username, listName], function (error, results) {
        if (error) throw error;
    });
    connection.query('DELETE FROM lists WHERE username = ? AND list = ?;', [username, listName], function (error, results) {
        if (error) throw error;
    });
    res.end();
});

app.post('/getList', function (req, res) {
    const username = req.session.username;
    const listName = req.body.listName;
    connection.query('SELECT * FROM lists WHERE username = ? AND list = ? ORDER BY wins DESC;', [username, listName], function (error, results) {
        if (error) throw error;
        res.send(results);
        res.end();
    });
});

app.post('/addToList', function (req, res) {
    const username = req.session.username;
    const listName = req.body.listName;
    const id = req.body.id;
    const title = req.body.title;
    const year = parseInt(req.body.year);
    const poster = req.body.poster;
    connection.query('SELECT * FROM lists WHERE username = ? AND list = ? AND id = ?;', [username, listName, id], function (error, results) {
        if (error) throw error;
        if (results.length !== 0) {
            res.json({ 'msg': 'Movie already in list.' });
            res.end();
        }
        else {
            connection.query('SELECT * FROM lists WHERE username = ? AND list = ?;', [username, listName], function (error, results) {
                if (error) throw error;
                results.forEach(r => {
                    if (Math.random() < 0.5) {
                        connection.query('INSERT INTO unranked VALUES(?, ?, ?, ?);', [username, listName, id, r['id']], function (error, results) {
                            if (error) throw error;
                        });
                    }
                    else {
                        connection.query('INSERT INTO unranked VALUES(?, ?, ?, ?);', [username, listName, r['id'], id], function (error, results) {
                            if (error) throw error;
                        });
                    }
                });
            });
            connection.query('INSERT INTO lists VALUES(?, ?, ?, ?, ?, ?, 0);', [username, listName, id, title, year, poster], function (error, results) {
                if (error) throw error;
                res.json({ 'msg': 'Successfully added movie to list.' });
                res.end();
            });

        }
    });
});

app.post('/submitRanking', function (req, res) {
    const username = req.session.username;
    const listName = req.session.list;
    const winner = req.body.winner;
    const loser = req.body.loser;
    const id1 = req.body.id1;
    const id2 = req.body.id2;
    connection.query('INSERT INTO rankings VALUES(?, ?, ?, ?);', [username, listName, winner, loser], function (error, results) {
        if (error) throw error;
    });
    connection.query('DELETE FROM unranked WHERE username = ? AND list = ? and id1 = ? and id2 = ?;', [username, listName, id1, id2], function (error, results) {
        if (error) throw error;
    });
    connection.query('UPDATE lists SET wins = wins + 1 WHERE username = ? AND list = ? and id = ?;', [username, listName, winner], function (error, results) {
        if (error) throw error;
    });
    res.end();
});

//authentication, sourced from https://codeshack.io/basic-login-system-nodejs-express-mysql/
app.post('/auth', function (req, res) {
    let username = req.body.username;
    let password = req.body.password;
    if (username && password) {
        connection.query('SELECT password, salt FROM accounts WHERE username = ?;', [username], function (error, results) {
            if (error) throw error;
            if (results.length > 0) {
                if (validatePassword(password, results[0]['password'], results[0]['salt'])) {
                    req.session.loggedin = true;
                    req.session.username = username;
                    res.redirect('/home');
                }
                else {
                    res.send('Incorrect Username and/or Password!');
                }
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

app.get('/home', async function (req, res) {
    // If the user is loggedin
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname + '/userLists.html'));
    }
    else {
        // Not logged in
        res.send('Please login to view this page!');
        res.end();
    }
});

app.get('/lists', async function (req, res) {
    // If the user is loggedin
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname + '/userLists.html'));
    }
    else {
        // Not logged in
        res.send('Please login to view this page!');
        res.end();
    }
});

app.get('/search', async function (req, res) {
    // If the user is loggedin
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname + '/searchPage.html'));
    }
    else {
        // Not logged in
        res.send('Please login to view this page!');
        res.end();
    }
});

app.post('/rankList', async function (req, res) {
    // If the user is loggedin
    if (req.session.loggedin) {
        req.session.list = req.body.listName;
        res.redirect('/rank')
    }
    else {
        // Not logged in
        res.send('Please login to view this page!');
        res.end();
    }
});

app.post('/createAccount', async (req, res) => {
    const username = req.body.user;
    const password = req.body.password;
    const userAdded = await addUser(username, password);
    if (userAdded) {
        res.redirect('/login');
    }
    else {
        res.redirect('/signup');
    }
})

app.get('/rank', (req, res) => {
    res.sendFile(path.join(__dirname + '/rank.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname + '/signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/currentUser', (req, res) => {
    res.send(req.session.username);
});

app.post('/getInfo', (req, res) => {
    connection.query('SELECT poster FROM lists WHERE id = ?;', [req.body.id], function(error, results) {
        if (error) throw error;
        res.json(results);
    });
})

app.get('/getAPIKey', (req, res) => {
    res.json({ value: key });
})

app.listen(port, () => {
    console.log(`Success! Your application is running on port ${port}.`);
});