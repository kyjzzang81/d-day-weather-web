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
        <div className="flex items-center justify-between mb-10 relative z-10">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            날짜 선택
          </h2>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-white 
                     bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600
                     rounded-full transition-all text-2xl font-bold shadow-lg hover:shadow-glow-pink
                     hover:scale-110 active:scale-95"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="flex justify-center mb-10 relative z-10">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            inline
            dateFormat="MM월 dd일"
            maxDate={new Date(2026, 11, 31)} // 2026-12-31
            minDate={new Date(2026, 0, 1)} // 2026-01-01
          />
        </div>

        <div className="flex gap-4 justify-end relative z-10">
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
