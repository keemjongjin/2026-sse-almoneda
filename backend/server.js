require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// 미들웨어
app.use(cors());
app.use(express.json());

// MongoDB 연결
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sse-auction-db';
mongoose.connect(mongoURI)
.then(() => console.log('MongoDB 연결 성공'))
.catch((err) => console.error('MongoDB 연결 에러:', err));

// 라우터 설정
const authRoutes = require('./routes/auth');
const auctionRoutes = require('./routes/auction');

app.use('/auth', authRoutes);
app.use('/auction', auctionRoutes);

// 기본 라우트
app.get('/', (req, res) => {
  res.send('SSE Auction Backend API');
});

// Socket.io 초기화
require('./socket')(server);

// 서버 시작
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
