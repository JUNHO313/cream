/**
 * 24. 프로젝트 관리 서비스
 *
 * 관리자 페이지에서 프로젝트를 만들고 고칠 때의 규칙을 담습니다.
 *
 * 핵심 규칙 — 저장 상태에 따라 검사 강도가 다릅니다.
 *
 *   초안(draft)     : 아무 칸이나 비어 있어도 저장됩니다. 쓰다 만 것을 남겨두는 용도.
 *                     단, 목록에서 알아볼 수 있도록 제목만은 필요합니다.
 *   공개(published) : 참고사항을 뺀 모든 칸이 채워져야 저장됩니다.
 *                     사이트에 바로 나가는 내용이므로 빈칸을 허용하지 않습니다.
 *
 * 이 검사는 화면(admin)에서도 하지만 서버에서도 반드시 합니다.
 * 화면 검사는 실수를 막아주는 편의일 뿐, 건너뛰고 요청을 보낼 수 있기 때문입니다.
 */
import { contentRepository } from '../repositories/index.js';
import { ApiError } from '../utils/ApiError.js';

/** 공개하려면 반드시 채워야 하는 칸 (참고사항 notes 는 제외) */
const REQUIRED_FOR_PUBLISH = [
  { key: 'title', label: '제목' },
  { key: 'role', label: '내가 한 역할' },
  { key: 'summary', label: '설명' },
  { key: 'period', label: '날짜' },
  { key: 'teamSize', label: '참여인원 수' }
];

const LIMITS = {
  title: 120,
  role: 100,
  summary: 600,
  period: 60,
  notes: 1000,
  teamSizeMax: 1000
};

const STATUSES = ['draft', 'published'];

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/** 빈 값인지 판단합니다. (0명은 인원수로 의미가 없으므로 빈 값으로 봅니다) */
function isBlank(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'number') return !Number.isFinite(value) || value <= 0;
  return false;
}

/** 참여인원 수를 숫자로 바꿉니다. 비어 있으면 null. */
function parseTeamSize(value) {
  if (value === null || value === undefined || value === '') return null;

  const num = Number(value);
  if (!Number.isInteger(num)) {
    throw ApiError.badRequest('참여인원 수는 정수로 입력해주세요.', 'TEAM_SIZE_INVALID');
  }
  if (num < 1 || num > LIMITS.teamSizeMax) {
    throw ApiError.badRequest(
      `참여인원 수는 1명 이상 ${LIMITS.teamSizeMax}명 이하로 입력해주세요.`,
      'TEAM_SIZE_RANGE'
    );
  }
  return num;
}

function checkLength(value, key, label) {
  if (value.length > LIMITS[key]) {
    throw ApiError.badRequest(
      `${label}은(는) ${LIMITS[key]}자 이내로 입력해주세요.`,
      `${key.toUpperCase()}_TOO_LONG`
    );
  }
}

/**
 * 입력값을 검사하고 저장할 형태로 정리합니다.
 * @returns {{status:string, title:string, role:string, summary:string,
 *            period:string, teamSize:number|null, notes:string}}
 */
function validate(body) {
  const status = trimString(body?.status) || 'draft';
  if (!STATUSES.includes(status)) {
    throw ApiError.badRequest('상태는 초안 또는 공개만 선택할 수 있습니다.', 'STATUS_INVALID');
  }

  const fields = {
    status,
    title: trimString(body?.title),
    role: trimString(body?.role),
    summary: trimString(body?.summary),
    period: trimString(body?.period),
    teamSize: parseTeamSize(body?.teamSize),
    notes: trimString(body?.notes)
  };

  checkLength(fields.title, 'title', '제목');
  checkLength(fields.role, 'role', '내가 한 역할');
  checkLength(fields.summary, 'summary', '설명');
  checkLength(fields.period, 'period', '날짜');
  checkLength(fields.notes, 'notes', '참고사항');

  // 초안이라도 제목은 필요합니다. 목록에서 구분할 수 없기 때문입니다.
  if (isBlank(fields.title)) {
    throw ApiError.badRequest(
      '초안으로 저장할 때도 제목은 입력해주세요.',
      'TITLE_REQUIRED'
    );
  }

  if (status === 'published') {
    const missing = REQUIRED_FOR_PUBLISH
      .filter(({ key }) => isBlank(fields[key]))
      .map(({ label }) => label);

    if (missing.length) {
      throw ApiError.badRequest(
        `공개하려면 다음 칸을 채워주세요: ${missing.join(', ')}`,
        'REQUIRED_FIELDS_MISSING'
      );
    }
  }

  return fields;
}

/** 공개 상태인데 빠진 칸이 있는지 알려줍니다. (관리자 목록의 '보완 필요' 표시용) */
function missingFields(project) {
  return REQUIRED_FOR_PUBLISH
    .filter(({ key }) => isBlank(project[key]))
    .map(({ label }) => label);
}

export const projectService = {
  /** 관리자용 — 초안까지 전부, 최근 수정 순 */
  async listForAdmin() {
    const items = await contentRepository.getAllProjects();

    const withStatus = items.map((project) => ({
      ...project,
      missingFields: missingFields(project)
    }));

    withStatus.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    return { items: withStatus, total: withStatus.length };
  },

  async getOne(id) {
    const project = await contentRepository.getProjectById(id, { includeDrafts: true });
    if (!project) {
      throw ApiError.notFound('해당 프로젝트를 찾을 수 없습니다.', 'PROJECT_NOT_FOUND');
    }
    return { ...project, missingFields: missingFields(project) };
  },

  async create(body) {
    const fields = validate(body);
    return contentRepository.createProject(fields);
  },

  async update(id, body) {
    const fields = validate(body);
    const updated = await contentRepository.updateProject(id, fields);

    if (!updated) {
      throw ApiError.notFound('해당 프로젝트를 찾을 수 없습니다.', 'PROJECT_NOT_FOUND');
    }
    return updated;
  },

  async remove(id) {
    const removed = await contentRepository.deleteProject(id);
    if (!removed) {
      throw ApiError.notFound('해당 프로젝트를 찾을 수 없습니다.', 'PROJECT_NOT_FOUND');
    }
  }
};
