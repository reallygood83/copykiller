const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 간소화된 표절 탐지 함수
async function detectPlagiarismAndAI(text, apiKey) {
  try {
    const results = {
      plagiarismRate: 0,
      aiProbability: 0,
      message: '',
      sources: [],
      highlightedText: text,
      aiReasoning: '',
      authenticityScore: 0.85,
      manipulationDetected: false,
      improvementSuggestions: []
    };

    // 1. 기본 텍스트 분석
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim()).length;
    const avgWordsPerSentence = wordCount / sentenceCount;

    // 2. AI 패턴 감지 (간단한 휴리스틱)
    const aiPatterns = [
      /결론적으로|요약하면|따라서|그러므로/g,
      /첫째.*둘째.*셋째/s,
      /이를 통해.*할 수 있습니다/g
    ];
    
    let aiScore = 0.15; // 기본값 설정
    aiPatterns.forEach(pattern => {
      if (pattern.test(text)) aiScore += 0.15;
    });

    // 문장 길이 일관성 체크
    if (avgWordsPerSentence > 15 && avgWordsPerSentence < 25) {
      aiScore += 0.2;
    }

    // 표절률 기본값 설정 (간단한 휴리스틱)
    const commonPhrases = text.match(/\b\w{5,}\b/g) || [];
    const uniquePhrases = new Set(commonPhrases);
    const repetitionRate = 1 - (uniquePhrases.size / commonPhrases.length);
    results.plagiarismRate = Math.min(repetitionRate * 0.5 + 0.1, 0.9);

    results.aiProbability = Math.min(aiScore, 0.9);

    // 3. Gemini CLI를 사용한 표절 검사 (가능한 경우)
    if (apiKey || process.env.GEMINI_API_KEY) {
      try {
        const geminiApiKey = apiKey || process.env.GEMINI_API_KEY;
        
        // Gemini API를 통한 간단한 검사
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiApiKey
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `다음 텍스트가 표절이나 AI로 생성되었을 가능성을 0-1 사이로 평가해주세요. 간단한 이유와 함께 JSON 형식으로 응답해주세요: {"plagiarism": 0.x, "ai": 0.x, "reason": "..."}\n\n${text.substring(0, 1000)}`
              }]
            }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const resultText = data.candidates[0].content.parts[0].text;
          try {
            const parsed = JSON.parse(resultText);
            if (parsed.plagiarism) {
              results.plagiarismRate = Math.max(results.plagiarismRate, parsed.plagiarism);
            }
            if (parsed.ai) {
              results.aiProbability = Math.max(results.aiProbability, parsed.ai);
            }
            results.aiReasoning = parsed.reason || '분석 완료';
          } catch (e) {
            console.log('Gemini 응답 파싱 오류:', e);
          }
        }
      } catch (error) {
        console.log('Gemini API 오류:', error);
      }
    }

    // 4. 개선 제안 생성
    results.improvementSuggestions = generateBasicSuggestions(text, results.aiProbability);

    // 5. 메시지 생성
    const plagiarismPercent = Math.round(results.plagiarismRate * 100);
    const aiPercent = Math.round(results.aiProbability * 100);
    
    if (plagiarismPercent > 70) {
      results.message = '⚠️ 높은 표절 가능성이 감지되었습니다.';
    } else if (aiPercent > 70) {
      results.message = '🤖 AI 생성 텍스트 특징이 다수 발견되었습니다.';
    } else if (plagiarismPercent > 30 || aiPercent > 30) {
      results.message = '📝 일부 개선이 필요한 부분이 있습니다.';
    } else {
      results.message = '✅ 전반적으로 양호한 텍스트입니다.';
    }

    // 퍼센트 값으로 변환
    results.plagiarismRate = plagiarismPercent;
    results.aiProbability = aiPercent / 100; // Report 컴포넌트가 0-1 범위를 기대함

    // 임시 PDF URL (실제로는 생성하지 않음)
    results.pdfUrl = `/api/reports/report_${Date.now()}.pdf`;

    return results;

  } catch (error) {
    console.error('분석 오류:', error);
    throw error;
  }
}

// 기본 개선 제안 생성
function generateBasicSuggestions(text, aiScore) {
  const suggestions = [];

  if (aiScore > 0.5) {
    suggestions.push({
      title: 'AI 패턴 개선 필요',
      description: '텍스트에서 AI 생성 패턴이 감지되었습니다. 더 자연스럽고 개인적인 문체로 수정이 필요합니다.',
      severity: 'high',
      methods: [
        {
          name: '개인적 경험 추가',
          description: '구체적인 개인 경험이나 사례를 추가하세요.',
          example: '"일반적으로..." → "제가 경험한 바로는..."'
        }
      ]
    });
  }

  const wordCount = text.split(/\s+/).length;
  if (wordCount < 300) {
    suggestions.push({
      title: '내용 보강 필요',
      description: '텍스트가 너무 짧습니다. 더 상세한 설명과 예시를 추가하세요.',
      severity: 'medium',
      methods: [
        {
          name: '구체적 예시 추가',
          description: '각 주장에 대한 구체적인 예시를 추가하세요.'
        }
      ]
    });
  }

  return suggestions;
}

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
    
    const result = await detectPlagiarismAndAI(text, apiKey);
    
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