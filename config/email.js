const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

module.exports = {
    sendEmail: function(to, subject, message, callback){
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        });

        const mailOptions = {
            from: 'Coupin App Ng <info@coupinapp.com>',
            to: to, //can be a lst of receivers e.g. 'test@test.com, test1@test1.com'
            subject: subject,
            html: '<h1>Hello There</h1><br/>' + message + '<br/>From we at Coupin App'
        };

        // send mail with transporter
        transporter.sendMail(mailOptions, (err, info) => {
            if(err)
                return callback({success: false, error: err});

            console.log(info);
            return callback({success: true, message: info});
        });
    }
}