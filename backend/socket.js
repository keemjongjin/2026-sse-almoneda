const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const { Auction, BidLog } = require('./models/Auction');
const auctionRoutes = require('./routes/auction');

module.exports = function(server) {
  const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('AUTH_FAILED'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey12345');
      socket.user = decoded.user;
      next();
    } catch (err) {
      return next(new Error('INVALID_TOKEN'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[SYS] USER_CONNECTED: ${socket.user.username}`);

    io.emit('chat:message', { 
      type: 'system', 
      message: `[JOIN] ${socket.user.username} ENTERED.`,
      timestamp: new Date()
    });

    socket.on('chat:send', (data) => {
      io.emit('chat:message', {
        type: 'user',
        username: socket.user.username,
        message: data.message,
        timestamp: new Date()
      });
    });

    socket.on('auction:buy', async () => {
      const state = auctionRoutes.getAuctionState();

      if (!state.isRunning) {
        return socket.emit('auction:error', { message: 'OPERATION_FAILED: NOT_RUNNING' });
      }
      if (state.isEnded) {
        return socket.emit('auction:error', { message: 'OPERATION_FAILED: TOO_LATE' });
      }
      
      const priceToPay = state.currentPrice;
      const trueValue = state.trueValue;

      try {
        const user = await User.findById(socket.user.id);
        if (user.points < priceToPay) {
          return socket.emit('auction:error', { message: 'INSUFFICIENT_FUNDS' });
        }

        // 손익 계산 및 포인트 반영
        // 지불한 금액(priceToPay)은 차감되고, 진짜 가치(trueValue)만큼 보상으로 들어옵니다.
        user.points = user.points - priceToPay + trueValue;
        await user.save();

        const newBidLog = new BidLog({
          user: user._id,
          username: user.username,
          amount: priceToPay
        });
        await newBidLog.save();

        // 경매 종료 호출
        await auctionRoutes.stopAuction(user._id, user.username, priceToPay);

        const netProfit = trueValue - priceToPay;
        const profitStatus = netProfit > 0 ? `+${netProfit.toLocaleString()} P PROFIT!` : `${netProfit.toLocaleString()} P LOSS...`;

        io.emit('chat:message', {
          type: 'system',
          message: `[RESULT] ${user.username} BOUGHT FOR ${priceToPay.toLocaleString()}. TRUE VALUE: ${trueValue.toLocaleString()}. (${profitStatus})`,
          timestamp: new Date()
        });

        socket.emit('user:updatePoints', { points: user.points });

      } catch (err) {
        console.error(err);
        socket.emit('auction:error', { message: 'SYS_ERR: TRANSACTION_FAILED' });
      }
    });

    socket.on('disconnect', () => {
      io.emit('chat:message', { 
        type: 'system', 
        message: `[LEAVE] ${socket.user.username} VANISHED.`,
        timestamp: new Date()
      });
    });
  });
};
