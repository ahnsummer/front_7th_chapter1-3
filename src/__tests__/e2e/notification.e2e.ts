import { expect, test } from '@playwright/test';

/**
 * 알림 시스템 E2E 테스트
 * - 설정된 알림 시간에 도달하면 알림 표시
 * - 알림 시간 전에는 알림 미표시
 * - 알림 시간이 0이면 알림 미표시
 * - 중복 알림 방지 (같은 일정에 대해 한 번만 알림)
 * - 여러 일정의 알림 동시 표시
 * - 알림 닫기 기능
 * - 과거 일정은 알림 미표시
 */

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

// 현재 시간 기준으로 N분 후 시간 문자열 반환 (HH:MM)
function getTimeAfterMinutes(minutes: number): string {
  const time = new Date(Date.now() + minutes * 60 * 1000);
  const hours = String(time.getHours()).padStart(2, '0');
  const mins = String(time.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

// 현재 시간 기준으로 N분 전 시간 문자열 반환 (HH:MM)
function getTimeBeforeMinutes(minutes: number): string {
  const time = new Date(Date.now() - minutes * 60 * 1000);
  const hours = String(time.getHours()).padStart(2, '0');
  const mins = String(time.getMinutes()).padStart(2, '0');
  return `${hours}:${mins}`;
}

test.describe('알림 시스템', () => {
  test.beforeEach(async ({ page }) => {
    const fs = await import('fs');
    const path = await import('path');
    const dbPath = path.join(process.cwd(), 'src/__mocks__/response/e2e.json');
    fs.writeFileSync(dbPath, JSON.stringify({ events: [] }));

    await page.goto('/');
    await page.waitForSelector('[data-testid="event-submit-button"]', { timeout: 15000 });
  });

  test.describe('알림 표시 조건', () => {
    test('알림 시간이 설정된 일정의 시작 시간이 가까워지면 알림이 표시된다', async ({ page }) => {
      // Given: 2분 후 시작하는 일정 생성 (알림 시간 5분)
      const startTime = getTimeAfterMinutes(2);
      const endTime = getTimeAfterMinutes(3);

      await page.fill('#title', '곧 시작할 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', startTime);
      await page.fill('#end-time', endTime);
      await page.click('#notification');
      await page.click('[aria-label="10 minutes"]');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 알림이 표시될 때까지 대기 (최대 3초)
      await page.waitForTimeout(3000);

      // Then: 알림이 화면에 표시됨
      const notification = page.locator('[role="alert"]').filter({ hasText: '곧 시작할 회의' });
      await expect(notification).toBeVisible({ timeout: 5000 });
      await expect(notification).toContainText('10분 후');
      await expect(notification).toContainText('일정이 시작됩니다');
    });

    test('알림 시간보다 이전에는 알림이 표시되지 않는다', async ({ page }) => {
      // Given: 20분 후 시작하는 일정 생성 (알림 시간 10분)
      const startTime = getTimeAfterMinutes(20);
      const endTime = getTimeAfterMinutes(21);

      await page.fill('#title', '나중에 시작할 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', startTime);
      await page.fill('#end-time', endTime);
      await page.click('#notification');
      await page.click('[aria-label="10 minutes"]');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 잠시 대기
      await page.waitForTimeout(3000);

      // Then: 알림이 표시되지 않음
      const notification = page.locator('[role="alert"]').filter({ hasText: '나중에 시작할 회의' });
      await expect(notification).not.toBeVisible();
    });

    test('과거 일정은 알림이 표시되지 않는다', async ({ page }) => {
      // Given: 과거 일정 생성 (10분 전)
      const startTime = getTimeBeforeMinutes(10);
      const endTime = getTimeBeforeMinutes(9);

      await page.fill('#title', '과거 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', startTime);
      await page.fill('#end-time', endTime);
      await page.click('#notification');
      await page.click('[aria-label="10 minutes"]');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 잠시 대기
      await page.waitForTimeout(3000);

      // Then: 알림이 표시되지 않음
      const notification = page.locator('[role="alert"]').filter({ hasText: '과거 회의' });
      await expect(notification).not.toBeVisible();
    });
  });

  test.describe('알림 중복 방지', () => {
    test('같은 일정에 대해 알림은 한 번만 표시된다', async ({ page }) => {
      // Given: 2분 후 시작하는 일정 생성 (알림 시간 5분)
      const startTime = getTimeAfterMinutes(2);
      const endTime = getTimeAfterMinutes(3);

      await page.fill('#title', '중복 테스트 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', startTime);
      await page.fill('#end-time', endTime);
      await page.click('#notification');
      await page.click('[aria-label="10 minutes"]');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 알림이 표시될 때까지 대기
      await page.waitForTimeout(3000);
      const notification = page.locator('[role="alert"]').filter({ hasText: '중복 테스트 회의' });
      await expect(notification).toBeVisible({ timeout: 5000 });

      // 첫 번째 알림 개수 확인
      const firstCount = await notification.count();

      // 추가로 대기
      await page.waitForTimeout(3000);

      // Then: 알림 개수가 증가하지 않음 (중복 생성 안됨)
      const secondCount = await notification.count();
      expect(secondCount).toBe(firstCount);
    });
  });

  test.describe('여러 일정의 알림', () => {
    test('여러 일정의 알림 시간이 겹치면 모두 표시된다', async ({ page }) => {
      // Given: 여러 일정 생성 (모두 2-3분 후, 알림 시간 5분)
      const events = [
        { title: '회의 A', startTime: getTimeAfterMinutes(1), endTime: getTimeAfterMinutes(2) },
        { title: '회의 B', startTime: getTimeAfterMinutes(2), endTime: getTimeAfterMinutes(3) },
        { title: '회의 C', startTime: getTimeAfterMinutes(3), endTime: getTimeAfterMinutes(4) },
      ];

      for (const event of events) {
        await page.fill('#title', event.title);
        await page.fill('#date', todayStr);
        await page.fill('#start-time', event.startTime);
        await page.fill('#end-time', event.endTime);
        await page.click('#notification');
        await page.click('[aria-label="10 minutes"]');
        await page.click('[data-testid="event-submit-button"]');
        await page.waitForResponse(
          (response) => response.url().includes('/api/events') && response.status() === 201
        );
        await page.waitForTimeout(500);
      }

      // When: 알림이 표시될 때까지 대기
      await page.waitForTimeout(3000);

      // Then: 모든 알림이 표시됨
      for (const event of events) {
        const notification = page.locator('[role="alert"]').filter({ hasText: event.title });
        await expect(notification).toBeVisible({ timeout: 5000 });
      }
    });

    test('각 일정마다 다른 알림 시간을 설정할 수 있다', async ({ page }) => {
      // Given: 서로 다른 알림 시간을 가진 일정 생성
      await page.fill('#title', '1분 전 알림');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', getTimeAfterMinutes(1));
      await page.fill('#end-time', getTimeAfterMinutes(2));
      await page.click('#notification');
      await page.click('[aria-label="1 minutes"]');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForTimeout(500);

      await page.fill('#title', '10분 전 알림');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', getTimeAfterMinutes(4));
      await page.fill('#end-time', getTimeAfterMinutes(6));
      await page.click('#notification');
      await page.click('[aria-label="10 minutes"]');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 알림 대기
      await page.waitForTimeout(3000);

      const notification1 = page.locator('[role="alert"]').filter({ hasText: '1분 전 알림' });
      await expect(notification1).toBeVisible({ timeout: 5000 });

      const notification10 = page.locator('[role="alert"]').filter({ hasText: '10분 전 알림' });
      await expect(notification10).toBeVisible();
    });
  });

  test.describe('알림 닫기', () => {
    test('알림의 닫기 버튼을 클릭하면 알림이 사라진다', async ({ page }) => {
      // Given: 알림이 표시되는 일정 생성
      const startTime = getTimeAfterMinutes(2);
      const endTime = getTimeAfterMinutes(3);

      await page.fill('#title', '닫을 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', startTime);
      await page.fill('#end-time', endTime);
      await page.click('#notification');
      await page.click('[aria-label="10 minutes"]');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // 알림 표시 대기
      await page.waitForTimeout(3000);
      const notification = page.locator('[role="alert"]').filter({ hasText: '닫을 회의' });
      await expect(notification).toBeVisible({ timeout: 5000 });

      // When: 닫기 버튼 클릭
      const closeButton = notification.getByRole('button', { name: 'Close notification' });
      await closeButton.click();

      // Then: 알림이 사라짐
      await expect(notification).not.toBeVisible();
    });

    test('여러 알림 중 하나만 닫으면 나머지는 유지된다', async ({ page }) => {
      // Given: 여러 알림 표시
      const events = [
        {
          title: '유지될 회의',
          startTime: getTimeAfterMinutes(2),
          endTime: getTimeAfterMinutes(3),
        },
        {
          title: '닫힐 회의',
          startTime: getTimeAfterMinutes(4),
          endTime: getTimeAfterMinutes(5),
        },
      ];

      for (const event of events) {
        await page.fill('#title', event.title);
        await page.fill('#date', todayStr);
        await page.fill('#start-time', event.startTime);
        await page.fill('#end-time', event.endTime);
        await page.click('#notification');
        await page.click('[aria-label="10 minutes"]');
        await page.click('[data-testid="event-submit-button"]');
        await page.waitForResponse(
          (response) => response.url().includes('/api/events') && response.status() === 201
        );
        await page.waitForTimeout(500);
      }

      // 알림 표시 대기
      await page.waitForTimeout(3000);

      const notification1 = page.locator('[role="alert"]').filter({ hasText: '유지될 회의' });
      const notification2 = page.locator('[role="alert"]').filter({ hasText: '닫힐 회의' });
      await expect(notification1).toBeVisible({ timeout: 5000 });
      await expect(notification2).toBeVisible({ timeout: 5000 });

      // When: 두 번째 알림만 닫기
      const closeButton2 = notification2.getByRole('button', { name: 'Close notification' });
      await closeButton2.click();

      // Then: 첫 번째 알림은 유지, 두 번째는 사라짐
      await expect(notification1).toBeVisible();
      await expect(notification2).not.toBeVisible();
    });
  });

  test.describe('알림 메시지 형식', () => {
    test('알림 메시지에 일정 제목과 시작 시간이 포함된다', async ({ page }) => {
      // Given: 알림이 표시되는 일정 생성
      const startTime = getTimeAfterMinutes(2);
      const endTime = getTimeAfterMinutes(3);

      await page.fill('#title', '중요한 발표');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', startTime);
      await page.fill('#end-time', endTime);
      await page.click('#notification');
      await page.click('[aria-label="10 minutes"]');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 알림 표시 대기
      await page.waitForTimeout(3000);

      // Then: 올바른 형식의 메시지 표시
      const notification = page.locator('[role="alert"]').filter({ hasText: '중요한 발표' });
      await expect(notification).toBeVisible({ timeout: 5000 });
      await expect(notification).toContainText('중요한 발표');
      await expect(notification).toContainText('10분 후');
      await expect(notification).toContainText('일정이 시작됩니다');
    });
  });

  test.describe('반복 일정 알림', () => {
    test('반복 일정의 각 인스턴스는 개별적으로 알림이 표시된다', async ({ page }) => {
      // Given: 오늘과 내일 반복되는 일정 생성 (오늘 일정이 2분 후 시작)
      const startTime = getTimeAfterMinutes(2);
      const endTime = getTimeAfterMinutes(3);

      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const endDateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

      await page.fill('#title', '반복 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', startTime);
      await page.fill('#end-time', endTime);
      await page.click('#notification');
      await page.click('[aria-label="10 minutes"]');
      await page.check('#is-repeating');
      await page.click('#repeat-type');
      await page.click('[aria-label="daily-option"]');
      await page.fill('#repeat-interval', '1');
      await page.fill('#repeat-end-date', endDateStr);
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 알림 표시 대기 (오늘 일정에 대한 알림)
      await page.waitForTimeout(3000);

      // Then: 오늘 일정에 대한 알림만 표시됨
      const notifications = page.locator('[role="alert"]').filter({ hasText: '반복 회의' });
      await expect(notifications.first()).toBeVisible({ timeout: 5000 });

      // 알림은 오늘 일정 하나에 대해서만 표시 (내일 것은 아직 안 나옴)
      const count = await notifications.count();
      expect(count).toBe(1);
    });
  });
});
