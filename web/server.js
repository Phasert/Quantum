// Import necessary modules
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');


// Create Express app
const app = express();

// Session middleware configuration
app.use(session({
    secret: '1b074e877995c3cbf7cb24fbe7c711f7', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: !true } // Set to true if using https
  }));

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
            // Login successful, set user session
            req.session.userId = results[0].customerID; // Store user ID in session
            req.session.firstName = results[0].firstName; // Store firstName in session
            res.redirect('/userDashboard.html');
        } else {
            // No user found with the provided credentials
            res.status(401).send('Login failed');
        }
    });
});
// Server-side: Ensure this route is defined in your Express application
app.get('/get-user-data', (req, res) => {
    if (req.session.userId) {
        res.json({ firstName: req.session.firstName });
    } else {
        res.status(401).send('Not logged in');
    }
});



// Route to add an item to the cart
app.post('/add-to-cart', (req, res) => {
    console.log('Attempting to add item to cart:', req.body); // Log the incoming cart item

    // Check if the user is logged in
    if (!req.session.userId) {
        console.log('User not logged in, session:', req.session);
        return res.status(401).send('User not logged in');
    }
    
    // Capture the cart item from the request body
    const cartItem = {
        ...req.body,
        customerID: req.session.userId // Add the user ID from the session
    };

    console.log('Prepared cart item:', cartItem); // Log the prepared cart item

    // Insert the cart item into the database
    const query = 'INSERT INTO ShoppingCart SET ?';
    db.query(query, cartItem, (err, result) => {
        if (err) {
            console.error('Error saving cart item', err);
            return res.status(500).send('Error saving cart item');
        }
        console.log('Cart item saved:', result); // Log the result of the insert
        res.json({ message: 'Cart item saved', cartItemId: result.insertId });
    });
});





// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});