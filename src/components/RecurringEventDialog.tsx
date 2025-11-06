import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

import { Event } from '../types';

type DialogMode = 'edit' | 'delete';

const DIALOG_CONFIG = {
  edit: {
    title: '반복 일정 수정',
    message: '해당 일정만 수정하시겠어요?',
  },
  delete: {
    title: '반복 일정 삭제',
    message: '해당 일정만 삭제하시겠어요?',
  },
} as const;

const BUTTON_TEXT = {
  cancel: '취소',
  no: '아니오',
  yes: '예',
} as const;

export interface RecurringEventDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (editSingleOnly: boolean) => void;
  event: Event | null;
  mode?: DialogMode;
}

/**
 * 반복 일정 작업을 처리하는 다이얼로그 컴포넌트
 * - 사용자가 단일 일정 또는 전체 반복 일정에 대한 작업을 선택할 수 있습니다
 */
const RecurringEventDialog = ({
  open,
  onClose,
  onConfirm,
  mode = 'edit',
}: RecurringEventDialogProps) => {
  const handleSingleOperation = () => {
    onConfirm(true);
  };

  const handleSeriesOperation = () => {
    onConfirm(false);
  };

  if (!open) return null;

  const config = DIALOG_CONFIG[mode];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="recurring-event-dialog-title"
      aria-describedby="recurring-event-dialog-description"
    >
      <DialogTitle id="recurring-event-dialog-title">{config.title}</DialogTitle>

      <DialogContent>
        <Typography id="recurring-event-dialog-description">{config.message}</Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {BUTTON_TEXT.cancel}
        </Button>
        <Button onClick={handleSeriesOperation} variant="outlined" color="primary">
          {BUTTON_TEXT.no}
        </Button>
        <Button onClick={handleSingleOperation} variant="contained" color="primary">
          {BUTTON_TEXT.yes}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecurringEventDialog;
