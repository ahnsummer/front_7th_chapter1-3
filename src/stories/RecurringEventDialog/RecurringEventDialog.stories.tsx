import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import RecurringEventDialog from '../../components/RecurringEventDialog';
import { Event } from '../../types';

const meta = {
  title: 'Components/RecurringEventDialog',
  component: RecurringEventDialog,
  parameters: {
    layout: 'padded',
    // Storybook Docs에서 backdrop이 다른 정보를 가리지 않도록 설정
    docs: {
      story: {
        inline: false,
        iframeHeight: 500,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    onClose: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof RecurringEventDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock event data
const mockRecurringEvent: Event = {
  id: '1',
  title: '주간 회의',
  date: '2024-11-06',
  startTime: '10:00',
  endTime: '11:00',
  description: '주간 팀 미팅',
  location: '회의실 A',
  category: '업무',
  repeat: { type: 'weekly', interval: 1, endDate: '2024-12-31' },
  notificationTime: 10,
};

/**
 * 기본 - 편집 모드 (주간 반복 일정)
 */
export const EditMode: Story = {
  args: {
    open: true,
    event: mockRecurringEvent,
    mode: 'edit',
  },
};

/**
 * 기본 - 삭제 모드 (주간 반복 일정)
 */
export const DeleteMode: Story = {
  args: {
    open: true,
    event: mockRecurringEvent,
    mode: 'delete',
  },
};

/**
 * 편집 모드 - 매일 반복
 */
export const EditDailyRepeat: Story = {
  args: {
    open: true,
    event: {
      ...mockRecurringEvent,
      title: '아침 운동',
      repeat: { type: 'daily', interval: 1 },
    },
    mode: 'edit',
  },
};

/**
 * 삭제 모드 - 매일 반복
 */
export const DeleteDailyRepeat: Story = {
  args: {
    open: true,
    event: {
      ...mockRecurringEvent,
      title: '아침 운동',
      repeat: { type: 'daily', interval: 1 },
    },
    mode: 'delete',
  },
};

/**
 * 편집 모드 - 매년 반복
 */
export const EditYearlyRepeat: Story = {
  args: {
    open: true,
    event: {
      ...mockRecurringEvent,
      title: '생일 파티',
      repeat: { type: 'yearly', interval: 1 },
    },
    mode: 'edit',
  },
};

/**
 * 삭제 모드 - 매년 반복
 */
export const DeleteYearlyRepeat: Story = {
  args: {
    open: true,
    event: {
      ...mockRecurringEvent,
      title: '생일 파티',
      repeat: { type: 'yearly', interval: 1 },
    },
    mode: 'delete',
  },
};

/**
 * 편집 모드 - 커스텀 간격 (격주)
 */
export const EditCustomInterval: Story = {
  args: {
    open: true,
    event: {
      ...mockRecurringEvent,
      title: '격주 미팅',
      repeat: { type: 'weekly', interval: 2, endDate: '2024-12-31' },
    },
    mode: 'edit',
  },
};

/**
 * 삭제 모드 - 종료일이 없는 반복 일정
 */
export const DeleteWithoutEndDate: Story = {
  args: {
    open: true,
    event: {
      ...mockRecurringEvent,
      repeat: { type: 'daily', interval: 1 },
    },
    mode: 'delete',
  },
};

/**
 * 편집 모드 - 긴 제목 처리
 */
export const EditLongTitle: Story = {
  args: {
    open: true,
    event: {
      ...mockRecurringEvent,
      title: '주간 보고서 작성 및 제출 그리고 검토 회의 참석 - 매우 긴 제목의 반복 일정입니다',
    },
    mode: 'edit',
  },
};

/**
 * 삭제 모드 - 긴 제목 처리
 */
export const DeleteLongTitle: Story = {
  args: {
    open: true,
    event: {
      ...mockRecurringEvent,
      title: '주간 보고서 작성 및 제출 그리고 검토 회의 참석 - 매우 긴 제목의 반복 일정입니다',
    },
    mode: 'delete',
  },
};
