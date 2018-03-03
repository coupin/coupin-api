const User = require('./../models/users');

module.exports = {
    /**
     * Activate merchant
     */
    activate : function(req, res) {
        User.findById(req.params.id, function(err, user) {
            if(err) 
                throw err;

            if(!user) {
                res.send({success: false, message: 'No Such User Exists'});
            } else {
                user.isActive = true;
                user.save( function(err) {
                    if(err)
                        throw err;

                    res.send({success: true, message: ' was Activated.'});
                });
            }
        });
    },

    /**
     * Add admin
     */
    addAdmin : function(req, res, next) {
        // Form Validator
        req.checkBody('email', 'Email cannot be empty').notEmpty();
        req.checkBody('email', 'Email is required to login').isEmail();
        req.checkBody('password', 'Password cannot be empty').notEmpty();
        req.checkBody('confirm', 'Please Confirm Password').notEmpty();
        req.checkBody('confirm','Passwords do not match').equals(req.body.password);

        // Check for Errors
        var errors = req.validationErrors();

        if(errors) {
            res.json({ errors: errors});
        } else {
            passport.authenticate('local-signup', function(err, user, info){

                if(err)
                    throw err;

                if(info) 
                    return res.send({success: false, message: info});

                if(user)
                    return res.send({success: true, message: 'User Created.'});
            })(req, res, next);
        }
    },

    /**
     * Add super admin
     */
    addSuperAdmin : function(req, res) {
        var user = new User();
        user.email = req.body.email;
        user.password = req.body.password;
        user.role = 0;


        User.createCustomer(user, function(err) {
            if(err)
                throw err;

            res.send({message: 'SuperAdmin Created!'});
        });

    },

    deactivate : function(req, res) {
        User.findById(req.params.id, function(err, user) {
            if(err) 
                throw err;

            if(!user) {
                res.send({success: false, message: 'No Such User Exists'});
            } else {
                user.isActive = false;
                user.save( function(err) {
                    if(err)
                        throw err;

                    res.send({success: true, message: ' was Deactivated.'});
                });
            }
        });
    },

    delete : function(req, res) {
        User.findById(req.params.id, function(err, user) {
            if(err)
                throw err;

            if(user) {
                User.remove({
                    _id : req.params.id
                }, function(err, user) {
                    if(err) {
                        throw err;
                    } else {
                        res.send({success : true, message: 'Admin has been deleted'});
                    }
                    
                });
            }
        });
    },
    
    getAllAdmins : function (req, res) {
        User.find({}, function(err, user) {
            res.json(user);
        });
    },

    /**
     * Admin Login
     */
    login : function (req, res) {
        req.logIn(req.user, function (err, user) {
            if(err)
                throw err;

            res.redirect('/homepage');
        });
    },

    /**
     * Retrieve admin access page
     */
    loginPage: function(req, res) {
        if (req.user) {
            res.redirect('/homepage');
        } else {
            // load the index page
            res.sendfile('./public/views/index.html');
        }
    },

    retrieveHotList: function(req, res) {
        const limit = req.body.limit || 5;

        User.find({
            'merchantInfo.hot.status': true
        })
        .sort({ 'merchantInfo.hot.starts': 'desc' })
        .limit(limit)
        .exec(function(err, users) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else {
                res.status(200).send(users);
            }
        });
    },

    /**
     * Set hot list. Add and Remove from the list
     */
    setHotList: function(req, res) {
        const body = req.body;
        const id = req.params.id || req.body.id;

        User.findById(id, function(err, user) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else if (!user) {
                res.status(404).send({ message: 'User does not exist.' });
            } else {
                user.merchantInfo.hot.status = body.status;

                if (body.status) {
                    user.merchantInfo.hot.starts = new Date(body.starts);
                    user.merchantInfo.hot.expires = new Date(body.expires);
                }

                user.save(function(err) {
                    if (err) {
                        console.log(err);
                        res.status(500).send(err);
                    } else {
                        res.status(200).send({message: 'Done' });
                    }
                });
            }
        });
    }
}