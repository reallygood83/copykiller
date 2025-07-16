const plagiarismModule = require('./plagiarism');

// Vercel Serverless 함수
module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POST 요청만 처리
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    
    res.status(200).json({
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
};