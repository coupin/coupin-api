// configure passport

// load everything we need
var LocalStrategy = require('passport-local').Strategy;
// Get the user model
var User = require('../app/models/admin');

//expose the function
module.exports = function(passport) {
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
        User.findOne({ 'local.email' : email }, function(err, user) {
            if(err) 
                throw err;

            //If no user is found return the signupMessage
            if(!user) 
                return done(null, false, {message: "No such user exists"});

            // id user is found but password is wrong
            if(!user.isValidPassword(password))
                return done(null, false, {message: 'Wrong Password'});
            
            // if everything is okay
            return done(null, user);
        });
    }))

    // Local Sign-up
    passport.use('local-signup', new LocalStrategy({
        usernameField : 'user-email',
        passwordField : 'user-password',
        passReqToCallback : true // allows us pass the entire request to the callback
    },
    function(req, email, password, done) {
        // make it asynchronous
        process.nextTick(function() {
            // Check if user exists
            User.findOne({
                'local.email': email
            }, function(err, user) {
                if(err) 
                    throw err;

                if(user) {
                    return done(null, false, req.flash('signupMessage', 'The email has been taking'));
                } else {
                    // Create new User
                    var newUser = new User();

                    // Store in local object
                    newUser.local.email = email;
                    newUser.local.password = newUser.encryptPassword(password);

                    // Save new User
                    newUser.save(function(err) {
                        if(err)
                            throw err;
                        return done(null, newUser);
                    });
                }
            });
        });
    }));
};