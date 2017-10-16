const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const jwt = require('jsonwebtoken');
const passportJWT = require("passport-jwt");

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

const jwtOptions = {
    jwtFromRequest : ExtractJwt.fromAuthHeaderWithScheme('jwt'),
    secretOrKey : 'coupinappcustomer'
};

// User Model
const User = require('./../models/users');

// used to serialize admin for the session
passport.serializeUser(function(user, done){
    done(null, user.id);
});

// Used to deserialize the user
passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    });
});

// Local sign-in
passport.use('local-login', new LocalStrategy({
    usernameField : 'email',
    passwordField: 'password',
    passReqToCallback : true
},
function(req, email, password, done){
    // Check to see if user exists
    User.findOne({ 'email' : email }, function(err, user) {
        if(err) 
            return done(err);

        //If no user is found return the signupMessage
        if(!user) 
            return done(null, false, {success : false, message: "No such user exists"});

        // id user is found but password is wrong
        if(!User.isValid(password, user.password)) {
            return done(null, false, {success : false, message: 'Wrong Password'});
        }
        
        // if everything is okay
        if(user.role === 0 || user.isActive) {
            return done(null, user);
        }

        return done(null, false, {success : false, message: 'User is currently inactive, please contact info@coupinapp.com'})
        
    });
}))

// Local Sign-up
passport.use('local-signup', new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true // allows us pass the entire request to the callback
},
function(req, email, password, done) {
    // make it asynchronous
    process.nextTick(function() {
        // Check if user exists
        User.findOne({
            'email': email
        }, function(err, user) {
            if(err) 
                throw err;

            if(user) {
                return done(null, false, req.flash('signupMessage', 'The email has been taking'));
            } else {
                // Create new User
                var newUser = new User();

                // Store in local object
                newUser.email = email;
                newUser.password = password;

                // Save new User
                User.createCustomer(newUser, function(err) {
                    if(err)
                        throw err;

                    return done(null, {message: 'User was created'});
                });
            }
        });
    });
}));

// Strategy for merchants
passport.use('jwt-1', new JwtStrategy(jwtOptions, function(jwt_payload, next) {
    User.findOne({ 
        'email' : jwt_payload.email
    }, function(err, merchant) {
        if (err) throw err;
        if (merchant) {
        next(null, merchant);
        } else {
        next(null, false,{message: 'Unknown Merchant'});
        }
    });
}));

passport.use('jwt-2', new JwtStrategy(jwtOptions, function(jwt_payload, done) {
    User.findById(jwt_payload.id, function(err, customer) {
        if (err) {
            throw err;
        } else if (!customer) {
            return done(null, false,{message: 'Unknown Customer'});
        } else {
            return done(null, customer);
        }
    });
}));



exports.verify = passport.authenticate('local-login');
exports.verifyJWT = passport.authenticate('jwt-1',{session: false});
exports.verifyJWT1 = passport.authenticate('jwt-2', {session : false});


