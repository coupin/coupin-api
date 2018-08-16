// module
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var primeSchema = new Schema({
  featured: {
    first: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    second: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    third: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  hotlist: [{
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

function slideLimit(val) {
  return val.length <= 6;
}

module.exports = mongoose.model('Prime', primeSchema);