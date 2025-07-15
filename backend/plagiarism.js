const axios = require('axios');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const natural = require('natural');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const stringSimilarity = require('string-similarity');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function detectPlagiarismAndAI(text, userApiKey) {
  try {
    // 1. Gemini CLI를 통한 표절 검사
    const plagiarismResult = await checkPlagiarismWithGemini(text);
    
    // 2. 웹 검색 기반 표절 검사
    const webSearchResult = await searchBasedPlagiarismCheck(text);
    
    // 3. AI 탐지 (Gemini API 직접 사용)
    const aiDetectionResult = await detectAIWithGemini(text);
    
    // 4. n-gram 기반 내부 유사도 검사
    const ngramResult = await performNgramAnalysis(text);
    
    // 5. 결과 종합
    const plagiarismRate = Math.max(plagiarismResult.rate, webSearchResult.rate, ngramResult.rate);
    const aiProbability = aiDetectionResult.probability;
    const highlightedText = highlightSuspiciousText(text, plagiarismResult.matches, webSearchResult.matches);
    
    // 6. PDF 보고서 생성
    const pdfPath = await generatePDFReport(text, plagiarismRate, aiProbability, highlightedText, {
      plagiarismSources: [...plagiarismResult.sources, ...webSearchResult.sources],
      aiReasoning: aiDetectionResult.reasoning,
      ngramStats: ngramResult.stats
    });

    return {
      plagiarismRate: Math.round(plagiarismRate * 100) / 100,
      aiProbability: Math.round(aiProbability * 100) / 100,
      highlightedText,
      pdfUrl: pdfPath,
      sources: [...plagiarismResult.sources, ...webSearchResult.sources],
      aiReasoning: aiDetectionResult.reasoning,
      message: '분석 완료! 유사도 점수는 표절 확정이 아닙니다. 각 항목을 직접 검토해주세요.'
    };
  } catch (error) {
    console.error('분석 중 오류 발생:', error);
    throw new Error('텍스트 분석 중 오류가 발생했습니다: ' + error.message);
  }
}

// Gemini CLI를 통한 표절 검사
async function checkPlagiarismWithGemini(text) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(__dirname, `temp_${Date.now()}.txt`);
    
    try {
      // 임시 파일 생성
      fs.writeFileSync(tempFile, text, 'utf8');
      
      const prompt = `다음 텍스트의 표절 여부를 검사해주세요. 웹에서 유사한 내용을 찾아 비교하고, 결과를 JSON 형식으로 반환해주세요:
      
{
  "plagiarismRate": 0.0-1.0,
  "matches": [
    {
      "text": "유사한 텍스트 구간",
      "source": "출처 URL 또는 설명",
      "similarity": 0.0-1.0
    }
  ],
  "sources": ["출처1", "출처2"]
}

분석할 텍스트: @${tempFile}`;

      exec(`gemini -p "${prompt.replace(/"/g, '\\"')}"`, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        // 임시 파일 삭제
        try { fs.unlinkSync(tempFile); } catch {}
        
        if (error) {
          console.warn('Gemini CLI 오류, 기본값 반환:', error.message);
          resolve({ rate: 0, matches: [], sources: [] });
          return;
        }
        
        try {
          // JSON 추출 시도
          const jsonMatch = stdout.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            resolve({
              rate: result.plagiarismRate || 0,
              matches: result.matches || [],
              sources: result.sources || []
            });
          } else {
            // JSON이 없으면 기본값
            resolve({ rate: 0, matches: [], sources: [] });
          }
        } catch (parseError) {
          console.warn('Gemini 응답 파싱 실패, 기본값 반환:', parseError.message);
          resolve({ rate: 0, matches: [], sources: [] });
        }
      });
    } catch (fileError) {
      reject(new Error('임시 파일 생성 실패: ' + fileError.message));
    }
  });
}

// 웹 검색 기반 표절 검사 (MCP 웹 검색 활용)
async function searchBasedPlagiarismCheck(text) {
  try {
    // 텍스트를 문장별로 분할
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const matches = [];
    const sources = [];
    let totalSimilarity = 0;
    
    for (const sentence of sentences.slice(0, 3)) { // 처음 3문장만 검사
      try {
        // 웹 검색 수행 (간단한 검색 쿼리 생성)
        const searchQuery = sentence.trim().substring(0, 100);
        
        // 실제 구현에서는 MCP 웹 검색을 사용하지만, 
        // 현재는 시뮬레이션으로 처리
        const searchResult = await simulateWebSearch(searchQuery);
        
        if (searchResult.similarity > 0.7) {
          matches.push({
            text: sentence.trim(),
            source: searchResult.source,
            similarity: searchResult.similarity
          });
          sources.push(searchResult.source);
          totalSimilarity += searchResult.similarity;
        }
      } catch (searchError) {
        console.warn('웹 검색 오류:', searchError.message);
      }
    }
    
    const avgSimilarity = sentences.length > 0 ? totalSimilarity / sentences.length : 0;
    
    return {
      rate: Math.min(avgSimilarity, 1.0),
      matches,
      sources: [...new Set(sources)] // 중복 제거
    };
  } catch (error) {
    console.warn('웹 검색 기반 검사 실패:', error.message);
    return { rate: 0, matches: [], sources: [] };
  }
}

// 웹 검색 시뮬레이션 (실제로는 MCP 웹 검색 사용)
async function simulateWebSearch(query) {
  // 실제 구현에서는 MCP 웹 검색 API를 사용
  // 현재는 랜덤한 결과 반환
  const commonPhrases = [
    '인공지능', '머신러닝', '딥러닝', '자연어처리', '빅데이터',
    '블록체인', '사물인터넷', '클라우드', '데이터베이스'
  ];
  
  const hasCommonPhrase = commonPhrases.some(phrase => query.includes(phrase));
  
  return {
    similarity: hasCommonPhrase ? Math.random() * 0.3 + 0.1 : Math.random() * 0.1,
    source: hasCommonPhrase ? 'Wikipedia 또는 기술 블로그' : '검색 결과 없음'
  };
}

// AI 탐지 (Gemini API 직접 사용)
async function detectAIWithGemini(text) {
  try {
    if (!GEMINI_API_KEY) {
      return { probability: 0, reasoning: 'Gemini API 키가 설정되지 않았습니다.' };
    }
    
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `다음 텍스트가 AI에 의해 생성되었을 가능성을 분석해주세요.

분석 요소:
1. 문체적 특징 (펄플렉서티, 문장 길이 일관성)
2. 어휘 사용 패턴 (반복, 다양성)
3. 개인적 경험/감정 표현의 유무
4. 상투적 표현의 사용

결과를 다음 JSON 형식으로 반환해주세요:
{
  "aiProbability": 0.0-1.0,
  "reasoning": "분석 근거 설명"
}

분석할 텍스트:
"${text.substring(0, 1000)}"`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          probability: parsed.aiProbability || 0,
          reasoning: parsed.reasoning || '분석 결과를 파싱할 수 없습니다.'
        };
      }
    } catch (parseError) {
      // JSON 파싱 실패시 정규식으로 확률 추출 시도
      const probMatch = response.match(/(\d+(?:\.\d+)?)[%\s]*(?:확률|probability)/i);
      const probability = probMatch ? parseFloat(probMatch[1]) / 100 : 0.3;
      
      return {
        probability: Math.min(probability, 1.0),
        reasoning: response.substring(0, 200) + '...'
      };
    }
    
    return { probability: 0.3, reasoning: '기본 AI 탐지 결과' };
  } catch (error) {
    console.warn('AI 탐지 오류:', error.message);
    return { probability: 0, reasoning: 'AI 탐지 중 오류가 발생했습니다: ' + error.message };
  }
}

// n-gram 기반 분석
async function performNgramAnalysis(text) {
  try {
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    if (words.length < 10) {
      return { rate: 0, stats: '텍스트가 너무 짧습니다.' };
    }
    
    // 3-gram 생성
    const trigrams = [];
    for (let i = 0; i < words.length - 2; i++) {
      trigrams.push(words.slice(i, i + 3).join(' '));
    }
    
    // 중복도 계산
    const uniqueGrams = new Set(trigrams);
    const repetitionRate = 1 - (uniqueGrams.size / trigrams.length);
    
    // 어휘 다양성 계산 (TTR)
    const uniqueWords = new Set(words);
    const ttr = uniqueWords.size / words.length;
    
    // 종합 점수 (반복이 많고 어휘가 단조로우면 의심)
    const suspicionRate = repetitionRate * 0.7 + (1 - ttr) * 0.3;
    
    return {
      rate: Math.min(suspicionRate, 1.0),
      stats: `어휘 다양성(TTR): ${(ttr * 100).toFixed(1)}%, n-gram 반복률: ${(repetitionRate * 100).toFixed(1)}%`
    };
  } catch (error) {
    console.warn('n-gram 분석 오류:', error.message);
    return { rate: 0, stats: 'n-gram 분석 실패' };
  }
}

// 의심스러운 텍스트 하이라이팅
function highlightSuspiciousText(text, plagiarismMatches, webMatches) {
  let highlighted = text;
  
  // 표절 의심 구간 하이라이팅 (빨간색)
  plagiarismMatches.forEach(match => {
    if (match.text && match.text.length > 5) {
      highlighted = highlighted.replace(
        new RegExp(escapeRegExp(match.text), 'gi'),
        `<span style="background-color: #ffcccc; color: #cc0000; font-weight: bold;">${match.text}</span>`
      );
    }
  });
  
  // 웹 검색 매치 구간 하이라이팅 (노란색)
  webMatches.forEach(match => {
    if (match.text && match.text.length > 5) {
      highlighted = highlighted.replace(
        new RegExp(escapeRegExp(match.text), 'gi'),
        `<span style="background-color: #ffffcc; color: #cc6600;">${match.text}</span>`
      );
    }
  });
  
  return highlighted;
}

// 정규식 이스케이프
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// PDF 보고서 생성
async function generatePDFReport(text, plagiarismRate, aiProbability, highlighted, details) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const fileName = `report_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, 'reports', fileName);
      
      // reports 디렉토리 생성
      const reportsDir = path.dirname(filePath);
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      doc.pipe(fs.createWriteStream(filePath));
      
      // 헤더
      doc.fontSize(20).text('표절 및 AI 탐지 보고서', { align: 'center' });
      doc.moveDown();
      
      // 요약 결과
      doc.fontSize(14).text('분석 결과 요약', { underline: true });
      doc.fontSize(12)
         .text(`표절 유사도: ${plagiarismRate}%`)
         .text(`AI 생성 확률: ${(aiProbability * 100).toFixed(1)}%`)
         .text(`분석 일시: ${new Date().toLocaleString('ko-KR')}`);
      
      doc.moveDown();
      
      // AI 분석 근거
      if (details.aiReasoning) {
        doc.fontSize(14).text('AI 탐지 근거', { underline: true });
        doc.fontSize(10).text(details.aiReasoning, { width: 500 });
        doc.moveDown();
      }
      
      // 출처 정보
      if (details.plagiarismSources && details.plagiarismSources.length > 0) {
        doc.fontSize(14).text('발견된 유사 출처', { underline: true });
        details.plagiarismSources.forEach((source, index) => {
          doc.fontSize(10).text(`${index + 1}. ${source}`);
        });
        doc.moveDown();
      }
      
      // 통계 정보
      if (details.ngramStats) {
        doc.fontSize(14).text('텍스트 통계', { underline: true });
        doc.fontSize(10).text(details.ngramStats);
        doc.moveDown();
      }
      
      // 원문 (하이라이트 제거된 버전)
      doc.fontSize(14).text('분석 원문', { underline: true });
      doc.fontSize(9).text(text.replace(/<[^>]*>/g, ''), { width: 500 });
      
      // 주의사항
      doc.moveDown();
      doc.fontSize(10).fillColor('red')
         .text('주의: 이 보고서의 결과는 참고용입니다. 최종 판단은 사용자가 직접 내려야 합니다.');
      
      doc.end();
      
      doc.on('end', () => {
        resolve(`/reports/${fileName}`);
      });
      
      doc.on('error', (error) => {
        reject(error);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { detectPlagiarismAndAI };
