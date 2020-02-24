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