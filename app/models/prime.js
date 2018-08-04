// module
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var primeSchema = new Schema({
  hotlist: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    validate: [hotLimit, 'You can only have 3 hot merchants at a time.']
  },
  slidelist: [{
    id: {
      type: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }],
      require: true,
      validate: [slideLimit, 'You can only have 6 merchants at a time on the slide.']
    },
    url: {
      type: String,
      require: true
    }
  }]
});

function hotLimit(val) {
  return val.length <= 3;
}

function slideLimit(val) {
  return val.length <= 6;
}

module.exports = mongoose.model('Prime', primeSchema);