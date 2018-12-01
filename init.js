var dotenv = require('dotenv');
var seeder = require('mongoose-seed');

var Raven = require('./config/config').Raven;
var Users = require('./app/models/users');

dotenv.config();

var db = process.env.MONGODB_URI;
// var db = process.env.LOCAL_URL;

// const data = require('./seeds/data.json');
seeder.connect(db, function () {
    Users.findOne({email: 'admin@coupin.com'}, function (err, user) {
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

                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    });
});