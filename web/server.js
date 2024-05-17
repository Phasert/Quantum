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

    // Check if email already exists in the database
    const emailExistsQuery = 'SELECT COUNT(*) AS count FROM customer WHERE email = ?';
    db.query(emailExistsQuery, [email], async (err, emailResults) => {
        if (err) {
            console.error('Error checking email existence', err);
            return res.status(500).send('Error checking email existence');
        }

        const emailExists = emailResults[0].count > 0;
        if (emailExists) {
            return res.status(400).send('Email already exists');
        }

        // Email doesn't exist, proceed with hashing password and inserting user
        bcrypt.hash(password, saltRounds, function(err, hash) {
            if (err) {
                console.error('Error hashing password', err);
                return res.status(500).send('Error hashing password');
            }

            const insertQuery = `INSERT INTO customer (firstName, lastName, email, phone, pword) VALUES (?, ?, ?, ?, ?)`;
            db.query(insertQuery, [firstName, lastName, email, phone, hash], (err, results) => {
                if (err) {
                    console.error('Error saving customer', err);
                    return res.status(500).send('Error saving customer');
                }

                // Send welcome email
                sendWelcomeEmail(firstName, email, results.insertId)
                    .then(() => {
                        // Send back the customer ID in the response
                        res.json({ message: 'Customer saved', customerId: results.insertId });
                    })
                    .catch(error => {
                        console.error('Error sending welcome email:', error);
                        // Even if email sending fails, still respond with the customer ID
                        res.json({ message: 'Customer saved', customerId: results.insertId });
                    });
            });
        });
    });
});


// Function to send welcome email
async function sendWelcomeEmail(firstName, userEmail, customerId) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'kyleplayfortnite@gmail.com', // Your email
            pass: 'bycocufvfxaxxixr', // Your email password
          },
        });
      
        let mailOptions = {
          from: 'kyleplayfortnite@gmail.com',
          to: userEmail,
        subject: 'Welcome to Our Website!',
        text: `Welcome, ${firstName}! Thank you for signing up. Your customer ID is ${customerId}.`,
    };

    await transporter.sendMail(mailOptions);
}



app.post('/login', (req, res) => {
    const { loginId, password } = req.body;

    // First, get the user's hashed password from the customer table
    const customerQuery = 'SELECT * FROM customer WHERE customerID = ?';

    db.query(customerQuery, [loginId], (err, results) => {
        if (err) {
            console.error('Error fetching user from customer table', err);
            return res.status(500).send('An error occurred');
        }
        if (results.length > 0) {
            // Compare the submitted password with the hashed password for customer
            bcrypt.compare(password, results[0].pword, (err, result) => {
                if (err) {
                    console.error('Error comparing passwords', err);
                    return res.status(500).send('An error occurred');
                }
                if (result) {
                    // Passwords match, login successful for customer
                    req.session.userId = results[0].customerID;
                    req.session.firstName = results[0].firstName;
                    return res.redirect('/userDashboard.html');
                } else {
                    // Passwords do not match for customer
                    return res.status(401).send('Login failed');
                }
            });
        } else {
            // No user found in customer table, check the staff table
            const staffQuery = 'SELECT * FROM staff WHERE employeeID = ?';
            db.query(staffQuery, [loginId], (err, results) => {
                if (err) {
                    console.error('Error fetching user from staff table', err);
                    return res.status(500).send('An error occurred');
                }
                if (results.length > 0) {
                    // Compare the submitted password with the stored password for staff
                    const storedPassword = results[0].pword; // Assuming the staff password is stored in plain text or a different format
                    if (password === storedPassword) {
                        // Passwords match, login successful for staff
                        req.session.userId = results[0].employeeID;
                        req.session.firstName = results[0].firstName;
                        
                        // Check the position and redirect accordingly
                        if (results[0].position === 'driver') {
                            return res.redirect('/driverDashboard.html');
                        } else {
                            return res.redirect('/staffDashboard.html');
                        }
                    } else {
                        // Passwords do not match for staff
                        return res.status(401).send('Login failed');
                    }
                } else {
                    // No user found in either customer or staff table
                    return res.status(401).send('Login failed');
                }
            });
        }
    });
});


// Server-side: Ensure this route is defined in your Express application
app.get('/get-user-data', (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).send('Not logged in');
    }

    // Query the database for the user's first name, email, and phone using their ID
    const query = 'SELECT firstName, email, phone FROM customer WHERE customerID = ?';

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('SQL Error:', err);
            return res.status(500).send('Error fetching user data');
        }
        if (results.length > 0) {
            const user = results[0];
            res.json({ firstName: user.firstName, email: user.email, phone: user.phone });
        } else {
            res.status(404).send('User not found');
        }
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

app.post('/cart', async (req, res) => {
    const userId = req.session.userId;

    const { options, quantity, comment, rentDate, rentTime, returnDate, returnTime } = req.body;

    // Query to fetch ProductID and Cost based on the selected option
    const query = 'SELECT ProductID, Cost FROM product WHERE pName = ?';
    db.query(query, [options], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching product details');
        } else {
            if (results.length === 0) {
                res.status(404).send('Product not found');
            } else {
                const { ProductID, Cost } = results[0];
                
                // Calculate rental duration in days
                const rentalDuration = Math.ceil((new Date(returnDate) - new Date(rentDate)) / (1000 * 60 * 60 * 24));
                
                // Calculate Cost_Est based on Cost, quantity, and rental duration
                const Cost_Est = Cost * quantity * rentalDuration;

                // Insert into shoppingcart table
                const insertQuery = 'INSERT INTO shoppingcart (CustomerID, ProductID, Quantity, Cost_Est, custComment, rentDate, rentTime, returnDate, returnTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                db.query(insertQuery, [userId, ProductID, quantity, Cost_Est, comment, rentDate, rentTime, returnDate, returnTime], (err, insertResult) => {
                    if (err) {
                        console.error(err);
                        res.status(500).send('Error saving to cart');
                    } else {
                        // Send back the customer ID in the response
                        res.json({ message: 'Saved to cart' });
                    }
                });
            }
        }
    });
});
app.get('/cart', (req, res) => {
    const userId = req.session.userId; // Retrieve the logged-in user's ID from the session
    

    // Query to select only the shopping cart items for the current customer
    const query = 'SELECT c.Quantity, c.Cost_Est, c.custComment, c.rentDate, c.rentTime, c.returnDate, c.returnTime, c.cartID, p.pName FROM shoppingcart c JOIN product p ON c.ProductID = p.productID WHERE c.CustomerID = ?';

    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error fetching cart data');
        } else {
            res.json(result);
        }
    });
});


app.delete('/cart/:cartID', (req, res) => {
    const cartID = req.params.cartID;
    // Query to delete the item with the specified cartID
    const deleteQuery = 'DELETE FROM shoppingcart WHERE cartID = ?';
    db.query(deleteQuery, [cartID], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error deleting cart item');
        } else {
            res.status(200).send('Cart item deleted successfully');
        }
    });
});




    // // Hash the password before saving to the database
    // bcrypt.hash(password, saltRounds, function(err, hash) {
    //     if (err) {
    //         console.error('Error hashing password', err);
    //         return res.status(500).send('Error processing your request');
    //     }

    //     // Use the hashed password in your database query
    //     const query = `INSERT INTO customer (firstName, lastName, email, phone, pword) VALUES (?, ?, ?, ?, ?)`;

    //     db.query(query, [firstName, lastName, email, phone, hash], (err, results) => {
    //         if (err) {
    //             console.error(err);
    //             res.status(500).send('Error saving customer');
    //         } else {
    //             // Send back the customer ID in the response
    //             res.json({ message: 'Customer saved', customerId: results.insertId });
    //         }
    //     });
    // });
  

    app.post('/save', async (req, res) => {
        const userId = req.session.userId;
        const { amt } = req.body;
    
        const query = 'SELECT CustomerID, ProductID, Quantity, Cost_Est, custComment, rentDate, returnDate FROM shoppingcart WHERE CustomerID = ?';
        db.query(query, [userId], (err, results) => {
            if (err) {
                console.error(err);
                res.status(500).send('Error fetching Cart details');
            } else {
                if (results.length === 0) {
                    res.status(404).send('Customer cart not found');
                } else {
                    const insertQuery = 'INSERT INTO productorder (CustomerID, ProductID, Quantity) VALUES (?,?,?)';
                    const insertOrdQuery = 'INSERT INTO ord (CustomerID, POrderID, RentDate, ReturnDate, Note) VALUES (?,?,?,?,?)';
                    const insertInvoiceQuery = 'INSERT INTO invoice (CustomerID, Balance, PaidAmt, Total, PaymentStatus, RentDate, ReturnDate) VALUES (?,?,?,?,?,?,?)';
                    const deleteCartQuery = 'DELETE FROM shoppingcart WHERE CustomerID = ?';
                    
                    let totalCost = 0;
    
                    results.forEach((item, index) => {
                        const { ProductID, Quantity, Cost_Est, rentDate, returnDate, custComment } = item;
                        totalCost += Cost_Est;
    
                        db.query(insertQuery, [userId, ProductID, Quantity], (err, insertResult) => {
                            if (err) {
                                console.error(err);
                                res.status(500).send('Error saving to product order table');
                            } else {
                                const POrderID = insertResult.insertId;
                                db.query(insertOrdQuery, [userId, POrderID, rentDate, returnDate, custComment], (err, insertOrdResult) => {
                                    if (err) {
                                        console.error(err);
                                        res.status(500).send('Error saving to ord table');
                                    } else if (index === results.length - 1) {  // Check if it is the last iteration
                                        const Balance = totalCost - amt;
                                        let PaymentStatus = "Unpaid";
                                        if (Balance > 0 && Balance < totalCost) {
                                            PaymentStatus = "Pending";
                                        } else if (Balance === 0) {
                                            PaymentStatus = "Paid";
                                        }
                                        db.query(insertInvoiceQuery, [userId, Balance, amt, totalCost, PaymentStatus, rentDate, returnDate], (err, insertInvoiceResult) => {
                                            if (err) {
                                                console.error(err);
                                                res.status(500).send('Error saving to invoice table');
                                            } else {
                                                db.query(deleteCartQuery, [userId], (err, deleteResult) => {
                                                    if (err) {
                                                        console.error(err);
                                                        res.status(500).send('Error deleting from shopping cart table');
                                                    } else {
                                                        res.json({ message: 'Saved to product order, ord, and invoice tables, and cart cleared' });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    });
                }
            }
        });
    });
    
    app.get('/get-dashboard-data', (req, res) => {
        const userId = req.session.userId;
    
        const invoicesQuery = 'SELECT InvoiceID, PaidAmt, Balance, PaymentStatus, RentDate, ReturnDate FROM invoice WHERE CustomerID = ?';
        const rentalsQuery = `
            SELECT product.pName AS item, productorder.Quantity, ord.RentDate, ord.ReturnDate, ord.Note AS comment 
            FROM productorder 
            JOIN ord ON productorder.POrderID = ord.POrderID 
            JOIN product ON productorder.ProductID = product.ProductID
            WHERE productorder.CustomerID = ?
        `;
    
        db.query(invoicesQuery, [userId], (err, invoiceResults) => {
            if (err) {
                console.error('SQL Error:', err);
                return res.status(500).send('Error fetching invoice data');
            }
    
            db.query(rentalsQuery, [userId], (err, rentalResults) => {
                if (err) {
                    console.error('SQL Error:', err);
                    return res.status(500).send('Error fetching rental data');
                }
    
                res.json({
                    invoices: invoiceResults,
                    rentals: rentalResults,
                    clientStatus: invoiceResults.length > 0 ? invoiceResults[0].PaymentStatus : 'Unknown'
                });
            });
        });
    });
    
    // Route to handle form submission
app.post('/submit-delivery-info', (req, res) => {
    const userId = req.session.userId;
    const { email, firstName, lastName, company, country, streetAddress, aptSuiteFloor, city, isBillingAddress } = req.body;

    const query = `
        INSERT INTO Address (CustomerID, Email, FirstName, LastName, Company, Country, StreetAddress, AptSuiteFloor, City, IsBillingAddress)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)
    `;

    const values = [userId, email, firstName, lastName, company, country, streetAddress, aptSuiteFloor, city, isBillingAddress ? 1 : 0];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error inserting data:', err);
            res.status(500).send('Error inserting data');
            return;
        }

        // Save billing info in the session
        req.session.billingInfo = { email, firstName, lastName, company, country, streetAddress, aptSuiteFloor, city, isBillingAddress };

        res.json({ redirect: '/payment.html' }); // Send a JSON response with the redirect URL
    });
});

// Route to handle updates to existing records
app.post('/update-delivery-info', (req, res) => {
    const userId = req.session.userId;
    const { email, firstName, lastName, company, country, streetAddress, aptSuiteFloor, city, isBillingAddress } = req.body;

    const query = `
        UPDATE Address
        SET Email = ?, FirstName = ?, LastName = ?, Company = ?, Country = ?, StreetAddress = ?, AptSuiteFloor = ?, City = ?, IsBillingAddress = ?
        WHERE CustomerID = ?
    `;

    const values = [email, firstName, lastName, company, country, streetAddress, aptSuiteFloor, city, isBillingAddress ? 1 : 0, userId];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating data:', err);
            res.status(500).send('Error updating data');
            return;
        }

        // Save billing info in the session
        req.session.billingInfo = { email, firstName, lastName, company, country, streetAddress, aptSuiteFloor, city, isBillingAddress };

        res.json({ status: 'success', updatedInfo: req.session.billingInfo });
    });
});


// Route to get billing info
app.get('/get-billing-info', (req, res) => {
    const userId = req.session.userId;

    const query = `
        SELECT * FROM Address
        WHERE CustomerID = ? AND IsBillingAddress = 1
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).send('Error fetching data');
            return;
        }

        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).send('No billing information found');
        }
    });
});
app.get('/order/:InvoiceID', (req, res) => {
    const invoiceID = req.params.invoiceID;
    const query = `SELECT * FROM Invoice WHERE InvoiceID = ${invoiceID}`;
  
    connection.query(query, (error, results, fields) => {
      if (error) throw error;
      const invoice = results[0]; // Assuming only one invoice per order for simplicity
      res.render('order', { invoice });
    });
  });
