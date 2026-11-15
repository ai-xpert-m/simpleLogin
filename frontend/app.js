/**
 * ==============================================================================
 * app.js - 회원 로그인 및 관리 시스템 프론트엔드 컨트롤러
 * ==============================================================================
 */

// 1. 기본 설정 키 및 기본값
const STORAGE_KEYS = {
  GAS_URL: 'app_gas_url',
  GOOGLE_CLIENT_ID: 'app_google_client_id',
  AUTH_USER: 'app_current_user',
  ADMIN_TOKEN: 'app_admin_id_token',
  ADMIN_EMAIL: 'app_admin_email'
};

// 기본 배포 URL (배포 후 설정 모달 또는 아래에 직접 입력 가능)
let gasUrl = localStorage.getItem(STORAGE_KEYS.GAS_URL) || '';
let googleClientId = localStorage.getItem(STORAGE_KEYS.GOOGLE_CLIENT_ID) || '';

// 2. DOM 요소 참조
const elements = {
  // 뷰 섹션들
  viewLogin: document.getElementById('viewLogin'),
  viewSignup: document.getElementById('viewSignup'),
  viewProfile: document.getElementById('viewProfile'),
  viewAdmin: document.getElementById('viewAdmin'),

  // 네비게이션 및 전환
  navAdminTab: document.getElementById('navAdminTab'),
  btnExitAdmin: document.getElementById('btnExitAdmin'),
  linkGoSignup: document.getElementById('linkGoSignup'),
  linkGoLogin: document.getElementById('linkGoLogin'),
  btnQuickSignup: document.getElementById('btnQuickSignup'),

  // 로그인 폼
  formLogin: document.getElementById('formLogin'),
  loginId: document.getElementById('loginId'),
  loginPw: document.getElementById('loginPw'),
  btnLoginSubmit: document.getElementById('btnLoginSubmit'),
  loginFailAlert: document.getElementById('loginFailAlert'),

  // 회원가입 폼
  formSignup: document.getElementById('formSignup'),
  signupId: document.getElementById('signupId'),
  signupPw: document.getElementById('signupPw'),
  signupName: document.getElementById('signupName'),
  signupMajor: document.getElementById('signupMajor'),
  btnSignupSubmit: document.getElementById('btnSignupSubmit'),

  // 마이페이지 (프로필)
  profileNo: document.getElementById('profileNo'),
  profileWelcome: document.getElementById('profileWelcome'),
  profileId: document.getElementById('profileId'),
  profileName: document.getElementById('profileName'),
  profileMajor: document.getElementById('profileMajor'),
  profileNote: document.getElementById('profileNote'),
  formUpdateProfile: document.getElementById('formUpdateProfile'),
  btnUpdateProfile: document.getElementById('btnUpdateProfile'),
  btnLogout: document.getElementById('btnLogout'),

  // 관리자 모드
  adminAuthGate: document.getElementById('adminAuthGate'),
  adminDashboardContent: document.getElementById('adminDashboardContent'),
  googleBtnContainer: document.getElementById('googleBtnContainer'),
  adminAuthError: document.getElementById('adminAuthError'),
  adminAuthErrorMessage: document.getElementById('adminAuthErrorMessage'),
  adminUserEmail: document.getElementById('adminUserEmail'),
  adminUserTableBody: document.getElementById('adminUserTableBody'),
  adminSearchInput: document.getElementById('adminSearchInput'),
  btnRefreshUsers: document.getElementById('btnRefreshUsers'),
  btnAdminLogout: document.getElementById('btnAdminLogout'),

  // 설정 모달
  btnOpenConfig: document.getElementById('btnOpenConfig'),
  modalConfig: document.getElementById('modalConfig'),
  btnCloseConfigModal: document.getElementById('btnCloseConfigModal'),
  cfgGasUrl: document.getElementById('cfgGasUrl'),
  cfgGoogleClientId: document.getElementById('cfgGoogleClientId'),
  btnSaveConfig: document.getElementById('btnSaveConfig'),

  // 관리자 회원 수정 모달
  modalAdminEdit: document.getElementById('modalAdminEdit'),
  btnCloseAdminEditModal: document.getElementById('btnCloseAdminEditModal'),
  btnCancelAdminEdit: document.getElementById('btnCancelAdminEdit'),
  formAdminEditUser: document.getElementById('formAdminEditUser'),
  editUserId: document.getElementById('editUserId'),
  editUserDisplayId: document.getElementById('editUserDisplayId'),
  editUserName: document.getElementById('editUserName'),
  editUserMajor: document.getElementById('editUserMajor'),
  editUserNote: document.getElementById('editUserNote'),

  // 토스트 컨테이너
  toastContainer: document.getElementById('toastContainer')
};

// 관리자 전체 회원 로컬 캐시 (검색용)
let cachedUsers = [];

// ==============================================================================
// 3. API 통신 헬퍼 함수 (CORS 이슈 방지 필수 설정 적용)
// ==============================================================================
async function callGasApi(action, data = {}) {
  if (!gasUrl) {
    showToast('Google Apps Script 웹 앱 URL이 설정되지 않았습니다. 우측 상단 [⚙️ 연동 설정]에서 입력하세요.', 'error');
    openConfigModal();
    throw new Error('GAS URL not configured');
  }

  const payload = { action, ...data };

  // Google Apps Script는 단순 POST 요청(text/plain)을 통해 CORS 프리플라이트를 우회하는 표준 방식을 사용합니다.
  const response = await fetch(gasUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }

  const result = await response.json();
  return result;
}

// 버튼 로딩 상태 토글
function setButtonLoading(button, isLoading, normalText = '') {
  const textEl = button.querySelector('.btn-text');
  const spinnerEl = button.querySelector('.spinner');

  if (isLoading) {
    button.disabled = true;
    if (textEl) textEl.classList.add('hidden');
    if (spinnerEl) spinnerEl.classList.remove('hidden');
  } else {
    button.disabled = false;
    if (textEl) {
      if (normalText) textEl.textContent = normalText;
      textEl.classList.remove('hidden');
    }
    if (spinnerEl) spinnerEl.classList.add('hidden');
  }
}

// 토스트 메시지 출력
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

// ==============================================================================
// 4. 화면(View) 전환 관리
// ==============================================================================
function showView(viewName) {
  // 모든 뷰 숨김
  elements.viewLogin.classList.add('hidden');
  elements.viewSignup.classList.add('hidden');
  elements.viewProfile.classList.add('hidden');
  elements.viewAdmin.classList.add('hidden');

  switch (viewName) {
    case 'login':
      elements.viewLogin.classList.remove('hidden');
      elements.loginFailAlert.classList.add('hidden');
      break;
    case 'signup':
      elements.viewSignup.classList.remove('hidden');
      break;
    case 'profile':
      elements.viewProfile.classList.remove('hidden');
      break;
    case 'admin':
      elements.viewAdmin.classList.remove('hidden');
      checkAdminAuthState();
      break;
  }
}

// ==============================================================================
// 5. 일반 회원 기능 (로그인, 회원가입, 정보 수정)
// ==============================================================================

// 로그인 폼 제출
elements.formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = elements.loginId.value.trim();
  const password = elements.loginPw.value.trim();

  if (!id || !password) return;

  setButtonLoading(elements.btnLoginSubmit, true);
  elements.loginFailAlert.classList.add('hidden');

  try {
    const res = await callGasApi('login', { id, password });
    if (res.success && res.user) {
      // 로그인 성공
      sessionStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(res.user));
      // 현재 세션 비밀번호도 로컬에 보관 (수정 시 검증용)
      sessionStorage.setItem('temp_pw', password);
      showToast(`${res.user.name}님 환영합니다!`, 'success');
      loadUserProfile(res.user);
      showView('profile');
      elements.formLogin.reset();
    } else {
      // 인증 실패: "회원정보가 없다"라는 알림 출력
      elements.loginFailAlert.classList.remove('hidden');
      showToast(res.message || '회원정보가 일치하지 않거나 존재하지 않습니다.', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('로그인 요청 중 오류가 발생했습니다. 설정을 확인해 주세요.', 'error');
  } finally {
    setButtonLoading(elements.btnLoginSubmit, false);
  }
});

// 회원가입 폼 제출
elements.formSignup.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = elements.signupId.value.trim();
  const password = elements.signupPw.value.trim();
  const name = elements.signupName.value.trim();
  const major = elements.signupMajor.value.trim();

  if (!id || !password || !name || !major) {
    showToast('모든 필수 항목을 입력해 주세요.', 'error');
    return;
  }

  setButtonLoading(elements.btnSignupSubmit, true);

  try {
    const res = await callGasApi('signup', { id, password, name, major });
    if (res.success) {
      showToast(res.message || '회원가입이 완료되었습니다!', 'success');
      // 가입 성공 후 자동 로그인 처리
      if (res.user) {
        sessionStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(res.user));
        sessionStorage.setItem('temp_pw', password);
        loadUserProfile(res.user);
        showView('profile');
      } else {
        showView('login');
      }
      elements.formSignup.reset();
    } else {
      showToast(res.message || '회원가입 실패', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('회원가입 중 오류가 발생했습니다.', 'error');
  } finally {
    setButtonLoading(elements.btnSignupSubmit, false);
  }
});

// 프로필 데이터 렌더링
function loadUserProfile(user) {
  elements.profileNo.textContent = user.no || '-';
  elements.profileWelcome.textContent = `${user.name} 님의 마이페이지`;
  elements.profileId.value = user.id || '';
  elements.profileName.value = user.name || '';
  elements.profileMajor.value = user.major || '';
  elements.profileNote.value = user.note || '';
}

// 회원 정보 수정 (전공, 비고)
elements.formUpdateProfile.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.AUTH_USER) || '{}');
  if (!user.id) {
    showToast('로그인 정보가 만료되었습니다.', 'error');
    showView('login');
    return;
  }

  const major = elements.profileMajor.value.trim();
  const note = elements.profileNote.value.trim();
  const password = sessionStorage.getItem('temp_pw') || '';

  setButtonLoading(elements.btnUpdateProfile, true);

  try {
    const res = await callGasApi('updateProfile', {
      id: user.id,
      password,
      major,
      note
    });

    if (res.success) {
      showToast('정보가 성공적으로 수정되었습니다.', 'success');
      // 로컬 스토리지 정보 갱신
      user.major = major;
      user.note = note;
      sessionStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    } else {
      showToast(res.message || '정보 수정에 실패했습니다.', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('수정 처리 중 오류가 발생했습니다.', 'error');
  } finally {
    setButtonLoading(elements.btnUpdateProfile, false);
  }
});

// 일반 회원 로그아웃
elements.btnLogout.addEventListener('click', () => {
  sessionStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  sessionStorage.removeItem('temp_pw');
  showToast('로그아웃 되었습니다.', 'info');
  showView('login');
});

// 화면 전환 링크 핸들러
elements.linkGoSignup.addEventListener('click', (e) => {
  e.preventDefault();
  showView('signup');
});
elements.btnQuickSignup.addEventListener('click', () => {
  showView('signup');
});
elements.linkGoLogin.addEventListener('click', (e) => {
  e.preventDefault();
  showView('login');
});
elements.navAdminTab.addEventListener('click', () => {
  showView('admin');
});
elements.btnExitAdmin.addEventListener('click', () => {
  const savedUser = sessionStorage.getItem(STORAGE_KEYS.AUTH_USER);
  if (savedUser) {
    showView('profile');
  } else {
    showView('login');
  }
});

// ==============================================================================
// 6. 관리자 모드 보안 및 구글 OAuth 인증 (Google Identity Services)
// ==============================================================================

function checkAdminAuthState() {
  const adminToken = sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  const adminEmail = sessionStorage.getItem(STORAGE_KEYS.ADMIN_EMAIL);

  if (adminToken && adminEmail) {
    // 이미 인증된 세션
    renderAdminDashboard(adminEmail);
  } else {
    // 인증 필요 화면
    elements.adminAuthGate.classList.remove('hidden');
    elements.adminDashboardContent.classList.add('hidden');
    elements.btnAdminLogout.classList.add('hidden');
    elements.adminAuthError.classList.add('hidden');
    initGoogleLoginButton();
  }
}

// Google Identity Services (GIS) 버튼 초기화
function initGoogleLoginButton() {
  if (!googleClientId) {
    elements.googleBtnContainer.innerHTML = `
      <div style="color: #dc2626; font-size: 0.85rem;">
        ⚠️ <strong>Google Client ID 미설정</strong><br>
        상단 [⚙️ 연동 설정]에서 Google OAuth Client ID를 입력해야 Google 로그인 버튼이 활성화됩니다.
      </div>
    `;
    return;
  }

  if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
    // 스크립트 로드 대기
    setTimeout(initGoogleLoginButton, 300);
    return;
  }

  google.accounts.id.initialize({
    client_id: googleClientId,
    callback: handleGoogleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true
  });

  elements.googleBtnContainer.innerHTML = '';
  google.accounts.id.renderButton(elements.googleBtnContainer, {
    theme: 'outline',
    size: 'large',
    type: 'standard',
    shape: 'rectangular',
    text: 'signin_with',
    width: 250
  });
}

// Google 로그인 응답 콜백
async function handleGoogleCredentialResponse(response) {
  const idToken = response.credential;
  if (!idToken) {
    showToast('Google 인증 토큰을 받지 못했습니다.', 'error');
    return;
  }

  elements.adminAuthError.classList.add('hidden');
  showToast('관리자 권한 확인 중...', 'info');

  try {
    // GAS 백엔드로 ID 토큰을 보내 관리자 이메일 검증
    const res = await callGasApi('adminLoginVerify', { idToken });
    if (res.success) {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, idToken);
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_EMAIL, res.adminEmail);
      showToast(`관리자 [${res.adminEmail}] 인증 완료`, 'success');
      renderAdminDashboard(res.adminEmail);
    } else {
      // 지정된 구글 계정이 아닐 경우 접근 원천 차단
      elements.adminAuthError.classList.remove('hidden');
      elements.adminAuthErrorMessage.textContent = res.message || '등록된 관리자 구글 계정이 아닙니다.';
      showToast(res.message || '관리자 인증 실패', 'error');
    }
  } catch (err) {
    console.error(err);
    elements.adminAuthError.classList.remove('hidden');
    elements.adminAuthErrorMessage.textContent = '인증 요청 중 오류가 발생했습니다.';
  }
}

// 관리자 대시보드 표시 및 회원 목록 조회
async function renderAdminDashboard(email) {
  elements.adminAuthGate.classList.add('hidden');
  elements.adminDashboardContent.classList.remove('hidden');
  elements.btnAdminLogout.classList.remove('hidden');
  elements.adminUserEmail.textContent = email;

  await loadAllUsers();
}

// 전체 회원 목록 조회
async function loadAllUsers() {
  const idToken = sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  if (!idToken) return;

  elements.adminUserTableBody.innerHTML = `
    <tr><td colspan="7" style="text-align: center; padding: 2rem;">데이터를 불러오는 중입니다...</td></tr>
  `;

  try {
    const res = await callGasApi('adminGetUsers', { idToken });
    if (res.success && Array.isArray(res.users)) {
      cachedUsers = res.users;
      renderUserTable(cachedUsers);
    } else {
      showToast(res.message || '회원 목록을 가져오지 못했습니다.', 'error');
      if (res.message && res.message.includes('인증')) {
        handleAdminLogout();
      }
    }
  } catch (err) {
    console.error(err);
    showToast('회원 목록 조회 중 오류가 발생했습니다.', 'error');
  }
}

// 회원 목록 테이블 렌더링
function renderUserTable(users) {
  elements.adminUserTableBody.innerHTML = '';

  if (users.length === 0) {
    elements.adminUserTableBody.innerHTML = `
      <tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 2rem;">등록된 회원이 없습니다.</td></tr>
    `;
    return;
  }

  users.forEach((u) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(String(u.no))}</strong></td>
      <td>${escapeHtml(String(u.id))}</td>
      <td style="color: #94a3b8;">${escapeHtml(String(u.password))}</td>
      <td><strong>${escapeHtml(String(u.name))}</strong></td>
      <td><span class="badge badge-editable">${escapeHtml(String(u.major))}</span></td>
      <td>${escapeHtml(String(u.note || '-'))}</td>
      <td>
        <div class="table-actions">
          <button class="btn btn-sm btn-outline btn-edit-user" data-id="${escapeHtml(u.id)}">수정</button>
          <button class="btn btn-sm btn-danger-soft btn-del-user" data-id="${escapeHtml(u.id)}">삭제</button>
        </div>
      </td>
    `;
    elements.adminUserTableBody.appendChild(tr);
  });

  // 이벤트 바인딩: 수정 및 삭제
  elements.adminUserTableBody.querySelectorAll('.btn-edit-user').forEach(btn => {
    btn.addEventListener('click', () => openAdminEditModal(btn.dataset.id));
  });

  elements.adminUserTableBody.querySelectorAll('.btn-del-user').forEach(btn => {
    btn.addEventListener('click', () => deleteUser(btn.dataset.id));
  });
}

// 회원 검색 필터링
elements.adminSearchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  if (!query) {
    renderUserTable(cachedUsers);
    return;
  }
  const filtered = cachedUsers.filter(u =>
    String(u.id).toLowerCase().includes(query) ||
    String(u.name).toLowerCase().includes(query) ||
    String(u.major).toLowerCase().includes(query) ||
    String(u.note).toLowerCase().includes(query)
  );
  renderUserTable(filtered);
});

// 관리자 목록 새로고침
elements.btnRefreshUsers.addEventListener('click', () => {
  loadAllUsers();
  showToast('회원 목록이 새로고침되었습니다.', 'info');
});

// 관리자 로그아웃
function handleAdminLogout() {
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.ADMIN_EMAIL);
  cachedUsers = [];
  showToast('관리자 모드에서 로그아웃되었습니다.', 'info');
  checkAdminAuthState();
}
elements.btnAdminLogout.addEventListener('click', handleAdminLogout);

// 회원 수정 모달 열기
function openAdminEditModal(userId) {
  const user = cachedUsers.find(u => String(u.id) === String(userId));
  if (!user) return;

  elements.editUserId.value = user.id;
  elements.editUserDisplayId.value = user.id;
  elements.editUserName.value = user.name;
  elements.editUserMajor.value = user.major;
  elements.editUserNote.value = user.note || '';
  elements.modalAdminEdit.classList.remove('hidden');
}

function closeAdminEditModal() {
  elements.modalAdminEdit.classList.add('hidden');
}

elements.btnCloseAdminEditModal.addEventListener('click', closeAdminEditModal);
elements.btnCancelAdminEdit.addEventListener('click', closeAdminEditModal);

// 관리자: 회원 정보 수정 제출
elements.formAdminEditUser.addEventListener('submit', async (e) => {
  e.preventDefault();
  const idToken = sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  const targetId = elements.editUserId.value;
  const name = elements.editUserName.value.trim();
  const major = elements.editUserMajor.value.trim();
  const note = elements.editUserNote.value.trim();

  if (!idToken || !targetId) return;

  try {
    const res = await callGasApi('adminUpdateUser', {
      idToken,
      targetId,
      name,
      major,
      note
    });

    if (res.success) {
      showToast(res.message || '수정되었습니다.', 'success');
      closeAdminEditModal();
      await loadAllUsers();
    } else {
      showToast(res.message || '수정 실패', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('수정 중 오류가 발생했습니다.', 'error');
  }
});

// 관리자: 회원 삭제
async function deleteUser(userId) {
  if (!confirm(`정말로 회원 [${userId}]을(를) 삭제하시겠습니까?\n이 작업은 구글 시트에서 즉시 영구 삭제됩니다.`)) {
    return;
  }

  const idToken = sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  if (!idToken) return;

  try {
    const res = await callGasApi('adminDeleteUser', { idToken, targetId: userId });
    if (res.success) {
      showToast(res.message || '삭제되었습니다.', 'success');
      await loadAllUsers();
    } else {
      showToast(res.message || '삭제 실패', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('삭제 중 오류가 발생했습니다.', 'error');
  }
}

// ==============================================================================
// 7. 설정 모달 및 초기화
// ==============================================================================
function openConfigModal() {
  elements.cfgGasUrl.value = gasUrl;
  elements.cfgGoogleClientId.value = googleClientId;
  elements.modalConfig.classList.remove('hidden');
}

function closeConfigModal() {
  elements.modalConfig.classList.add('hidden');
}

elements.btnOpenConfig.addEventListener('click', openConfigModal);
elements.btnCloseConfigModal.addEventListener('click', closeConfigModal);

elements.btnSaveConfig.addEventListener('click', () => {
  gasUrl = elements.cfgGasUrl.value.trim();
  googleClientId = elements.cfgGoogleClientId.value.trim();

  localStorage.setItem(STORAGE_KEYS.GAS_URL, gasUrl);
  localStorage.setItem(STORAGE_KEYS.GOOGLE_CLIENT_ID, googleClientId);

  showToast('설정이 성공적으로 저장되었습니다.', 'success');
  closeConfigModal();

  // 관리자 화면 버튼 재초기화
  if (!elements.viewAdmin.classList.contains('hidden')) {
    checkAdminAuthState();
  }
});

// HTML 이스케이프 헬퍼
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// 페이지 로드 초기화
window.addEventListener('DOMContentLoaded', () => {
  // 기존 사용자 세션 복원
  const savedUser = sessionStorage.getItem(STORAGE_KEYS.AUTH_USER);
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      loadUserProfile(user);
      showView('profile');
    } catch {
      showView('login');
    }
  } else {
    showView('login');
  }

  // GAS URL이 설정되어 있지 않은 경우 사용자 편의를 위해 설정 모달 자동 노출
  if (!gasUrl) {
    setTimeout(openConfigModal, 400);
  }
});
