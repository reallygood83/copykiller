import React, { useState, useRef } from 'react';
import axios from 'axios';

function UploadForm({ onResult }) {
  const [text, setText] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [showApiKeyHelp, setShowApiKeyHelp] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  const steps = [
    'Gemini CLI 표절 검사 중...',
    '웹 검색 기반 분석 중...',
    'AI 탐지 분석 중...',
    'N-gram 통계 분석 중...',
    'PDF 보고서 생성 중...'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      alert('분석할 텍스트를 입력해주세요.');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setCurrentStep('분석 시작 중...');

    try {
      // 진행 상황 시뮬레이션
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 20, 90);
          const stepIndex = Math.floor(newProgress / 20);
          if (stepIndex < steps.length) {
            setCurrentStep(steps[stepIndex]);
          }
          return newProgress;
        });
      }, 1000);

      const response = await axios.post('/api/analyze', { text, apiKey });
      
      clearInterval(progressInterval);
      setProgress(100);
      setCurrentStep('분석 완료!');
      
      setTimeout(() => {
        onResult(response.data);
        setIsAnalyzing(false);
        setProgress(0);
        setCurrentStep('');
      }, 1000);

    } catch (error) {
      setIsAnalyzing(false);
      setProgress(0);
      setCurrentStep('');
      
      const errorMessage = error.response?.data?.error || error.message;
      alert('분석 중 오류가 발생했습니다: ' + errorMessage);
    }
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      
      if (uploadedFile.type === 'text/plain' || uploadedFile.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setText(e.target.result);
        };
        reader.readAsText(uploadedFile);
      } else {
        alert('현재 텍스트 파일(.txt)만 지원됩니다.');
        setFile(null);
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sampleTexts = [
    {
      title: '학술 논문 샘플',
      text: '인공지능 기술의 발전은 현대 사회에 혁신적인 변화를 가져오고 있다. 머신러닝과 딥러닝 알고리즘의 발달로 인해 다양한 분야에서 자동화와 지능화가 진행되고 있으며, 이는 산업 구조의 근본적인 변화를 촉발하고 있다.'
    },
    {
      title: '일반 텍스트 샘플',
      text: '오늘은 정말 좋은 날씨였다. 아침에 일어나서 창문을 열어보니 파란 하늘이 너무나 아름다웠다. 이런 날에는 산책을 하거나 공원에 가서 책을 읽는 것이 좋겠다고 생각했다.'
    }
  ];

  const insertSampleText = (sampleText) => {
    setText(sampleText);
  };

  return (
    <div className="upload-form-container">
      <div className="form-header">
        <h2>📝 표절 및 AI 탐지 분석</h2>
        <p className="form-description">
          텍스트를 입력하거나 파일을 업로드하여 표절 여부와 AI 생성 가능성을 분석하세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        {/* 파일 업로드 섹션 */}
        <div className="file-upload-section">
          <label className="file-upload-label">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt"
              className="file-input"
            />
            <span className="file-upload-button">
              📁 파일 선택 (TXT)
            </span>
          </label>
          
          {file && (
            <div className="file-info">
              <span className="file-name">{file.name}</span>
              <button type="button" onClick={clearFile} className="clear-file">
                ✕
              </button>
            </div>
          )}
        </div>

        {/* 텍스트 입력 섹션 */}
        <div className="text-input-section">
          <div className="textarea-header">
            <label htmlFor="text-input">분석할 텍스트</label>
            <span className="char-count">
              {text.length} / 10,000 글자
            </span>
          </div>
          
          <textarea
            id="text-input"
            placeholder="여기에 분석할 텍스트를 입력하세요...&#10;&#10;• 한국어와 영어를 모두 지원합니다&#10;• 최대 10,000자까지 입력 가능합니다&#10;• 논문, 보고서, 기사 등 다양한 형태의 텍스트를 분석할 수 있습니다"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 10000))}
            rows={12}
            required
            className="text-input"
            disabled={isAnalyzing}
          />
        </div>

        {/* 샘플 텍스트 */}
        <div className="sample-texts">
          <h4>샘플 텍스트</h4>
          <div className="sample-buttons">
            {sampleTexts.map((sample, index) => (
              <button
                key={index}
                type="button"
                onClick={() => insertSampleText(sample.text)}
                className="sample-button"
                disabled={isAnalyzing}
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* API 키 섹션 */}
        <div className="api-key-section">
          <div className="api-key-header">
            <label htmlFor="api-key">Gemini API 키 (선택사항)</label>
            <button
              type="button"
              onClick={() => setShowApiKeyHelp(!showApiKeyHelp)}
              className="help-button"
            >
              ❓
            </button>
          </div>
          
          <input
            id="api-key"
            type="password"
            placeholder="Gemini API 키를 입력하세요 (더 정확한 AI 탐지를 위해)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="api-key-input"
            disabled={isAnalyzing}
          />
          
          {showApiKeyHelp && (
            <div className="api-key-help">
              <p>
                <strong>API 키 없이도 기본 분석이 가능합니다!</strong>
              </p>
              <ul>
                <li>API 키 없음: 웹 검색 + N-gram 분석</li>
                <li>API 키 있음: Gemini AI 분석 추가</li>
                <li>API 키는 <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>에서 무료로 발급 가능</li>
              </ul>
            </div>
          )}
        </div>

        {/* 분석 진행 상황 */}
        {isAnalyzing && (
          <div className="analysis-progress">
            <div className="progress-info">
              <span className="current-step">{currentStep}</span>
              <span className="progress-percent">{progress.toFixed(0)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="progress-note">
              ⚠️ 분석 중입니다. 페이지를 새로고침하지 마세요.
            </p>
          </div>
        )}

        {/* 제출 버튼 */}
        <button 
          type="submit" 
          className="submit-button"
          disabled={isAnalyzing || !text.trim()}
        >
          {isAnalyzing ? (
            <>
              <span className="spinner"></span>
              분석 중...
            </>
          ) : (
            '🔍 분석 시작'
          )}
        </button>

        {/* 안내 메시지 */}
        <div className="form-footer">
          <p className="footer-note">
            💡 <strong>팁:</strong> 더 정확한 분석을 위해 최소 100자 이상의 텍스트를 입력하세요.
          </p>
          <p className="privacy-note">
            🔒 업로드된 텍스트는 분석 후 자동으로 삭제되며, 개인정보는 저장되지 않습니다.
          </p>
        </div>
      </form>
    </div>
  );
}

export default UploadForm;
