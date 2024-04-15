// Import necessary modules
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const saltRounds = 10;


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
    password: 'Clement@71', // Change this to your MySQL password
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
app.post('/signup', async (req, res) => {
    const { firstName, lastName, email, phone, password } = req.body;
    
    // Hash the password before saving to the database
    bcrypt.hash(password, saltRounds, function(err, hash) {
        if (err) {
            console.error('Error hashing password', err);
            return res.status(500).send('Error processing your request');
        }

        // Use the hashed password in your database query
        const query = `INSERT INTO customer (firstName, lastName, email, phone, pword) VALUES (?, ?, ?, ?, ?)`;

        db.query(query, [firstName, lastName, email, phone, hash], (err, results) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error saving customer');
            } else {
                // Send back the customer ID in the response
                res.json({ message: 'Customer saved', customerId: results.insertId });
            }
        });
    });
});


app.post('/login', (req, res) => {
    const { loginId, password } = req.body;
    
    // First, get the user's hashed password from the database
    const query = 'SELECT * FROM customer WHERE customerID = ?';
    
    db.query(query, [loginId], (err, results) => {
        if (err) {
            console.error('Error fetching user', err);
            return res.status(500).send('An error occurred');
        }
        if (results.length > 0) {
            // Now, compare the submitted password with the hashed password
            bcrypt.compare(password, results[0].pword, function(err, result) {
                if (result) {
                    // Passwords match, login successful
                    req.session.userId = results[0].customerID;
                    req.session.firstName = results[0].firstName;
                    res.redirect('/userDashboard.html');
                } else {
                    // Passwords do not match, login failed
                    res.status(401).send('Login failed');
                }
            });
        } else {
            // No user found with the provided ID
            res.status(401).send('Login failed');
        }
    });
});

// Server-side: Ensure this route is defined in your Express application
app.get('/get-user-data', (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).send('Not logged in');
    }

    // Query the database for the user's email and phone using their ID
    const query = 'SELECT email, phone FROM customer WHERE customerID = ?';

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('SQL Error:', err);
            return res.status(500).send('Error fetching user data');
        }
        if (results.length > 0) {
            const user = results[0];
            res.json({ email: user.email, phone: user.phone });
        } else {
            res.status(404).send('User not found');
        }
    });
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


app.post('/update-customer-info', (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        console.log('User not logged in');
        return res.status(401).send('User not logged in');
    }

    const { email, phone, pword } = req.body;
    let updateFields = [];
    let queryParams = [];

    if (email) {
        updateFields.push(`email = ?`);
        queryParams.push(email);
    }
    if (phone) {
        updateFields.push(`phone = ?`);
        queryParams.push(phone);
    }
    if (pword) {
        updateFields.push(`pword = ?`);
        queryParams.push(pword);
    }

    if (updateFields.length === 0) {
        return res.status(400).send('No valid fields to update');
    }

    queryParams.push(userId);
    const query = `UPDATE customer SET ${updateFields.join(', ')} WHERE customerID = ?`;

    db.query(query, queryParams, (err, result) => {
        if (err) {
            console.error('SQL Error:', err);
            return res.status(500).send('Error updating customer info');
        }
        if (result.affectedRows === 0) {
            // No rows affected, likely no customer with this ID
            return res.status(404).send('Customer not found');
        }
        res.json({ success: true, message: 'Info updated successfully' });
    });
});


app.get('/logout', function(req, res) {
    // Destroy the session
    req.session.destroy(function(err) {
        if (err) {
            console.error('Logout failed', err);
            return res.status(500).send('Logout failed');
        }
        res.clearCookie('connect.sid'); // If you are using 'express-session', clear the session cookie
        res.redirect('/index.html'); // Redirect to the home page, which should serve index.html
    });
});





// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Place this in your server-side JavaScript file

// Static files configuration
app.use(express.static('public'));
// Serve index.html for the root route
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.post('/reset', (req, res) => {
    const userEmail = req.body.email;
    // Function to send email
    sendPasswordResetEmail(userEmail)
      .then(() => res.send('Password reset email sent.'))
      .catch(err => res.status(500).send('Failed to send email.'));
      
  });

  const nodemailer = require('nodemailer');

async function sendPasswordResetEmail(userEmail) {
  let transporter = nodemailer.createTransport({
    service: 'gmail', // For example, use Gmail. You can use other services.
    auth: {
      user: 'kyleplayfortnite@gmail.com', // Your email
      pass: 'bycocufvfxaxxixr', // Your email password
    },
  });

  let mailOptions = {
    from: 'kyleplayfortnite@gmail.com',
    to: userEmail,
    subject: 'Password Reset',
    text: 'Here is your password reset link http://localhost:3000/settings.html?token=secure_unique_token', // You can also use HTML content
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error; // Rethrow the error to be caught by the route handler
  }
}
app.get('/settings.html', (req, res) => {
    const { token } = req.query;
  
    // Lookup the token in the database
    const query = 'SELECT * FROM tokens WHERE token = ?';
    
    db.query(query, [token], (err, results) => {
      if (err) {
        return res.status(500).send('An error occurred');
      }
      if (results.length > 0) {
        const userTokenInfo = results[0];
        const currentTimestamp = Math.floor(Date.now() / 1000);
        
        // Check if token has expired
        if (currentTimestamp > userTokenInfo.expiry) {
          return res.status(400).send('Token has expired');
        }
        
        // Token is valid, so authenticate the user
        req.session.userId = userTokenInfo.userId;
        // Invalidate the token so it can't be reused
        invalidateToken(token);
        
        // Now redirect to the actual settings page or serve it directly
        res.redirect('/actualSettingsPage.html'); // This is the page that checks for req.session.userId
      } else {
        res.status(400).send('Invalid token');
      }
    });
  });
  // Function to call the reset endpoint
function resetPassword(userEmail) {
    fetch('/reset', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            window.location.href = '/index.html'; // Redirect after closing the alert
        } else {
            alert('Failed to reset password.');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}
app.post('/cart', (req, res) => {
    const data = req.body; // Assuming you send the data as JSON
    // Calculate estimated cost
    const calculateCost = async () => {
        // Placeholder value for cost; this will be calculated based on the query result
        let cost = 0;
        // Adjust the query to match your database schema
        // This query looks for a product cost by matching the pName with the submitted item name
        const query = 'SELECT cost FROM Products WHERE pName = ?';
        // Using data.Item assuming your form's item name is passed as 'Item'
        const values = [data.Item]; 
      
        return new Promise((resolve, reject) => {
          connection.query(query, values, (error, results) => {
            if (error) return reject(error);
            if (results.length > 0) {
              const productCost = results[0].cost;
              const days = (new Date(data.returnDate) - new Date(data.rentDate)) / (1000 * 3600 * 24);
              cost = productCost * data.quantity * days;
            }
            resolve(cost);
          });
        });
      };
      
  
    calculateCost().then(cost => {
      const insertQuery = 'INSERT INTO cart (cartID, Item, Quantity, CostEstimate, Comment, RentDate, RentTime, ReturnDate, ReturnTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      const insertValues = [data.cartID, data.item, data.quantity, cost, data.comment, data.rentDate, data.rentTime, data.returnDate, data.returnTime];
      
      connection.query(insertQuery, insertValues, (error, results) => {
        if (error) {
          res.status(500).send('Error inserting data');
          throw error;
        }
        res.status(200).send('Data inserted successfully');
      });
    }).catch(error => {
      console.log(error);
      res.status(500).send('Error calculating cost');
    });
  });
// Example usage
// resetPassword('user@example.com');

  

