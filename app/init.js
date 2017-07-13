const seeder = require('mongoose-seed');
const Users = require('./models/users');

// Configuration
var db = require('../config/db');
var config = require('../config/env');

// const data = require('./seeds/data.json');

seeder.connect(db.url, function () {
    // seeder.populateModels(data, function () {
        Users.findOne({email: 'admin@coupin.com'}, function (err, admin) {
            if (err) {
                console.log(err);
            } else if (!admin) {
                let admin = new Users();
                admin.email = 'admin@coupin.com';
                admin.password = 'coupinapp';
                admin.role = 0;

                Users.createCustomer(admin, function (err) {
                    if (err) {
                        console.log(err);
                    }

                    process.exit(0);
                });
            } else {
                process.exit(0);
            }
        });
    // });
});