import React from 'react';

function Report({ data }) {
  return (
    <div className="report">
      <h2>분석 결과</h2>
      <p>표절률: {data.plagiarismRate}%</p>
      <p>AI 생성 확률: {data.aiProbability * 100}%</p>
      <div dangerouslySetInnerHTML={{ __html: data.highlightedText }} />  // 하이라이트 표시
      <a href={data.pdfUrl} download>PDF 보고서 다운로드</a>
      <p>{data.message}</p>  // 교육적 툴팁
    </div>
  );
}

export default Report;
