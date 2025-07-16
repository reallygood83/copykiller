// Health check endpoint
module.exports = (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: '키메라 2.0 표절탐지기+글쓰기 멘토'
  });
};