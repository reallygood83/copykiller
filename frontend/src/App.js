import React, { useState } from 'react';
import UploadForm from './components/UploadForm';
import Report from './components/Report';

function App() {
  const [result, setResult] = useState(null);

  return (
    <div className="app">
      <h1>표절 및 AI 탐지 서비스 (키메라)</h1>
      <UploadForm onResult={setResult} />
      {result && <Report data={result} />}
    </div>
  );
}

export default App;
