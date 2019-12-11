var https = require('https');
var dotenv = require('dotenv');
var StringDecoder = require('string_decoder').StringDecoder;
var querystring = require('querystring');
var Raven = require('./config.js').Raven;

var url = 'https://api.pdfmonkey.io/api/v1/documents';

var pdfTemplateId = {
  singleReward: 'ca80b705-5a2b-4644-803f-0c0f5980f739',
  allRewards: '75ADE016-C42F-46CF-8437-A76CE440992C',
}

module.exports = {
  checkPdf: function (documentId, cb) {
    var req = https.request({
      protocol: 'https:',
      hostname: 'api.pdfmonkey.io',
      path: '/api/v1/documents/' + documentId,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + process.env.PDFMONKEY_PRIVATE_KEY,
      }
    }, function (res) {
      var decoder = new StringDecoder('utf-8');
      var buffer = '';
      res.on('data', function (data) {
        buffer += decoder.write(data);
      });

      res.on('end', function (data) {
        buffer += decoder.end();

        if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 204) {
          cb(null, buffer);
        } else {
          console.error('problem with request');
          cb(new Error());
        }
      });
    });

    req.on('error', function (e) {
      console.error('problem with request: ' + e.message);
      Raven.captureException(e);
      cb(err);
    });

    req.end();
  },
  generatePdf: function (template, data, cb) {
    var payload = JSON.stringify({
      document: {
        document_template_id: pdfTemplateId[template],
        payload: data,
        status: 'pending',
      },
    });

    var req = https.request({
      protocol: 'https:',
      hostname: 'api.pdfmonkey.io',
      path: '/api/v1/documents',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.PDFMONKEY_PRIVATE_KEY,
      }
    }, function (res) {
      var decoder = new StringDecoder('utf-8');
      var buffer = '';
      res.on('data', function (data) {
        buffer += decoder.write(data);
      });

      res.on('end', function (data) {
        buffer += decoder.end();

        if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 204) {
          cb(null, buffer);
        } else {
          console.error('problem with request');
          cb(new Error());
        }
      });
    });

    req.on('error', function (e) {
      console.error('problem with request: ' + e.message);
      Raven.captureException(e);
      cb(err);
    });
    
    // Write data to request body
    req.write(payload);
    req.end();
  },
};
