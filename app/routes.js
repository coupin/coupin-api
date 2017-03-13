// models
var Location = require('./models/location');

module.exports = function(app) {
    // server routes

    // get all locations
    app.get('/api/locations', function(req, res) {
        // get all from the database using mongoose
        Location.find(function(err, locations) {
            // send back error if any
            if(err)
                res.send(err);
            
            // return all locations
            res.json(locations);
        });
    });

    app.get('/api/locations/:location_id', function(req, res) {
        // get all from the database using mongoose
        Location.findById(req.params.location_id, function(err, location) {
            // send back error if any
            if(err)
                res.send(err);
            
            // return all locations
            res.json(location);
        });
    });

    app.delete('/api/locations/:location_id', function(req, res) {
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

    app.post('/api/locations', function(req, res) {
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

    // frontend routers
    // routes to handle all angular requests
    app.get('/', function(req, res) {
        // load the index page
        res.sendfile('./public/views/index.html');
    });
}