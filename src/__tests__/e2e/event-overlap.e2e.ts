import { expect, test } from '@playwright/test';

/**
 * 일정 겹침 처리 E2E 테스트
 * - 동일한 시간대 일정 생성 시 경고 표시
 * - 부분 겹침 일정 감지
 * - 겹침 경고 다이얼로그 동작 (취소/계속 진행)
 * - 일정 수정 시 겹침 처리
 * - 반복 일정 겹침 처리
 * - 여러 일정과 동시 겹침
 */

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const dayDiffToEndOfMonth =
  new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1;

test.describe('일정 겹침 처리', () => {
  test.beforeEach(async ({ page }) => {
    const fs = await import('fs');
    const path = await import('path');
    const dbPath = path.join(process.cwd(), 'src/__mocks__/response/e2e.json');
    fs.writeFileSync(dbPath, JSON.stringify({ events: [] }));

    await page.goto('/');
    await page.waitForSelector('[data-testid="event-submit-button"]', { timeout: 15000 });
  });

  test.describe('일정 생성 시 겹침 감지', () => {
    test('동일한 시간대에 일정을 생성하면 겹침 경고 다이얼로그가 표시된다', async ({ page }) => {
      // Given: 첫 번째 일정 생성
      await page.fill('#title', '회의 A');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '10:00');
      await page.fill('#end-time', '11:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 동일한 시간대에 두 번째 일정 생성 시도
      await page.fill('#title', '회의 B');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '10:00');
      await page.fill('#end-time', '11:00');
      page.click('[data-testid="event-submit-button"]');

      // Then: 겹침 경고 다이얼로그가 표시됨
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog.getByText('일정 겹침 경고')).toBeVisible();
      await expect(dialog.getByText('회의 A')).toBeVisible();
      await expect(dialog.getByText('계속 진행하시겠습니까?')).toBeVisible();
    });

    test('시작 시간이 겹치는 일정을 생성하면 경고가 표시된다', async ({ page }) => {
      // Given: 10:00-12:00 일정 생성
      await page.fill('#title', '오전 업무');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '10:00');
      await page.fill('#end-time', '12:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 11:00-13:00 일정 생성 시도 (부분 겹침)
      await page.fill('#title', '점심 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '11:00');
      await page.fill('#end-time', '13:00');
      await page.click('[data-testid="event-submit-button"]');

      // Then: 겹침 경고 다이얼로그 표시
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog.getByText('일정 겹침 경고')).toBeVisible();
      await expect(dialog.getByText('오전 업무')).toBeVisible();
    });

    test('종료 시간이 겹치는 일정을 생성하면 경고가 표시된다', async ({ page }) => {
      // Given: 13:00-15:00 일정 생성
      await page.fill('#title', '오후 미팅');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '13:00');
      await page.fill('#end-time', '15:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 12:00-14:00 일정 생성 시도 (부분 겹침)
      await page.fill('#title', '점심 식사');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '12:00');
      await page.fill('#end-time', '14:00');
      await page.click('[data-testid="event-submit-button"]');

      // Then: 겹침 경고 다이얼로그 표시
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog.getByText('일정 겹침 경고')).toBeVisible();
      await expect(dialog.getByText('오후 미팅')).toBeVisible();
    });

    test('기존 일정을 완전히 포함하는 일정을 생성하면 경고가 표시된다', async ({ page }) => {
      // Given: 14:00-15:00 일정 생성
      await page.fill('#title', '짧은 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '14:00');
      await page.fill('#end-time', '15:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 13:00-16:00 일정 생성 시도 (기존 일정 포함)
      await page.fill('#title', '긴 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '13:00');
      await page.fill('#end-time', '16:00');
      await page.click('[data-testid="event-submit-button"]');

      // Then: 겹침 경고 다이얼로그 표시
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog.getByText('일정 겹침 경고')).toBeVisible();
      await expect(dialog.getByText('짧은 회의')).toBeVisible();
    });

    test('기존 일정 안에 포함되는 일정을 생성하면 경고가 표시된다', async ({ page }) => {
      // Given: 09:00-12:00 일정 생성
      await page.fill('#title', '긴 워크샵');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '09:00');
      await page.fill('#end-time', '12:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 10:00-11:00 일정 생성 시도 (기존 일정에 포함됨)
      await page.fill('#title', '중간 휴식');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '10:00');
      await page.fill('#end-time', '11:00');
      await page.click('[data-testid="event-submit-button"]');

      // Then: 겹침 경고 다이얼로그 표시
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog.getByText('일정 겹침 경고')).toBeVisible();
      await expect(dialog.getByText('긴 워크샵')).toBeVisible();
    });
  });

  test.describe('겹침 다이얼로그 동작', () => {
    test('겹침 경고에서 취소를 선택하면 일정이 생성되지 않는다', async ({ page }) => {
      // Given: 첫 번째 일정 생성
      await page.fill('#title', '원래 일정');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '15:00');
      await page.fill('#end-time', '16:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 겹치는 일정 생성 시도 후 취소
      await page.fill('#title', '겹치는 일정');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '15:00');
      await page.fill('#end-time', '16:00');
      await page.click('[data-testid="event-submit-button"]');

      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      const dialog = page.locator('[role="dialog"]');
      await dialog.getByRole('button', { name: '취소' }).click();

      // Then: 다이얼로그가 닫히고 일정이 생성되지 않음
      await expect(dialog).not.toBeVisible();
      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('겹치는 일정')).not.toBeVisible();
      await expect(eventList.getByText('원래 일정')).toBeVisible();
    });

    test('겹침 경고에서 계속 진행을 선택하면 일정이 생성된다', async ({ page }) => {
      // Given: 첫 번째 일정 생성
      await page.fill('#title', '원래 일정');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '16:00');
      await page.fill('#end-time', '17:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 겹치는 일정 생성 시도 후 계속 진행
      await page.fill('#title', '강제 생성');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '16:00');
      await page.fill('#end-time', '17:00');
      await page.click('[data-testid="event-submit-button"]');

      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      const dialog = page.locator('[role="dialog"]');
      dialog.getByRole('button', { name: '계속 진행' }).click();

      // API 응답 대기
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );

      // Then: 두 일정 모두 생성됨
      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('원래 일정')).toBeVisible();
      await expect(eventList.getByText('강제 생성')).toBeVisible();
    });
  });

  test.describe('여러 일정과 겹침', () => {
    test('여러 일정과 겹치는 경우 모두 경고에 표시된다', async ({ page }) => {
      // Given: 3개의 연속된 일정 생성
      const events = [
        { title: '회의 1', startTime: '09:00', endTime: '10:00' },
        { title: '회의 2', startTime: '10:30', endTime: '11:30' },
        { title: '회의 3', startTime: '12:00', endTime: '13:00' },
      ];

      for (const event of events) {
        await page.fill('#title', event.title);
        await page.fill('#date', todayStr);
        await page.fill('#start-time', event.startTime);
        await page.fill('#end-time', event.endTime);
        await page.click('[data-testid="event-submit-button"]');
        await page.waitForResponse(
          (response) => response.url().includes('/api/events') && response.status() === 201
        );
        await page.waitForTimeout(500);
      }

      // When: 모든 일정과 겹치는 긴 일정 생성 시도
      await page.fill('#title', '종일 세미나');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '09:00');
      await page.fill('#end-time', '13:00');
      await page.click('[data-testid="event-submit-button"]');

      // Then: 겹치는 모든 일정이 다이얼로그에 표시됨
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog.getByText('일정 겹침 경고')).toBeVisible();

      for (const event of events) {
        await expect(dialog.getByText(event.title, { exact: false })).toBeVisible();
      }
    });
  });

  test.describe('일정 수정 시 겹침 처리', () => {
    test('일정 수정 시 다른 일정과 겹치면 경고가 표시된다', async ({ page }) => {
      // Given: 두 개의 일정 생성
      await page.fill('#title', '일정 A');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '14:00');
      await page.fill('#end-time', '15:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForTimeout(500);

      await page.fill('#title', '일정 B');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '16:00');
      await page.fill('#end-time', '17:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 일정 B의 시간을 일정 A와 겹치도록 수정
      const editButtons = page.locator('[data-testid="event-list"]').getByLabel('Edit event');
      await editButtons.last().click();

      await page.fill('#start-time', '14:30');
      await page.fill('#end-time', '15:30');
      page.click('[data-testid="event-submit-button"]');

      // Then: 겹침 경고 다이얼로그 표시
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog.getByText('일정 겹침 경고')).toBeVisible();
      await expect(dialog.getByText('일정 A')).toBeVisible();
    });

    test('일정 수정 시 자기 자신은 겹침 검사에서 제외된다', async ({ page }) => {
      // Given: 일정 생성
      await page.fill('#title', '수정할 일정');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '10:00');
      await page.fill('#end-time', '11:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 같은 일정의 제목만 수정
      const editButton = page.locator('[data-testid="event-list"]').getByLabel('Edit event');
      await editButton.first().click();

      await page.fill('#title', '수정된 일정');
      page.click('[data-testid="event-submit-button"]');

      // Then: 겹침 경고 없이 수정됨
      await page.waitForResponse((response) => response.url().includes('/api/events/'));
      await page.waitForTimeout(1000);

      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('수정된 일정')).toBeVisible();
      await expect(eventList.getByText('수정할 일정')).not.toBeVisible();

      // 다이얼로그가 표시되지 않았는지 확인
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog.getByText('일정 겹침 경고')).not.toBeVisible();
    });
  });

  test.describe('반복 일정 겹침 처리', () => {
    test('반복 일정 생성 시에는 겹침 경고가 표시되지 않는다', async ({ page }) => {
      // Given: 일반 일정 생성
      await page.fill('#title', '일반 일정');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '09:00');
      await page.fill('#end-time', '10:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 같은 시간대에 반복 일정 생성
      await page.fill('#title', '매일 반복');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '09:00');
      await page.fill('#end-time', '10:00');
      await page.check('#is-repeating');
      await page.click('#repeat-type');
      await page.click('[aria-label="daily-option"]');
      await page.fill('#repeat-interval', '1');
      page.click('[data-testid="event-submit-button"]');

      // Then: 겹침 경고 없이 생성됨
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201,
        { timeout: 10000 }
      );

      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('매일 반복')).toHaveCount(dayDiffToEndOfMonth);
      await expect(eventList.getByText('일반 일정')).toBeVisible();

      // 겹침 다이얼로그가 표시되지 않았는지 확인
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog.getByText('일정 겹침 경고')).not.toBeVisible();
    });
  });

  test.describe('다른 날짜 일정은 겹치지 않음', () => {
    test('같은 시간대라도 다른 날짜의 일정은 겹침으로 감지되지 않는다', async ({ page }) => {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

      // Given: 오늘 일정 생성
      await page.fill('#title', '오늘 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '14:00');
      await page.fill('#end-time', '15:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 내일 같은 시간대 일정 생성
      await page.fill('#title', '내일 회의');
      await page.fill('#date', tomorrowStr);
      await page.fill('#start-time', '14:00');
      await page.fill('#end-time', '15:00');
      page.click('[data-testid="event-submit-button"]');

      // Then: 겹침 경고 없이 생성됨
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201,
        { timeout: 10000 }
      );

      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('오늘 회의')).toBeVisible();

      // 겹침 다이얼로그가 표시되지 않았는지 확인
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog.getByText('일정 겹침 경고')).not.toBeVisible();
    });
  });
});
