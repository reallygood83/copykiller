#!/bin/bash

echo "🔍 키메라 2.0 설치 스크립트"
echo "================================"

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Node.js 확인
echo -e "\n${YELLOW}1. Node.js 확인 중...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo "https://nodejs.org 에서 Node.js를 먼저 설치해주세요."
    exit 1
fi
echo -e "${GREEN}✅ Node.js 발견: $(node -v)${NC}"

# 2. 의존성 설치
echo -e "\n${YELLOW}2. 의존성 설치 중...${NC}"
echo "백엔드 패키지 설치 중..."
cd backend && npm install
echo "프론트엔드 패키지 설치 중..."
cd ../frontend && npm install
cd ..

# 3. 프론트엔드 빌드
echo -e "\n${YELLOW}3. 프론트엔드 빌드 중...${NC}"
cd frontend && npm run build
cd ..

# 4. 한글 폰트 설정
echo -e "\n${YELLOW}4. 한글 폰트 설정 중...${NC}"
if [ ! -f "backend/fonts/NotoSansKR-Regular.ttf" ]; then
    echo "한글 폰트 다운로드 중..."
    mkdir -p backend/fonts
    curl -L -o backend/fonts/NotoSansKR-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf"
    echo -e "${GREEN}✅ 한글 폰트 다운로드 완료${NC}"
else
    echo -e "${GREEN}✅ 한글 폰트 이미 존재${NC}"
fi

# 5. 실행 스크립트 생성
echo -e "\n${YELLOW}5. 실행 스크립트 생성 중...${NC}"
cat > start.sh << 'EOF'
#!/bin/bash
echo "🔍 키메라 2.0 표절 탐지 서버 시작..."
cd backend
npm start
EOF
chmod +x start.sh

# 6. 바탕화면 바로가기 생성 옵션
echo -e "\n${YELLOW}6. 바탕화면 바로가기를 만드시겠습니까? (y/n)${NC}"
read -p "선택: " create_shortcut

if [[ "$create_shortcut" == "y" || "$create_shortcut" == "Y" ]]; then
    DESKTOP_PATH="$HOME/Desktop"
    if [ -d "$DESKTOP_PATH" ]; then
        cat > "$DESKTOP_PATH/키메라2.0 시작.command" << EOF
#!/bin/bash
cd "$(pwd)/backend"
echo "🔍 키메라 2.0 서버 시작 중..."
npm start
echo "🌐 브라우저에서 http://localhost:3001 로 접속하세요!"
read -p "엔터를 누르면 종료됩니다..."
EOF
        chmod +x "$DESKTOP_PATH/키메라2.0 시작.command"
        echo -e "${GREEN}✅ 바탕화면에 '키메라2.0 시작.command' 생성 완료${NC}"
    fi
fi

# 7. macOS 앱 생성 옵션
echo -e "\n${YELLOW}7. macOS 앱으로 만드시겠습니까? (Launchpad에서 실행 가능) (y/n)${NC}"
read -p "선택: " create_app

if [[ "$create_app" == "y" || "$create_app" == "Y" ]]; then
    APP_PATH="/Applications/키메라2.0.app"
    mkdir -p "$APP_PATH/Contents/MacOS"
    
    # Info.plist 생성
    cat > "$APP_PATH/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>키메라2.0</string>
    <key>CFBundleIdentifier</key>
    <string>com.copykiller.chimera</string>
    <key>CFBundleName</key>
    <string>키메라2.0</string>
    <key>CFBundleVersion</key>
    <string>2.0</string>
    <key>CFBundleShortVersionString</key>
    <string>2.0</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.education</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF
    
    # 실행 스크립트 생성
    cat > "$APP_PATH/Contents/MacOS/start_server.sh" << EOF
#!/bin/bash
osascript -e 'tell application "Terminal"
    do script "cd $(pwd)/backend && echo \"🔍 키메라 2.0 표절 탐지 서버 시작 중...\" && npm start"
    activate
end tell'

sleep 3
open "http://localhost:3001"
EOF
    
    cat > "$APP_PATH/Contents/MacOS/키메라2.0" << 'EOF'
#!/bin/bash
/Applications/키메라2.0.app/Contents/MacOS/start_server.sh
EOF
    
    chmod +x "$APP_PATH/Contents/MacOS/start_server.sh"
    chmod +x "$APP_PATH/Contents/MacOS/키메라2.0"
    
    echo -e "${GREEN}✅ Launchpad 앱 '/Applications/키메라2.0.app' 생성 완료${NC}"
fi

echo -e "\n${GREEN}=====================================${NC}"
echo -e "${GREEN}🎉 키메라 2.0 설치 완료!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo -e "\n실행 방법:"
echo -e "1. 터미널: ${YELLOW}./start.sh${NC}"
if [[ "$create_shortcut" == "y" || "$create_shortcut" == "Y" ]]; then
    echo -e "2. 바탕화면: ${YELLOW}'키메라2.0 시작.command' 더블클릭${NC}"
fi
if [[ "$create_app" == "y" || "$create_app" == "Y" ]]; then
    echo -e "3. Launchpad: ${YELLOW}'키메라2.0' 앱 클릭${NC}"
fi
echo -e "\n서버 주소: ${YELLOW}http://localhost:3001${NC}"
echo -e "\nGemini API 키가 있다면 웹 UI에서 입력하거나"
echo -e "backend/.env 파일에 GEMINI_API_KEY=your_key_here 추가하세요."
echo -e "\n${GREEN}즐거운 사용되세요! 🔍${NC}"