# 저장소(repository) 계층 — 나중에 DB를 붙이는 곳

이 폴더는 **"데이터를 어디에 저장하는가"** 만 담당합니다.
지금은 JSON 파일에 저장하고 있고, 나중에 MySQL·PostgreSQL 등으로 바꿀 때
**이 폴더 안쪽만 고치면 됩니다.**

```
요청 → routes → controllers → services → repositories → (JSON 파일 / 나중엔 DB)
                                          ↑ 여기만 교체
```

---

## 왜 이렇게 나눴나

서비스 코드가 `fs.readFile` 같은 저장 방식을 직접 알고 있으면,
DB로 바꿀 때 서비스 코드까지 전부 뒤져서 고쳐야 합니다.

지금 구조에서는 서비스가 저장 방식을 모릅니다.
`repositories/index.js` 가 골라준 객체의 함수를 부를 뿐입니다.

---

## 저장소가 지켜야 할 약속 (인터페이스)

새 구현체를 만들 때는 **아래 함수 이름과 반환 형태를 그대로** 맞추면 됩니다.

### `contentRepository` — 읽기 전용

| 함수 | 반환 |
|---|---|
| `getProfile()` | 프로필 객체 |
| `getSkills()` | `{ filters: [], items: [] }` |
| `getProjects()` | `{ filters: [], items: [] }` |
| `getProjectById(id)` | 프로젝트 객체 또는 `null` |
| `getTimeline()` | 여정 배열 |

### `guestbookRepository`

| 함수 | 반환 |
|---|---|
| `findAll()` | 방명록 배열 (최신순) |
| `findById(id)` | 방명록 객체 또는 `null` |
| `create({ author, badge, avatar, content })` | 저장된 객체 |
| `changeLikes(id, delta)` | 갱신된 객체 또는 `null` |
| `remove(id)` | `true` / `false` |
| `resetToSeed()` | 복원된 배열 |

방명록 한 건의 형태:

```json
{
  "id": "문자열",
  "author": "문자열",
  "badge": "문자열",
  "avatar": "이모지 문자열",
  "content": "문자열",
  "likes": 0,
  "createdAt": "2026-09-22T04:00:00.000Z"
}
```

### `contactRepository`

| 함수 | 반환 |
|---|---|
| `create({ name, email, subject, message })` | 저장된 객체 |
| `findAll()` | 문의 배열 (최신순) |

---

## MySQL 로 바꾸는 예시 (3단계)

**1. 테이블을 만듭니다.**

```sql
CREATE TABLE guestbook (
  id         CHAR(36)     PRIMARY KEY,
  author     VARCHAR(40)  NOT NULL,
  badge      VARCHAR(50)  NOT NULL,
  avatar     VARCHAR(16)  NOT NULL,
  content    VARCHAR(300) NOT NULL,
  likes      INT          NOT NULL DEFAULT 0,
  created_at DATETIME(3)  NOT NULL
);
```

**2. `mysql/guestbook.repo.js` 를 같은 함수 이름으로 만듭니다.**

```js
import { pool } from './pool.js';

export const guestbookRepository = {
  async findAll() {
    const [rows] = await pool.query(
      'SELECT id, author, badge, avatar, content, likes, created_at AS createdAt ' +
      'FROM guestbook ORDER BY created_at DESC'
    );
    return rows;
  },
  // findById, create, changeLikes, remove, resetToSeed ...
};
```

> `changeLikes` 는 DB에서는 `UPDATE guestbook SET likes = GREATEST(0, likes + ?) WHERE id = ?`
> 한 줄로 끝나서, 지금의 "읽고-고치고-다시 쓰기" 보다 오히려 안전해집니다.

**3. `repositories/index.js` 의 switch 에 `case 'mysql'` 을 추가하고,
서버를 `DATA_DRIVER=mysql` 로 실행합니다.**

끝입니다. `routes` · `controllers` · `services` · `frontend` 는 건드리지 않습니다.

---

## 지금 JSON 구현의 한계 (알고 쓰기)

- 파일 하나를 통째로 읽고 쓰므로 글이 수천 건이 되면 느려집니다.
- 서버를 여러 대로 늘리면 각 서버가 서로 다른 파일을 보게 됩니다.
- 검색·정렬을 코드에서 직접 해야 합니다.

즉 **혼자 쓰는 포트폴리오 수준에서는 충분하고, 실서비스가 되면 DB로 옮기면 됩니다.**
그 시점에 고칠 파일이 이 폴더뿐이도록 미리 갈라 둔 구조입니다.
