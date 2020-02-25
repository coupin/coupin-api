// module
var mongoose = require('mongoose');

var schema = mongoose.Schema;

var rewardSchema = new schema({
  name: {
    type: String,
    required: true
  },
  description: {
      type: String
  },
  merchantID: {
      type: String,
      required: true,
      ref: 'User'
  },
  categories: [{
    type: String,
    enum: ['entertainment', 'foodndrink', 'technology', 'groceries', 'healthnbeauty', 'shopping', 'tickets', 'travel']
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  pictures: [{
    id: {
      type: String
    },
    url: {
      type: String
    }
  }],
  createdDate: {
    type: Date,
    default: new Date
  },
  modifiedDate: {
    type: Date
  },
  multiple: {
    status: {
      type: Boolean,
      default: false
    },
    capacity: Number
  },
  price: {
    old: {
      type: Number
    },
    new: {
      type: Number
    }
  },
  applicableDays: [{
    type: Number,
    enum: [0, 1, 2, 3, 4, 5, 6],
    required: true
  }],
  status: {
    type: String,
    enum: ['draft', 'isPending', 'review', 'active', 'inactive', 'expired'],
    default: 'draft'
  },
  isActive: {
      type: Boolean,
      default: false
  },
  delivery: {
      type: Boolean,
      default: false
  },
  review: [{
    admin: {
      type: String,
      ref: 'User',
      require: true
    },
    comment: {
      type: String,
      default: 'Good',
      require: true
    },
    timeStamp: {
      type: Date,
      default: new Date
    },
    seen: {
      type: Boolean,
      default: false
    }
  }],
  notify: {
    type: Boolean,
    default: false
  }
}, {
  usePushEach: true
});
// module.exports allows is to pass this to other files when it is called
var Reward = mongoose.model('Reward', rewardSchema);

Reward.getRewardById = function(id, callback){
	Reward.findById(id, callback);
}


Reward.getRewardByMerchantId = function(merchantId, callback){
  var query = { merchantID: merchantId };
	Reward.find(query, callback);
}

Reward.getRewardByCustomerId = function(customerId, callback){
	var query = {customerId: customerId};
	Reward.findOne(query, callback);
}

Reward.getRewardByCategoryId = function(category, callback){
	var query = {category: category};
	Reward.findOne(query, callback);
}

module.exports = Reward;
