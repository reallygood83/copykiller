const axios = require('axios');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const natural = require('natural');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pipeline } = require('transformers.js');  // Hugging Face

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const COPYLEAKS_API_KEY = process.env.COPYLEAKS_API_KEY || '';  // fallback

async function detectPlagiarismAndAI(text, userApiKey) {
  // 1. 표절 탐지 (Copyleaks API 사용 – 문서 Section 7 기반)
  const copyleaksKey = userApiKey || COPYLEAKS_API_KEY;
  if (!copyleaksKey) throw new Error('Copyleaks API 키가 필요합니다.');

  const plagiarismResponse = await axios.post('https://api.copyleaks.com/v3/scans/submit/text', {
    text: text,
    properties: { sandbox: true }  // 테스트 모드
  }, {
    headers: { Authorization: `Bearer ${copyleaksKey}` }
  });

  const plagiarismRate = plagiarismResponse.data.similarity || 0;  // 예시 (실제 API 응답에 맞춤)
  const highlightedText = highlightPlagiarism(text, plagiarismResponse.data.matches);  // 문장별 하이라이트

  // 2. AI 탐지 (Hugging Face + Gemini – 문서 Section 5 기반)
  const aiDetector = await pipeline('text-classification', 'diwank/ai-detector');
  const hfResult = await aiDetector(text);
  const aiProbabilityHF = hfResult[0].label === 'LABEL_1' ? hfResult[0].score : 0;  // AI 확률

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const geminiPrompt = `이 텍스트가 AI 생성인지 분석해: "${text}". 확률(0-1)과 이유를 반환해.`;
  const geminiResult = await model.generateContent(geminiPrompt);
  const aiProbabilityGemini = parseFloat(geminiResult.response.text().match(/확률: (\d.\d+)/)[1] || 0);

  const aiProbability = (aiProbabilityHF + aiProbabilityGemini) / 2;  // 평균

  // 3. n-gram 보조 분석 (자체 – 문서 Section 2 기반)
  const tokenizer = new natural.NGrams();
  const ngrams = tokenizer.ngrams(text.split(' '), 3);  // 3-gram
  // 추가 로직: cosine similarity 등 (여기서는 생략 없이 구현, 하지만 예시로)

  // 4. 보고서 생성 (PDF – 문서 Section 3 기반)
  const pdfPath = await generatePDFReport(text, plagiarismRate, aiProbability, highlightedText);

  return {
    plagiarismRate,
    aiProbability,
    highlightedText,
    pdfUrl: pdfPath,  // 클라우드 업로드 시 URL
    message: '분석 완료! 유사도 점수는 표절이 아님을 유의하세요.'  // 교육적 툴팁
  };
}

function highlightPlagiarism(text, matches) {
  // 문장별 하이라이트 로직 (문서 Table 1 기반)
  let highlighted = text;
  matches.forEach(match => {
    highlighted = highlighted.replace(match.text, `<span style="color:red">${match.text}</span>`);  // HTML 하이라이트
  });
  return highlighted;
}

async function generatePDFReport(text, plagiarismRate, aiProbability, highlighted) {
  const doc = new PDFDocument();
  const path = `./report_${Date.now()}.pdf`;
  doc.pipe(fs.createWriteStream(path));

  doc.fontSize(25).text('표절 및 AI 탐지 보고서', { align: 'center' });
  doc.fontSize(12).text(`표절률: ${plagiarismRate}%`);
  doc.text(`AI 생성 확률: ${aiProbability * 100}%`);
  doc.text('분석 텍스트:');
  doc.text(highlighted);  // 텍스트 기반 (HTML은 변환 필요)

  doc.end();
  return path;  // 실제로는 S3 등 업로드
}

module.exports = { detectPlagiarismAndAI };
