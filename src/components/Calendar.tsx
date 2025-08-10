import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  unavailableDates?: Date[];
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, unavailableDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isDateUnavailable = (date: Date) => {
    return unavailableDates.some(unavailableDate => 
      format(unavailableDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const isDatePast = (date: Date) => {
    return isBefore(date, new Date());
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);
          const isUnavailable = isDateUnavailable(day);
          const isPast = isDatePast(day);

          return (
            <button
              key={day.toString()}
              onClick={() => !isUnavailable && !isPast && onDateSelect(day)}
              disabled={isUnavailable || isPast}
              className={`
                p-2 text-sm rounded-lg transition-colors
                ${isSelected 
                  ? 'bg-blue-600 text-white' 
                  : isCurrentDay 
                  ? 'bg-blue-100 text-blue-600' 
                  : isCurrentMonth 
                  ? 'text-gray-900 hover:bg-gray-100' 
                  : 'text-gray-400'
                }
                ${isUnavailable || isPast ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
