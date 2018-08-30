var dotenv = require('dotenv');
var nodemailer = require('nodemailer');

// Custom
var config = require('./config');
var mailgun = config.mailgun;

module.exports = {
    getUiUrl: function() {
        console.log('Inside getUiUtl');
        console.log(process.env.UI_URL);
        return `http://${process.env.UI_URL}`;
    },
    sendEmail: function(to, subject, message, callback){

        var mailOptions = {
            from: 'Coupin App Ng <info@coupinapp.com>',
            to: to, //can be a lst of receivers e.g. 'test@test.com, test1@test1.com'
            subject: subject,
            cc: process.env.ADMINEMAIL,
            html: '<h1>Hello There</h1><br/>' + message + '<br/>From we at Coupin App'
        };

        // send mail with transporter
        mailgun.messages().send(mailOptions, (err, info) => {
            if(err) {
                console.log('Email attempt failed!');
                console.log(err);
                return callback({success: false, error: err});
            } else {
                console.log('Email attempt succeeded!');
                console.log(info);
                return callback({success: true, message: info});
            }
        });
    }
}