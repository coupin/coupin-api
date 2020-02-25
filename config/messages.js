module.exports = {
  // message sent when a merchant's registration has been approved
  approved: function(id, url, merchantName) { 
    return '<tr><td style="padding-bottom: 15px;">Hello ' + merchantName + ',</td></tr>' +
      '<tr><td style="padding-bottom: 20px; line-height: 1.2;">' +
      '<p> We are excited to have you as part of Coupin</p>' +
      '<p style="margin: 10px 0;">Please click on the link <a href="' + url + '/merchant/' + id + '/confirm">' + url + '/merchant/' + id + '/confirm</a> to activate your account</p>' +
      '<p style="margin: 10px 0;">Attached to this email is a quick setup guide, if you have any questions, please feel free to message us at <a href="mailto:' + process.env.CARE_EMAIL + '">' + process.env.CARE_EMAIL +'</a></p>' +
      '</td></tr>';
  },
  // message sent after a merchant has added their details after registration
  completedEmail: function(data) {
    return '<tr><td style="padding-bottom: 15px;">Hello ' + data.name + ',</td></tr>' +
    '<tr><td style="padding-bottom: 20px; line-height: 1.2;">' +
    '<p>Congratulations!</p>' +
    '<p style="margin: 10px 0;">' + data.name + ' you have completed your registration! Please log in to start adding rewards right away </p>';
  },
  // Email sent to admin after a reward has been created
  rewardCreated: function (merchantName, rewardName) {
    return '<tr><td style="padding-bottom: 15px;">Hello Admin,</td></tr>' +
    '<tr><td style="padding-bottom: 20px; line-height: 1.2;">' +
    '<p style="margin: 10px 0;">Merchant ' + merchantName + ' has initiated ' + rewardName + ' reward for approval review.' +
    '</td></tr>';
  },
  // Email sent to customer after a coupin has been created
  coupinCreated: function(booking, username) {
      var greetingSuffix = username ? ' ' + username +',' : ',';
      return '<tr><td style="padding-bottom: 15px;">Hello' + greetingSuffix + '</td></tr>' +
      '<tr><td style="padding-bottom: 20px; line-height: 1.2;">' +
      '<p> Your Coupin was created successfully. below is the information needed:</p>' +
      '<h4>Your Code is ' + booking.shortCode + '</h4>' +
      '</td></tr>';
  },
  // Email sent to admin after a customer gives feedback about a merchant
  feedback: function(data) {
    return '<tr><td style="padding-bottom: 15px;">Hello Admin,</td></tr>' +
    '<tr><td style="padding-bottom: 20px; line-height: 1.2;">' +
    '<p>A customer, ' + data.customer.name + ' with email ' + data.customer.email + ', has left a feedback/suggestion. See details below: </p>' +
    '<h3>Coupin Code: ' + data.coupinCode + '</h3>' +
    '<h3>Merchant Name: ' + data.merchantName + '</h3>' +
    '<h4>Message: ' + data.message + '</h4>' +
    '</td></tr>';
  },
  // forgot password
  forgotPassword: function(id, url) {
    return '<tr><td style="padding-bottom: 15px;">Hello There,</td></tr>' +
    '<tr><td style="padding-bottom: 20px; line-height: 1.2;">' + 
    '<h4> It seems you have forgotten your password. If it really was you, please click on the link below:</h4>' +
    '<p style="margin: 10px 0;">Please click on the link <a href="' + url + '/auth/forgot-password?query=' + id + '">' + url + '/auth/forgot-password?query=' + id + '</a> to reset your password</p>' +
    '<p style="margin: 10px 0;">If you have any questions, please feel free to message us at ' + process.env.CARE_EMAIL +'</p>' +
    '</td></tr>';
  },
  // Email sent to merchant after a merchant has registered
  registered: function(merchantName) {
    return '<tr><td style="padding-bottom: 15px;">Hello There,</td></tr>' +
    '<tr><td style="padding-bottom: 20px; line-height: 1.2;">' + 
    '<p style="margin: 10px 0;">This is to let you know that we got your application for ' + merchantName + '. We will get back to you in the next 24hours.</p>' +
    '</td></tr>';
  },
  // Email sent to merchant if their application was rejected
  rejected: function(rejectionMessage, merchantName) {
    return '<tr><td style="padding-bottom: 15px;">Hello ' + merchantName + ',</td></tr>' +
    '<tr><td style="padding-bottom: 20px; line-height: 1.2;">' + 
    '<h4> We are sorry to let you know that your application has been rejected</h4>' +
    '<p style="margin: 10px 0;">Please send addition information at ' + process.env.CARE_EMAIL + ', to help us in verifying your business.</p>' +
    '<p style="margin: 10px 0;">The Rejection Reason was: </p>' +
    '<p style="margin: 10px 0;">' + rejectionMessage + '</p>' +
    '</td></tr>';
  },
  // Email sent to merchant when their rewards are expiring
  rewardExpiring: function(merchantName, rewardName, expiryDate) {
    return '<tr><td style="padding-bottom: 15px;">Hello ' + merchantName + ',</td></tr>' +
    '<tr><td style="padding-bottom: 20px; line-height: 1.2;">' + 
    '<p style="margin: 10px 0;">This is to let you know that your reward, ' + rewardName + ', will be expiring within the next 2 days on ' + expiryDate + '.</p>' +
    '</td></tr>';
  },
  // Email sent to merchant after their reward has been reviewed and not rejected
  reviewed: function(rewardName, rewardStatus, merchantName) {
    return '<tr><td style="padding-bottom: 15px;">Hello ' + merchantName + ',</td></tr>' +
    '<tr><td style="padding-bottom: 20px; line-height: 1.2;">' + 
    '<h4> Your Reward, ' + rewardName + ', has been ' + rewardStatus + '</h4>' +
    '<p style="margin: 10px 0;">If a review was requested, please login to make changes required. If not, your promotion/info will be seen on the Coupin app on the specified live date.</p>' +
    '<p style="margin: 10px 0;"><b>Please log on to see comment.</b></p>' +
    '</td></tr>';
  }
};