const express = require('express');
const { detectPlagiarismAndAI } = require('./plagiarism');

const router = express.Router();

router.post('/analyze', async (req, res) => {
  const { text, apiKey } = req.body;  // apiKey: Copyleaks나 Gemini용 (사용자 입력)
  try {
    const result = await detectPlagiarismAndAI(text, apiKey);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
