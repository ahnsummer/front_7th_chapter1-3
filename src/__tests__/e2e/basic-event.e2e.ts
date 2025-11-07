import { expect, test } from '@playwright/test';

/**
 * 기본 일정 관리 워크플로우 E2E 테스트
 * - 일정 생성 (Create)
 * - 일정 조회 (Read)
 * - 일정 수정 (Update)
 * - 일정 삭제 (Delete)
 */

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

test.describe('기본 일정 관리', () => {
  test.beforeEach(async ({ page }) => {
    const fs = await import('fs');
    const path = await import('path');
    const dbPath = path.join(process.cwd(), 'src/__mocks__/response/e2e.json');
    fs.writeFileSync(dbPath, JSON.stringify({ events: [] }));

    await page.goto('/');
    // 페이지 로드 대기
    await page.waitForSelector('[data-testid="event-submit-button"]', { timeout: 15000 });
  });

  test('일정 생성 - 폼에 정보를 입력하고 저장하면 일정 목록에 표시된다', async ({ page }) => {
    // Given: 일정 폼에 정보 입력
    await page.fill('#title', '팀 회의');
    await page.fill('#date', todayStr);
    await page.fill('#start-time', '10:00');
    await page.fill('#end-time', '11:00');

    page.click('[data-testid="event-submit-button"]');

    // When: 일정 추가 버튼 클릭
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/events') && response.status() === 201,
      { timeout: 10000 }
    );

    // API 응답 대기
    await responsePromise;

    // UI 업데이트 대기
    await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

    // Then: 일정 목록에 표시
    const eventList = page.locator('[data-testid="event-list"]');
    await expect(eventList.getByText('팀 회의', { exact: false })).toBeVisible({ timeout: 5000 });
  });

  test('일정 수정 - 생성된 일정을 클릭하고 수정하면 변경사항이 반영된다', async ({ page }) => {
    // Given: 일정 생성
    await page.fill('#title', '헬스장 운동');
    await page.fill('#date', todayStr);
    await page.fill('#start-time', '18:00');
    await page.fill('#end-time', '19:00');
    page.click('[data-testid="event-submit-button"]');

    await page.waitForResponse(
      (response) => response.url().includes('/api/events') && response.status() === 201
    );

    // 생성된 일정의 수정 버튼 클릭
    const editButton = page.locator('[data-testid="event-list"]').getByLabel('Edit event');
    await editButton.first().click();

    // When: 일정 정보 수정
    await page.fill('#title', '운동');
    await page.fill('#location', '헬스장');
    page.click('[data-testid="event-submit-button"]');

    // API 응답 대기
    await page.waitForResponse((response) => response.url().includes('/api/events/'));

    await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

    // Then: 수정된 정보 확인
    await expect(page.getByTestId('month-view').getByRole('button', { name: '운동' })).toBeVisible({
      timeout: 5000,
    });
  });

  test('일정 삭제 - 삭제 버튼을 클릭하면 일정이 목록에서 사라진다', async ({ page }) => {
    // Given: 일정 생성
    await page.fill('#title', '일정');
    await page.fill('#date', todayStr);
    await page.fill('#start-time', '14:00');
    await page.fill('#end-time', '15:00');
    page.click('[data-testid="event-submit-button"]');
    await page.waitForResponse(
      (response) => response.url().includes('/api/events') && response.status() === 201
    );

    await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

    // 일정이 생성되었는지 확인
    await expect(
      page.getByTestId('month-view').getByRole('button', { name: '일정' })
    ).toBeVisible();

    // When: 삭제 버튼 클릭
    const deleteButton = page.locator('[data-testid="event-list"]').getByLabel('Delete event');
    deleteButton.first().click();

    // API 응답 대기
    await page.waitForResponse((response) => response.url().includes('/api/events/'));

    // Then: 일정이 목록에서 사라짐
    await expect(
      page.getByTestId('month-view').getByRole('button', { name: '일정' })
    ).not.toBeVisible();
  });

  test('일정 조회 - 여러 일정을 생성하면 모두 목록에 표시된다', async ({ page }) => {
    // Given: 3개의 일정 생성
    const events = [
      { title: '아침 회의', startTime: '09:00', endTime: '10:00' },
      { title: '점심 약속', startTime: '12:00', endTime: '13:00' },
      { title: '저녁 모임', startTime: '18:00', endTime: '19:00' },
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
      await page.waitForTimeout(500); // 연속 클릭 방지
    }

    // Then: 모든 일정이 목록에 표시됨
    for (const event of events) {
      await expect(
        page.getByTestId('month-view').getByRole('button', { name: event.title })
      ).toBeVisible();
    }
  });
});
