import { Box } from '@mui/material';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { EventItem } from '../../components/EventItem';
import { Event } from '../../types';

const meta = {
  title: 'Components/EventItem',
  component: EventItem,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Box sx={{ width: 200, p: 2, backgroundColor: '#fff' }}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof EventItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock Event 데이터
const normalEvent: Event = {
  id: '1',
  title: '팀 회의',
  date: '2024-11-06',
  startTime: '10:00',
  endTime: '11:00',
  description: '주간 팀 미팅',
  location: '회의실 A',
  category: '업무',
  repeat: { type: 'none', interval: 0 },
  notificationTime: 10,
};

const shortTitleEvent: Event = {
  ...normalEvent,
  id: '2',
  title: '점심',
};

const longTitleEvent: Event = {
  ...normalEvent,
  id: '3',
  title: '주간 보고서 작성 및 제출 그리고 검토 회의 참석 - 매우 긴 제목의 일정입니다',
};

const dailyRepeatEvent: Event = {
  ...normalEvent,
  id: '4',
  title: '아침 운동',
  repeat: { type: 'daily', interval: 1 },
};

const weeklyRepeatEvent: Event = {
  ...normalEvent,
  id: '5',
  title: '주간 회의',
  repeat: { type: 'weekly', interval: 1, endDate: '2024-12-31' },
};

const monthlyRepeatEvent: Event = {
  ...normalEvent,
  id: '6',
  title: '월간 보고',
  repeat: { type: 'monthly', interval: 1 },
};

const yearlyRepeatEvent: Event = {
  ...normalEvent,
  id: '7',
  title: '생일 파티',
  repeat: { type: 'yearly', interval: 1 },
};

const customIntervalEvent: Event = {
  ...normalEvent,
  id: '8',
  title: '격주 미팅',
  repeat: { type: 'weekly', interval: 2 },
};

// Stories

/**
 * 기본 일정 - 일반 상태 (회색 배경)
 */
export const Normal: Story = {
  args: {
    event: normalEvent,
    isNotified: false,
  },
};

/**
 * 알림이 울린 일정 (빨간색 배경 + 벨 아이콘)
 */
export const Notified: Story = {
  args: {
    event: normalEvent,
    isNotified: true,
  },
};

/**
 * 반복 일정 - 매일 (반복 아이콘)
 */
export const DailyRepeat: Story = {
  args: {
    event: dailyRepeatEvent,
    isNotified: false,
  },
};

/**
 * 반복 일정 - 매주
 */
export const WeeklyRepeat: Story = {
  args: {
    event: weeklyRepeatEvent,
    isNotified: false,
  },
};

/**
 * 반복 일정 - 매월
 */
export const MonthlyRepeat: Story = {
  args: {
    event: monthlyRepeatEvent,
    isNotified: false,
  },
};

/**
 * 반복 일정 - 매년
 */
export const YearlyRepeat: Story = {
  args: {
    event: yearlyRepeatEvent,
    isNotified: false,
  },
};

/**
 * 커스텀 간격 반복 일정 (2주마다)
 */
export const CustomIntervalRepeat: Story = {
  args: {
    event: customIntervalEvent,
    isNotified: false,
  },
};

/**
 * 알림 + 반복 일정 (둘 다)
 */
export const NotifiedAndRepeating: Story = {
  args: {
    event: dailyRepeatEvent,
    isNotified: true,
  },
};

/**
 * 짧은 제목
 */
export const ShortTitle: Story = {
  args: {
    event: shortTitleEvent,
    isNotified: false,
  },
};

/**
 * 긴 제목 (말줄임표 처리)
 */
export const LongTitle: Story = {
  args: {
    event: longTitleEvent,
    isNotified: false,
  },
};

/**
 * 긴 제목 + 알림
 */
export const LongTitleWithNotification: Story = {
  args: {
    event: longTitleEvent,
    isNotified: true,
  },
};

/**
 * 긴 제목 + 반복
 */
export const LongTitleWithRepeat: Story = {
  args: {
    event: { ...longTitleEvent, repeat: { type: 'weekly', interval: 1 } },
    isNotified: false,
  },
};

/**
 * 모든 요소 결합 (긴 제목 + 알림 + 반복)
 */
export const AllCombined: Story = {
  args: {
    event: { ...longTitleEvent, repeat: { type: 'daily', interval: 1 } },
    isNotified: true,
  },
};

/**
 * 드래그 중 상태 (투명도 0.5)
 */
export const Dragging: Story = {
  args: {
    event: normalEvent,
    isNotified: false,
    isDragging: true,
  },
};

/**
 * 드래그 중 + 알림
 */
export const DraggingWithNotification: Story = {
  args: {
    event: normalEvent,
    isNotified: true,
    isDragging: true,
  },
};

/**
 * 여러 상태를 한 번에 비교
 */
export const Comparison: Story = {
  args: {
    event: normalEvent,
    isNotified: false,
    isDragging: false,
  },
  render: () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: 250 }}>
      <EventItem event={normalEvent} />
      <EventItem event={normalEvent} isNotified />
      <EventItem event={dailyRepeatEvent} />
      <EventItem event={dailyRepeatEvent} isNotified />
      <EventItem event={longTitleEvent} />
    </Box>
  ),
};
