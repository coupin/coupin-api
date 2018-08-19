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
      type: Schema.Types.ObjectId,
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