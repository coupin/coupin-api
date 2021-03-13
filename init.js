var chalk = require('chalk');
var dotenv = require('dotenv');
var seeder = require('mongoose-seed');

var Raven = require('./config/config').Raven;
var Users = require('./app/models/users');

dotenv.config();

var db = process.env.MONGO_URL;

// const data = require('./seeds/data.json');
seeder.connect(db, function () {
    // TODO: change this in the future
    Users.findOne({email: process.env.ADMINEMAIL}, function (err, user) {
        if (err) {
            Raven.captureException(err);
            process.exit(0);
        } else if (!user) {
            var admin = new Users();
            admin.email = process.env.ADMINEMAIL;
            admin.password = 'coupinapp';
            admin.role = 0;

            Users.createCustomer(admin, function (err) {
                if (err) {
                    Raven.captureException(err);
                    process.exit(0);
                }

                console.log(chalk.blue.bold('Done with creating the customer'));
                process.exit(0);
            });
        } else {
            console.log(chalk.blue.bold('Customer already exists.'));
            process.exit(0);
        }
    });
});