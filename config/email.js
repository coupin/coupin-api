var fs = require('fs');
var _ = require('lodash');
var path = require('path');
var dotenv = require('dotenv');
var nodemailer = require('nodemailer');

// Custom
var config = require('./config');
var mailgun = config.mailgun;

module.exports = {
    getUiUrl: function() {
        return `https://${process.env.UI_URL}`;
    },
    sendEmail: function(to, subject, message, file, callback){
        
        fs.readFile(path.resolve(__dirname, './emailTemplate/index.html'), function (error, html) {
            if (!error) {
                var compiled = _.template(html);
                var signature = path.resolve(__dirname, './emailTemplate/image/signature.png');
        
                var mailOptions = {
                    from: `CoupinApp NG <${process.env.CARE_EMAIL}>`,
                    to: to, //can be a lst of receivers e.g. 'test@test.com, test1@test1.com'
                    subject: subject,
                    bcc: process.env.CARE_EMAIL,
                    html: compiled({ message: message }),
                    inline: signature,
                };
        
                if (typeof file === 'function') {
                    callback = file;
                } else {
                    mailOptions.attachment = file;
                }
        
                // send mail with transporter
                mailgun.messages().send(mailOptions, (err, info) => {
                    if(err) {
                        config.Raven.captureException(err);
                        return callback({success: false, error: err});
                    } else {
                        return callback({success: true, message: info});
                    }
                });
            } else {
                return callback({success: false, error: error});
            }
        })
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