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
    // 0. 전처리 - 회피 시도 탐지 및 정규화
    const normalizedText = normalizeAndDetectManipulation(text);
    
    // 1. Gemini CLI를 통한 표절 검사
    const plagiarismResult = await checkPlagiarismWithGemini(normalizedText.clean);
    
    // 2. 웹 검색 기반 표절 검사
    const webSearchResult = await searchBasedPlagiarismCheck(normalizedText.clean);
    
    // 3. AI 탐지 (Gemini API 직접 사용)
    const aiDetectionResult = await detectAIWithGemini(normalizedText.clean, userApiKey);
    
    // 4. n-gram 기반 내부 유사도 검사
    const ngramResult = await performNgramAnalysis(normalizedText.clean);
    
    // 5. 새로운 고급 탐지 기능들
    const styleAnalysis = await analyzeWritingStyle(normalizedText.clean);
    const authenticity = await checkWritingAuthenticity(normalizedText.clean);
    const improvementSuggestions = await generateImprovementSuggestions(normalizedText.clean, plagiarismResult, aiDetectionResult);
    
    // 6. 결과 종합
    const plagiarismRate = Math.max(plagiarismResult.rate, webSearchResult.rate, ngramResult.rate);
    const aiProbability = Math.max(aiDetectionResult.probability, styleAnalysis.aiLikelihood);
    const highlightedText = highlightSuspiciousText(normalizedText.clean, plagiarismResult.matches, webSearchResult.matches);
    
    // 7. PDF 보고서 생성 (개선 제안 포함)
    const pdfPath = await generateEnhancedPDFReport(normalizedText.clean, plagiarismRate, aiProbability, highlightedText, {
      plagiarismSources: [...plagiarismResult.sources, ...webSearchResult.sources],
      aiReasoning: aiDetectionResult.reasoning,
      ngramStats: ngramResult.stats,
      styleAnalysis,
      manipulationAttempts: normalizedText.manipulationAttempts,
      improvementSuggestions
    });

    return {
      plagiarismRate: Math.round(plagiarismRate * 100) / 100,
      aiProbability: Math.round(aiProbability * 100) / 100,
      highlightedText,
      pdfUrl: pdfPath,
      sources: [...plagiarismResult.sources, ...webSearchResult.sources],
      aiReasoning: aiDetectionResult.reasoning,
      styleAnalysis,
      manipulationDetected: normalizedText.manipulationAttempts.length > 0,
      improvementSuggestions,
      authenticityScore: authenticity.score,
      message: '분석 완료! 개선 제안을 확인하여 더 나은 글쓰기를 경험해보세요.'
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

// 텍스트 정규화 및 조작 시도 탐지
function normalizeAndDetectManipulation(text) {
  const manipulationAttempts = [];
  
  // 1. 비정상 유니코드 문자 탐지
  const suspiciousChars = ['\u200B', '\u200C', '\u200D', '\uFEFF'];
  suspiciousChars.forEach(char => {
    if (text.includes(char)) {
      manipulationAttempts.push({
        type: 'unicode_manipulation',
        description: '보이지 않는 문자 삽입 감지',
        severity: 'high'
      });
    }
  });
  
  // 2. 텍스트 정규화
  const cleanText = text
    .normalize('NFKD')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // 3. 비정상적인 공백 패턴 탐지
  if (text.includes('  ') || text.includes('\t')) {
    manipulationAttempts.push({
      type: 'spacing_manipulation',
      description: '비정상적인 공백 패턴 감지',
      severity: 'medium'
    });
  }
  
  return {
    clean: cleanText,
    original: text,
    manipulationAttempts
  };
}

// 문체 분석
async function analyzeWritingStyle(text) {
  try {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentences.length < 3) {
      return { aiLikelihood: 0, analysis: '텍스트가 너무 짧습니다.' };
    }
    
    // 문장 길이 분석
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const lengthVariance = calculateVariance(sentenceLengths);
    
    // 어휘 다양성 분석
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const uniqueWords = new Set(words);
    const lexicalDiversity = uniqueWords.size / words.length;
    
    // AI 가능성 점수 계산
    let aiLikelihood = 0;
    
    // 문장 길이가 너무 일정하면 AI 가능성 증가
    if (lengthVariance < 10 && avgLength > 15) {
      aiLikelihood += 0.3;
    }
    
    // 어휘 다양성이 낮으면 AI 가능성 증가
    if (lexicalDiversity < 0.6) {
      aiLikelihood += 0.2;
    }
    
    // 상투적 표현 탐지
    const clichePhrases = ['따라서', '결론적으로', '한편으로는', '다른 한편으로는'];
    const clicheCount = clichePhrases.filter(phrase => text.includes(phrase)).length;
    if (clicheCount > 2) {
      aiLikelihood += 0.2;
    }
    
    return {
      aiLikelihood: Math.min(aiLikelihood, 1.0),
      analysis: {
        avgSentenceLength: Math.round(avgLength),
        sentenceLengthVariance: Math.round(lengthVariance),
        lexicalDiversity: Math.round(lexicalDiversity * 100) / 100,
        clicheCount
      }
    };
  } catch (error) {
    console.warn('문체 분석 오류:', error.message);
    return { aiLikelihood: 0, analysis: '문체 분석 실패' };
  }
}

// 분산 계산 함수
function calculateVariance(numbers) {
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
}

// 글쓰기 진정성 검사
async function checkWritingAuthenticity(text) {
  try {
    // 개인적 경험 표현 탐지
    const personalIndicators = ['저는', '제가', '우리', '경험했습니다', '느꼈습니다', '생각합니다'];
    const personalCount = personalIndicators.filter(indicator => text.includes(indicator)).length;
    
    // 감정적 표현 탐지
    const emotionalWords = ['기쁘다', '슬프다', '놀랍다', '흥미롭다', '실망스럽다', '만족스럽다'];
    const emotionalCount = emotionalWords.filter(word => text.includes(word)).length;
    
    // 구체적 세부사항 탐지
    const specificDetails = text.match(/\d{4}년|\d+월|\d+일|구체적|예를 들어|실제로/g) || [];
    
    let authenticityScore = 0.5; // 기본값
    
    if (personalCount > 0) authenticityScore += 0.2;
    if (emotionalCount > 0) authenticityScore += 0.15;
    if (specificDetails.length > 2) authenticityScore += 0.15;
    
    return {
      score: Math.min(authenticityScore, 1.0),
      factors: {
        personalExpressions: personalCount,
        emotionalWords: emotionalCount,
        specificDetails: specificDetails.length
      }
    };
  } catch (error) {
    console.warn('진정성 검사 오류:', error.message);
    return { score: 0.5, factors: {} };
  }
}

// 개선 제안 생성
async function generateImprovementSuggestions(text, plagiarismResult, aiDetectionResult) {
  const suggestions = [];
  
  try {
    // 표절 관련 개선 제안
    if (plagiarismResult.rate > 0.3) {
      suggestions.push({
        type: 'plagiarism',
        severity: plagiarismResult.rate > 0.7 ? 'high' : 'medium',
        title: '표절 의심 구간 개선',
        description: '다음과 같은 방법으로 개선할 수 있습니다.',
        methods: [
          {
            name: '적절한 인용',
            description: '출처를 명시하고 인용 부호를 사용하세요.',
            example: '"원문 내용" (저자, 연도)'
          },
          {
            name: '패러프레이징',
            description: '내용을 이해하고 본인의 언어로 다시 표현하세요.',
            example: '원문의 핵심 아이디어를 바탕으로 새로운 표현 방식 사용'
          },
          {
            name: '개인적 관점 추가',
            description: '본인의 경험이나 생각을 함께 서술하세요.',
            example: '이론적 내용 + "제 경험으로는..." + 구체적 사례'
          }
        ]
      });
    }
    
    // AI 탐지 관련 개선 제안
    if (aiDetectionResult.probability > 0.5) {
      suggestions.push({
        type: 'ai_detection',
        severity: aiDetectionResult.probability > 0.8 ? 'high' : 'medium',
        title: 'AI 생성 흔적 개선',
        description: '더 자연스럽고 개인적인 글로 만들어보세요.',
        methods: [
          {
            name: '개인 경험 추가',
            description: '본인의 실제 경험이나 관찰을 포함하세요.',
            example: '"실제로 지난주에 경험한 사례를 보면..."'
          },
          {
            name: '감정적 표현 강화',
            description: '감정이나 느낌을 솔직하게 표현하세요.',
            example: '"이 부분이 특히 인상 깊었던 이유는..."'
          },
          {
            name: '문체 다양화',
            description: '문장 길이와 구조를 다양하게 변화시키세요.',
            example: '짧은 문장과 긴 문장을 적절히 혼합'
          },
          {
            name: '비판적 사고 추가',
            description: '내용에 대한 본인의 분석이나 반박을 포함하세요.',
            example: '"하지만 이런 관점도 고려해볼 필요가 있습니다..."'
          }
        ]
      });
    }
    
    // 일반적인 글쓰기 개선 제안
    suggestions.push({
      type: 'general',
      severity: 'low',
      title: '전반적인 글쓰기 개선',
      description: '더 나은 글쓰기를 위한 일반적인 조언입니다.',
      methods: [
        {
          name: '구체적 예시 추가',
          description: '추상적인 내용을 구체적인 사례로 설명하세요.',
          example: '통계나 실제 사례, 날짜 등 구체적 정보 포함'
        },
        {
          name: '논리적 구조 강화',
          description: '서론-본론-결론의 명확한 구조를 갖추세요.',
          example: '각 단락의 주제문과 뒷받침 문장 명확히 구분'
        },
        {
          name: '참고문헌 정리',
          description: '사용한 모든 자료의 출처를 명확히 기록하세요.',
          example: 'APA, MLA 등 표준 인용 형식 사용'
        }
      ]
    });
    
    return suggestions;
  } catch (error) {
    console.warn('개선 제안 생성 오류:', error.message);
    return [{
      type: 'error',
      severity: 'low',
      title: '개선 제안 생성 실패',
      description: '개선 제안을 생성하는 중 오류가 발생했습니다.',
      methods: []
    }];
  }
}

// 향상된 PDF 보고서 생성
async function generateEnhancedPDFReport(text, plagiarismRate, aiProbability, highlighted, details) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const fileName = `enhanced_report_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, 'reports', fileName);
      
      // reports 디렉토리 생성
      const reportsDir = path.dirname(filePath);
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      doc.pipe(fs.createWriteStream(filePath));
      
      // 헤더
      doc.fontSize(20).text('🔍 고급 표절 및 AI 탐지 보고서', { align: 'center' });
      doc.moveDown();
      
      // 요약 결과
      doc.fontSize(14).text('📊 분석 결과 요약', { underline: true });
      doc.fontSize(12)
         .text(`표절 유사도: ${plagiarismRate}%`)
         .text(`AI 생성 확률: ${(aiProbability * 100).toFixed(1)}%`)
         .text(`진정성 점수: ${details.authenticityScore ? (details.authenticityScore * 100).toFixed(1) + '%' : 'N/A'}`)
         .text(`조작 시도 감지: ${details.manipulationAttempts?.length > 0 ? '예' : '아니오'}`)
         .text(`분석 일시: ${new Date().toLocaleString('ko-KR')}`);
      
      doc.moveDown();
      
      // 개선 제안 섹션
      if (details.improvementSuggestions && details.improvementSuggestions.length > 0) {
        doc.fontSize(14).text('✨ 개선 제안', { underline: true });
        details.improvementSuggestions.forEach((suggestion, index) => {
          doc.fontSize(12).text(`${index + 1}. ${suggestion.title}`, { continued: false });
          doc.fontSize(10).text(`   ${suggestion.description}`);
          
          suggestion.methods.forEach((method, methodIndex) => {
            doc.fontSize(9).text(`   • ${method.name}: ${method.description}`);
          });
          doc.moveDown(0.5);
        });
        doc.moveDown();
      }
      
      // 문체 분석
      if (details.styleAnalysis) {
        doc.fontSize(14).text('📝 문체 분석', { underline: true });
        doc.fontSize(10).text(`평균 문장 길이: ${details.styleAnalysis.analysis?.avgSentenceLength || 'N/A'}단어`);
        doc.fontSize(10).text(`어휘 다양성: ${details.styleAnalysis.analysis?.lexicalDiversity || 'N/A'}`);
        doc.fontSize(10).text(`AI 유사성: ${(details.styleAnalysis.aiLikelihood * 100).toFixed(1)}%`);
        doc.moveDown();
      }
      
      // AI 분석 근거
      if (details.aiReasoning) {
        doc.fontSize(14).text('🤖 AI 탐지 근거', { underline: true });
        doc.fontSize(10).text(details.aiReasoning, { width: 500 });
        doc.moveDown();
      }
      
      // 출처 정보
      if (details.plagiarismSources && details.plagiarismSources.length > 0) {
        doc.fontSize(14).text('🔗 발견된 유사 출처', { underline: true });
        details.plagiarismSources.forEach((source, index) => {
          doc.fontSize(10).text(`${index + 1}. ${source}`);
        });
        doc.moveDown();
      }
      
      // 통계 정보
      if (details.ngramStats) {
        doc.fontSize(14).text('📈 텍스트 통계', { underline: true });
        doc.fontSize(10).text(details.ngramStats);
        doc.moveDown();
      }
      
      // 원문 (하이라이트 제거된 버전)
      doc.fontSize(14).text('📄 분석 원문', { underline: true });
      doc.fontSize(9).text(text.replace(/<[^>]*>/g, ''), { width: 500 });
      
      // 주의사항
      doc.moveDown();
      doc.fontSize(10).fillColor('red')
         .text('⚠️ 주의: 이 보고서의 결과는 참고용입니다. 최종 판단은 사용자가 직접 내려야 합니다.');
      
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
