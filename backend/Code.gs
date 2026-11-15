/**
 * ==============================================================================
 * Google Apps Script (Code.gs) - 회원 로그인 & 관리 백엔드
 * ==============================================================================
 * 스프레드시트 URL: https://docs.google.com/spreadsheets/d/1k-fcUFu2DrcpLdO1xqWX8ZjcOZ2PRzSpkt7MqRZdn3o/edit
 * 시트 헤더(1행): 번호 | 아이디 | 비밀번호 | 이름 | 전공 | 비고
 */

// [설정] 스프레드시트 ID
const SPREADSHEET_ID = '1k-fcUFu2DrcpLdO1xqWX8ZjcOZ2PRzSpkt7MqRZdn3o';

// [설정] 관리자 Google 계정 이메일 목록 (소문자로 작성)
// 실제 관리자로 지정할 본인의 구글 이메일 주소를 입력하세요.
const ADMIN_EMAILS = [
  'admin@example.com',
  // 'your-google-email@gmail.com'
];

/**
 * 활성 시트 가져오기 (첫 번째 시트 사용)
 */
function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheets()[0];
}

/**
 * GET 요청 처리 (웹앱 상태 확인용)
 */
function doGet(e) {
  return createJsonResponse({
    status: 'ok',
    message: 'Google Apps Script Member API is running.'
  });
}

/**
 * POST 요청 처리 (메인 API 엔드포인트)
 * CORS 문제를 방지하기 위해 JSON 문자열 또는 text/plain 본문을 파싱합니다.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ success: false, message: '요청 본문(Body)이 비어 있습니다.' });
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    switch (action) {
      case 'login':
        return handleLogin(payload);
      case 'signup':
        return handleSignup(payload);
      case 'updateProfile':
        return handleUpdateProfile(payload);
      case 'adminLoginVerify':
        return handleAdminVerify(payload);
      case 'adminGetUsers':
        return handleAdminGetUsers(payload);
      case 'adminUpdateUser':
        return handleAdminUpdateUser(payload);
      case 'adminDeleteUser':
        return handleAdminDeleteUser(payload);
      default:
        return createJsonResponse({ success: false, message: '알 수 없는 요청(Action)입니다.' });
    }
  } catch (error) {
    return createJsonResponse({
      success: false,
      message: '서버 처리 중 오류가 발생했습니다: ' + error.toString()
    });
  }
}

/**
 * 1. 로그인 처리
 */
function handleLogin(payload) {
  const { id, password } = payload;
  if (!id || !password) {
    return createJsonResponse({ success: false, message: '아이디와 비밀번호를 모두 입력해주세요.' });
  }

  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  // 1행은 헤더이므로 index 1부터 탐색
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowId = String(row[1]).trim();
    const rowPw = String(row[2]).trim();

    if (rowId === String(id).trim() && rowPw === String(password).trim()) {
      return createJsonResponse({
        success: true,
        message: '로그인 성공',
        user: {
          no: row[0],
          id: row[1],
          name: row[3],
          major: row[4],
          note: row[5] || ''
        }
      });
    }
  }

  // 일치하는 회원정보가 없는 경우
  return createJsonResponse({
    success: false,
    message: '회원정보가 일치하지 않거나 존재하지 않습니다.'
  });
}

/**
 * 2. 회원가입 처리
 */
function handleSignup(payload) {
  const { id, password, name, major } = payload;
  if (!id || !password || !name || !major) {
    return createJsonResponse({ success: false, message: '모든 필수 입력값을 작성해주세요.' });
  }

  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  // 아이디 중복 체크 & 마지막 번호 계산
  let maxNo = 0;
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const currentNo = Number(row[0]);
    if (!isNaN(currentNo) && currentNo > maxNo) {
      maxNo = currentNo;
    }

    if (String(row[1]).trim().toLowerCase() === String(id).trim().toLowerCase()) {
      return createJsonResponse({
        success: false,
        message: '이미 존재하는 아이디입니다. 다른 아이디를 사용해주세요.'
      });
    }
  }

  // 새 회원 번호는 마지막 번호 + 1 (데이터가 없으면 1)
  const newNo = maxNo + 1;
  const newNote = ''; // 비고는 빈칸 처리

  // 행 추가: 번호, 아이디, 비밀번호, 이름, 전공, 비고
  sheet.appendRow([newNo, id.trim(), password.trim(), name.trim(), major.trim(), newNote]);

  return createJsonResponse({
    success: true,
    message: '회원가입이 성공적으로 완료되었습니다!',
    user: {
      no: newNo,
      id: id.trim(),
      name: name.trim(),
      major: major.trim(),
      note: newNote
    }
  });
}

/**
 * 3. 사용자 본인 프로필 수정 (전공, 비고)
 */
function handleUpdateProfile(payload) {
  const { id, password, major, note } = payload;
  if (!id) {
    return createJsonResponse({ success: false, message: '사용자 정보가 올바르지 않습니다.' });
  }

  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rowId = String(row[1]).trim();
    const rowPw = String(row[2]).trim();

    if (rowId === String(id).trim()) {
      // 본인 확인을 위해 비밀번호가 제공된 경우 일치 여부 확인
      if (password && rowPw !== String(password).trim()) {
        return createJsonResponse({ success: false, message: '비밀번호가 일치하지 않습니다.' });
      }

      const rowIndex = i + 1; // 1-based index
      // E열: 전공 (5번째 열), F열: 비고 (6번째 열)
      sheet.getRange(rowIndex, 5).setValue(major !== undefined ? major : row[4]);
      sheet.getRange(rowIndex, 6).setValue(note !== undefined ? note : row[5]);

      return createJsonResponse({
        success: true,
        message: '회원 정보가 성공적으로 수정되었습니다.',
        updatedData: {
          no: row[0],
          id: row[1],
          name: row[3],
          major: major !== undefined ? major : row[4],
          note: note !== undefined ? note : row[5]
        }
      });
    }
  }

  return createJsonResponse({ success: false, message: '수정할 회원 정보를 찾을 수 없습니다.' });
}

/**
 * Google ID Token 검증 헬퍼 함수
 * Google OAuth2 tokeninfo 엔드포인트를 호출하여 토큰의 유효성 및 이메일을 검증합니다.
 */
function verifyGoogleIdToken(idToken) {
  if (!idToken) return null;
  try {
    const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      return data; // email, email_verified, name, sub 등 포함
    }
  } catch (e) {
    Logger.log('Token verification error: ' + e.toString());
  }
  return null;
}

/**
 * 관리자 권한 확인 (Google ID Token 기반)
 */
function checkAdminAuth(idToken) {
  const tokenInfo = verifyGoogleIdToken(idToken);
  if (!tokenInfo || !tokenInfo.email) {
    return { authorized: false, message: 'Google 계정 인증에 실패했습니다.' };
  }

  const email = tokenInfo.email.toLowerCase();
  // 관리자 목록에 포함되어 있는지 확인
  const isAllowed = ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === email);

  if (!isAllowed) {
    return {
      authorized: false,
      email: email,
      message: '접근 권한이 없습니다. 등록된 관리자 구글 계정이 아닙니다: ' + email
    };
  }

  return { authorized: true, email: email, name: tokenInfo.name || email };
}

/**
 * 4. 관리자 로그인 검증
 */
function handleAdminVerify(payload) {
  const auth = checkAdminAuth(payload.idToken);
  if (!auth.authorized) {
    return createJsonResponse({ success: false, message: auth.message });
  }

  return createJsonResponse({
    success: true,
    message: '관리자 인증 성공',
    adminEmail: auth.email,
    adminName: auth.name
  });
}

/**
 * 5. 관리자: 전체 회원 목록 조회
 */
function handleAdminGetUsers(payload) {
  const auth = checkAdminAuth(payload.idToken);
  if (!auth.authorized) {
    return createJsonResponse({ success: false, message: auth.message });
  }

  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const users = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] === '' && row[1] === '') continue; // 빈 행 건너뜀

    users.push({
      rowIndex: i + 1,
      no: row[0],
      id: row[1],
      password: '***', // 보안을 위해 비밀번호 마스킹
      name: row[3],
      major: row[4],
      note: row[5] || ''
    });
  }

  return createJsonResponse({
    success: true,
    users: users
  });
}

/**
 * 6. 관리자: 회원 정보 수정
 */
function handleAdminUpdateUser(payload) {
  const auth = checkAdminAuth(payload.idToken);
  if (!auth.authorized) {
    return createJsonResponse({ success: false, message: auth.message });
  }

  const { targetId, name, major, note } = payload;
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === String(targetId).trim()) {
      const rowIndex = i + 1;
      if (name !== undefined) sheet.getRange(rowIndex, 4).setValue(name);
      if (major !== undefined) sheet.getRange(rowIndex, 5).setValue(major);
      if (note !== undefined) sheet.getRange(rowIndex, 6).setValue(note);

      return createJsonResponse({
        success: true,
        message: `회원 [${targetId}]의 정보가 관리자에 의해 수정되었습니다.`
      });
    }
  }

  return createJsonResponse({ success: false, message: '해당 회원을 찾을 수 없습니다.' });
}

/**
 * 7. 관리자: 회원 삭제
 */
function handleAdminDeleteUser(payload) {
  const auth = checkAdminAuth(payload.idToken);
  if (!auth.authorized) {
    return createJsonResponse({ success: false, message: auth.message });
  }

  const { targetId } = payload;
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === String(targetId).trim()) {
      const rowIndex = i + 1;
      sheet.deleteRow(rowIndex);
      return createJsonResponse({
        success: true,
        message: `회원 [${targetId}]이(가) 성공적으로 삭제되었습니다.`
      });
    }
  }

  return createJsonResponse({ success: false, message: '삭제할 회원을 찾을 수 없습니다.' });
}

/**
 * JSON 응답 생성기 (CORS 방지 헤더 설정)
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
