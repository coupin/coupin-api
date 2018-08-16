const bcrypt = require('bcryptjs');

const Prime = require('../models/prime');
const User = require('./../models/users');

module.exports = {
    /**
     * Activate merchant
     */
    activeToggle : function(req, res) {
        User.findById(req.params.id, function(err, user) {
            if(err) {
                res.status(500).send(err);
                throw new Error(err);
            } else if(!user) {
                res.status(404).send({message: 'No Such User Exists'});
            } else {
                user.isActive = !user.isActive;
                user.save( function(err) {
                    if(err) {
                        res.status(500).send(err);
                        throw new Error(err);
                    } else {
                        var status = user.isActive ? 'Activated' : 'Deactivated';
                        res.send({message: `${user.email} was ${status} successfully.`});
                    }
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
            res.status(400).send({ errors: errors});
        } else {
            var body = req.body;
            const salt = bcrypt.genSaltSync(10);
            var user = new User({
                email: body.email,
                password: bcrypt.hashSync(body.password, salt),
                role: 1
            });

            user.save(function(err) {
                if (err) {
                    res.status(500).send(err);
                    throw new Error(err);
                } else {
                    res.status(200).send({message: 'User Created.'});
                }
            });
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

    delete : function(req, res) {
        User.findById(req.params.id, function(err, user) {
            if(err) {
                res.status(500).send(err);
                throw new Error(err);
            } else if (!user) {
                res.status(404).send({message: 'User does not exist.'});
            } else {
                User.remove({
                    _id : req.params.id
                }, function(err, user) {
                    if(err) {
                        res.status(500).send(err);
                        throw new Error(err);
                    } else {
                        res.status(200).send({message: 'Admin has been deleted'});
                    }
                    
                });
            }
        });
    },
    
    getAllAdmins : function (req, res) {
        User.find({
            role: {
                $lte: 1
            },
            email: {
                $ne: process.env.SADMIN
            }
        }, function(err, user) {
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
        Prime.findOne({})
        .populate({
            path: 'featured.first',
            model: 'User',
            select: 'merchantInfo.companyName merchantInfo.logo'
        })
        .populate({
            path: 'featured.second',
            model: 'User',
            select: 'merchantInfo.companyName merchantInfo.logo'
        })
        .populate({
            path: 'featured.third',
            model: 'User',
            select: 'merchantInfo.companyName merchantInfo.logo'
        })
        .exec(function(err, prime) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else {
                res.status(200).send(prime);
            }
        });
    },

    /**
     * Set hot list. Add and Remove from the list
     */
    setHotList: function(req, res) {
        const body = req.body;

        Prime.findOne(function(err, prime) {
            if (err) {
                console.log(err);
                res.status(500).send(err);
            } else {
                prime = !prime ? new Prime() : prime;

                if (body.isFeatured) {
                    prime.featured = {
                        first: body.featured.first._id,
                        second: body.featured.second._id,
                        third: body.featured.third._id
                    };
                } else {
                    const hotlist = JSON.parse(body.hotlist);
                    if (Array.isArray(hotlist)) {
                        if (!prime.hotlist) {
                            prime.hotlist = [];
                        }
                        featured.forEach(element => {
                            prime.hotlist.push({
                                id: element.id,
                                url: element.url
                            });
                        });
                    } else {
                        res.status(400).send({ message: 'Bad hot list format.' });
                    }
                }

                prime.save(function(err) {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send({message: 'Done' });
                    }
                });
            }
        });
    }
}