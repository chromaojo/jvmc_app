require('dotenv').config();
const express = require('express');
const app = express();
const port = 3600 || process.env.PORT;
const expressLayouts = require('express-ejs-layouts');

app.use(express.urlencoded({ extended: true }));



app.use(expressLayouts);
app.use(express.json());
app.use(express.static('public'));
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');




app.use('', require('./server/routes/pages'));
app.use('/mgt', require('./server/routes/management'));
app.use('/staff', require('./server/routes/staff'));



app.listen(port,()=>{
    console.log(`App running on ${port}`)
})