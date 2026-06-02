const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    default: 1000000 // 1,000,000 포인트 기본 지급
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
