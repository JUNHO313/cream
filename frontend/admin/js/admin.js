/**
 * 0. 관리자 페이지 진입점
 *
 * 화면은 두 가지입니다.
 *   로그인 화면  — 비밀번호를 넣기 전
 *   관리 화면    — 로그인한 뒤 (왼쪽 목록 + 오른쪽 폼)
 *
 * 페이지를 열면 먼저 서버에 "나 로그인 되어 있나요?"를 물어보고,
 * 그 답에 따라 둘 중 하나를 보여줍니다.
 */
import { adminApi } from './admin.api.js';
import { showToast } from '../../js/ui/toast.js';
import * as list from './projectList.js';
import * as form from './projectForm.js';

/* -------------------------------------------------------------- 화면 전환 */

function showLogin() {
  document.getElementById('login-screen').hidden = false;
  document.getElementById('workspace').hidden = true;
  document.getElementById('login-password').focus();
}

function showWorkspace() {
  document.getElementById('login-screen').hidden = true;
  document.getElementById('workspace').hidden = false;
}

/* ------------------------------------------------------------------ 시작 */

document.addEventListener('DOMContentLoaded', async () => {
  bindLogin();
  bindWorkspace();
  form.initForm();
  list.initList(handleSelectProject);

  try {
    if (await adminApi.isLoggedIn()) {
      showWorkspace();
      await loadProjects();
    } else {
      showLogin();
    }
  } catch (err) {
    // 서버가 꺼져 있어도 로그인 화면은 보여줍니다.
    showLogin();
    showToast(err.message, 'error');
  }
});

/* ---------------------------------------------------------------- 로그인 */

function bindLogin() {
  const loginForm = document.getElementById('login-form');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const input = document.getElementById('login-password');
    const errorEl = document.getElementById('login-error');
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    errorEl.hidden = true;
    submitBtn.disabled = true;

    try {
      const message = await adminApi.login(input.value);
      input.value = '';

      showWorkspace();
      await loadProjects();
      showToast(message);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
      input.select();
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function bindWorkspace() {
  document.getElementById('btn-logout').addEventListener('click', handleLogout);
  document.getElementById('btn-new').addEventListener('click', handleNewProject);
  document.getElementById('btn-cancel').addEventListener('click', handleNewProject);
  document.getElementById('btn-delete').addEventListener('click', handleDelete);
  document.getElementById('project-form').addEventListener('submit', handleSave);
}

async function handleLogout() {
  try {
    const message = await adminApi.logout();
    list.setItems([]);
    form.resetForm();
    showLogin();
    showToast(message);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* -------------------------------------------------------------- 목록 불러오기 */

async function loadProjects() {
  try {
    const { items } = await adminApi.listProjects();
    list.setItems(items);
    list.setSelected(form.getEditingId());
  } catch (err) {
    handleAuthError(err);
  }
}

/* ------------------------------------------------------------------ 동작들 */

function handleNewProject() {
  form.resetForm();
  list.setSelected(null);
  form.focusField('title');
}

function handleSelectProject(id) {
  const project = list.findItem(id);
  if (!project) return;

  form.fillForm(project);
  list.setSelected(id);

  // 화면이 좁으면 폼이 목록 아래에 있으므로 스크롤해서 보여줍니다.
  if (window.matchMedia('(max-width: 900px)').matches) {
    document.getElementById('project-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

async function handleSave(e) {
  e.preventDefault();

  // 1) 화면에서 먼저 확인 — 서버까지 갔다 오지 않고 바로 알려줍니다.
  const { ok, firstErrorField } = form.validate();
  if (!ok) {
    form.focusField(firstErrorField);
    showToast('입력하지 않은 칸이 있습니다. 빨간 표시를 확인해주세요.', 'error');
    return;
  }

  const values = form.collectValues();
  const editingId = form.getEditingId();

  form.setSaving(true);

  try {
    const { project, message } = editingId
      ? await adminApi.updateProject(editingId, values)
      : await adminApi.createProject(values);

    // 2) 저장된 내용을 그대로 다시 채웁니다. (서버가 정리한 값이 화면에 반영됨)
    form.fillForm(project);
    await loadProjects();
    list.setSelected(project.id);

    showToast(message);
  } catch (err) {
    // 서버가 특정 칸을 지목했다면 그 칸에 표시합니다.
    if (!form.showServerError(err)) {
      handleAuthError(err);
    }
  } finally {
    form.setSaving(false);
  }
}

async function handleDelete() {
  const editingId = form.getEditingId();
  if (!editingId) return;

  const project = list.findItem(editingId);
  const title = project?.title || '이 프로젝트';

  if (!confirm(`'${title}' 을(를) 삭제하시겠습니까?\n삭제하면 되돌릴 수 없습니다.`)) return;

  try {
    const message = await adminApi.deleteProject(editingId);
    form.resetForm();
    await loadProjects();
    showToast(message);
  } catch (err) {
    handleAuthError(err);
  }
}

/**
 * 로그인이 풀린 경우(세션 만료, 서버 재시작)에는 로그인 화면으로 돌려보냅니다.
 * 그 외의 오류는 그냥 메시지만 보여줍니다.
 */
function handleAuthError(err) {
  if (err.status === 401) {
    showLogin();
    showToast('로그인이 만료되었습니다. 다시 로그인해주세요.', 'error');
    return;
  }
  showToast(err.message, 'error');
}
