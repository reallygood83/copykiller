# 🔍 Chimera 2.0 - Advanced Plagiarism Detection & Writing Mentor System

An AI-powered educational platform that goes beyond plagiarism detection to provide **comprehensive writing improvement guidance**.

## ✨ Key Features

### 🔍 Advanced Plagiarism Detection
- **Gemini CLI-based Search**: Web search for similar content detection
- **N-gram Analysis**: Statistical text analysis for suspicious pattern identification
- **Unicode Manipulation Detection**: Detects and normalizes evasion attempts
- **Real-time Highlighting**: Color-coded suspicious sections

### 🤖 AI Text Detection
- **Gemini API Analysis**: Style-based AI detection
- **Authenticity Score**: Human writing style evaluation
- **Multi-metric Analysis**: Perplexity, burstiness, vocabulary diversity
- **Explainable Results**: Analysis with detailed reasoning

### ✨ Writing Mentor System (NEW!)
- **Improvement Suggestions**: AI-powered personalized writing guides
- **Step-by-step Methods**: Concrete improvement methods with examples
- **Severity Classification**: Prioritized improvement points
- **Real-time Feedback**: Instant improvement tips

### 📊 Enhanced Reports
- **Auto PDF Generation**: Detailed analysis reports with improvement suggestions
- **5-Tab UI**: Summary, Improvements, Text Analysis, Sources, AI Analysis
- **Mobile Optimized**: Responsive design

## 🚀 Quick Start

### 🎯 **One-Click Installation (New Users)**

```bash
# 1. Clone the project
git clone https://github.com/reallygood83/copykiller.git
cd copykiller

# 2. Run automatic setup script
./setup.sh
```

**The setup script automatically:**
- ✅ Checks Node.js
- ✅ Installs all packages
- ✅ Builds frontend
- ✅ Downloads Korean fonts
- ✅ Creates desktop shortcut (optional)
- ✅ Creates Launchpad app (optional)

### 🎯 **Running the App (After Installation)**

#### Method 1: Launchpad (macOS)
1. Open **Launchpad** (F4 or rocket icon in dock)
2. Click **"키메라2.0"** app
3. Terminal starts server + browser opens automatically!
4. 🎉 **Done!** Connected to http://localhost:3001

#### Method 2: Desktop Shortcut
1. Double-click **"키메라2.0 시작.command"** on desktop
2. Server starts automatically in terminal
3. Access http://localhost:3001 in browser

#### Method 3: Command Line
```bash
# In project folder
./start.sh
```

### 🔧 **Manual Installation (For Developers)**

#### 1. Install Dependencies
```bash
# Backend
cd backend/
npm install

# Frontend  
cd ../frontend/
npm install
```

#### 2. Environment Setup (Optional)
```bash
# Create backend/.env file
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

**⚠️ Important: Basic features work without an API key!**
- Without API key: Web search + N-gram analysis
- With API key: Additional Gemini AI analysis

#### 3. Run Manually
```bash
# All-in-one server (frontend + backend integrated)
cd backend/
npm start
```

#### 4. Access
- **Integrated Server**: http://localhost:3001 (frontend + API)
- **API Only**: http://localhost:3001/api

## 🎯 API Key Setup (Optional)

For more accurate AI detection:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Get free API key
3. Enter in web UI or set in `.env` file

## 📝 Usage

### 🎯 **Simple Usage**
1. **Launchpad → Click 키메라2.0** (or desktop shortcut)
2. Browser opens automatically (http://localhost:3001)
3. Enter text or upload .txt file
4. Click "Analyze"
5. 📊 View real-time results + download PDF

### Web Interface Details
1. Enter text or upload .txt file
2. Optional: Enter Gemini API key  
3. Click "Start Analysis"
4. Monitor real-time progress
5. Download detailed results and PDF report

### API Direct Call
```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Text to analyze",
    "apiKey": "optional_gemini_api_key"
  }'
```

## 🏗️ Tech Stack

### Backend
- **Node.js + Express**: REST API server
- **Gemini CLI**: Plagiarism check & AI analysis
- **PDFKit**: Report generation with Korean font support
- **Natural**: N-gram text analysis

### Frontend
- **React 18**: Modern UI framework
- **Axios**: HTTP client
- **CSS3**: Responsive design

### AI/ML
- **Google Gemini**: Language model analysis
- **N-gram Analysis**: Statistical text analysis
- **Cosine Similarity**: Vector-based similarity measurement

## 📊 Result Interpretation

### Plagiarism Similarity
- **0-30%**: Safe (Green)
- **30-70%**: Caution (Orange)  
- **70%+**: Danger (Red)

### AI Generation Probability
- **Stylistic Features**: Sentence length, structure consistency
- **Vocabulary Patterns**: Repetition, lack of diversity
- **Emotional Expression**: Absence of personal experience
- **Cliche Usage**: AI-specific phrases

### Authenticity Score
- **80-100%**: Human-like writing (Green)
- **60-80%**: Average (Orange)  
- **0-60%**: Suspicious (Red)

## ⚠️ Important Notes

- **Reference Tool**: Final judgment by user
- **Similarity ≠ Plagiarism**: Proper citations are normal
- **AI Detection Limits**: Not 100% accurate
- **Data Security**: Uploaded text deleted after analysis

## 🆕 Chimera 2.0 New Features

- ✅ **Writing Mentor System**: AI-powered improvement suggestions
- ✅ **Unicode Manipulation Detection**: Evasion attempt detection
- ✅ **Authenticity Score**: Human-like writing evaluation
- ✅ **Enhanced Reports**: 5-tab UI + improvement guides
- ✅ **One-Click Launch**: Launchpad app + desktop shortcuts
- ✅ **All-in-One Server**: Integrated frontend + backend
- ✅ **Detailed Logging**: Real-time analysis process tracking
- ✅ **Korean Font Support**: Perfect Korean text in PDFs

## 📈 Future Plans

- [ ] Real-time web search MCP integration
- [ ] Multi-language support  
- [ ] More file formats (PDF, DOCX)
- [ ] Batch analysis
- [ ] Personalized learning dashboard

## 🐛 Troubleshooting

### 🚀 **Quick Fixes**
1. **App won't open**: Refresh Launchpad (Cmd+R)
2. **Browser won't open**: Manually visit http://localhost:3001
3. **Server won't start**: Terminal `cd backend && npm start`

### Common Errors
1. **Port conflict**: Use different port (`PORT=3002 npm start`)
2. **Dependency errors**: Re-run `npm install`
3. **API key errors**: Check environment variables or enter in web
4. **Permission errors**: Run `chmod +x start.sh`

### Performance Optimization
- Large texts: 10,000 characters or less recommended
- Concurrent analysis: Process one at a time

### 🔧 **File Locations**
- **Launchpad App**: `/Applications/키메라2.0.app/`
- **Desktop Shortcut**: `~/Desktop/키메라2.0 시작.command`
- **Script**: `./start.sh`

## 📄 License

MIT License

## 👥 Contributing

Issues and pull requests welcome!

---

## 🎯 Project Status

- **Version**: Chimera 2.0
- **Last Updated**: July 16, 2025
- **Deployment Status**: ✅ Ready for local deployment
- **GitHub**: [reallygood83/copykiller](https://github.com/reallygood83/copykiller)

**🔍 Discover the truth in text and improve your writing with Chimera 2.0!**