const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

// Custom
const config = require('./config');
const mailgun = config.mailgun;

module.exports = {
    sendEmail: function(to, subject, message, callback){

        const mailOptions = {
            from: 'Coupin App Ng <info@coupinapp.com>',
            to: to, //can be a lst of receivers e.g. 'test@test.com, test1@test1.com'
            subject: subject,
            cc: process.env.ADMINEMAIL,
            html: '<h1>Hello There</h1><br/>' + message + '<br/>From we at Coupin App'
        };

        // send mail with transporter
        mailgun.messages().send(mailOptions, (err, info) => {
            if(err) {
                return callback({success: false, error: err});
            } else {
                console.log(info);
                return callback({success: true, message: info});
            }
        });
    }
}