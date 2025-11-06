import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { Calendar } from '../../components/Calendar';
import { Event } from '../../types';

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    setView: fn(),
    navigate: fn(),
    onEventDateChange: fn(),
    onCellClick: fn(),
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const baseDate = new Date(2024, 10, 6); // 2024년 11월 6일 (수요일)

const mockEvents: Event[] = [
  {
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
  },
  {
    id: '2',
    title: '점심 약속',
    date: '2024-11-07',
    startTime: '12:00',
    endTime: '13:00',
    description: '친구와 점심',
    location: '강남역',
    category: '개인',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  },
  {
    id: '3',
    title: '매일 아침 운동',
    date: '2024-11-06',
    startTime: '07:00',
    endTime: '08:00',
    description: '조깅',
    location: '공원',
    category: '개인',
    repeat: { type: 'daily', interval: 1 },
    notificationTime: 60,
  },
  {
    id: '4',
    title: '주간 보고서 작성 및 제출 - 매우 긴 제목의 일정입니다',
    date: '2024-11-08',
    startTime: '15:00',
    endTime: '17:00',
    description: '분기 보고서',
    location: '사무실',
    category: '업무',
    repeat: { type: 'weekly', interval: 1, endDate: '2024-12-31' },
    notificationTime: 1440,
  },
  {
    id: '5',
    title: '생일 파티',
    date: '2024-11-10',
    startTime: '18:00',
    endTime: '21:00',
    description: '친구 생일',
    location: '레스토랑',
    category: '가족',
    repeat: { type: 'yearly', interval: 1 },
    notificationTime: 120,
  },
];

const mockHolidays = {
  '2024-11-03': '문화의 날',
  '2024-11-11': '빼빼로데이',
};

// Stories

/**
 * 주간 뷰 - 이벤트가 없는 기본 상태
 */
export const WeekViewEmpty: Story = {
  args: {
    view: 'week',
    currentDate: baseDate,
    holidays: {},
    filteredEvents: [],
    notifiedEvents: [],
  },
};

/**
 * 주간 뷰 - 다양한 이벤트가 있는 상태
 */
export const WeekViewWithEvents: Story = {
  args: {
    view: 'week',
    currentDate: baseDate,
    holidays: mockHolidays,
    filteredEvents: mockEvents,
    notifiedEvents: [],
  },
};

/**
 * 주간 뷰 - 알림이 울린 이벤트 표시
 */
export const WeekViewWithNotifications: Story = {
  args: {
    view: 'week',
    currentDate: baseDate,
    holidays: mockHolidays,
    filteredEvents: mockEvents,
    notifiedEvents: ['1', '3'], // 팀 회의와 아침 운동에 알림
  },
};

/**
 * 월간 뷰 - 이벤트가 없는 기본 상태
 */
export const MonthViewEmpty: Story = {
  args: {
    view: 'month',
    currentDate: baseDate,
    holidays: {},
    filteredEvents: [],
    notifiedEvents: [],
  },
};

/**
 * 월간 뷰 - 다양한 이벤트가 있는 상태
 */
export const MonthViewWithEvents: Story = {
  args: {
    view: 'month',
    currentDate: baseDate,
    holidays: mockHolidays,
    filteredEvents: mockEvents,
    notifiedEvents: [],
  },
};

/**
 * 월간 뷰 - 휴일이 표시된 상태
 */
export const MonthViewWithHolidays: Story = {
  args: {
    view: 'month',
    currentDate: baseDate,
    holidays: {
      '2024-11-03': '문화의 날',
      '2024-11-11': '빼빼로데이',
      '2024-11-15': '칠오삼',
      '2024-11-23': '추수감사절',
    },
    filteredEvents: mockEvents,
    notifiedEvents: [],
  },
};

/**
 * 월간 뷰 - 알림이 울린 이벤트들
 */
export const MonthViewWithNotifications: Story = {
  args: {
    view: 'month',
    currentDate: baseDate,
    holidays: mockHolidays,
    filteredEvents: mockEvents,
    notifiedEvents: ['1', '2', '3'], // 여러 이벤트에 알림
  },
};

/**
 * 반복 일정만 표시
 */
export const WithRecurringEvents: Story = {
  args: {
    view: 'month',
    currentDate: baseDate,
    holidays: {},
    filteredEvents: mockEvents.filter((event) => event.repeat.type !== 'none'),
    notifiedEvents: [],
  },
};

/**
 * 여러 이벤트가 한 날짜에 겹친 상태
 */
export const WithMultipleEventsPerDay: Story = {
  args: {
    view: 'month',
    currentDate: baseDate,
    holidays: {},
    filteredEvents: [
      ...mockEvents,
      {
        id: '6',
        title: '저녁 약속',
        date: '2024-11-06',
        startTime: '18:00',
        endTime: '20:00',
        description: '저녁 식사',
        location: '레스토랑',
        category: '개인',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 30,
      },
      {
        id: '7',
        title: '추가 미팅',
        date: '2024-11-06',
        startTime: '14:00',
        endTime: '15:00',
        description: '고객 미팅',
        location: '회의실 B',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
    ],
    notifiedEvents: [],
  },
};

/**
 * 긴 제목 처리 테스트 (말줄임표)
 */
export const WithLongTitles: Story = {
  args: {
    view: 'week',
    currentDate: baseDate,
    holidays: {},
    filteredEvents: [
      {
        id: '1',
        title: '이것은 매우 긴 제목의 일정입니다 - 말줄임표 처리 테스트용',
        date: '2024-11-06',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '업무',
        repeat: { type: 'none', interval: 0 },
        notificationTime: 10,
      },
      {
        id: '2',
        title:
          '또 다른 매우 매우 긴 제목의 일정입니다 텍스트가 얼마나 길어질 수 있는지 테스트합니다',
        date: '2024-11-07',
        startTime: '14:00',
        endTime: '15:00',
        description: '',
        location: '',
        category: '개인',
        repeat: { type: 'weekly', interval: 1 },
        notificationTime: 30,
      },
    ],
    notifiedEvents: ['2'],
  },
};

/**
 * 이전 달 넘어가는 월간 뷰
 */
export const MonthViewStartOfMonth: Story = {
  args: {
    view: 'month',
    currentDate: new Date(2024, 10, 1), // 11월 1일 (금요일)
    holidays: mockHolidays,
    filteredEvents: mockEvents,
    notifiedEvents: [],
  },
};

/**
 * 다음 달 넘어가는 월간 뷰
 */
export const MonthViewEndOfMonth: Story = {
  args: {
    view: 'month',
    currentDate: new Date(2024, 10, 30), // 11월 30일 (토요일)
    holidays: mockHolidays,
    filteredEvents: mockEvents,
    notifiedEvents: [],
  },
};
