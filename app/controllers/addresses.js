// Coupin App Messages
var Address = require('../models/addresses');
var Customer = require('../models/users');
var formatAddress = require('../services/outputFormatter').formatAddress;

module.exports = {
    /**
     * @api {post} /customer/addresses Add an address to customer
     * @apiName addAddress
     * @apiGroup Customer
     * 
     * @apiExample {curl} Example usage:
     * curl -i http://localhost:5030/api/v1/customer/addresses
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiSuccess {String} message 'Added Successfully' 
     * @apiSuccess {Object} address an object holding the address information
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  {
     *      "message": "Added Successfully",
     *      "address": {
     *          "id": "String",
     *          "address": "String",
     *          "location": {
     *            longitude: 0,
     *            latitude: 0
     *          }
     *          "mobileNumber": "String",
     *          "owner": "String"
     *      }
     *  }
     * 
     * @apiError Unauthorized Invalid token.
     * 
     * @apiErrorExample Unauthorized:
     *  HTTP/1.1 401 Unauthorized
     *  {
     *      "message": "Unauthorized."
     *  }
     * 
     * @apiError (Error 5xx) ServerError an error occured on the server.
     * 
     * @apiErrorExample ServerError:
     *  HTTP/1.1 500 ServerError
     *  {
     *      "message": "Server Error."
     *  }
     */
    addAddress : function (req, res) {
        var body = req.body;

        var address = new Address({
          address: body.address,
          location: {
            longitude: body.longitude,
            latitude: body.latitude
          },
          mobileNumber: body.mobileNumber,
          owner: req.user.id
        });

        address.save(function(err) {
          if (err) {
            return res.status(500).send(err);
          }

          res.status(200).send({ 
            message: 'Address added successfully',
            address: formatAddress(address)
          });
        });
    },

    /**
     * @api {get} /customer/addresses Get customers addresses
     * @apiName retrieveAddress
     * @apiGroup Customer
     * 
     * @apiExample {curl} Example usage:
     * curl -i http://localhost:5030/api/v1/customer/addresses
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiSuccess {Array} addresses an array address objects
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  {
     *      "addresses": [{
     *          "id": "String",
     *          "address": "String",
     *          "location": {
     *            longitude: 0,
     *            latitude: 0
     *          }
     *          "mobileNumber": "String",
     *          "owner": "String",
     *       }]
     *  }
     * 
     * @apiError Unauthorized Invalid token.
     * 
     * @apiErrorExample Unauthorized:
     *  HTTP/1.1 401 Unauthorized
     *  {
     *      "message": "Unauthorized."
     *  }
     * 
     * @apiError (Error 5xx) ServerError an error occured on the server.
     * 
     * @apiErrorExample ServerError:
     *  HTTP/1.1 500 ServerError
     *  {
     *      "message": "Server Error."
     *  }
     */
     retrieveAddresses : function (req, res) {
        var limit = +req.query.limit || 10;
        var skip = +req.query.skip || 0 ;

        Address.find({
          owner: req.user.id
        }).limit(10).skip(skip*limit).exec(function(err, addresses) {
          if (err) {
            return res.status(500).send(err);
          }

          res.status(200).send({ 
            addresses: addresses.map(function(address) { return formatAddress(address) })
          });
        });
    },

    /**
     * @api {post} /customer/addresses/:id Add an address to customer
     * @apiName addAddress
     * @apiGroup Customer
     * 
     * @apiExample {curl} Example usage:
     * curl -i http://localhost:5030/api/v1/customer/addresses
     * 
     * @apiHeader {String} x-access-token Users unique token
     * 
     * @apiParam {String} id The address id
     * 
     * @apiSuccess {String} message 'updated Successfully' 
     * @apiSuccess {Object} user an object holding the address information
     * 
     * @apiSuccessExample Success-Response:
     *  HTTP/1.1 200 OK
     *  {
     *      "message": "Added Successfully",
     *      "address": {
     *          "id": "String",
     *          "address": "String",
     *          "location": {
     *            longitude: 0,
     *            latitude: 0
     *          }
     *          "mobileNumber": "String",
     *          "owner": "String"
     *      }
     *  }
     * 
     * @apiError Unauthorized Invalid token.
     * 
     * @apiErrorExample Unauthorized:
     *  HTTP/1.1 401 Unauthorized
     *  {
     *      "message": "Unauthorized."
     *  }
     * 
     * @apiError (Error 5xx) ServerError an error occured on the server.
     * 
     * @apiErrorExample ServerError:
     *  HTTP/1.1 500 ServerError
     *  {
     *      "message": "Server Error."
     *  }
     */
     updateAddress : function (req, res) {
      var body = req.body;
      var id = req.params.id;

      Address.findById(id).exec(function(err, address) {
        if (err) {
          return res.status(404).send({ message: 'Address does not exist.' });
        }

        ['address', 'latitude', 'longitude', 'mobileNumber'].forEach(function(key) {
          if (body[key] && (key === 'latitude' || 'longitude')) {
            address.location[key] = body[key];
          } else {
            address[key] = body[key];
          }
        });

        address.save(function(err) {
          if (err) {
            return res.status(500).send(err);
          }

          res.status(200).send({ 
            message: 'Address updated successfully',
            address: formatAddress(address)
          });
        });
      });
  },
}
