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

// 프론트엔드 정적 파일 서빙
app.use(express.static(path.join(__dirname, '../frontend/build')));

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

// 모든 요청을 React 앱으로 리다이렉트 (SPA를 위한 catch-all)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Vercel 배포를 위한 기본 익스포트
module.exports = app;

// 항상 서버 시작 (Vercel이 아닌 경우)
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🔍 키메라 2.0 서버가 포트 ${port}에서 실행 중입니다.`);
    console.log(`🌐 웹 인터페이스: http://localhost:${port}`);
    console.log(`🔧 API 엔드포인트: http://localhost:${port}/api`);
  });
}
