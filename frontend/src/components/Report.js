import React, { useState } from 'react';
import ImprovementSuggestions from './ImprovementSuggestions';

function Report({ data }) {
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const getSeverityLevel = (rate) => {
    if (rate > 70) return { level: 'high', color: '#d32f2f', text: '높음' };
    if (rate > 30) return { level: 'medium', color: '#f57c00', text: '보통' };
    return { level: 'low', color: '#388e3c', text: '낮음' };
  };

  const plagiarismSeverity = getSeverityLevel(data.plagiarismRate);
  const aiSeverity = getSeverityLevel(data.aiProbability * 100);

  return (
    <div className="report-container">
      {/* 헤더 */}
      <div className="report-header">
        <h2>🔍 분석 결과</h2>
        <div className="analysis-time">
          분석 완료: {new Date().toLocaleString('ko-KR')}
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="summary-cards">
        <div className="summary-card plagiarism">
          <div className="card-header">
            <span className="icon">📄</span>
            <h3>표절 유사도</h3>
          </div>
          <div className="score-display">
            <span className="score" style={{ color: plagiarismSeverity.color }}>
              {data.plagiarismRate}%
            </span>
            <span className="severity" style={{ color: plagiarismSeverity.color }}>
              {plagiarismSeverity.text}
            </span>
          </div>
        </div>

        <div className="summary-card ai-detection">
          <div className="card-header">
            <span className="icon">🤖</span>
            <h3>AI 생성 확률</h3>
          </div>
          <div className="score-display">
            <span className="score" style={{ color: aiSeverity.color }}>
              {(data.aiProbability * 100).toFixed(1)}%
            </span>
            <span className="severity" style={{ color: aiSeverity.color }}>
              {aiSeverity.text}
            </span>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="tab-navigation">
        <button 
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          📊 요약
        </button>
        <button 
          className={`tab ${activeTab === 'improvements' ? 'active' : ''}`}
          onClick={() => setActiveTab('improvements')}
        >
          ✨ 개선 제안
        </button>
        <button 
          className={`tab ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          📝 텍스트 분석
        </button>
        <button 
          className={`tab ${activeTab === 'sources' ? 'active' : ''}`}
          onClick={() => setActiveTab('sources')}
        >
          🔗 출처
        </button>
        <button 
          className={`tab ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          🤖 AI 분석
        </button>
      </div>

      {/* 탭 내용 */}
      <div className="tab-content">
        {activeTab === 'summary' && (
          <div className="summary-tab">
            <div className="alert-message">
              <span className="alert-icon">⚠️</span>
              <p>{data.message}</p>
            </div>

            {/* 새로운 지표들 추가 */}
            {data.authenticityScore && (
              <div className="authenticity-score">
                <h4>진정성 점수</h4>
                <div className="score-display">
                  <span className="score">{(data.authenticityScore * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}

            {data.manipulationDetected && (
              <div className="manipulation-warning">
                <h4>⚠️ 조작 시도 감지</h4>
                <p>텍스트에서 회피 시도가 감지되었습니다. 상세 분석 결과를 확인해주세요.</p>
              </div>
            )}

            {data.sources && data.sources.length > 0 && (
              <div className="quick-sources">
                <h4>발견된 유사 출처 ({data.sources.length}개)</h4>
                <ul>
                  {data.sources.slice(0, 3).map((source, index) => (
                    <li key={index}>{source}</li>
                  ))}
                  {data.sources.length > 3 && (
                    <li className="more-sources">
                      ... 외 {data.sources.length - 3}개 ({' '}
                      <button onClick={() => setActiveTab('sources')}>
                        전체 보기
                      </button>
                      )
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="progress-bars">
              <div className="progress-item">
                <label>표절 유사도</label>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${data.plagiarismRate}%`,
                      backgroundColor: plagiarismSeverity.color 
                    }}
                  ></div>
                </div>
                <span>{data.plagiarismRate}%</span>
              </div>

              <div className="progress-item">
                <label>AI 생성 확률</label>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${data.aiProbability * 100}%`,
                      backgroundColor: aiSeverity.color 
                    }}
                  ></div>
                </div>
                <span>{(data.aiProbability * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'improvements' && (
          <ImprovementSuggestions suggestions={data.improvementSuggestions} />
        )}

        {activeTab === 'text' && (
          <div className="text-analysis-tab">
            <div className="text-legend">
              <h4>범례</h4>
              <div className="legend-items">
                <span className="legend-item">
                  <span className="legend-color plagiarism-highlight"></span>
                  표절 의심 구간
                </span>
                <span className="legend-item">
                  <span className="legend-color web-match-highlight"></span>
                  웹 검색 일치
                </span>
              </div>
            </div>
            
            <div className="highlighted-text-container">
              <div 
                className="highlighted-text"
                dangerouslySetInnerHTML={{ __html: data.highlightedText || '하이라이트된 텍스트가 없습니다.' }} 
              />
            </div>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="sources-tab">
            <h4>발견된 유사 출처</h4>
            {data.sources && data.sources.length > 0 ? (
              <div className="sources-list">
                {data.sources.map((source, index) => (
                  <div key={index} className="source-item">
                    <span className="source-number">{index + 1}</span>
                    <span className="source-text">{source}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-sources">발견된 유사 출처가 없습니다.</p>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="ai-analysis-tab">
            <h4>AI 탐지 분석 근거</h4>
            <div className="ai-reasoning">
              <p>{data.aiReasoning || 'AI 분석 근거를 사용할 수 없습니다.'}</p>
            </div>
            
            <div className="ai-tips">
              <h5>AI 생성 텍스트의 특징</h5>
              <ul>
                <li>문장 길이와 구조가 일관적</li>
                <li>개인적 경험이나 감정 표현이 적음</li>
                <li>상투적인 표현을 자주 사용</li>
                <li>어휘의 다양성이 제한적</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="action-buttons">
        <button 
          className="details-toggle"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '간단히 보기' : '세부 정보 보기'}
        </button>
        
        {data.pdfUrl && (
          <a 
            href={data.pdfUrl} 
            download 
            className="download-button"
          >
            📄 PDF 보고서 다운로드
          </a>
        )}
      </div>

      {/* 세부 정보 (토글) */}
      {showDetails && (
        <div className="detailed-info">
          <h4>기술적 세부 정보</h4>
          <div className="tech-details">
            <p><strong>분석 방법:</strong></p>
            <ul>
              <li>Gemini CLI 기반 표절 검사</li>
              <li>웹 검색 기반 유사도 분석</li>
              <li>N-gram 통계 분석</li>
              <li>AI 문체 패턴 분석</li>
            </ul>
          </div>
        </div>
      )}

      {/* 면책 조항 */}
      <div className="disclaimer">
        <p>
          <strong>⚠️ 중요:</strong> 이 분석 결과는 참고용입니다. 
          표절이나 AI 생성 여부의 최종 판단은 사용자가 직접 내려야 합니다.
        </p>
      </div>
    </div>
  );
}

export default Report;
