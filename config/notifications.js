var config = require('./config');
var gcm = require('node-gcm');

module.exports = {
  sendMessage: function(title, msg, tokens, data) {
    var message = new gcm.Message({
      data: data,
      notification: {
        title: title,
        body: msg
      }
    });

    tokens = ['fGzyfH9Jtok:APA91bHthy-Z-j9REzWAQQmEuM6rCATJhaaUcEHbf2k2ggbG0ZGLdZ7kDlYHSTJaafoH-nz8yNa_v46DoPOduyk0fuedExlnEENPOuKHNF9TosRLDWh3UvowFAIWJvsj8LaSioXAW7AB'];

    config.GCMSender.send(message, {
      registrationTokens: tokens
    }, function(err, resp) {
      if (err) {
        console.log('Notification failed to send.');
      } else {
        console.log('Notification sent successfully.');
      }
    });
  }
};