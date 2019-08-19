module.exports = {
  approved: function(id, url) {
      return `<h4> We are excited to have you as part of the team</h4><br/>
      Please click on the link <a href="${url}/merchant/${id}/confirm">${url}/merchant/${id}/confirm</a> to activate your account<br/><br/>
      If you have any questions, please feel free to message us at ${process.env.CARE_EMAIL}<br/><br/>
      Best Regards,</br>The Coupin App Family.`;
  },
  completedEmail: function(data) {
    return `
    <h1>Congratulations!</h1>
    <h3 class="test"> ${data.name} you have completed your registration! Please log in to start adding rewards right away </h3>
    `;
  },
  coupinCreated: function(booking) {
      return '<h4> Your Coupin was created successfully. below is the information needed:</h4><br/>'
      + `<h2>Your Code is ${booking.shortCode}</h2>`;
  },
  feedback: function(data) {
    return `
    <p>A customer, ${data.customer.name} with email ${data.customer.email}, has left a feedback/suggestion. See details below: </p>
    <h3>Coupin Code: ${data.coupinCode}</h3>
    <h3>Merchant Name: ${data.merchantName}</h3>
    <h4 class="test">Message: ${data.message}</h4>`;
  },
  forgotPassword: function(id, url) {
    return `
    <h4> It seems you have forgotten your password. If it really was you, please click on the link below:</h4><br/>
      Please click on the link <a href="${url}/auth/forgot-password?query=${id}">${url}/auth/forgot-password?query=${id}</a> to reset your password<br/><br/>
      If you have any questions, please feel free to message us at ${process.env.CARE_EMAIL}<br/><br/>
      Best Regards,</br>The Coupin App Family.
    `;
  },
  registered: function(name) {
    return `<h4> Hello There, </h4><br/>
    <p>This is to let you know that we got your application for ${name}. We will get back to you in the next 24hours.</p>`;
  },
  rejected: function(msg) {
    return `<h4> We are sorry to let you know that your application has been rejected :(</h4><br/>
        Please send addition information at ${process.env.CARE_EMAIL}, to help us in verifying your business.<br/><br/>
        <br/>The Rejection Reason was: <br/>${msg}<br/><br/>
        Best Regards,</br>The Coupin App Family.`;
  },
  rewardExpiring: function(merchantName, name, dateStr) {
    return `<h4> Hello There, ${merchantName}</h4><br/>
    <p>This is to let you know that your reward, ${name}, will be expiring within the next 2 days on ${dateStr}.</p>`;
  },
  reviewed: function(name, status) {
    return `<h4> Your Reward, ${reward.name}, has been ${status}:(</h4><br/>
      If review requested, please login to make any changes required. If no changes and it has been approved, it can now be seen on the Coupin app.<br/><br/>
      <br/><b>Please log on to see comment.</b><br/><br/>
      Best Regards,</br>The Coupin App Family.`;
  }
};