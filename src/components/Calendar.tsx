import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
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
  Typography,
} from '@mui/material';
import React from 'react';

import { Event } from '../types';
import { EventItem } from './EventItem';
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

// Draggable Event Component - EventItem을 드래그 가능하게 감싸는 래퍼
function DraggableEvent({ event, isNotified }: { event: Event; isNotified: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: { event },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : {};

  return (
    <Box ref={setNodeRef} {...listeners} {...attributes} sx={style}>
      <EventItem event={event} isNotified={isNotified} isDragging={isDragging} />
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

                        return (
                          <DraggableEvent key={event.id} event={event} isNotified={isNotified} />
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

                            return (
                              <DraggableEvent
                                key={event.id}
                                event={event}
                                isNotified={isNotified}
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
