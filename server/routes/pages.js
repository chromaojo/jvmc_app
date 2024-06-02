const express = require('express');
const route = express.Router();
const path = require("path");
const bodyParser = require('body-parser');
const mail = require('../config/mail');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { UserLoggin, AvoidIndex, AdminRoleBased } = require('../auth/userAuth');
const db = require('../config/dbConfig');
const cookieParser = require('cookie-parser');
const rand = Math.floor(Math.random() * 999999)
const rando = Math.floor(Math.random() * 99999)




// Middleware
route.use(
    session({
        secret: `Hidden_Key`,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true }
    })
);
route.use(cookieParser());
route.use(express.static(path.join(__dirname, 'public')));
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({ extended: true }));



// To use tables at server\models\tables.js 
route.use('', require('../models/tables'));


// To get index page 
route.get('/', AvoidIndex, (req, res) => {

    res.sendFile(path.join(__dirname, "../../statics", 'index.html'));
})


// To get the Team page
route.get('/services', (req, res) => {

    const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;

    if (!userCookie) {

        res.sendFile(path.join(__dirname, "../../statics", 'services.html'));
    } else {
        res.redirect('/login');
    }
})


// SME REGISTRATION PAGE 
// To get the SME page
route.get('/sme', (req, res) => {

    const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;

    if (!userCookie) {

        res.sendFile(path.join(__dirname, "../../statics", 'sme.html'));
    } else {
        res.redirect('/login');
    }
})
// To get the Team page
route.get('/sme/reg', (req, res) => {

    const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;

    if (!userCookie) {

        res.sendFile(path.join(__dirname, "../../statics", 'services.html'));
    } else {
        res.redirect('/login');
    }
})


// To Login into the dashboard

route.get('/login', (req, res) => {
    const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;

    if (!userCookie) {
        res.sendFile(path.join(__dirname, "../../statics", 'login.html'));

    } else if (userCookie.role = 'staff') {
        res.redirect('/dashboard');
    } else {
        res.redirect('/mgt/dashboard');
    }

});


// Login route
route.post('/login/account', async (req, res) => {
    const { email, password } = req.body;


    const sqlGetUserWithAccount = `
       SELECT 
         u.user_id,
         u.password,
         u.id,
         u.email,
         u.user_role,
         u.department,
         a.staff_id,
         a.surname,
         a.otherNames,
         a.user_id,
         a.profilePix,
         a.job_status,
         a.whatsapp,
         a.phone_number,
         a.dob,
         a.about,
         a.address,
         a.bank_name,
         a.bank_account,
         a.account_name,
         a.office,
         a.gender,
         a.resume_date
       FROM bkew76jt01b1ylysxnzp.jvmc_users u
       LEFT JOIN bkew76jt01b1ylysxnzp.jvmc_profile a ON u.user_id = a.user_id
       WHERE u.email = ?;
     `;
    // Check if the user and account details with the provided email exists

    db.query(sqlGetUserWithAccount, [email], async (error, result) => {
        if (error) {
            return res.status(500).json({
                message: 'Internal Server Error'
            });
        }
        if (result.length === 0) {
            return res.status(401).json({
                message: 'Invalid Email or Password'
            });
        }

        // Compare the provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, result[0].password);
        if (!isPasswordValid) {
            res.send('Invalid Password or Email');
        }

        req.app.set('userData', result[0])
        const userWithAccount = result[0];
        res.cookie('user', JSON.stringify({ ...userWithAccount }));
        req.session.userId = result[0].id

        res.redirect('/dashboard');
        // if (userWithAccount.user_role == 'staff') {

        // } else {
        //     res.redirect('mgt/dashboard');
        // }  

        // State the sign in for management and staffs for seperate dashboards 
    });
});




// Dashboard route To get all reports from all users

route.get('/dashboard', UserLoggin, (req, res) => {

    const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;

    if (userCookie) {
        const userId = req.params.userId;
        const sqlw = `
          SELECT * FROM bkew76jt01b1ylysxnzp.jvmc_report ORDER BY id DESC;
        `;

        db.query(sqlw, [userId], (err, results) => {
            if (err) {
                return res.status(500).send('Internal Server Error');
            }
            res.clearCookie('userRept');
            req.app.set('userRept', results)
            const userData = userCookie
            const userRept = req.app.get('userRept');
            console.log("All Report detail is", userRept)
            res.render('home', { userRept, userData });

        });

    } else {

        res.redirect('/login');
    }


})



// To Get All the report of One user only
route.get('/dashboard/:user_id', UserLoggin, (req, res) => {
    // const userData = req.app.get('userData');
    const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;

    if (userCookie) {
        const user_id = userCookie.user_id
        const sql = `
          SELECT * FROM bkew76jt01b1ylysxnzp.jvmc_report WHERE user_id = ?  ORDER BY id DESC ;
        `;

        db.query(sql, [user_id], (err, results) => {
            if (err) {
                return res.status(500).send('Internal Server Error');
            }
            res.clearCookie('userRept');
            req.app.set('userRept', results)
            const userData = userCookie
            const userRept = req.app.get('userRept');
            console.log("User Id Details is ", user_id)
            res.render('home1', { userRept, userData });
        });


    } else {

        res.redirect('/login');
    }

})


// To Read only One Specific report
route.get('/dash/:id', UserLoggin, async (req, res) => {
    try {
        const id = req.params.id;
        const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;

        if (!userCookie) {
            return res.redirect('/login');
        }

        // Fetch report data
        const [report] = await new Promise((resolve, reject) => {
            const sql = `SELECT * FROM bkew76jt01b1ylysxnzp.jvmc_report WHERE report_id = ?;`;
            db.query(sql, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        if (!report) {
            return res.status(404).send('Report not found');
        }

        // Fetch report content data
        const reportContent = await new Promise((resolve, reject) => {
            const sqls = `SELECT * FROM bkew76jt01b1ylysxnzp.report_content WHERE report_id = ?;`;
            db.query(sqls, [id], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        // Clear the 'oneRept' cookie
        res.clearCookie('oneRept');

        // Set application level data
        req.app.set('oneRept', reportContent);

        const userData = userCookie;
        // Render the 'one-report' view
        res.render('one-report', { oneRept: reportContent, userData, report });

    } catch (err) {
        console.error('Error handling /dash/:id route:', err);
        res.status(500).send('Internal Server Error');
    }
});

// To get the report page 
route.get('/create/report', UserLoggin, (req, res) => {

    const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;
    const userData = userCookie
    if (!userCookie) {
        res.redirect('/login');
    } else {

        res.render('create-report', { userData })
    }
})


// To Create Report  
route.post('/new/report', async (req, res) => {

    const userData = req.cookies.user ? JSON.parse(req.cookies.user) : null;
    const { name, title } = req.body;
    const user_id = userData.user_id
    const report_id = rand + 'JvMc' + rando
    const currentDate = new Date();
    // Extract date part  
    const date = currentDate.toISOString().split('T')[0]
    const time = new Date().toLocaleTimeString();

    // To Fill the Report Data 

    const sql = `INSERT INTO bkew76jt01b1ylysxnzp.jvmc_report (name, title, report_id, date , time, user_id) VALUES (?,?,?,?,?,?)`;
    const values = [name, title, report_id, date, time, user_id];
    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error storing account data:', err);
            return res.status(500).send('Internal Profile Error');
        }
        res.clearCookie('oneReport');
        res.cookie('report', JSON.stringify({ ...result }));
        req.app.set('oneReport', result)
        res.redirect('/add/report/' + report_id)
    });
});


// To get the add content page 

// To get the report page 
route.get('/add/report/:id', UserLoggin, (req, res) => {

    const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;
    if (userCookie) {
        const id = req.params.id;
        const sql = `
          SELECT * FROM bkew76jt01b1ylysxnzp.jvmc_report WHERE report_id = ?;
        `;
        db.query(sql, [id], (err, result) => {
            if (err) {
                return res.status(500).send('Internal Server Error');
            }
            const title = result[0].title

            const sqls = `SELECT * FROM bkew76jt01b1ylysxnzp.report_content WHERE report_id = ?; `;
            db.query(sqls, [id], (err, results) => {
                if (err) {
                    return res.status(500).send('Internal Server Error');
                }
                res.clearCookie('oneRept');
                req.app.set('oneRept', results)
                const userData = userCookie
                const oneRept = req.app.get('oneRept');
                res.render('create-report2', { oneRept, userData, id, title });
            });
        });

    } else {
        res.redirect('/login');
    }


})

// To Add Content to a report  
route.post('/add/rep', UserLoggin, async (req, res) => {
    const { action, outcome, status, report_id } = req.body;

    // Validate input data
    if (!action || !outcome || !status || !report_id) {
        return res.status(400).send('All fields are required');
    }
    // Check if report_id exists in jvmc_report table
    const checkSql = 'SELECT * FROM bkew76jt01b1ylysxnzp.jvmc_report WHERE report_id = ?';
    db.query(checkSql, [report_id], (checkErr, checkResult) => {
        if (checkErr) {
            console.error('Error checking report_id:', checkErr);
            return res.status(500).send('Internal Server Error');
        }

        if (checkResult.length === 0) {
            return res.status(404).send('report_id not found');
        }
        // Proceed with inserting into report_content
        const insertSql = `INSERT INTO bkew76jt01b1ylysxnzp.report_content (action, outcome, status, report_id) VALUES (?, ?, ?, ?)`;
        const values = [action, outcome, status, report_id];

        db.query(insertSql, values, (insertErr, insertResult) => {
            if (insertErr) {
                console.error('Error inserting report content:', insertErr);
                return res.status(500).send('Internal Server Error');
            }
            res.redirect('/add/report/' + report_id)
        });
    });
});

// To delete a report content
route.get('/del/content/:id', UserLoggin, async (req, res) => {
    try {
        const id = req.params.id;

        // Check if the user is logged in
        const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;
        if (!userCookie) {
            return res.status(401).send('Unauthorized');
        }

        const sqls = `SELECT * FROM bkew76jt01b1ylysxnzp.report_content WHERE id = ?;`;
        db.query(sqls, [id], (err, results) => {
            if (err) {
                console.error('Error deleting report content:', err);
                return res.status(500).send('Internal Server Error');
            }
            const report_id = results[0].report_id
            // Perform the deletion
            const sql = `DELETE FROM bkew76jt01b1ylysxnzp.report_content WHERE id = ?;`;
            db.query(sql, [id], (err, result) => {
                if (err) {
                    console.error('Error deleting report content:', err);
                    return res.status(500).send('Internal Server Error');
                }
                // Check if any rows were affected
                if (result.affectedRows === 0) {
                    return res.status(404).send('Report content not found');
                }
                // Report content successfully deleted
                
                res.redirect('/dash/'+ report_id);
            });
        });
    } catch (err) {
        console.error('Error handling /delete-report-content/:id route:', err);
        res.status(500).send('Internal Server Error');
    }
});
// To delete a reprt 
route.get('/del/report/:id', UserLoggin, async (req, res) => {
    try {
        const report_id = req.params.id;

        // Check if the user is logged in
        const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;
        if (!userCookie) {
            return res.status(401).send('Unauthorized');
        }

        // Perform the deletion
        const sql = `DELETE FROM bkew76jt01b1ylysxnzp.report_content WHERE report_id = ?;`;
        db.query(sql, [report_id], (err, result) => {
            if (err) {
                console.error('Error deleting report content:', err);
                return res.status(500).send('Internal Server Error');
            }

        });

        // To Delete the parent 
        const sqls = `DELETE FROM bkew76jt01b1ylysxnzp.jvmc_report WHERE report_id = ?;`;
        db.query(sqls, [report_id], (err, result) => {
            if (err) {
                console.error('Error deleting report content:', err);
                return res.status(500).send('Internal Server Error');
            }
            // Check if any rows were affected
            if (result.affectedRows === 0) {
                return res.status(404).send('Report content not found');
            } // Report content successfully deleted
            const userC = req.cookies.user ? JSON.parse(req.cookies.user) : null;
            const user_id = userC.user_id
            res.redirect('/dashboard/' + user_id);
        });


    } catch (err) {
        console.error('Error handling /delete-report-content/:id route:', err);
        res.status(500).send('Internal Server Error');
    }
});



// To get the Team page
route.get('/team', (req, res) => {

    const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;

    if (!userCookie) {
        res.sendFile(path.join(__dirname, "../../statics", 'team.html'));

    } else {

        res.redirect('/login');
    }
})

// To get the forgot password page 

route.get('/forgot/password', (req, res) => {

    const userCookie = req.cookies.user ? JSON.parse(req.cookies.user) : null;

    if (!userCookie) {
        res.sendFile(path.join(__dirname, "../../statics", 'pass-reset.html'));

    } else {

        res.redirect('/login');
    }
})





// User edit Page 
route.get('/user/edit', UserLoggin, (req, res) => {

    const userData = req.app.get('userData');

    res.render('userEdit', { userData });
})


// To Update The Password Data 
route.post('/profile/updatePass', UserLoggin, async (req, res) => {

    try {
        const { oldPassword, newPassword } = req.body;
        const userData = req.app.get('userData');

        // Retrieve the current hashed password from the database
        const selectQuery = 'SELECT password FROM users WHERE email = ?';
        let selectValues = [userData.email];

        db.query(selectQuery, selectValues, async (selectError, selectResults) => {
            if (selectError) {
                console.error('Database select error:', selectError);
                res.status(500).send('Error selecting password from the database');
                return;
            }

            if (selectResults.length === 0) {
                res.status(404).send('User not found');
                return;
            }

            const hashedPassword = selectResults[0].password;

            // Compare the provided old password with the hashed password
            const passwordMatch = await bcrypt.compare(oldPassword, hashedPassword);

            if (passwordMatch) {
                // Hash the new password
                const hashedNewPassword = await bcrypt.hash(newPassword, 10);

                // Update the password in the database
                const updateQuery = 'UPDATE users SET password = ? WHERE email = ?';
                const updateValues = [hashedNewPassword, userData.email];

                db.query(updateQuery, updateValues, updateError => {
                    if (updateError) {
                        console.error('Database update error:', updateError);
                        res.status(500).send('Error updating password in the database');
                        return;
                    }
                    const sqlGetUserWithAccount = `
                    SELECT 
                      u.user_id,
                      u.phone_number,
                      u.password,
                      u.email,
                      u.role,
                      a.account_id,
                      a.account_balance,
                      a.votes,
                      a.phone_number1,
                      a.about,
                      a.email as account_email
                    FROM bkew76jt01b1ylysxnzp.jvmc_users u
                    LEFT JOIN bkew76jt01b1ylysxnzp.jvmc_accounts a ON u.user_id = a.user_id
                    WHERE u.email = ?;
                  `;
                    db.query(sqlGetUserWithAccount, [userData.email], async (error, result) => {
                        if (error) {

                            return res.status(500).json({
                                message: 'Internal Server Error'
                            });
                        }

                        if (result.length === 0) {
                            return res.status(401).json({
                                message: 'Invalid Email or Password'
                            });
                        }
                        console.log('This is the Login Result :', result);
                        // Compare the provided password with the hashed password in the database

                        req.app.set('userData', result[0])


                        const userWithAccount = result[0];
                        res.clearCookie('user');
                        res.cookie('user', JSON.stringify(userWithAccount));
                        res.redirect('/dashboard');

                    });
                });
            } else {
                res.status(401).send('Incorrect old password');
            }
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).send('Unexpected error');
    }
});



// Logout route
route.get('/logout', (req, res) => {

    req.session.destroy((err) => {
        delete userData
        res.clearCookie('user');
        if (err) {
            console.error(err);
            res.status(500).send('Error logging out');
        } else {

            res.redirect('/login');
        }
    });
});



module.exports = route;
