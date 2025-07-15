import React, { useState } from 'react';
import axios from 'axios';

function UploadForm({ onResult }) {
  const [text, setText] = useState('');
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/analyze', { text, apiKey });
      onResult(response.data);
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        placeholder="텍스트를 입력하세요 (한국어 지원)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        required
      />
      <input
        type="text"
        placeholder="API 키 입력 (Copyleaks 또는 Gemini)"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        required
      />
      <button type="submit">분석 시작</button>
    </form>
  );
}

export default UploadForm;
