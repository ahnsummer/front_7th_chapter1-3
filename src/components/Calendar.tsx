import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Notifications, Repeat } from '@mui/icons-material';
import {
  Box,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';

import { Event, RepeatType } from '../types';
import {
  formatDate,
  formatMonth,
  formatWeek,
  getEventsForDay,
  getWeekDates,
  getWeeksAtMonth,
} from '../utils/dateUtils';

type CalendarProps = {
  view: 'week' | 'month';
  setView: (view: 'week' | 'month') => void;
  currentDate: Date;
  holidays: Record<string, string>;
  navigate: (direction: 'prev' | 'next') => void;
  filteredEvents: Event[];
  notifiedEvents: string[];
  onEventDateChange: (eventId: string, newDate: string) => void;
  onCellClick: (date: Date) => void;
};

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

const eventBoxStyles = {
  notified: {
    backgroundColor: '#ffebee',
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  normal: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'normal',
    color: 'inherit',
  },
  common: {
    p: 0.5,
    my: 0.5,
    borderRadius: 1,
    minHeight: '18px',
    width: '100%',
    overflow: 'hidden',
  },
};

const getRepeatTypeLabel = (type: RepeatType): string => {
  switch (type) {
    case 'daily':
      return '일';
    case 'weekly':
      return '주';
    case 'monthly':
      return '월';
    case 'yearly':
      return '년';
    default:
      return '';
  }
};

// Draggable Event Component
function DraggableEvent({
  event,
  isNotified,
  isRepeating,
}: {
  event: Event;
  isNotified: boolean;
  isRepeating: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }
    : { cursor: 'grab' };

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        ...eventBoxStyles.common,
        ...(isNotified ? eventBoxStyles.notified : eventBoxStyles.normal),
        ...style,
        '&:hover': {
          opacity: 0.8,
        },
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {isNotified && <Notifications fontSize="small" />}
        {isRepeating && (
          <Tooltip
            title={`${event.repeat.interval}${getRepeatTypeLabel(event.repeat.type)}마다 반복${
              event.repeat.endDate ? ` (종료: ${event.repeat.endDate})` : ''
            }`}
          >
            <Repeat fontSize="small" />
          </Tooltip>
        )}
        <Typography variant="caption" noWrap sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
          {event.title}
        </Typography>
      </Stack>
    </Box>
  );
}

// Droppable Date Cell Component
function DroppableCell({
  date,
  children,
  sx,
  onCellClick,
}: {
  date: Date;
  children: React.ReactNode;
  sx?: object;
  onCellClick?: (date: Date) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: date.toISOString(),
    data: { date },
  });

  return (
    <TableCell
      ref={setNodeRef}
      sx={{
        ...sx,
        backgroundColor: isOver ? '#e3f2fd' : '#FFF',
        transition: 'background-color 0.2s',
        cursor: onCellClick == null ? undefined : 'pointer',
      }}
      onClick={() => onCellClick?.(date)}
    >
      {children}
    </TableCell>
  );
}

export function Calendar({
  view,
  setView,
  currentDate,
  holidays,
  navigate,
  filteredEvents,
  notifiedEvents,
  onEventDateChange,
  onCellClick,
}: CalendarProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const eventId = active.id as string;
    const draggedEvent = active.data.current?.event as Event;
    const targetDate = over.data.current?.date as Date;

    if (!draggedEvent || !targetDate) return;

    // Format target date to match event date format (YYYY-MM-DD)
    const newDate = formatDate(targetDate);

    // Don't update if dropping on same date
    if (draggedEvent.date === newDate) return;

    onEventDateChange(eventId, newDate);
  };
  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    return (
      <Stack data-testid="week-view" spacing={4} sx={{ width: '100%' }}>
        <Typography variant="h5">{formatWeek(currentDate)}</Typography>
        <TableContainer>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                {weekDays.map((day) => (
                  <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                {weekDates
                  .map((date) => ({
                    date,
                    events: filteredEvents.filter(
                      (event) => new Date(event.date).toDateString() === date.toDateString()
                    ),
                  }))
                  .map(({ date, events }) => (
                    <DroppableCell
                      key={date.toISOString()}
                      date={date}
                      sx={{
                        height: '120px',
                        verticalAlign: 'top',
                        width: '14.28%',
                        padding: 1,
                        border: '1px solid #e0e0e0',
                        overflow: 'hidden',
                      }}
                      onCellClick={events.length > 0 ? undefined : onCellClick}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {date.getDate()}
                      </Typography>
                      {events.map((event) => {
                        const isNotified = notifiedEvents.includes(event.id);
                        const isRepeating = event.repeat.type !== 'none';

                        return (
                          <DraggableEvent
                            key={event.id}
                            event={event}
                            isNotified={isNotified}
                            isRepeating={isRepeating}
                          />
                        );
                      })}
                    </DroppableCell>
                  ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  };

  const renderMonthView = () => {
    const weeks = getWeeksAtMonth(currentDate);

    return (
      <Stack data-testid="month-view" spacing={4} sx={{ width: '100%' }}>
        <Typography variant="h5">{formatMonth(currentDate)}</Typography>
        <TableContainer>
          <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
              <TableRow>
                {weekDays.map((day) => (
                  <TableCell key={day} sx={{ width: '14.28%', padding: 1, textAlign: 'center' }}>
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {weeks.map((week, weekIndex) => (
                <TableRow key={weekIndex}>
                  {week.map((day, dayIndex) => {
                    const dateString = day ? formatDate(currentDate, day) : '';
                    const holiday = holidays[dateString];

                    // Create a proper date object for droppable
                    const cellDate = day
                      ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                      : null;

                    if (!cellDate) {
                      return (
                        <TableCell
                          key={dayIndex}
                          sx={{
                            height: '120px',
                            verticalAlign: 'top',
                            width: '14.28%',
                            padding: 1,
                            border: '1px solid #e0e0e0',
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                        />
                      );
                    }

                    return (
                      <DroppableCell
                        key={dayIndex}
                        date={cellDate}
                        sx={{
                          height: '120px',
                          verticalAlign: 'top',
                          width: '14.28%',
                          padding: 1,
                          border: '1px solid #e0e0e0',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                        onCellClick={
                          day && getEventsForDay(filteredEvents, day).length > 0
                            ? undefined
                            : onCellClick
                        }
                      >
                        <Typography variant="body2" fontWeight="bold">
                          {day}
                        </Typography>
                        {holiday && (
                          <Typography variant="body2" color="error">
                            {holiday}
                          </Typography>
                        )}
                        {day &&
                          getEventsForDay(filteredEvents, day).map((event) => {
                            const isNotified = notifiedEvents.includes(event.id);
                            const isRepeating = event.repeat.type !== 'none';

                            return (
                              <DraggableEvent
                                key={event.id}
                                event={event}
                                isNotified={isNotified}
                                isRepeating={isRepeating}
                              />
                            );
                          })}
                      </DroppableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <Stack flex={1} spacing={5}>
        <Typography variant="h4">일정 보기</Typography>

        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <IconButton aria-label="Previous" onClick={() => navigate('prev')}>
            <ChevronLeft />
          </IconButton>
          <Select
            size="small"
            aria-label="뷰 타입 선택"
            value={view}
            onChange={(e) => setView(e.target.value as 'week' | 'month')}
          >
            <MenuItem value="week" aria-label="week-option">
              Week
            </MenuItem>
            <MenuItem value="month" aria-label="month-option">
              Month
            </MenuItem>
          </Select>
          <IconButton aria-label="Next" onClick={() => navigate('next')}>
            <ChevronRight />
          </IconButton>
        </Stack>

        {view === 'week' && renderWeekView()}
        {view === 'month' && renderMonthView()}
      </Stack>
    </DndContext>
  );
}
