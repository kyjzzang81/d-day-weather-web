import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (month: number, day: number) => void;
  currentDate?: Date;
}

const DatePickerDialog: React.FC<DatePickerDialogProps> = ({
  isOpen,
  onClose,
  onSelectDate,
  currentDate,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate || new Date());

  if (!isOpen) return null;

  const handleConfirm = () => {
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    onSelectDate(month, day);
    onClose();
  };

  return createPortal(
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 700, color: 'var(--c-text)' }}>
            날짜 선택
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--c-surf)', border: '1px solid var(--c-line)',
              color: 'var(--c-dim)', fontSize: 18, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            inline
            dateFormat="MM월 dd일"
            maxDate={new Date(2026, 11, 31)}
            minDate={new Date(2026, 0, 1)}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary">
            취소
          </button>
          <button onClick={handleConfirm} className="btn-primary">
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DatePickerDialog;
