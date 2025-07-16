const path = require('path');
const fs = require('fs');

module.exports = (req, res) => {
  const { filename } = req.query;
  
  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  try {
    const filePath = path.join('/tmp', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    const fileContent = fs.readFileSync(filePath);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(fileContent);
    
  } catch (error) {
    console.error('리포트 다운로드 오류:', error);
    res.status(500).json({ error: '다운로드 중 오류가 발생했습니다.' });
  }
};