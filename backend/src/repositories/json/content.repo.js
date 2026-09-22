/**
 * 5. 콘텐츠 저장소 (JSON 구현)
 *
 * 프로필 · 스킬 · 프로젝트 · 여정 등 포트폴리오 내용입니다.
 * 내용을 직접 고치고 싶으면 backend/data/content.json 을 수정하면 됩니다.
 * (프로젝트는 관리자 페이지에서 고치는 편이 안전합니다.)
 *
 * 프로젝트에는 공개 여부(status)가 있습니다.
 *  - published : 사이트에 보이는 프로젝트
 *  - draft     : 관리자에게만 보이는 작성 중인 프로젝트
 * 공개용 함수는 기본적으로 draft 를 걸러서 돌려줍니다.
 */
import { randomUUID } from 'node:crypto';
import { readJson, updateJson, NO_CHANGE } from './jsonStore.js';

const FILE = 'content.json';
const EMPTY = {
  profile: {},
  skillFilters: [],
  skills: [],
  projectFilters: [],
  projects: [],
  timeline: [],
  guestbookOptions: { avatars: [], badges: [] }
};

/** 새 프로젝트를 만들 때 쓰는 기본값 (화면이 깨지지 않도록 최소 형태를 갖춥니다) */
const PROJECT_DEFAULTS = {
  category: 'web',
  categoryLabel: '기타',
  tags: [],
  links: {
    repo: null,
    demo: null,
    repoNote: 'GitHub 주소가 아직 등록되지 않았습니다.',
    demoNote: '데모 주소가 아직 등록되지 않았습니다.'
  },
  mockup: {
    variant: 'mockup-devorbit',
    url: '',
    type: 'code',
    statusText: ''
  },
  detail: {
    category: '',
    title: '',
    desc: '',
    tech: [],
    features: [],
    bannerBg: 'linear-gradient(135deg, #0f172a, #1e1b4b)'
  }
};

async function load() {
  return readJson(FILE, EMPTY);
}

function isPublished(project) {
  // status 가 없던 옛 데이터는 공개로 간주합니다.
  return (project.status || 'published') === 'published';
}

export const contentRepository = {
  async getProfile() {
    const data = await load();
    return data.profile;
  },

  async getSkills() {
    const data = await load();
    return { filters: data.skillFilters, items: data.skills };
  },

  /** 공개용 — 초안은 빼고 돌려줍니다. */
  async getProjects() {
    const data = await load();
    return { filters: data.projectFilters, items: data.projects.filter(isPublished) };
  },

  /** 관리자용 — 초안까지 전부 돌려줍니다. */
  async getAllProjects() {
    const data = await load();
    return data.projects;
  },

  async getProjectById(id, { includeDrafts = false } = {}) {
    const data = await load();
    const project = data.projects.find((p) => p.id === id);
    if (!project) return null;

    return includeDrafts || isPublished(project) ? project : null;
  },

  async getTimeline() {
    const data = await load();
    return data.timeline;
  },

  /** 방명록 폼의 아바타·구분 선택지 (화면과 서버 검증이 같은 값을 쓰도록 한 곳에서 관리) */
  async getGuestbookOptions() {
    const data = await load();
    return data.guestbookOptions;
  },

  /* ------------------------------------------------- 관리자 페이지에서 쓰는 쓰기 */

  /**
   * 새 프로젝트를 추가합니다.
   * 카드·모달이 쓰는 나머지 정보(태그·목업 등)는 기본값으로 채워둡니다.
   */
  async createProject(fields) {
    return updateJson(FILE, EMPTY, (data) => {
      const now = new Date().toISOString();
      const project = {
        id: randomUUID(),
        ...structuredClone(PROJECT_DEFAULTS),
        ...fields,
        createdAt: now,
        updatedAt: now
      };

      // 상세 모달에도 같은 내용이 보이도록 맞춰둡니다.
      project.detail = {
        ...project.detail,
        title: fields.title,
        desc: fields.summary
      };

      data.projects.push(project);
      return project;
    });
  },

  /**
   * 프로젝트를 수정합니다.
   * 관리자 페이지에서 다루지 않는 정보(태그·목업·기술스택 등)는 그대로 둡니다.
   * 없는 id 면 null 을 돌려줍니다.
   */
  async updateProject(id, fields) {
    return updateJson(FILE, EMPTY, (data) => {
      const index = data.projects.findIndex((p) => p.id === id);
      if (index === -1) return NO_CHANGE;

      const before = data.projects[index];
      const after = {
        ...before,
        ...fields,
        updatedAt: new Date().toISOString()
      };

      after.detail = {
        ...before.detail,
        title: fields.title,
        desc: fields.summary
      };

      data.projects[index] = after;
      return after;
    });
  },

  async deleteProject(id) {
    const result = await updateJson(FILE, EMPTY, (data) => {
      const index = data.projects.findIndex((p) => p.id === id);
      if (index === -1) return NO_CHANGE;

      data.projects.splice(index, 1);
      return true;
    });
    return result === true;
  }
};
