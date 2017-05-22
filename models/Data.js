var mongoose = require('mongoose');

var dataSchema = mongoose.Schema({
  name:String,
  count:Number
});

var Data = mongoose.model('data',dataSchema);

module.exports = Data;
