const express = require('express');
const router = express.Router();
const { Auction, BidLog } = require('../models/Auction');

const clients = new Set();

const MYSTERY_ITEMS = [
  '[OBJ] 내용물을 알 수 없는 검은 금고',
  '[DATA] 정부 폐기 위성 접속 코드 조각',
  '[OBJ] 출처 불명의 미개봉 혈청(Serum) 앰플',
  '[DATA] 유명 은행의 미공개 파산 보고서 (원본)',
  '[OBJ] 1999년의 폴라로이드 사진 뭉치',
  '[DATA] 자아를 가졌다고 주장하는 미완성 AI 소스코드',
  '[OBJ] 방사능 수치가 미세하게 잡히는 운석 파편',
  '[DATA] 뒷골목 가상화폐 지갑 프라이빗 키 (잔액 미상)',
  '[OBJ] 주인이 7번 바뀐 낡은 은회중시계',
  '[OBJ] 누구의 것인지 모를 피 묻은 백지수표'
];

let auctionState = {
  itemName: 'WAITING...',
  startPrice: 0,
  currentPrice: 0,
  trueValue: 0, 
  highestBidder: null, 
  highestBidderName: null,
  timeLeft: 0, 
  isRunning: false,
  isEnded: false,
  timerId: null,
  nextAuctionTimerId: null,
  nextStartTime: null 
};

function broadcast(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach((res) => {
    res.write(payload);
  });
}

function broadcastAuctionState() {
  broadcast('auctionState', {
    itemName: auctionState.itemName,
    startPrice: auctionState.startPrice,
    currentPrice: auctionState.currentPrice,
    highestBidderName: auctionState.highestBidderName,
    timeLeft: auctionState.timeLeft,
    isRunning: auctionState.isRunning,
    isEnded: auctionState.isEnded,
    nextStartTime: auctionState.nextStartTime,
    // trueValue는 경매 중엔 절대 보내지 않음 (클라이언트 해킹 방지)
  });
}

async function internalStartAuction() {
  if (auctionState.isRunning) return;

  if (auctionState.nextAuctionTimerId) {
    clearTimeout(auctionState.nextAuctionTimerId);
    auctionState.nextAuctionTimerId = null;
  }

  // 랜덤 로직: 10개 중 하나
  const randomItem = MYSTERY_ITEMS[Math.floor(Math.random() * MYSTERY_ITEMS.length)];
  
  // 시작가: 50만 ~ 300만 P (10만 단위)
  const randomStart = Math.floor(Math.random() * 26 + 5) * 100000; 
  
  // 진짜 가치: 10만 ~ 500만 P (10만 단위)
  const randomTrue = Math.floor(Math.random() * 50 + 1) * 100000;

  auctionState.isRunning = true;
  auctionState.isEnded = false;
  auctionState.timeLeft = 20;
  auctionState.itemName = randomItem;
  auctionState.startPrice = randomStart;
  auctionState.currentPrice = randomStart;
  auctionState.trueValue = randomTrue;
  auctionState.highestBidder = null;
  auctionState.highestBidderName = null;
  auctionState.nextStartTime = null;

  await BidLog.deleteMany({});
  
  let dbAuction = await Auction.findOne();
  if (!dbAuction) {
    dbAuction = new Auction();
  }
  dbAuction.itemName = auctionState.itemName;
  dbAuction.isRunning = true;
  dbAuction.isEnded = false;
  dbAuction.currentPrice = auctionState.startPrice;
  dbAuction.highestBidder = null;
  dbAuction.highestBidderName = null;
  await dbAuction.save();

  broadcastAuctionState();
  broadcast('systemMessage', { message: 'A NEW MYSTERY AUCTION HAS STARTED.' });

  auctionState.timerId = setInterval(async () => {
    auctionState.timeLeft--;
    
    // 20초 동안 0이 되게끔 비율에 맞춰 차감 (시작가 / 20)
    const dropAmount = Math.floor(auctionState.startPrice / 20);
    auctionState.currentPrice -= dropAmount;
    
    if (auctionState.currentPrice <= 0 || auctionState.timeLeft <= 0) {
      auctionState.currentPrice = 0;
      await stopAuction(null, null, 0);
    } else {
      broadcast('timerUpdate', { 
        timeLeft: auctionState.timeLeft,
        currentPrice: auctionState.currentPrice 
      });
    }
  }, 1000);
}

// socket.js에서 호출됨
async function stopAuction(winnerId, winnerName, finalPrice) {
  if (auctionState.timerId) {
    clearInterval(auctionState.timerId);
    auctionState.timerId = null;
  }
  
  auctionState.isRunning = false;
  auctionState.isEnded = true;
  auctionState.highestBidder = winnerId;
  auctionState.highestBidderName = winnerName;
  auctionState.currentPrice = finalPrice;
  
  auctionState.nextStartTime = Date.now() + 15000; // 템포 상승: 3분 -> 15초 뒤로 변경

  let currentDbAuction = await Auction.findOne();
  if(currentDbAuction) {
    currentDbAuction.isRunning = false;
    currentDbAuction.isEnded = true;
    currentDbAuction.currentPrice = finalPrice;
    currentDbAuction.highestBidder = winnerId;
    currentDbAuction.highestBidderName = winnerName;
    await currentDbAuction.save();
  }

  const netProfit = winnerId ? (auctionState.trueValue - finalPrice) : 0;

  broadcast('auctionEnd', {
    winner: winnerName,
    finalPrice: finalPrice,
    itemName: auctionState.itemName,
    nextStartTime: auctionState.nextStartTime,
    trueValue: auctionState.trueValue, // 종료 시에만 진짜 가치 공개
    netProfit: netProfit
  });

  broadcast('systemMessage', { message: 'NEXT AUCTION IN 15 SECONDS.' });
  auctionState.nextAuctionTimerId = setTimeout(() => {
    internalStartAuction();
  }, 15000);
}

router.getAuctionState = () => auctionState;
router.broadcastAuctionState = broadcastAuctionState;
router.broadcast = broadcast;
router.stopAuction = stopAuction;

router.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  clients.add(res);
  res.write('data: {"message": "CONNECTION_ESTABLISHED"}\n\n');

  const statePayload = `event: auctionState\ndata: ${JSON.stringify(auctionState)}\n\n`;
  res.write(statePayload);

  req.on('close', () => {
    clients.delete(res);
  });
});

router.post('/start', async (req, res) => {
  if (auctionState.isRunning) {
    return res.json({ success: false, message: 'ALREADY_RUNNING' });
  }
  await internalStartAuction();
  res.json({ success: true, message: 'INITIATING_SEQUENCE...' });
});

setTimeout(() => {
  internalStartAuction();
}, 2000);

module.exports = router;
