// models
var express = require('express');
var routes = express.Router();
var Location = require('../models/location');

// get all locations
    routes.route('/').get(function(req, res) {
        // get all from the database using mongoose
        Location.find(function(err, locations) {
            // send back error if any
            if(err)
                res.send(err);
            
            // return all locations
            res.json(locations);
        });
    }).post(function(req, res) {
        // save location
        var location = new Location();

        // Populate the location
        location.name = req.body.name;
        location.address = req.body.address;
        location.phone = req.body.phone;
        location.geopoint = {
            latitude: req.body.latitude,
            longitude: req.body.longitude
        };
        location.isActive = req.body.isActive | false;

        location.save(function(err) {
            if(err)
                res.send(err);
            
            res.json({message: 'Location Created!'});
        });
    });

    routes.route('/:location_id').get(function(req, res) {
        // get all from the database using mongoose
        Location.findById(req.params.location_id, function(err, location) {
            // send back error if any
            if(err)
                res.send(err);
            
            // return all locations
            res.json(location);
        });
    }).delete(function(req, res) {
        // get all from the database using mongoose
        Location.remove({
            _id: req.params.location_id
        }, function(err, location) {
            // send back error if any
            if(err)
                res.send(err);
            
            // return all locations
            res.json({ message: 'Location Successfully deleted' });
        });
    });

    module.exports = routes;