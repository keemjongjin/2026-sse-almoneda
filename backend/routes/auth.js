const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: '모든 필드를 입력해주세요.' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '이미 존재하는 사용자 이름입니다.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      password: hashedPassword
      // points는 스키마에서 1,000,000으로 기본 부여됨
    });

    await newUser.save();

    res.status(201).json({ message: '회원가입이 완료되었습니다.', points: newUser.points });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: '존재하지 않는 사용자입니다.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    const payload = {
      user: {
        id: user.id,
        username: user.username
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'supersecretjwtkey12345',
      { expiresIn: '1d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, username: user.username, points: user.points } });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// 내 정보 가져오기 (토큰 검증)
router.get('/me', async (req, res) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ message: '토큰이 없습니다. 인증이 거부되었습니다.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey12345');
    const user = await User.findById(decoded.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(401).json({ message: '토큰이 유효하지 않습니다.' });
  }
});

module.exports = router;
