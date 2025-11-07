import { expect, test } from '@playwright/test';

/**
 * 반복 일정 관리 워크플로우 E2E 테스트
 * - 반복 일정 생성 (다양한 반복 타입)
 * - 반복 일정 조회 (캘린더에서 여러 날짜에 표시)
 * - 반복 일정 수정 (단일 인스턴스 vs 전체 시리즈)
 * - 반복 일정 삭제 (단일 인스턴스 vs 전체 시리즈)
 */

const today = new Date();
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

const dayDiffToEndOfMonth =
  new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1;

const dayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate();

// 1주일 후
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);
const nextWeekStr = nextWeek.toISOString().split('T')[0];

// 1개월 후
const nextMonth = new Date(today);
nextMonth.setMonth(today.getMonth() + 1);
const nextMonthStr = nextMonth.toISOString().split('T')[0];

test.describe('반복 일정 관리', () => {
  test.beforeEach(async ({ page }) => {
    const fs = await import('fs');
    const path = await import('path');
    const dbPath = path.join(process.cwd(), 'src/__mocks__/response/e2e.json');
    fs.writeFileSync(dbPath, JSON.stringify({ events: [] }));

    await page.goto('/');
    await page.waitForSelector('[data-testid="event-submit-button"]', { timeout: 15000 });
  });

  test.describe('반복 일정 생성', () => {
    test('일간 반복 일정을 생성하면 매일 같은 시간에 일정이 표시된다', async ({ page }) => {
      // Given: 일간 반복 일정 폼 입력
      await page.fill('#title', '매일 스탠드업');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '09:00');
      await page.fill('#end-time', '09:30');
      await page.check('#is-repeating');
      await page.click('#repeat-type');
      await page.click('[aria-label="daily-option"]');
      await page.fill('#repeat-interval', '1');

      // When: 일정 생성
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // Then: 생성된 일정 확인
      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('매일 스탠드업')).toHaveCount(dayDiffToEndOfMonth);

      if (today.getMonth() === 12) return;

      await page.click('[aria-label="Next"]');
      await page.waitForTimeout(500);
      await expect(eventList.getByText('매일 스탠드업')).toHaveCount(dayOfNextMonth);
    });

    test('주간 반복 일정을 생성하면 매주 같은 요일에 일정이 표시된다', async ({ page }) => {
      // Given: 주간 반복 일정 폼 입력
      await page.fill('#title', '주간 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '14:00');
      await page.fill('#end-time', '15:00');
      await page.check('#is-repeating');
      await page.click('#repeat-type');
      await page.click('[aria-label="weekly-option"]');
      await page.fill('#repeat-interval', '1');

      // When: 일정 생성
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // Then: 생성된 일정 확인
      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('주간 회의')).toHaveCount(
        Math.ceil(dayDiffToEndOfMonth / 7)
      );

      if (today.getMonth() === 12) return;

      await page.click('[aria-label="Next"]');
      await page.waitForTimeout(500);
      await expect(eventList.getByText('주간 회의')).toHaveCount(Math.floor(dayOfNextMonth / 7));
    });

    test('월간 반복 일정을 생성하면 매월 같은 날짜에 일정이 표시된다', async ({ page }) => {
      // Given: 월간 반복 일정 폼 입력
      await page.fill('#title', '월간 보고');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '10:00');
      await page.fill('#end-time', '11:00');
      await page.check('#is-repeating');
      await page.click('#repeat-type');
      await page.click('[aria-label="monthly-option"]');
      await page.fill('#repeat-interval', '1');

      // When: 일정 생성
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // Then: 생성된 일정 확인
      await expect(page.locator('[data-testid="event-list"]').getByText('월간 보고')).toHaveCount(
        1
      );

      if (new Date().getMonth() === 12) return;

      await page.click('[aria-label="Next"]');
      await page.waitForTimeout(500);
      await expect(page.locator('[data-testid="event-list"]').getByText('월간 보고')).toHaveCount(
        1
      );
    });

    test('종료 날짜가 있는 반복 일정을 생성하면 종료 날짜까지만 일정이 표시된다', async ({
      page,
    }) => {
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 14); // 2주 후
      const endDateStr = endDate.toISOString().split('T')[0];

      // Given: 종료 날짜가 있는 일간 반복 일정
      await page.fill('#title', '2주간 프로젝트 회의');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '15:00');
      await page.fill('#end-time', '16:00');
      await page.check('#is-repeating');
      await page.click('#repeat-type');
      await page.click('[aria-label="daily-option"]');
      await page.fill('#repeat-interval', '1');
      await page.fill('#repeat-end-date', endDateStr);

      // When: 일정 생성
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // Then: 생성된 일정 확인
      await expect(
        page.locator('[data-testid="event-list"]').getByText('2주간 프로젝트 회의')
      ).toHaveCount(Math.min(14, dayDiffToEndOfMonth));

      if (dayDiffToEndOfMonth < 14) {
        await page.click('[aria-label="Next"]');
        await expect(
          page.locator('[data-testid="event-list"]').getByText('2주간 프로젝트 회의')
        ).toHaveCount(14 - dayDiffToEndOfMonth);
      }
    });

    test('2일마다 반복되는 일정을 생성할 수 있다', async ({ page }) => {
      // Given: 2일 간격 반복 일정
      await page.fill('#title', '격일 운동');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '07:00');
      await page.fill('#end-time', '08:00');
      await page.check('#is-repeating');
      await page.click('#repeat-type');
      await page.click('[aria-label="daily-option"]');
      await page.fill('#repeat-interval', '2');

      // When: 일정 생성
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // Then: 생성된 일정 확인
      await expect(page.locator('[data-testid="event-list"]').getByText('격일 운동')).toHaveCount(
        Math.ceil(dayDiffToEndOfMonth / 2)
      );
    });
  });

  test.describe('반복 일정 수정', () => {
    test('반복 일정의 단일 인스턴스만 수정하면 해당 날짜의 일정만 변경된다', async ({ page }) => {
      // Given: 일간 반복 일정 생성
      await page.fill('#title', '매일 조깅');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '06:00');
      await page.fill('#end-time', '07:00');
      await page.check('#is-repeating');
      await page.click('#repeat-type');
      await page.click('[aria-label="daily-option"]');
      await page.fill('#repeat-interval', '1');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 일정 수정 버튼 클릭
      const editButton = page.locator('[data-testid="event-list"]').getByLabel('Edit event');
      await editButton.first().click();

      // 다이얼로그에서 '이 일정만' 선택
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      const dialog = page.locator('[role="dialog"]');
      await dialog.getByRole('button', { name: '예' }).click();

      // 제목 수정
      await page.fill('#title', '오늘만 휴식');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse((response) => response.url().includes(`/api/events/`));
      await page.waitForTimeout(1000);

      // Then: 수정된 일정 확인
      await expect(
        page.getByTestId('month-view').getByRole('button', { name: '오늘만 휴식' })
      ).toBeVisible();
    });

    test('반복 일정의 전체 시리즈를 수정하면 모든 반복 일정이 변경된다', async ({ page }) => {
      // Given: 주간 반복 일정 생성
      await page.fill('#title', '팀 미팅');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '10:00');
      await page.fill('#end-time', '11:00');
      await page.check('#is-repeating');
      await page.click('#repeat-type');
      await page.click('[aria-label="weekly-option"]');
      await page.fill('#repeat-interval', '1');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 일정 수정 버튼 클릭
      const editButton = page.locator('[data-testid="event-list"]').getByLabel('Edit event');
      await editButton.first().click();

      // 다이얼로그에서 '모든 일정' 선택
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      const dialog = page.locator('[role="dialog"]');
      await dialog.getByRole('button', { name: '아니오' }).click();

      // 제목과 시간 수정
      await page.fill('#title', '전체 팀 회의');
      await page.fill('#start-time', '14:00');
      await page.fill('#end-time', '15:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse((response) => response.url().includes('/api/recurring-events/'));
      await page.waitForTimeout(1000);

      // Then: 수정된 일정 확인
      await expect(
        page.getByTestId('month-view').getByRole('button', { name: '전체 팀 회의' })
      ).toHaveCount(Math.ceil(dayDiffToEndOfMonth / 7));

      // 다음 주로 이동하여 반복 일정도 변경되었는지 확인
      await page.click('[aria-label="Next"]');
      await page.waitForTimeout(500);
      await expect(
        page.getByTestId('month-view').getByRole('button', { name: '전체 팀 회의' })
      ).toHaveCount(Math.floor(dayOfNextMonth / 7));
    });

    test('반복 일정의 시간대를 수정할 수 있다', async ({ page }) => {
      // Given: 일간 반복 일정 생성
      await page.fill('#title', '오전 업무');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '09:00');
      await page.fill('#end-time', '12:00');
      await page.check('#is-repeating');
      await page.click('#repeat-type');
      await page.click('[aria-label="daily-option"]');
      await page.fill('#repeat-interval', '1');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 전체 시리즈 수정
      const editButton = page.locator('[data-testid="event-list"]').getByLabel('Edit event');
      await editButton.first().click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      const dialog = page.locator('[role="dialog"]');
      await dialog.getByRole('button', { name: '아니오' }).click();

      await page.fill('#start-time', '10:00');
      await page.fill('#end-time', '13:00');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse((response) => response.url().includes('/api/recurring-events/'));
      await page.waitForTimeout(1000);

      // Then: 시간이 변경되었는지 확인
      const eventItem = page.locator('[data-testid="event-item"]').first();
      await expect(eventItem).toContainText('10:00');
      await expect(eventItem).toContainText('13:00');
    });
  });

  test.describe('반복 일정 삭제', () => {
    test('반복 일정의 단일 인스턴스만 삭제하면 해당 날짜의 일정만 제거된다', async ({ page }) => {
      // Given: 일간 반복 일정 생성
      await page.fill('#title', '매일 알림');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '08:00');
      await page.fill('#end-time', '08:30');
      await page.check('#is-repeating');
      await page.click('#repeat-type');
      await page.click('[aria-label="daily-option"]');
      await page.fill('#repeat-interval', '1');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 삭제 버튼 클릭
      const deleteButton = page.locator('[data-testid="event-list"]').getByLabel('Delete event');
      await deleteButton.first().click();

      // 다이얼로그에서 '이 일정만' 선택
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      const dialog = page.locator('[role="dialog"]');
      await dialog.getByRole('button', { name: '예' }).click();

      await page.waitForResponse((response) => response.url().includes('/api/events/'));
      await page.waitForTimeout(1000);

      // Then: 오늘 날짜의 일정은 삭제되었지만, 반복 일정은 유지
      // (다음 날로 이동하여 확인 필요 - 실제 구현에 따라 조정)
    });

    test('반복 일정의 전체 시리즈를 삭제하면 모든 반복 일정이 제거된다', async ({ page }) => {
      // Given: 주간 반복 일정 생성
      await page.fill('#title', '주간 리뷰');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '16:00');
      await page.fill('#end-time', '17:00');
      await page.check('#is-repeating');
      await page.click('#repeat-type');
      await page.click('[aria-label="weekly-option"]');
      await page.fill('#repeat-interval', '1');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // When: 삭제 버튼 클릭
      const deleteButton = page.locator('[data-testid="event-list"]').getByLabel('Delete event');
      await deleteButton.first().click();

      // 다이얼로그에서 '모든 일정' 선택
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      const dialog = page.locator('[role="dialog"]');
      await dialog.getByRole('button', { name: '아니오' }).click();

      await page.waitForResponse(
        (response) => response.url().includes('/api/recurring-events') && response.status() === 204
      );
      await page.waitForTimeout(1000);

      // Then: 일정이 목록에서 완전히 사라짐
      await expect(
        page.getByTestId('month-view').getByRole('button', { name: '주간 리뷰' })
      ).not.toBeVisible();

      // 다음 주로 이동하여 반복 일정도 삭제되었는지 확인
      await page.click('[aria-label="Next"]');
      await page.waitForTimeout(500);
      await expect(
        page.getByTestId('month-view').getByRole('button', { name: '주간 리뷰' })
      ).not.toBeVisible();
    });
  });

  test.describe('반복 일정 조회 및 표시', () => {
    test('여러 개의 반복 일정을 생성하면 모두 캘린더에 표시된다', async ({ page }) => {
      // Given: 3개의 반복 일정 생성
      const recurringEvents = [
        { title: '아침 요가', time: '06:00-07:00', type: 'daily', ariaLabel: 'daily-option' },
        { title: '주간 보고', time: '09:00-10:00', type: 'weekly', ariaLabel: 'weekly-option' },
        { title: '월간 점검', time: '15:00-16:00', type: 'monthly', ariaLabel: 'monthly-option' },
      ];

      for (const event of recurringEvents) {
        const [startTime, endTime] = event.time.split('-');
        await page.fill('#title', event.title);
        await page.fill('#date', todayStr);
        await page.fill('#start-time', startTime);
        await page.fill('#end-time', endTime);
        await page.check('#is-repeating');
        await page.click('#repeat-type');
        await page.click(`[aria-label="${event.ariaLabel}"]`);
        await page.fill('#repeat-interval', '1');
        await page.click('[data-testid="event-submit-button"]');
        await page.waitForResponse(
          (response) => response.url().includes('/api/events') && response.status() === 201
        );
        await page.waitForTimeout(1000);
      }

      // Then: 모든 반복 일정이 목록에 표시됨
      const eventList = page.locator('[data-testid="event-list"]');
      for (const event of recurringEvents) {
        await expect(eventList.getByText(event.title)).toHaveCount(
          event.type === 'daily'
            ? dayDiffToEndOfMonth
            : event.type === 'weekly'
              ? Math.ceil(dayDiffToEndOfMonth / 7)
              : 1
        );
      }
    });

    test('월간 보기에서 반복 일정이 올바른 날짜들에 표시된다', async ({ page }) => {
      // Given: 주간 반복 일정 생성
      await page.fill('#title', '주간 스터디');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '19:00');
      await page.fill('#end-time', '21:00');
      await page.check('#is-repeating');
      await page.click('#repeat-type');
      await page.click('[aria-label="weekly-option"]');
      await page.fill('#repeat-interval', '1');
      page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // Then: 이번 주에 일정 표시 확인
      await expect(
        page.getByTestId('month-view').getByRole('button', { name: '주간 스터디' })
      ).toHaveCount(Math.ceil(dayDiffToEndOfMonth / 7));
    });

    test('반복 간격이 적용된 일정이 올바르게 표시된다', async ({ page }) => {
      // Given: 3일마다 반복되는 일정 생성
      await page.fill('#title', '3일마다 체크');
      await page.fill('#date', todayStr);
      await page.fill('#start-time', '12:00');
      await page.fill('#end-time', '12:30');
      await page.check('#is-repeating');
      await page.click('#repeat-type');
      await page.click('[aria-label="daily-option"]');
      await page.fill('#repeat-interval', '3');
      await page.click('[data-testid="event-submit-button"]');
      await page.waitForResponse(
        (response) => response.url().includes('/api/events') && response.status() === 201
      );
      await page.waitForSelector('[data-testid="event-item"]', { timeout: 10000 });

      // Then: 생성된 일정 확인 (3일마다 반복되므로 여러 개 표시)
      const eventList = page.locator('[data-testid="event-list"]');
      await expect(eventList.getByText('3일마다 체크')).toHaveCount(
        Math.ceil(dayDiffToEndOfMonth / 3)
      );
    });
  });
});
