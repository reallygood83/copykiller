import React, { useState } from 'react';

function ImprovementSuggestions({ suggestions }) {
  const [expandedCard, setExpandedCard] = useState(null);

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="improvement-container">
        <h3>✨ 개선 제안</h3>
        <p className="no-suggestions">현재 개선이 필요한 부분이 발견되지 않았습니다.</p>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#d32f2f';
      case 'medium': return '#f57c00';
      case 'low': return '#388e3c';
      default: return '#666';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '💡';
      default: return '📝';
    }
  };

  return (
    <div className="improvement-container">
      <h3>✨ 개선 제안</h3>
      <p className="improvement-intro">
        분석 결과를 바탕으로 글쓰기를 개선할 수 있는 구체적인 방법을 제안해드립니다.
      </p>
      
      {suggestions.map((suggestion, index) => (
        <div key={index} className="suggestion-card">
          <div 
            className="suggestion-header"
            onClick={() => setExpandedCard(expandedCard === index ? null : index)}
          >
            <div className="suggestion-title">
              <span className="severity-icon">{getSeverityIcon(suggestion.severity)}</span>
              <h4>{suggestion.title}</h4>
              <span 
                className="severity-badge"
                style={{ backgroundColor: getSeverityColor(suggestion.severity) }}
              >
                {suggestion.severity}
              </span>
            </div>
            <span className="expand-icon">
              {expandedCard === index ? '▼' : '▶'}
            </span>
          </div>

          <div className="suggestion-description">
            <p>{suggestion.description}</p>
          </div>

          {expandedCard === index && (
            <div className="suggestion-methods">
              <h5>📋 개선 방법</h5>
              {suggestion.methods.map((method, methodIndex) => (
                <div key={methodIndex} className="method-card">
                  <div className="method-header">
                    <span className="method-number">{methodIndex + 1}</span>
                    <h6>{method.name}</h6>
                  </div>
                  <p className="method-description">{method.description}</p>
                  {method.example && (
                    <div className="method-example">
                      <strong>💡 예시:</strong>
                      <span>{method.example}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="improvement-tips">
        <h4>🎯 추가 팁</h4>
        <ul>
          <li><strong>단계적 개선:</strong> 한 번에 모든 것을 고치려 하지 말고, 하나씩 차근차근 개선해보세요.</li>
          <li><strong>개인화:</strong> 본인만의 경험과 관점을 추가하면 글이 더욱 독창적이 됩니다.</li>
          <li><strong>반복 검토:</strong> 개선 후 다시 분석해보며 지속적으로 향상시켜보세요.</li>
        </ul>
      </div>
    </div>
  );
}

export default ImprovementSuggestions;