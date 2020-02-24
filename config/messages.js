module.exports = {
  approved: function(id, url) { 
    return '<p> We are excited to have you as part of Coupin</p>' +
      '<p style="margin: 10px 0;">Please click on the link <a href="' + url + '/merchant/' + id + '/confirm">' + url + '/merchant/' + id + '/confirm</a> to activate your account</p>' +
      '<p style="margin: 10px 0;">Attached to this email is a quick setup guide, if you have any questions, please feel free to message us at <a href="mailto:' + process.env.CARE_EMAIL + '">' + process.env.CARE_EMAIL +'</a></p>';
  },
  completedEmail: function(data) {
    return '<p>Congratulations!</p>' +
    '<p style="margin: 10px 0;">' + data.name + ' you have completed your registration! Please log in to start adding rewards right away </p>';
  },
  rewardCreated: function (merchantName, rewardName) {
    return '<p style="margin: 10px 0;">Merchant ' + merchantName + ' has initiated ' + rewardName + ' reward for approval review.'
  },
  coupinCreated: function(booking) {
      return '<h4> Your Coupin was created successfully. below is the information needed:</h4><br/>' +
      '<h2>Your Code is ' + booking.shortCode + '</h2>';
  },
  feedback: function(data) {
    return '<p>A customer, ' + data.customer.name + ' with email ' + data.customer.email + ', has left a feedback/suggestion. See details below: </p>' +
    '<h3>Coupin Code: ' + data.coupinCode + '</h3>' +
    '<h3>Merchant Name: ' + data.merchantName + '</h3>' +
    '<h4>Message: ' + data.message + '</h4>';
  },
  forgotPassword: function(id, url) {
    return '<h4> It seems you have forgotten your password. If it really was you, please click on the link below:</h4>' +
    '<p style="margin: 10px 0;">Please click on the link <a href="' + url + '/auth/forgot-password?query=' + id + '">' + url + '/auth/forgot-password?query=' + id + '</a> to reset your password</p>' +
    '<p style="margin: 10px 0;">If you have any questions, please feel free to message us at ' + process.env.CARE_EMAIL +'</p>';
  },
  registered: function(name) {
    return '<p style="margin: 10px 0;">This is to let you know that we got your application for ' + name + '. We will get back to you in the next 24hours.</p>';
  },
  rejected: function(msg) {
    return '<h4> We are sorry to let you know that your application has been rejected</h4>' +
    '<p style="margin: 10px 0;">Please send addition information at ' + process.env.CARE_EMAIL + ', to help us in verifying your business.</p>' +
    '<p style="margin: 10px 0;">The Rejection Reason was: </p>' +
    '<p style="margin: 10px 0;">' + msg + '</p>';
  },
  rewardExpiring: function(merchantName, name, dateStr) {
    return '<h4> Hello There, ' + merchantName + '</h4><br/>' +
    '<p style="margin: 10px 0;">This is to let you know that your reward, ' + name + ', will be expiring within the next 2 days on ' + dateStr + '.</p>';
  },
  reviewed: function(name, status) {
    return '<h4> Your Reward, ' + name + ', has been ' + status + '</h4>' +
    '<p style="margin: 10px 0;">If review requested, please login to make any changes required. If no changes and it has been approved, it can now be seen on the Coupin app.</p>' +
    '<p style="margin: 10px 0;"><b>Please log on to see comment.</b></p>';
  }
};