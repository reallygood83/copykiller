const express = require('express');
const cors = require('cors');
const plagiarismModule = require('./plagiarism');
const path = require('path');

const app = express();

// CORS 설정
app.use(cors({
  origin: ['http://localhost:3000', 'https://copykiller-a3lidiwgm-moon-jungs-projects.vercel.app'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 분석 엔드포인트
app.post('/api/analyze', async (req, res) => {
  try {
    const { text, apiKey } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '분석할 텍스트를 입력해주세요.'
      });
    }

    if (text.length > 50000) {
      return res.status(400).json({
        success: false,
        error: '텍스트는 50,000자 이하로 입력해주세요.'
      });
    }

    console.log(`분석 요청 받음: ${text.length}자`);
    
    const result = await plagiarismModule.detectPlagiarismAndAI(text, apiKey);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('분석 중 오류:', error);
    res.status(500).json({
      success: false,
      error: '분석 중 오류가 발생했습니다: ' + error.message
    });
  }
});

// 건강 상태 확인
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: '키메라 2.0 표절탐지기+글쓰기 멘토'
  });
});

// PDF 리포트 다운로드
app.get('/api/reports/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('/tmp', filename);
    
    res.download(filePath, (err) => {
      if (err) {
        console.error('파일 다운로드 오류:', err);
        res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
      }
    });
  } catch (error) {
    console.error('리포트 다운로드 오류:', error);
    res.status(500).json({ error: '다운로드 중 오류가 발생했습니다.' });
  }
});

module.exports = app;