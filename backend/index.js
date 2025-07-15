require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://copykiller.vercel.app', 'https://www.copykiller.vercel.app']
    : ['http://localhost:3000', 'http://127.0.0.1:3000']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 서빙 (PDF 보고서용)
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// API 라우트
app.use('/api', routes);

// 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Vercel 배포를 위한 기본 익스포트
module.exports = app;

// 로컬 개발 환경에서만 서버 시작
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
  });
}
