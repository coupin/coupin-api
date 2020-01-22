var dotenv = require('dotenv');
var nodemailer = require('nodemailer');

// Custom
var config = require('./config');
var mailgun = config.mailgun;

module.exports = {
    getUiUrl: function() {
        return `http://${process.env.UI_URL}`;
    },
    sendEmail: function(to, subject, message, callback){

        var mailOptions = {
            from: `Coupin App Ng <${process.env.CARE_EMAIL}>`,
            to: to, //can be a lst of receivers e.g. 'test@test.com, test1@test1.com'
            subject: subject,
            cc: process.env.CARE_EMAIL,
            html: `
            <style>
                .test {
                color: #5E5EE5;
                }
            </style>
            <h1>Hello There</h1><br/>${message}<br/>From we at Coupin App`
        };

        // send mail with transporter
        mailgun.messages().send(mailOptions, (err, info) => {
            if(err) {
                config.Raven.captureException(err);
                return callback({success: false, error: err});
            } else {
                return callback({success: true, message: info});
            }
        });
    },
    sendAdminEmail: function(subject, message, cb) {
        var mailOptions = {
            from: `mobilerewardsplatform@gmail.com`,
            to: process.env.CARE_EMAIL,
            subject: subject,
            html: `
            <style>
                .test {
                color: #5E5EE5;
                }
            </style>
            <h1>Hello There</h1>
            <p>${message}</p>`
        };

        // send mail with transporter
        mailgun.messages().send(mailOptions, (err, info) => {
            if(err) {
                config.Raven.captureException(err);
                return cb({success: false, error: err});
            } else {
                return cb({success: true, message: info});
            }
        });
    }
}