import { expect, test } from '@playwright/test';

/**
 * 검색 및 필터링 E2E 테스트
 * - 제목으로 검색
 * - 설명으로 검색
 * - 위치로 검색
 * - 대소문자 구분 없는 검색
 * - 부분 문자열 검색
 * - 검색어 없을 때 모든 일정 표시
 * - 검색 결과 없을 때 안내 메시지
 * - 여러 일정 중 일부만 매칭
 * - 검색어 초기화
 * - 뷰(월간/주간) 전환 시 검색 유지
 */

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

test.describe('검색 및 필터링', () => {
  test.beforeEach(async ({ page }) => {
    const fs = await import('fs');
    const path = await import('path');
    const dbPath = path.join(process.cwd(), 'src/__mocks__/response/e2e.json');
    fs.writeFileSync(dbPath, JSON.stringify({ events: [] }));

    await page.goto('/');
    await page.waitForSelector('[data-testid="event-submit-button"]', { timeout: 15000 });
  });

  test.describe('기본 검색 기능', () => {
    test('제목으로 일정을 검색할 수 있다', async ({ page }) => {
      // Given: 여러 일정 생성
      const events = [
        {
          title: '팀 회의',
          startTime: '10:00',
          endTime: '11:00',
          description: '주간 회의',
          location: '회의실 A',
        },
        {
          title: '점심 약속',
          startTime: '12:00',
          endTime: '13:00',
          description: '동료와 식사',
          location: '식당',
        },
        {
          title: '프로젝트 발표',
          startTime: '14:00',
          endTime: '15:00',
          description: '최종 발표',
          location: '강당',
        },
      ];

      for (const event of events) {
        await page.fill('#title', event.title);
        await page.fill('#date', todayStr);
        await page.fill('#start-time', event.startTime);
        await page.fill('#end-time', event.endTime);
        await page.fill('#description', event.description);
        await page.fill('#location', event.location);
        page.click('[data-testid="event-submit-button"]');
        await page.waitForResponse(
          (response) => response.url().includes('/api/events') && response.status() === 201
        );
        await page.waitForTimeout(500);
      }

      // When: 제목으로 검색
      await page.fill('#search', '회의');

      // Then: 해당 제목을 포함한 일정만 표시
      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('팀 회의')).toBeVisible();
      await expect(eventList.getByText('점심 약속')).not.toBeVisible();
      await expect(eventList.getByText('프로젝트 발표')).not.toBeVisible();
    });

    test('설명으로 일정을 검색할 수 있다', async ({ page }) => {
      // Given: 여러 일정 생성
      await page.fill('#title', '업무 미팅');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '09:00');
      await page.fill('#end-time', '10:00');
      await page.fill('#description', '분기별 실적 리뷰');
      await page.fill('#location', '본사');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForTimeout(500);

      await page.fill('#title', '개발자 세미나');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '14:00');
      await page.fill('#end-time', '16:00');
      await page.fill('#description', '신기술 동향 발표');
      await page.fill('#location', '세미나실');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 설명으로 검색
      await page.fill('#search', '발표');

      // Then: 해당 설명을 포함한 일정만 표시
      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('업무 미팅')).not.toBeVisible();
      await expect(eventList.getByText('개발자 세미나')).toBeVisible();
    });

    test('위치로 일정을 검색할 수 있다', async ({ page }) => {
      // Given: 여러 일정 생성
      await page.fill('#title', '영업 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '10:00');
      await page.fill('#end-time', '11:00');
      await page.fill('#location', '서울 본사');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForTimeout(500);

      await page.fill('#title', '고객 미팅');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '14:00');
      await page.fill('#end-time', '15:00');
      await page.fill('#location', '부산 지사');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 위치로 검색
      await page.fill('#search', '부산');

      // Then: 해당 위치를 포함한 일정만 표시
      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('영업 회의')).not.toBeVisible();
      await expect(eventList.getByText('고객 미팅')).toBeVisible();
    });
  });

  test.describe('검색 동작 방식', () => {
    test('대소문자를 구분하지 않고 검색한다', async ({ page }) => {
      // Given: 일정 생성
      await page.fill('#title', 'JavaScript 스터디');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '19:00');
      await page.fill('#end-time', '21:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 소문자로 검색
      await page.fill('#search', 'javascript');

      // Then: 일정이 검색됨
      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('JavaScript 스터디')).toBeVisible();

      // When: 대문자로 검색
      await page.fill('#search', 'JAVASCRIPT');

      // Then: 일정이 검색됨
      await expect(eventList.getByText('JavaScript 스터디')).toBeVisible();
    });

    test('부분 문자열로 검색할 수 있다', async ({ page }) => {
      // Given: 일정 생성
      await page.fill('#title', '프론트엔드 개발 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '10:00');
      await page.fill('#end-time', '11:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 부분 문자열로 검색
      await page.fill('#search', '개발');

      // Then: 일정이 검색됨
      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('프론트엔드 개발 회의')).toBeVisible();
    });

    test('검색어가 없으면 모든 일정이 표시된다', async ({ page }) => {
      // Given: 여러 일정 생성
      const events = [
        { title: '회의 A', startTime: '10:00', endTime: '11:00' },
        { title: '회의 B', startTime: '12:00', endTime: '13:00' },
        { title: '회의 C', startTime: '14:00', endTime: '15:00' },
      ];

      for (const event of events) {
        await page.fill('#title', event.title);
        await page.fill('#date', todayStr);
        await page.fill('#start-time', event.startTime);
        await page.fill('#end-time', event.endTime);
        page.click('[data-testid="event-submit-button"]');
        await page.waitForResponse(
          (response) => response.url().includes('/api/events') && response.status() === 201
        );
        await page.waitForTimeout(500);
      }

      // When: 검색어 없음
      await page.fill('#search', '');

      // Then: 모든 일정이 표시됨
      const eventList = page.locator('[data-testid="event-list"]');
      for (const event of events) {
        await expect(eventList.getByText(event.title)).toBeVisible();
      }
    });

    test('검색 결과가 없으면 안내 메시지가 표시된다', async ({ page }) => {
      // Given: 일정 생성
      await page.fill('#title', '팀 미팅');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '10:00');
      await page.fill('#end-time', '11:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 존재하지 않는 검색어 입력
      await page.fill('#search', '존재하지않는검색어12345');

      // Then: 안내 메시지 표시
      await expect(page.getByText('검색 결과가 없습니다.')).toBeVisible();
      await expect(page.getByText('팀 미팅')).not.toBeVisible();
    });
  });

  test.describe('복합 검색', () => {
    test('여러 일정 중 일부만 검색 조건에 맞으면 해당 일정만 표시된다', async ({ page }) => {
      // Given: 다양한 일정 생성
      const events = [
        {
          title: '개발팀 회의',
          startTime: '10:00',
          endTime: '11:00',
          description: '스프린트 계획',
          location: '회의실 1',
        },
        {
          title: '디자인 리뷰',
          startTime: '12:00',
          endTime: '13:00',
          description: 'UI 검토',
          location: '디자인실',
        },
        {
          title: '개발 세미나',
          startTime: '14:00',
          endTime: '15:00',
          description: '신기술 공유',
          location: '강당',
        },
        {
          title: '점심 식사',
          startTime: '16:00',
          endTime: '17:00',
          description: '팀 회식',
          location: '식당',
        },
      ];

      for (const event of events) {
        await page.fill('#title', event.title);
        await page.fill('#date', todayStr);
        await page.fill('#start-time', event.startTime);
        await page.fill('#end-time', event.endTime);
        await page.fill('#description', event.description);
        await page.fill('#location', event.location);
        page.click('[data-testid="event-submit-button"]');
        await page.waitForResponse(
          (response) => response.url().includes('/api/events') && response.status() === 201
        );
        await page.waitForTimeout(500);
      }

      // When: '개발'로 검색
      await page.fill('#search', '개발');

      // Then: '개발'이 포함된 일정만 표시
      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('개발팀 회의')).toBeVisible();
      await expect(eventList.getByText('개발 세미나')).toBeVisible();
      await expect(eventList.getByText('디자인 리뷰')).not.toBeVisible();
      await expect(eventList.getByText('점심 식사')).not.toBeVisible();
    });

    test('제목, 설명, 위치 중 하나라도 매칭되면 검색된다', async ({ page }) => {
      // Given: 일정 생성
      await page.fill('#title', '일반 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '10:00');
      await page.fill('#end-time', '11:00');
      await page.fill('#description', '중요한 안건 논의');
      await page.fill('#location', '본사');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      const eventList = page.locator('[data-testid="event-list"]');

      // When: 제목에만 있는 단어 검색
      await page.fill('#search', '일반');
      await expect(eventList.getByText('일반 회의')).toBeVisible();

      // When: 설명에만 있는 단어 검색
      await page.fill('#search', '중요한');
      await expect(eventList.getByText('일반 회의')).toBeVisible();

      // When: 위치에만 있는 단어 검색
      await page.fill('#search', '본사');
      await expect(eventList.getByText('일반 회의')).toBeVisible();
    });
  });

  test.describe('검색어 관리', () => {
    test('검색어를 입력하다가 지우면 다시 모든 일정이 표시된다', async ({ page }) => {
      // Given: 여러 일정 생성
      await page.fill('#title', '아침 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '09:00');
      await page.fill('#end-time', '10:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForTimeout(500);

      await page.fill('#title', '점심 약속');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '12:00');
      await page.fill('#end-time', '13:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      const eventList = page.locator('[data-testid="event-list"]');

      // When: 검색어 입력
      await page.fill('#search', '아침');
      await expect(eventList.getByText('아침 회의')).toBeVisible();
      await expect(eventList.getByText('점심 약속')).not.toBeVisible();

      // When: 검색어 지우기
      await page.fill('#search', '');

      // Then: 모든 일정이 다시 표시됨
      await expect(eventList.getByText('아침 회의')).toBeVisible();
      await expect(eventList.getByText('점심 약속')).toBeVisible();
    });

    test('검색어를 변경하면 즉시 결과가 업데이트된다', async ({ page }) => {
      // Given: 여러 일정 생성
      const events = [
        { title: '개발 회의', time: '09:00-10:00' },
        { title: '디자인 회의', time: '11:00-12:00' },
        { title: '마케팅 회의', time: '14:00-15:00' },
      ];

      for (const event of events) {
        const [startTime, endTime] = event.time.split('-');
        await page.fill('#title', event.title);
        await page.fill('#date', todayStr);
        await page.fill('#start-time', startTime);
        await page.fill('#end-time', endTime);
        page.click('[data-testid="event-submit-button"]');
        await page.waitForResponse(
          (response) => response.url().includes('/api/events') && response.status() === 201
        );
        await page.waitForTimeout(500);
      }

      const eventList = page.locator('[data-testid="event-list"]');

      // When: '개발'로 검색
      await page.fill('#search', '개발');
      await expect(eventList.getByText('개발 회의')).toBeVisible();
      await expect(eventList.getByText('디자인 회의')).not.toBeVisible();

      // When: '디자인'으로 변경
      await page.fill('#search', '디자인');
      await expect(eventList.getByText('개발 회의')).not.toBeVisible();
      await expect(eventList.getByText('디자인 회의')).toBeVisible();

      // When: '회의'로 변경
      await page.fill('#search', '회의');
      await expect(eventList.getByText('개발 회의')).toBeVisible();
      await expect(eventList.getByText('디자인 회의')).toBeVisible();
      await expect(eventList.getByText('마케팅 회의')).toBeVisible();
    });
  });

  test.describe('뷰 전환과 검색', () => {
    test('주간 뷰에서 월간 뷰로 전환해도 검색어가 유지된다', async ({ page }) => {
      // Given: 일정 생성
      await page.fill('#title', '주간 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '10:00');
      await page.fill('#end-time', '11:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // 검색어 입력
      await page.fill('#search', '주간');
      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('주간 회의')).toBeVisible();

      // When: 주간 뷰로 전환
      await page.click('[aria-label="뷰 타입 선택"]');
      await page.click('[aria-label="week-option"]');
      await page.waitForTimeout(500);

      // Then: 검색어와 결과가 유지됨
      const searchInput = page.locator('#search');
      await expect(searchInput).toHaveValue('주간');
      await expect(eventList.getByText('주간 회의')).toBeVisible();
    });
  });

  test.describe('반복 일정 검색', () => {
    test('반복 일정도 검색할 수 있다', async ({ page }) => {
      // Given: 반복 일정과 일반 일정 생성
      await page.fill('#title', '매일 스탠드업');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '09:00');
      await page.fill('#end-time', '09:30');
      await page.check('#is-repeating');
      await page.click('#repeat-type');
      await page.click('[aria-label="daily-option"]');
      await page.fill('#repeat-interval', '1');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForTimeout(500);

      await page.fill('#title', '일반 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '14:00');
      await page.fill('#end-time', '15:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 반복 일정 검색
      await page.fill('#search', '스탠드업');

      // Then: 반복 일정만 표시됨
      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('매일 스탠드업').first()).toBeVisible();
      await expect(eventList.getByText('일반 회의')).not.toBeVisible();
    });
  });

  test.describe('실시간 검색', () => {
    test('검색 중에 새 일정을 추가하면 검색 조건에 맞으면 표시된다', async ({ page }) => {
      // Given: 초기 일정 생성 및 검색
      await page.fill('#title', '아침 미팅');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '09:00');
      await page.fill('#end-time', '10:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      await page.fill('#search', '미팅');
      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('아침 미팅')).toBeVisible();

      // When: 검색어와 매칭되는 새 일정 추가
      await page.fill('#title', '오후 미팅');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '14:00');
      await page.fill('#end-time', '15:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForTimeout(1000);

      // Then: 새 일정도 검색 결과에 포함됨
      await expect(eventList.getByText('아침 미팅')).toBeVisible();
      await expect(eventList.getByText('오후 미팅')).toBeVisible();
    });
  });
});
