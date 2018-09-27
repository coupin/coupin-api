// module
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var primeSchema = new Schema({
  featured: {
    first: {
      type: String,
      ref: 'User'
    },
    second: {
      type: String,
      ref: 'User'
    },
    third: {
      type: String,
      ref: 'User'
    }
  },
  hotlist: [{
    id: {
      type: String,
      ref: 'User',
      require: true
    },
    index: {
      type: Number,
      require: true
    },
    url: {
      type: String,
      require: true
    }
  }],
  history: [{
    activity: {
      type: String,
      require: true
    },
    timeStamp: {
      type: Date,
      default: new Date()
    }
  }]
}, {
  usePushEach: true
});

module.exports = mongoose.model('Prime', primeSchema);