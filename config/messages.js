module.exports = {
  approved: function(id, url) {
    console.log(id);
    console.log(url);
      return `<h4> We are excited to have you as part of the team</h4><br/>
      Please click on the link <a href="${url}/merchant/${id}/confirm">${url}/merchant/${id}/confirm</a> to activate your account<br/><br/>
      If you have any questions, please feel free to message us at info@coupinapp.com<br/><br/>
      Best Regards,</br>The Coupin App Family.`;
  },
  completedEmail: function(data) {
    return `
    <style>
      .test: {
        color: #5E5EE5;
      }
    </style>
    <h1>Congratulations!</h1>
    <h3 class="test"> ${data.name} you have completed your registration! Please log in to start adding rewards right away </h3>
    `
  },
  coupinCreated: function(booking) {
      return '<h4> Your Coupin was created successfully. below is the information needed:</h4><br/>'
      + `<h2>Your Code is ${booking.shortCode}</h2>`;
  },
  registered: function(name) {
    return `<h4> Hello There, </h4><br/>
    <p>This is to let you know that we got your application for ${name}. We will get back to you in the next 24hours.</p>`;
  },
  rejected: function(msg) {
    return `<h4> We are sorry to let you know that your application has been rejected :(</h4><br/>
        Please send addition information at info@coupinapp.com, to help us in verifying your business.<br/><br/>
        <br/>The Rejection Reason was: <br/>${msg}<br/><br/>
        Best Regards,</br>The Coupin App Family.`;
  },
  reviewed: function(review, reward) {
    const status = reward.isActive ? 'accepted' : 'reviewed and chances are required'.
    return `<h4> Your Reward, ${reward.name}, has been ${status}:(</h4><br/>
      If review requested, please login to make any changes required. If no changes and it has been approved, it can now be seen on the Coupin app.<br/><br/>
      <br/><b>Please log on to see comment.</b><br/><br/>
      Best Regards,</br>The Coupin App Family.`;
  }
};