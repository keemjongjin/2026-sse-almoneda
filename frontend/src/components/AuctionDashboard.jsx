import React, { useEffect, useState, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { io } from 'socket.io-client';

const formatWaitTime = (ms) => {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const AuctionDashboard = () => {
  const { user, token, logout, updatePoints } = useContext(AuthContext);
  
  const [auctionState, setAuctionState] = useState({
    itemName: 'WAITING...',
    startPrice: 0,
    currentPrice: 0,
    highestBidderName: null,
    timeLeft: 0,
    isRunning: false,
    isEnded: false,
    nextStartTime: null,
    trueValue: 0,
    netProfit: 0
  });
  
  const [waitTimerDisplay, setWaitTimerDisplay] = useState('00:00');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [errorToast, setErrorToast] = useState('');
  
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    let intervalId;
    if (!auctionState.isRunning && auctionState.nextStartTime) {
      intervalId = setInterval(() => {
        const diff = auctionState.nextStartTime - Date.now();
        setWaitTimerDisplay(formatWaitTime(diff));
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [auctionState.isRunning, auctionState.nextStartTime]);

  useEffect(() => {
    if (!token) return;

    const socket = io('http://localhost:4000', { auth: { token } });
    socketRef.current = socket;

    socket.on('chat:message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    socket.on('user:updatePoints', (data) => updatePoints(data.points));
    socket.on('auction:error', (data) => showToast(data.message));

    const eventSource = new EventSource('http://localhost:4000/auction/events');

    eventSource.addEventListener('auctionState', (e) => {
      const data = JSON.parse(e.data);
      setAuctionState(prev => ({ ...prev, ...data }));
    });

    eventSource.addEventListener('timerUpdate', (e) => {
      const data = JSON.parse(e.data);
      setAuctionState(prev => ({ ...prev, timeLeft: data.timeLeft, currentPrice: data.currentPrice }));
    });

    eventSource.addEventListener('auctionEnd', (e) => {
      const data = JSON.parse(e.data);
      setAuctionState(prev => ({ 
        ...prev, 
        isRunning: false, 
        isEnded: true, 
        highestBidderName: data.winner,
        currentPrice: data.finalPrice,
        nextStartTime: data.nextStartTime,
        trueValue: data.trueValue,
        netProfit: data.netProfit
      }));
    });

    eventSource.addEventListener('systemMessage', (e) => {
      const data = JSON.parse(e.data);
      setChatMessages(prev => [...prev, { type: 'system', message: data.message }]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => {
      socket.disconnect();
      eventSource.close();
    };
  }, [token]);

  const showToast = (msg) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(''), 3000);
  };

  const handleStartAuction = async () => {
    try {
      const res = await fetch('http://localhost:4000/auction/start', { method: 'POST' });
      const data = await res.json();
      if(!data.success) showToast(data.message);
    } catch (err) {
      showToast('SERVER UNREACHABLE');
    }
  };

  const handleBuy = () => {
    if (socketRef.current && auctionState.isRunning) {
      socketRef.current.emit('auction:buy');
    }
  };

  const handleChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (socketRef.current) {
      socketRef.current.emit('chat:send', { message: chatInput });
      setChatInput('');
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1000px', padding: '40px 20px', display: 'flex', gap: '30px', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
        <h1 style={{ fontSize: '1.2rem', letterSpacing: '4px' }}>
          DUTCH AUCTION
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.8rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#666' }}>{user?.username}</div>
            <div>{user?.points?.toLocaleString()} P</div>
          </div>
          <button onClick={logout} style={{ background: 'none', border: '1px solid #333', padding: '6px 12px', color: '#888', cursor: 'pointer', letterSpacing: '1px' }}>
            LEAVE
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', border: '1px solid #222', padding: '30px' }}>
          
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '10px', fontWeight: 'normal', letterSpacing: '1px' }}>
              {auctionState.itemName}
            </h2>
            <div style={{ color: '#555', fontSize: '0.85rem' }}>INITIAL: {auctionState.startPrice.toLocaleString()}</div>
          </div>

          <div style={{ padding: '30px 0', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '10px' }}>CURRENT</div>
            
            <div style={{ 
              fontSize: '4rem', 
              color: auctionState.isRunning ? '#fff' : '#444',
              letterSpacing: '2px'
            }}>
              {auctionState.currentPrice.toLocaleString()}
            </div>
            
            <div style={{ marginTop: '15px', fontSize: '0.85rem', color: '#444' }}>
              TIME: <span style={{ color: auctionState.timeLeft <= 5 ? '#ff3333' : '#888' }}>{auctionState.timeLeft}</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', minHeight: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            
            {!auctionState.isRunning && !auctionState.isEnded && (
              <div style={{ color: '#888', letterSpacing: '2px', fontSize: '1.5rem' }}>
                <span style={{ fontSize: '1rem', color: '#555', display: 'block', marginBottom: '10px' }}>NEXT AUCTION STARTING IN</span>
                {waitTimerDisplay}
                <br /><br />
                <button className="hacker-btn" style={{ fontSize: '0.7rem', padding: '5px 10px', borderColor: '#333' }} onClick={handleStartAuction}>FORCE START</button>
              </div>
            )}
            
            {auctionState.isRunning && (
              <button 
                className="hacker-btn" 
                style={{ width: '100%', padding: '20px 0', fontSize: '1.2rem', letterSpacing: '4px', borderColor: '#fff' }} 
                onClick={handleBuy}
              >
                BUY
              </button>
            )}

            {auctionState.isEnded && (
              <div style={{ padding: '10px' }}>
                {auctionState.highestBidderName ? (
                  <>
                    <div style={{ color: '#888', marginBottom: '10px', letterSpacing: '1px' }}>
                      SOLD TO: {auctionState.highestBidderName}
                    </div>
                    <div style={{ fontSize: '1.2rem', margin: '20px 0', border: '1px dashed #444', padding: '15px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px' }}>TRUE VALUE REVEALED</div>
                      <div style={{ color: '#fff', fontSize: '1.5rem' }}>{auctionState.trueValue?.toLocaleString()} P</div>
                      
                      <div style={{ 
                        marginTop: '10px', 
                        color: auctionState.netProfit > 0 ? '#00ff41' : '#ff3333' 
                      }}>
                        {auctionState.netProfit > 0 ? `+${auctionState.netProfit.toLocaleString()} P (PROFIT)` : `${auctionState.netProfit.toLocaleString()} P (LOSS)`}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#666', marginBottom: '20px', letterSpacing: '1px' }}>
                    NO BUYERS.
                  </div>
                )}
                
                <div style={{ color: '#444', fontSize: '0.8rem', marginTop: '20px' }}>NEXT: {waitTimerDisplay}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', height: '600px', border: '1px solid #222', padding: '20px' }}>
          
          <div style={{ fontSize: '0.8rem', color: '#555', borderBottom: '1px solid #222', paddingBottom: '10px' }}>
            COM_LINK
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem', color: '#888', padding: '15px 0' }}>
            {chatMessages.map((msg, idx) => (
              <div key={idx}>
                {msg.type === 'system' ? (
                  <span style={{ color: '#555' }}>[SYS] {msg.message}</span>
                ) : (
                  <span>
                    <span style={{ color: '#666' }}>{msg.username}:</span> <span style={{ color: '#ccc' }}>{msg.message}</span>
                  </span>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div style={{ borderTop: '1px solid #222', paddingTop: '15px' }}>
            <form onSubmit={handleChat} style={{ display: 'flex' }}>
               <input 
                type="text" 
                style={{ 
                  flex: 1, 
                  background: 'none', 
                  border: 'none', 
                  color: '#fff',
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                autoComplete="off"
                placeholder="type..."
              />
            </form>
          </div>
        </div>
      </div>

      {errorToast && (
        <div style={{ 
          position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', 
          color: '#ff3333', fontSize: '0.85rem', letterSpacing: '1px'
        }}>
          {errorToast}
        </div>
      )}
    </div>
  );
};

export default AuctionDashboard;
