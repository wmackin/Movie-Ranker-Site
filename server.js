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

app.get('/customItem.js', (req, res) => {
    res.sendFile('./customItem.js', { root: __dirname });
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
    const username = req.body.user;
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

app.post('/getUnranked', function (req, res) {
    const username = req.session.username;
    const listName = req.session.list;
    const rankType = req.session.rankType;
    if (rankType === 'standard') {
        connection.query('SELECT * FROM unranked WHERE username = ? AND list = ? ORDER BY RAND();', [username, listName], function (error, results) {
            if (error) throw error;
            res.json(results);
        });
    }
    else if (rankType === 'top') {
        const pct = req.body.pct;
        connection.query('SELECT COUNT(*) FROM lists WHERE username = ? AND list = ?', [username, listName], function (error, results) {
            if (error) throw error;
            const count = results[0]['COUNT(*)'];
            const additionalValues = Math.ceil(count / 10);
            connection.query('SELECT u.username, u.list, u.id1, u.id2 FROM rankings.unranked AS u, rankings.lists AS l, rankings.lists AS z WHERE u.username = ? AND l.username = u.username AND z.username = u.username AND u.list = ? AND l.list = u.list AND z.list = u.list AND u.id1 = l.id AND u.id2 = z.id AND ((l.wins + ?) / (l.wins + l.losses + (2 * ?))) >= ? AND ((z.wins + ?) / (z.wins + z.losses + (2 * ?))) >= ? ORDER BY LEAST((l.wins + ?) / (l.wins + l.losses + (2 * ?)), (z.wins + ?) / (z.wins + z.losses + (2 * ?))) DESC, GREATEST((l.wins + 1) / (l.wins + l.losses + 2), (z.wins + 1) / (z.wins + z.losses + 2)) DESC;', [username, listName, additionalValues, additionalValues, pct, additionalValues, additionalValues, pct, additionalValues, additionalValues, additionalValues, additionalValues], function (error, results) {
                if (error) throw error;
                res.json(results);
            });
        });
    }
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

app.post('/resetList', function (req, res) {
    const username = req.session.username;
    const listName = req.body.listName;
    connection.query('UPDATE lists SET wins = 0, losses = 0 WHERE username = ? and list = ?;', [username, listName], function (error, results) {
        if (error) throw error;
    });
    connection.query('DELETE FROM rankings WHERE username = ? AND list = ?;', [username, listName], function (error, results) {
        if (error) throw error;
    });
    connection.query('DELETE FROM smart_rankings WHERE username = ? AND list = ?;', [username, listName], function (error, results) {
        if (error) throw error;
    });
    connection.query('SELECT id FROM lists WHERE username = ? AND list = ?;', [username, listName], function (error, results) {
        if (error) throw error;
        const items = results;
        connection.query('SELECT id1, id2 FROM unranked WHERE username = ? AND list = ?;', [username, listName], function (error, results) {
            if (error) throw error;
            let unrankedPairs = new Set()
            results.forEach(r => {
                unrankedPairs.add(r['id1'] + r['id2']);
                unrankedPairs.add(r['id2'] + r['id1']);
            });
            for (let i = 0; i < items.length; i++) {
                for (let j = i + 1; j < items.length; j++) {
                    if (!unrankedPairs.has(items[i]['id'] + items[j]['id'])) {
                        if (Math.random() < 0.5) {
                            connection.query('INSERT INTO unranked VALUES(?, ?, ?, ?);', [username, listName, items[i]['id'], items[j]['id']], function (error, results) {
                                if (error) throw error;
                            });
                        }
                        else {
                            connection.query('INSERT INTO unranked VALUES(?, ?, ?, ?);', [username, listName, items[j]['id'], items[i]['id']], function (error, results) {
                                if (error) throw error;
                            });
                        }
                    }
                }
            }
        });
    });
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
    connection.query('DELETE FROM rankings WHERE username = ? AND list = ?;', [username, listName], function (error, results) {
        if (error) throw error;
    });
    connection.query('DELETE FROM smart_rankings WHERE username = ? AND list = ?;', [username, listName], function (error, results) {
        if (error) throw error;
    });
    connection.query('DELETE FROM unranked WHERE username = ? AND list = ?;', [username, listName], function (error, results) {
        if (error) throw error;
    });
    res.end();
});

app.post('/getList', function (req, res) {
    const username = req.session.username;
    const listName = req.body.listName;
    connection.query('SELECT COUNT(*) FROM lists WHERE username = ? AND list = ?', [username, listName], function (error, results) {
        if (error) throw error;
        const count = results[0]['COUNT(*)'];
        const additionalValues = Math.ceil(count / 10);
        connection.query('SELECT *, (wins + ?) / (wins + losses + (2 * ?)) AS score FROM lists WHERE username = ? AND list = ? ORDER BY score DESC;', [additionalValues, additionalValues, username, listName], function (error, results) {
            if (error) throw error;
            res.send(results);
            res.end();
        });
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
            connection.query('INSERT INTO lists VALUES(?, ?, ?, ?, ?, NULL, ?, 0, 0);', [username, listName, id, title, year, poster], function (error, results) {
                if (error) throw error;
                res.json({ 'msg': 'Successfully added movie to list.' });
                res.end();
            });

        }
    });
});

app.post('/removeFromList', function (req, res) {
    const username = req.session.username;
    const listName = req.body.listName;
    const id = req.body.id;
    connection.query('SELECT * FROM lists WHERE username = ? AND list = ? AND id = ?;', [username, listName, id], function (error, results) {
        if (error) throw error;
        if (results.length === 0) {
            res.json({ 'msg': 'Movie not in list.' });
            res.end();
        }
        else {
            connection.query('DELETE FROM lists WHERE username = ? AND list = ? AND id = ?;', [username, listName, id], function (error, results) {
                if (error) throw error;
            });
            connection.query('DELETE FROM unranked WHERE username = ? AND list = ? AND (id1 = ? OR id2 = ?);', [username, listName, id, id], function (error, results) {
                if (error) throw error;
            });
            connection.query('SELECT * FROM rankings WHERE username = ? AND list = ? AND winner = ?;', [username, listName, id], function (error, results) {
                if (error) throw error;
                results.forEach(r => {
                    const loser = r['loser'];
                    connection.query('UPDATE lists SET losses = losses - 1 WHERE username = ? AND list = ? AND id = ?;', [username, listName, loser], function (error, results) {
                        if (error) throw error;
                    });
                });
                connection.query('SELECT * FROM rankings WHERE username = ? AND list = ? AND loser = ?;', [username, listName, id], function (error, results) {
                    if (error) throw error;
                    results.forEach(r => {
                        const winner = r['winner'];
                        connection.query('UPDATE lists SET wins = wins - 1 WHERE username = ? AND list = ? AND id = ?;', [username, listName, winner], function (error, results) {
                            if (error) throw error;
                        });
                    });
                    connection.query('DELETE FROM rankings WHERE username = ? AND list = ? AND (winner = ? OR loser = ?);', [username, listName, id, id], function (error, results) {
                        if (error) throw error;
                    });

                });
            });
            connection.query('SELECT * FROM smart_rankings WHERE username = ? AND list = ? AND winner = ?;', [username, listName, id], function (error, results) {
                if (error) throw error;
                results.forEach(r => {
                    const loser = r['loser'];
                    connection.query('UPDATE lists SET losses = losses - 1 WHERE username = ? AND list = ? AND id = ?;', [username, listName, loser], function (error, results) {
                        if (error) throw error;
                    });
                });
                connection.query('SELECT * FROM smart_rankings WHERE username = ? AND list = ? AND loser = ?;', [username, listName, id], function (error, results) {
                    if (error) throw error;
                    results.forEach(r => {
                        const winner = r['winner'];
                        connection.query('UPDATE lists SET wins = wins - 1 WHERE username = ? AND list = ? AND id = ?;', [username, listName, winner], function (error, results) {
                            if (error) throw error;
                        });
                    });
                    connection.query('DELETE FROM smart_rankings WHERE username = ? AND list = ? AND (winner = ? OR loser = ?);', [username, listName, id, id], function (error, results) {
                        if (error) throw error;
                        res.json({ 'msg': 'Successfully removed movie from list.' });
                        res.end();
                    });

                });
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
    connection.query('UPDATE lists SET losses = losses + 1 WHERE username = ? AND list = ? and id = ?;', [username, listName, loser], function (error, results) {
        if (error) throw error;
    });
    res.end();
});

app.post('/submitSmartRanking', async function (req, res) {
    const username = req.session.username;
    const listName = req.session.list;
    const winner = req.body.winner;
    const loser = req.body.loser;
    const id1 = req.body.id1;
    const id2 = req.body.id2;
    connection.query('INSERT INTO smart_rankings VALUES(?, ?, ?, ?);', [username, listName, winner, loser], function (error, results) {
        if (error) throw error;
        connection.query('DELETE FROM unranked WHERE username = ? AND list = ? and id1 = ? and id2 = ?;', [username, listName, id1, id2], function (error, results) {
            if (error) throw error;
            connection.query('UPDATE lists SET wins = wins + 1 WHERE username = ? AND list = ? and id = ?;', [username, listName, winner], function (error, results) {
                if (error) throw error;
                connection.query('UPDATE lists SET losses = losses + 1 WHERE username = ? AND list = ? and id = ?;', [username, listName, loser], function (error, results) {
                    if (error) throw error;
                    let winnerGraph = {}; //keys are winner, values are loser
                    let loserGraph = {}; //keys are loser, values are winner
                    connection.query('SELECT * FROM lists WHERE username = ? AND list = ?;', [username, listName], function (error, results) {
                        if (error) throw error;
                        results.forEach(r => {
                            winnerGraph[r.id] = [];
                            loserGraph[r.id] = [];
                        });
                        connection.query('SELECT winner, loser FROM smart_rankings WHERE username = ? AND list = ?;', [username, listName], async function (error, results) {
                            if (error) throw error;
                            results.forEach(r => {
                                winnerGraph[r.winner].push(r.loser);
                                loserGraph[r.loser].push(r.winner);
                            });
                            //first let's find all descendants of the loser
                            let newLosers = new Set();
                            let queue = winnerGraph[loser];
                            queue.forEach(x => { newLosers.add(x) });
                            while (queue.length > 0) {
                                let descendants = winnerGraph[queue[0]];
                                descendants.forEach(d => {
                                    if (!newLosers.has(d)) {
                                        queue.push(d);
                                        newLosers.add(d);
                                    }
                                });
                                queue.shift();
                            };

                            //at this point, have the winner beat any descendants it has not yet gone against
                            //utilized chatgpt to rewrite the function to ensure all SQL statements ran before returning
                            async function winOverDescendants() {
                                return new Promise((resolve, reject) => {
                                    newLosers = Array.from(newLosers);
                                    let promises = [];
                                    newLosers.forEach(l => {
                                        let promise = new Promise((innerResolve, innerReject) => {
                                            connection.query('SELECT COUNT(*) FROM rankings WHERE username = ? AND list = ? AND ((winner = ? AND loser = ?) OR (loser = ? AND winner = ?));', [username, listName, winner, l, winner, l], function (error, results) {
                                                if (error) return innerReject(error);
                                                if (results[0]['COUNT(*)'] == 0) {
                                                    connection.query('SELECT COUNT(*) FROM smart_rankings WHERE username = ? AND list = ? AND ((winner = ? AND loser = ?) OR (loser = ? AND winner = ?));', [username, listName, winner, l, winner, l], function (error, results) {
                                                        if (error) return innerReject(error);
                                                        if (results[0]['COUNT(*)'] == 0) {
                                                            connection.query('INSERT INTO smart_rankings VALUES(?, ?, ?, ?);', [username, listName, winner, l], function (error, results) {
                                                                if (error) return innerReject(error);
                                                                connection.query('DELETE FROM unranked WHERE username = ? AND list = ? AND ((id1 = ? AND id2 = ?) OR (id2 = ? AND id1 = ?));', [username, listName, winner, l, winner, l], function (error, results) {
                                                                    if (error) return innerReject(error);
                                                                    connection.query('UPDATE lists SET wins = wins + 1 WHERE username = ? AND list = ? and id = ?;', [username, listName, winner], function (error, results) {
                                                                        if (error) return innerReject(error);
                                                                        connection.query('UPDATE lists SET losses = losses + 1 WHERE username = ? AND list = ? and id = ?;', [username, listName, l], function (error, results) {
                                                                            if (error) return innerReject(error);
                                                                            innerResolve(); // Resolve the promise when all queries are successful
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        } else {
                                                            innerResolve(); // Resolve the promise if smart_rankings already has a record
                                                        }
                                                    });
                                                } else {
                                                    innerResolve(); // Resolve the promise if rankings already has a record
                                                }
                                            });
                                        });
                                        promises.push(promise);
                                    });

                                    Promise.all(promises)
                                        .then(() => {
                                            resolve(); // Resolve the main promise when all queries are successful
                                        })
                                        .catch(error => {
                                            reject(error); // Reject the main promise if any query fails
                                        });
                                });
                            }
                            await winOverDescendants();
                            //now let's find all parents of the winner
                            let newWinners = new Set();
                            queue = loserGraph[winner];
                            queue.forEach(x => { newWinners.add(x) });
                            while (queue.length > 0) {
                                let descendants = loserGraph[queue[0]];
                                descendants.forEach(d => {
                                    if (!newWinners.has(d)) {
                                        queue.push(d);
                                        newWinners.add(d);
                                    }
                                });
                                queue.shift();
                            };
                            //at this point, have the loser lose to any parents it has not yet gone against
                            //utilized chatgpt to rewrite the function to ensure all SQL statements ran before returning
                            async function loseToParents() {
                                newWinners = Array.from(newWinners);

                                for (const w of newWinners) {
                                    try {
                                        const rankingsCount = await queryPromise('SELECT COUNT(*) FROM rankings WHERE username = ? AND list = ? AND ((winner = ? AND loser = ?) OR (loser = ? AND winner = ?));', [username, listName, w, loser, w, loser]);
                                        if (rankingsCount[0]['COUNT(*)'] == 0) {
                                            const smartRankingsCount = await queryPromise('SELECT COUNT(*) FROM smart_rankings WHERE username = ? AND list = ? AND ((winner = ? AND loser = ?) OR (loser = ? AND winner = ?));', [username, listName, w, loser, w, loser]);
                                            if (smartRankingsCount[0]['COUNT(*)'] == 0) {
                                                await queryPromise('INSERT INTO smart_rankings VALUES(?, ?, ?, ?);', [username, listName, w, loser]);
                                                await queryPromise('DELETE FROM unranked WHERE username = ? AND list = ? AND ((id1 = ? AND id2 = ?) OR (id2 = ? AND id1 = ?));', [username, listName, w, loser, w, loser]);
                                                await queryPromise('UPDATE lists SET wins = wins + 1 WHERE username = ? AND list = ? and id = ?;', [username, listName, w]);
                                                await queryPromise('UPDATE lists SET losses = losses + 1 WHERE username = ? AND list = ? and id = ?;', [username, listName, loser]);
                                            }
                                        }
                                    } catch (error) {
                                        throw error;
                                    }
                                }
                                return { ok: true }; // Return an object indicating success
                            }
                            function queryPromise(sql, values) {
                                return new Promise((resolve, reject) => {
                                    connection.query(sql, values, (error, results) => {
                                        if (error) {
                                            reject(error);
                                        } else {
                                            resolve(results);
                                        }
                                    });
                                });
                            }
                            await loseToParents();
                            res.end();
                        });
                    });
                });
            });
        });
    });
});

app.post('/replacePoster', function (req, res) {
    const username = req.session.username;
    const id = req.body.id;
    const link = req.body.link;
    connection.query('UPDATE lists SET poster = ? WHERE username = ? AND id = ?;', [link, username, id], function (error, results) {
        if (error) throw error;
        res.json({ 'msg': 'Successfully changed poster.' });
        res.end();
    });
});

app.get('/rankType', function (req, res) {
    res.json({ 'type': req.session.rankType });
})

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

app.post('/rankListTop', async function (req, res) {
    // If the user is loggedin
    if (req.session.loggedin) {
        req.session.list = req.body.listName;
        res.redirect('/rankTop')
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
});

app.get('/rank', (req, res) => {
    req.session.rankType = 'standard';
    res.sendFile(path.join(__dirname + '/rank.html'));
});

app.get('/rankTop', (req, res) => {
    req.session.rankType = 'top';
    res.sendFile(path.join(__dirname + '/rank.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname + '/signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/customPage', (req, res) => {
    res.sendFile(path.join(__dirname + '/customitem.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/currentUser', (req, res) => {
    res.send(req.session.username);
});

app.post('/getInfo', (req, res) => {
    connection.query('SELECT title, year, poster FROM lists WHERE list = ? AND id = ? AND username = ?;', [req.session.list, req.body.id, req.session.username], function (error, results) {
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