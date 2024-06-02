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
const rand = Math.floor(Math.random() * 99999)



// Create A Database
route.get('/createDb', (req, res) => {
  let sql = 'CREATE DATABASE jvmc';

  db.query(sql, (err, result) => {
    if (err) {
      res.send('Database Creation Error');
    }
    res.send('A Database Created');
  })
})



// Create The Tables use
route.get('/createTable', (req, res) => {

  const sqlUsers = `
  CREATE TABLE IF NOT EXISTS bkew76jt01b1ylysxnzp.jvmc_users (
    id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
    user_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL CHECK (LENGTH(password) >= 6),
    department VARCHAR(255),
    username VARCHAR(255),
    user_role ENUM('management', 'staff', 'admin'),
    FOREIGN KEY (department) REFERENCES jvmc.jvmc_dept(name) 
  );
`;

  const sqlDept = `
  CREATE TABLE IF NOT EXISTS jvmc.jvmc_dept (
    id INT AUTO_INCREMENT PRIMARY KEY UNIQUE,
    name VARCHAR(255) UNIQUE,
    hod VARCHAR(255),
    objective VARCHAR(255),
    dept_total INT,
    dept_id VARCHAR(255)  /* This has a 1:1 relation */
  );
`;

  const sqlProfile = `
  CREATE TABLE IF NOT EXISTS jvmc.jvmc_profile (
    id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
    staff_id VARCHAR(255) UNIQUE,
    surname VARCHAR(255),
    profilePix VARCHAR(255),
    otherNames VARCHAR(255),
    dob VARCHAR(255),
    state_origin VARCHAR(255),
    country VARCHAR(255),
    gender ENUM('male', 'female', 'other'),
    address VARCHAR(255),
    job_status VARCHAR(255),
    phone_number VARCHAR(255),
    about VARCHAR(255),
    whatsapp VARCHAR(255),
    office VARCHAR(255),
    resume_date DATE,
    resume_year VARCHAR(100),
    bank_name VARCHAR(255),
    bank_account VARCHAR(255),
    account_name VARCHAR(255),
    user_id VARCHAR (255) UNIQUE,
    department VARCHAR (255),
    salary VARCHAR(255),
    leave_total INT,
    FOREIGN KEY (user_id) REFERENCES jvmc.jvmc_users(user_id) /* This has a 1:1 relation */
  ); 
`;

  const sqlReports = `
CREATE TABLE IF NOT EXISTS jvmc.jvmc_report (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id VARCHAR(255) UNIQUE,
  title VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  date VARCHAR(255),
  time VARCHAR(255)
);
`;

  const sqlReport = `
    CREATE TABLE IF NOT EXISTS jvmc.report_content (
      id INT PRIMARY KEY AUTO_INCREMENT,
      action TEXT,
      outcome TEXT,
      status VARCHAR(100),
      report_id VARCHAR(255) NOT NULL,
      FOREIGN KEY (report_id) REFERENCES jvmc.jvmc_report(report_id)
    );
  `;


  const sqlLeave = `
  CREATE TABLE IF NOT EXISTS jvmc.jvmc_leave(
    id INT PRIMARY KEY AUTO_INCREMENT,
    leave_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    reason VARCHAR(255) NOT NULL,
    duration INT,
    applic_date VARCHAR(255),
    note TEXT,
    start VARCHAR(255),
    hr_approval ENUM('approved', 'declined'),
    mgt_approval ENUM('approved', 'declined'),
    status ENUM('approved', 'declined', 'pending', 'ongoing'),
    FOREIGN KEY (leave_id) REFERENCES jvmc.jvmc_users(user_id)
  );
`;
  const sqlLeaveHist = `
CREATE TABLE IF NOT EXISTS jvmc.jvmc_leave_hist(
  id INT PRIMARY KEY AUTO_INCREMENT,
  leave_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  duration INT,
  rem_leave INT,
  applic_date VARCHAR(255),
  start VARCHAR(255),
  approval ENUM('approved', 'declined', 'pending'),
  approved_by VARCHAR (255),
  FOREIGN KEY (leave_id) REFERENCES jvmc.jvmc_users(user_id) /* This has a 1:M relation */
);
`;

  const sqlNotification = `
  CREATE TABLE IF NOT EXISTS jvmc.jvmc_notification (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(70),
    message VARCHAR(255),
    user_id VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES jvmc.jvmc_users(user_id) /* This has a 1:M relation */
  );
`;

  const sqlApplicant = `
  CREATE TABLE IF NOT EXISTS jvmc.jvmc_trainee(
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    about TEXT,
    whatsapp VARCHAR(255),
    phone_number VARCHAR(255),
    address VARCHAR(255),
    unique_id VARCHAR(255)
  );
`;
  const sqlSme = `
CREATE TABLE IF NOT EXISTS jvmc.jvmc_sme(
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  about TEXT,
  phone_number VARCHAR(255),
  phone_number1 VARCHAR(255),
  address VARCHAR(255),
  staff_strength INT,
  status ENUM('llc', 'business_name', 'not_registered'),
  unique_id VARCHAR(255) UNIQUE
);
`;

// -- Create the jvmc_task table
const sqlSmeRep = `
  CREATE TABLE IF NOT EXISTS jvmc.jvmc_task (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    name VARCHAR(255),
    date VARCHAR(255) NOT NULL,
    time VARCHAR(255),
    task_id VARCHAR(255) NOT NULL UNIQUE,
    user_id VARCHAR(255)
  );
`; 

const sqltaskContent = `
  CREATE TABLE IF NOT EXISTS jvmc.task_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task VARCHAR(255) NOT NULL,
    objective TEXT,
    target TEXT,
    timeline VARCHAR(255),
    expectations TEXT,
    achievement TEXT,
    remark TEXT,
    status VARCHAR(100),
    task_id VARCHAR(255) NOT NULL,
    FOREIGN KEY (task_id) REFERENCES jvmc.jvmc_task (user_id)
  );
`; 

const sqlTaskList = `
  CREATE TABLE IF NOT EXISTS jvmc.task_list (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task VARCHAR(255) NOT NULL,
    objective TEXT,
    target TEXT,
    timeline VARCHAR(255),
    expectations TEXT,
    achievement TEXT,
    remark TEXT,
    task_id VARCHAR(255) NOT NULL,
    FOREIGN KEY (task_id) REFERENCES jvmc.jvmc_task(task_id)
  );
`; 




  // db.query(sqlSmeStaff, (errBusinessTerms) => {
  //   if (errBusinessTerms) {
  //     console.log('Error creating SME STAFF table:', errBusinessTerms);
  //     return res.status(500).send('Internal Server Error');
  //   }
  //   console.log('SME Staff Created Successfully');
  // });

  db.query(sqlDept, (errBusinessTerms) => {
    if (errBusinessTerms) {
      console.log('Error creating dept table:', errBusinessTerms);
      return res.status(500).send('Internal Server Error');
    }
    console.log('Department Created Successfully');
  });

  db.query(sqlUsers, (errBusinessTerms) => {
    if (errBusinessTerms) {
      console.log('Error creating users table:', errBusinessTerms);
      return res.status(500).send('Internal Server Error');
    }
    console.log('User Created Successfully');
  });


  db.query(sqlProfile, (errBusinessTerms) => {
    if (errBusinessTerms) {
      console.log('Error creating profile table:', errBusinessTerms);
      return res.status(500).send('Internal Server Error');
    }
    console.log('Profile Created Successfully');
  });

  db.query(sqlReports, (errBusinessTerms) => {
    if (errBusinessTerms) {
      console.log('Error creating Reports table:', errBusinessTerms);
      return res.status(500).send('Internal Server Error');
    }
    console.log('Reports Created Successfully');
  });

  db.query(sqlReport, (errBusinessTerms) => {
    if (errBusinessTerms) {
      console.log('Error creating Report content table:', errBusinessTerms);
      return res.status(500).send('Internal Server Error');
    }
    console.log('Report content Created Successfully');
  });

  db.query(sqlLeave, (errBusinessTerms) => {
    if (errBusinessTerms) {
      console.log('Error creating Levae table:', errBusinessTerms);
      return res.status(500).send('Internal Server Error');
    }
    console.log('Leave Created Successfully');
  });
  db.query(sqlLeaveHist, (errBusinessTerms) => {
    if (errBusinessTerms) {
      console.log('Error creating Levae Hist table:', errBusinessTerms);
      return res.status(500).send('Internal Server Error');
    }
    console.log('Leave History Created Successfully');
  });

  db.query(sqlNotification, (errBusinessTerms) => {
    if (errBusinessTerms) {
      console.log('Error creating notification table:', errBusinessTerms);
      return res.status(500).send('Internal Notif Server Error');
    }
    console.log('Notification Created Successfully');
  });

  db.query(sqlSme, (errBusinessTerms) => {
    if (errBusinessTerms) {
      console.log('Error creating notification table:', errBusinessTerms);
      return res.status(500).send('SME Internal Server Error');
    }
    console.log('SME Created Successfully');
  });

  db.query(sqlApplicant, (errBusinessTerms) => {
    if (errBusinessTerms) {
      console.log('Error creating applicant table:', errBusinessTerms);
      return res.status(500).send('Internal Server Error');
    }
    console.log('Applicant Created Successfully');
    
  });

  db.query(sqlSmeRep, (errBusinessTerms) => {
    if (errBusinessTerms) {
      console.log('Error creating SME Report table:', errBusinessTerms);
      return res.status(500).send(' Task Internal Server Error');
    }
    console.log('Task Created Successfully');
  });

  db.query(sqltaskContent , (errBusinessTerms) => {
    if (errBusinessTerms) {
      console.log('Error creating Task Tracker table:', errBusinessTerms);
      return res.status(500).send('Internal Server Error');
    }
    console.log('Task Content Created Successfully');
  });

  db.query(sqlTaskList, (errBusinessTerms) => {
    if (errBusinessTerms) {
      console.log('Error creating Task Tracker table:', errBusinessTerms);
      return res.status(500).send('Internal Server Error');
    }
    console.log('Task Tracker Created Successfully');
    res.send('All Tables Created Successfully');
  });
 


  
});



module.exports = route;
