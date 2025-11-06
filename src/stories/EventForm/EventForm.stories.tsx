import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { EventForm } from '../../components/EventForm';
import { Event } from '../../types';

const meta = {
  title: 'Components/EventForm',
  component: EventForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    setTitle: fn(),
    setDate: fn(),
    setDescription: fn(),
    setLocation: fn(),
    setCategory: fn(),
    setIsRepeating: fn(),
    setRepeatType: fn(),
    setRepeatInterval: fn(),
    setRepeatEndDate: fn(),
    setNotificationTime: fn(),
    handleStartTimeChange: fn(),
    handleEndTimeChange: fn(),
    onSubmit: fn(),
    getTimeErrorMessage: fn(() => ({ startTimeError: null, endTimeError: null })),
  },
} satisfies Meta<typeof EventForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock event data
const mockEvent: Event = {
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

/**
 * 일정 추가 - 빈 폼
 */
export const AddEventEmpty: Story = {
  args: {
    editingEvent: null,
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    description: '',
    location: '',
    category: '업무',
    isRepeating: false,
    repeatType: 'none',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 10,
    startTimeError: null,
    endTimeError: null,
  },
};

/**
 * 일정 추가 - 기본 입력값
 */
export const AddEventFilled: Story = {
  args: {
    editingEvent: null,
    title: '팀 회의',
    date: '2024-11-06',
    startTime: '10:00',
    endTime: '11:00',
    description: '주간 팀 미팅',
    location: '회의실 A',
    category: '업무',
    isRepeating: false,
    repeatType: 'none',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 10,
    startTimeError: null,
    endTimeError: null,
  },
};

/**
 * 일정 수정 모드
 */
export const EditEvent: Story = {
  args: {
    editingEvent: mockEvent,
    title: '팀 회의',
    date: '2024-11-06',
    startTime: '10:00',
    endTime: '11:00',
    description: '주간 팀 미팅',
    location: '회의실 A',
    category: '업무',
    isRepeating: false,
    repeatType: 'none',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 10,
    startTimeError: null,
    endTimeError: null,
  },
};

/**
 * 반복 일정 추가 - 매일
 */
export const AddDailyRepeat: Story = {
  args: {
    editingEvent: null,
    title: '아침 운동',
    date: '2024-11-06',
    startTime: '07:00',
    endTime: '08:00',
    description: '조깅',
    location: '공원',
    category: '개인',
    isRepeating: true,
    repeatType: 'daily',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 60,
    startTimeError: null,
    endTimeError: null,
  },
};

/**
 * 반복 일정 추가 - 매주
 */
export const AddWeeklyRepeat: Story = {
  args: {
    editingEvent: null,
    title: '주간 회의',
    date: '2024-11-06',
    startTime: '14:00',
    endTime: '15:00',
    description: '주간 보고',
    location: '회의실 B',
    category: '업무',
    isRepeating: true,
    repeatType: 'weekly',
    repeatInterval: 1,
    repeatEndDate: '2024-12-31',
    notificationTime: 10,
    startTimeError: null,
    endTimeError: null,
  },
};

/**
 * 반복 일정 추가 - 매월
 */
export const AddMonthlyRepeat: Story = {
  args: {
    editingEvent: null,
    title: '월간 보고',
    date: '2024-11-01',
    startTime: '09:00',
    endTime: '10:00',
    description: '월간 실적 보고',
    location: '대회의실',
    category: '업무',
    isRepeating: true,
    repeatType: 'monthly',
    repeatInterval: 1,
    repeatEndDate: '2025-12-31',
    notificationTime: 1440,
    startTimeError: null,
    endTimeError: null,
  },
};

/**
 * 반복 일정 추가 - 매년
 */
export const AddYearlyRepeat: Story = {
  args: {
    editingEvent: null,
    title: '생일 파티',
    date: '2024-11-10',
    startTime: '18:00',
    endTime: '21:00',
    description: '친구 생일',
    location: '레스토랑',
    category: '가족',
    isRepeating: true,
    repeatType: 'yearly',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 120,
    startTimeError: null,
    endTimeError: null,
  },
};

/**
 * 반복 일정 추가 - 커스텀 간격 (격주)
 */
export const AddCustomInterval: Story = {
  args: {
    editingEvent: null,
    title: '격주 미팅',
    date: '2024-11-06',
    startTime: '15:00',
    endTime: '16:00',
    description: '격주 진행 상황 체크',
    location: '온라인',
    category: '업무',
    isRepeating: true,
    repeatType: 'weekly',
    repeatInterval: 2,
    repeatEndDate: '2024-12-31',
    notificationTime: 10,
    startTimeError: null,
    endTimeError: null,
  },
};

/**
 * 시작 시간 에러
 */
export const WithStartTimeError: Story = {
  args: {
    editingEvent: null,
    title: '팀 회의',
    date: '2024-11-06',
    startTime: '25:00',
    endTime: '11:00',
    description: '',
    location: '',
    category: '업무',
    isRepeating: false,
    repeatType: 'none',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 10,
    startTimeError: '시작 시간을 확인해주세요',
    endTimeError: null,
  },
};

/**
 * 종료 시간 에러
 */
export const WithEndTimeError: Story = {
  args: {
    editingEvent: null,
    title: '팀 회의',
    date: '2024-11-06',
    startTime: '10:00',
    endTime: '09:00',
    description: '',
    location: '',
    category: '업무',
    isRepeating: false,
    repeatType: 'none',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 10,
    startTimeError: null,
    endTimeError: '종료 시간은 시작 시간보다 늦어야 합니다',
  },
};

/**
 * 시작/종료 시간 모두 에러
 */
export const WithBothTimeErrors: Story = {
  args: {
    editingEvent: null,
    title: '팀 회의',
    date: '2024-11-06',
    startTime: '',
    endTime: '',
    description: '',
    location: '',
    category: '업무',
    isRepeating: false,
    repeatType: 'none',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 10,
    startTimeError: '시작 시간을 입력해주세요',
    endTimeError: '종료 시간을 입력해주세요',
  },
};

/**
 * 카테고리 - 개인
 */
export const CategoryPersonal: Story = {
  args: {
    editingEvent: null,
    title: '운동',
    date: '2024-11-06',
    startTime: '19:00',
    endTime: '20:00',
    description: '헬스장',
    location: '헬스장',
    category: '개인',
    isRepeating: false,
    repeatType: 'none',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 10,
    startTimeError: null,
    endTimeError: null,
  },
};

/**
 * 카테고리 - 가족
 */
export const CategoryFamily: Story = {
  args: {
    editingEvent: null,
    title: '가족 저녁',
    date: '2024-11-06',
    startTime: '18:00',
    endTime: '20:00',
    description: '가족 모임',
    location: '집',
    category: '가족',
    isRepeating: false,
    repeatType: 'none',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 10,
    startTimeError: null,
    endTimeError: null,
  },
};

/**
 * 카테고리 - 기타
 */
export const CategoryOther: Story = {
  args: {
    editingEvent: null,
    title: '기타 일정',
    date: '2024-11-06',
    startTime: '10:00',
    endTime: '11:00',
    description: '',
    location: '',
    category: '기타',
    isRepeating: false,
    repeatType: 'none',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 10,
    startTimeError: null,
    endTimeError: null,
  },
};

/**
 * 알림 설정 - 1분 전
 */
export const Notification1Min: Story = {
  args: {
    editingEvent: null,
    title: '긴급 회의',
    date: '2024-11-06',
    startTime: '14:00',
    endTime: '15:00',
    description: '',
    location: '',
    category: '업무',
    isRepeating: false,
    repeatType: 'none',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 1,
    startTimeError: null,
    endTimeError: null,
  },
};

/**
 * 알림 설정 - 1일 전
 */
export const Notification1Day: Story = {
  args: {
    editingEvent: null,
    title: '중요 회의',
    date: '2024-11-06',
    startTime: '09:00',
    endTime: '10:00',
    description: '사전 준비 필요',
    location: '본사',
    category: '업무',
    isRepeating: false,
    repeatType: 'none',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 1440,
    startTimeError: null,
    endTimeError: null,
  },
};

/**
 * 긴 텍스트 입력
 */
export const WithLongTexts: Story = {
  args: {
    editingEvent: null,
    title: '이것은 매우 긴 제목의 일정입니다 - 제목이 얼마나 길어질 수 있는지 테스트합니다',
    date: '2024-11-06',
    startTime: '10:00',
    endTime: '11:00',
    description:
      '이것은 매우 긴 설명입니다. 설명이 여러 줄에 걸쳐 표시될 수 있는지 테스트합니다. 설명에는 일정에 대한 자세한 정보가 포함될 수 있습니다.',
    location: '이것은 매우 긴 위치명입니다 - 서울특별시 강남구 테헤란로 123번길 45호',
    category: '업무',
    isRepeating: false,
    repeatType: 'none',
    repeatInterval: 1,
    repeatEndDate: '',
    notificationTime: 10,
    startTimeError: null,
    endTimeError: null,
  },
};
