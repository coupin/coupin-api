module.exports = {
  approved: function(id) {
      return '<h4> We are excited to have you as part of the team</h4><br/>'
      + 'Please click on the link <a href="http://localhost:5030/merchant/confirm/'+id+'">http://localhost:5030/merchant/confirm/'+id+'</a> to activate your account<br/><br/>'
      + 'If you have any questions, please feel free to message us at info@coupinapp.com<br/><br/>'
      + 'Best Regards,</br>The Coupin App Family.';
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
  rejected: function(msg) {
    return `<h4> We are sorry to let you know that your application has been rejected :(</h4><br/>
        Please send addition information at info@coupinapp.com, to help us in verifying your business.<br/><br/>
        <br/>The Rejection Reason was: <br/>${msg}<br/><br/>
        Best Regards,</br>The Coupin App Family.`;
  }
};