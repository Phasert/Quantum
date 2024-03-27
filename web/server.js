// Import necessary modules
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');


// Create Express app
const app = express();

// Parse JSON and urlencoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ilMeesha', // Change this to your MySQL password
    database: 'quantum'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL Connected');
});


app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});


// Route to handle POST request
app.post('/signup', (req, res) => {
    const { firstName, lastName, email, phone, password } = req.body;
    
    const query = `INSERT INTO customer (firstName, lastName, email, phone, pword) VALUES (?, ?, ?, ?, ?)`;
    
    db.query(query, [firstName, lastName, email, phone, password], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error saving customer');
        } else {
            // Send back the customer ID in the response
            res.json({ message: 'Customer saved', customerId: results.insertId });
        }
    });
});


app.post('/login', (req, res) => {
    const { loginId, password } = req.body;

    const query = 'SELECT * FROM customer WHERE customerID = ? AND pword = ?';
    
    db.query(query, [loginId, password], (err, results) => {
        if (err) {
            console.error('Error fetching user', err);
            res.status(500).send('An error occurred');
        } else if (results.length > 0) {
            // Login successful, redirect to userDashboard.html
            res.redirect('/userDashboard.html');
        } else {
            // No user found with the provided credentials
            res.status(401).send('Login failed');
        }
    });
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});