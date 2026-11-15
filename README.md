# Google Sheets DB 기반 회원 로그인 및 관리 웹 애플리케이션

구글 스프레드시트(Google Sheets)를 데이터베이스(DB)로 사용하고, Google Apps Script(GAS)를 백엔드 API로 활용하는 모던한 회원 인증 및 관리 웹 애플리케이션입니다.

---

## 📁 프로젝트 구조

```text
simpleLogin/
├── backend/
│   └── Code.gs         # Google Apps Script 백엔드 소스코드 (doGet, doPost, CRUD, OAuth 검증)
├── frontend/
│   ├── index.html      # 반응형 UI 화면 (로그인, 회원가입, 마이페이지, 관리자 대시보드)
│   ├── style.css       # 모던 클린 디자인 스타일시트
│   └── app.js          # 프론트엔드 비즈니스 로직 & GIS Google OAuth 연동
└── README.md           # 구축 및 배포 가이드
```

---

## 📊 시트 구조 정보

- **스프레드시트 URL**: [구글 스프레드시트 링크](https://docs.google.com/spreadsheets/d/1k-fcUFu2DrcpLdO1xqWX8ZjcOZ2PRzSpkt7MqRZdn3o/edit?gid=0#gid=0)
- **스프레드시트 ID**: `1k-fcUFu2DrcpLdO1xqWX8ZjcOZ2PRzSpkt7MqRZdn3o`
- **1행 헤더**: `번호` | `아이디` | `비밀번호` | `이름` | `전공` | `비고`

---

## 🚀 빠른 시작 가이드 (설치 및 배포)

### 1단계: Google Apps Script 백엔드 배포

1. [구글 스프레드시트](https://docs.google.com/spreadsheets/d/1k-fcUFu2DrcpLdO1xqWX8ZjcOZ2PRzSpkt7MqRZdn3o/edit?gid=0#gid=0)를 엽니다.
2. 상단 메뉴에서 **[확장 프로그램] > [Apps Script]**를 클릭합니다.
3. 기존 코드를 모두 지우고, [`backend/Code.gs`](file:///d:/DeV/Antigravity/simpleLogin/backend/Code.gs) 파일의 내용을 복사하여 붙여넣습니다.
4. 코드 상단의 **관리자 구글 이메일**을 본인의 구글 계정으로 변경합니다:
   ```javascript
   const ADMIN_EMAILS = [
     'your-google-email@gmail.com' // 본인의 관리자 구글 계정 입력
   ];
   ```
5. 우측 상단의 **[배포] > [새 배포]**를 클릭합니다.
   - **유형 선택(톱니바퀴)**: **웹 앱** 선택
   - **설명**: `Member Login API v1`
   - **다음 사용자로 실행**: `나 (myaccount@gmail.com)`
   - **액세스 권한이 있는 사용자**: **모든 사용자 (Anyone)**  *(매우 중요)*
6. **[배포]** 버튼을 클릭하고, 구글 계정 권한 승인 창이 뜨면 권한을 부여합니다.
7. 생성된 **웹 앱 URL** (예: `https://script.google.com/macros/s/AKfycb.../exec`)을 복사합니다.

---

### 2단계: 관리자 모드 보안용 Google OAuth Client ID 발급 (선택/권장)

관리자 대시보드는 **Google Identity Services (OAuth 2.0)**를 통해 승인된 관리자 계정만 접근할 수 있습니다.

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속합니다.
2. 새 프로젝트 생성 후 **[API 및 서비스] > [OAuth 동의 화면]**을 설정합니다 (외부 사용자 선택).
3. **[API 및 서비스] > [사용자 인증 정보] > [사용자 인증 정보 만들기] > [OAuth 클라이언트 ID]**를 선택합니다.
   - **애플리케이션 유형**: **웹 애플리케이션**
   - **승인된 자바스크립트 원본**: `http://localhost:3000`, `http://127.0.0.1:5500` (또는 실제 배포 도메인)
4. 생성된 **클라이언트 ID** (예: `xxxx.apps.googleusercontent.com`)를 복사합니다.

---

### 3단계: 프론트엔드 실행 및 설정 연결

1. 프론트엔드 폴더(`frontend`)를 웹 서버로 실행합니다.
   - **VS Code**의 Live Server 확장 프로그램을 사용하거나:
   ```bash
   npx serve frontend
   # 또는
   python -m http.server 3000 --directory frontend
   ```
2. 웹 브라우저로 접속합니다 (예: `http://localhost:3000`).
3. 우측 상단 **[⚙️ 연동 설정]** 버튼을 클릭합니다.
   - **Google Apps Script 웹 앱 URL**: 1단계에서 복사한 웹 앱 배포 URL 입력
   - **Google OAuth Client ID**: 2단계에서 복사한 Client ID 입력
   - **[설정 저장]** 클릭 (브라우저 LocalStorage에 저장되어 유지됩니다)

---

## 🌟 주요 기능 설명

### 1. 회원 로그인
- 아이디/비밀번호를 입력하여 스프레드시트 데이터와 대조.
- 일치 시 마이페이지로 이동하고 환영 메시지 출력.
- 불일치 시 **"회원정보가 일치하지 않습니다"** 경고창 및 즉시 회원가입 화면으로 전환 가능한 버튼 제공.

### 2. 회원가입
- `아이디`, `비밀번호`, `이름`, `전공` 입력.
- 기존 시트 데이터를 기반으로 아이디 중복 자동 검사.
- `번호`는 시트의 마지막 번호 + 1로 자동 부여.
- `비고`는 빈칸으로 생성.

### 3. 회원 정보 조회 및 수정 (마이페이지)
- 로그인 성공 시 본인의 회원 번호, 아이디, 이름, 전공, 비고를 직관적으로 확인.
- `전공`과 `비고` 내용을 직접 수정하고 **[정보 수정하기]** 버튼 클릭 시 구글 스프레드시트의 해당 행이 실시간 업데이트.

### 4. 고도화된 관리자 모드 보안 (Admin Dashboard)
- **프론트엔드**: Google 공식 Identity Services SDK를 통한 구글 로그인 팝업.
- **백엔드 (Code.gs)**: 
  - 프론트엔드에서 수신한 Google ID 토큰(`id_token`)을 Google OAuth2 Tokeninfo 엔드포인트(`https://oauth2.googleapis.com/tokeninfo?id_token=...`)로 전송하여 백엔드에서 2차 검증.
  - 토큰의 이메일이 `ADMIN_EMAILS` 목록에 있는지 대조하여 비인가자의 조작 및 접근을 원천 차단.
- **관리자 기능**: 전체 회원 목록 실시간 조회, 비밀번호 보안 마스킹, 회원 검색 필터링, 회원 정보 직접 수정 및 삭제 기능 제공.

---

## 🛠️ CORS 방지 기술 구현

Google Apps Script와의 fetch 통신 시 브라우저 CORS 차단 문제를 방지하기 위해:
- 프론트엔드에서 `headers: { 'Content-Type': 'text/plain;charset=utf-8' }`로 단순 POST 요청 전송.
- 백엔드 `doPost(e)`에서 `JSON.parse(e.postData.contents)`를 통해 안전하게 파싱하여 처리.
