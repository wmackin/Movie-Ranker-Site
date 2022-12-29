const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql');
const { getPassword } = require('./getPassword');
const app = express();
const port = 8000;

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));
app.use(bodyParser.urlencoded({ extended: false }));

const connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : getPassword(),
	database : 'rankings'
});

//authentication, sourced from https://codeshack.io/basic-login-system-nodejs-express-mysql/
app.post('/auth', function (req, res) {
    // Capture the input fields
    let username = req.body.username;
    let password = req.body.password;
    // Ensure the input fields exists and are not empty
    if (username && password) {
        // Execute SQL query that'll select the account from the database based on the specified username and password
        connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
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
app.get('/home', function (req, res) {
    // If the user is loggedin
    if (req.session.loggedin) {
        // Output username
        res.send('Welcome back, ' + req.session.username + '!');
    } else {
        // Not logged in
        res.send('Please login to view this page!');
    }
    res.end();
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname + '/signup.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/login.html'));
});

app.listen(port, () => {
    console.log(`Success! Your application is running on port ${port}.`);
});