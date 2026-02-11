import React, { useState } from 'react';
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
    const month = selectedDate.getMonth() + 1; // 0-indexed to 1-indexed
    const day = selectedDate.getDate();
    onSelectDate(month, day);
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">날짜 선택</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="flex justify-center mb-6">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            inline
            dateFormat="MM월 dd일"
            maxDate={new Date(2026, 11, 31)} // 2026-12-31
            minDate={new Date(2026, 0, 1)} // 2026-01-01
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">
            취소
          </button>
          <button onClick={handleConfirm} className="btn-primary">
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatePickerDialog;
