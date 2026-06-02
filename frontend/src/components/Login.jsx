import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Verifying...');
    
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    
    try {
      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Access Denied');
      }

      if (isLogin) {
        setMessage('Welcome.');
        setTimeout(() => {
          login(data.token, data.user);
          navigate('/');
        }, 800);
      } else {
        setMessage('Registered.');
        setIsLogin(true);
        setUsername('');
        setPassword('');
      }
    } catch (err) {
      setMessage(`[!] ${err.message}`);
    }
  };

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', color: '#fff' }}>
      
      <div style={{ marginBottom: '60px', textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem', userSelect: 'none' }}>
        DUTCH AUCTION
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '250px' }}>
        <input 
          type="text" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ID"
          required
          autoComplete="off"
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid #333',
            color: '#fff',
            padding: '8px 0',
            fontFamily: 'monospace',
            fontSize: '1rem',
            outline: 'none',
            textAlign: 'center',
            letterSpacing: '2px'
          }}
        />
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="PASSWORD"
          required
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid #333',
            color: '#fff',
            padding: '8px 0',
            fontFamily: 'monospace',
            fontSize: '1rem',
            outline: 'none',
            textAlign: 'center',
            letterSpacing: '2px'
          }}
        />
        
        <button type="submit" style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          padding: '20px 0',
          fontFamily: 'monospace',
          fontSize: '1rem',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '4px',
          marginTop: '10px'
        }}>
          ENTER
        </button>
      </form>

      <div style={{ height: '30px', marginTop: '20px', fontSize: '0.85rem', color: '#666', fontFamily: 'monospace' }}>
        {message}
      </div>

      <div 
        onClick={() => { setIsLogin(!isLogin); setMessage(''); }}
        style={{ position: 'absolute', bottom: '30px', fontSize: '0.7rem', color: '#333', cursor: 'pointer', letterSpacing: '1px', userSelect: 'none' }}
      >
        {isLogin ? 'CREATE' : 'LOGIN'}
      </div>

    </div>
  );
};

export default Login;
