const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  itemName: { type: String, default: '희귀 빈티지 시계' },
  startPrice: { type: Number, default: 100000 },
  currentPrice: { type: Number, default: 100000 },
  highestBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  highestBidderName: { type: String, default: null },
  timeLeft: { type: Number, default: 30 },
  isRunning: { type: Boolean, default: false },
  isEnded: { type: Boolean, default: false },
  timerId: { type: String, default: null } // 메모리에서 관리하므로 DB에선 참조용
}, { timestamps: true });

const bidLogSchema = new mongoose.Schema({
  auctionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auction' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String },
  amount: { type: Number },
}, { timestamps: true });

const Auction = mongoose.model('Auction', auctionSchema);
const BidLog = mongoose.model('BidLog', bidLogSchema);

module.exports = { Auction, BidLog };
