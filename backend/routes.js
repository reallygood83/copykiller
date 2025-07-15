const express = require('express');
const { detectPlagiarismAndAI } = require('./plagiarism');

const router = express.Router();

router.post('/analyze', async (req, res) => {
  const { text, apiKey } = req.body;
  
  try {
    console.log('분석 요청 받음:', { textLength: text?.length, hasApiKey: !!apiKey });
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: '분석할 텍스트를 입력해주세요.' });
    }
    
    if (text.length > 10000) {
      return res.status(400).json({ error: '텍스트는 10,000자를 초과할 수 없습니다.' });
    }
    
    const result = await detectPlagiarismAndAI(text, apiKey);
    console.log('분석 완료:', result);
    
    res.json(result);
  } catch (error) {
    console.error('분석 오류:', error);
    res.status(500).json({ 
      error: error.message || '분석 중 오류가 발생했습니다.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 헬스 체크 엔드포인트
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

module.exports = router;
