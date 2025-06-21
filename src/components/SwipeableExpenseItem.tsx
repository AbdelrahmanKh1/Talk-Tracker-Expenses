import React, { useState, useRef } from 'react';
import { Edit, Trash2 } from 'lucide-react';

interface SwipeableExpenseItemProps {
  expense: {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
  };
  onEdit: (expense: any) => void;
  onDelete: (expenseId: string) => void;
  currencySymbol?: string;
}

const SwipeableExpenseItem: React.FC<SwipeableExpenseItemProps> = ({
  expense,
  onEdit,
  onDelete,
  currencySymbol = 'EGP'
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    startX.current = clientX;
    currentX.current = clientX;
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    
    currentX.current = clientX;
    const diff = startX.current - currentX.current;
    
    // Only allow left swipe (positive offset)
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 160)); // Max swipe distance
    } else {
      setSwipeOffset(0);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    
    // If swiped more than 60px, keep it open, otherwise close
    if (swipeOffset > 60) {
      setSwipeOffset(160);
    } else {
      setSwipeOffset(0);
    }
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleEditClick = () => {
    onEdit(expense);
    setSwipeOffset(0); // Close swipe after action
  };

  const handleDeleteClick = () => {
    onDelete(expense.id);
    setSwipeOffset(0); // Close swipe after action
  };

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl">
      {/* Action buttons (revealed when swiped) */}
      <div className="absolute right-0 top-0 h-full flex items-center">
        <button
          onClick={handleEditClick}
          className="h-full px-4 bg-blue-500 text-white flex items-center justify-center min-w-[80px]"
        >
          <Edit className="w-5 h-5" />
        </button>
        <button
          onClick={handleDeleteClick}
          className="h-full px-4 bg-red-500 text-white flex items-center justify-center min-w-[80px]"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Main content */}
      <div
        className="p-4 cursor-pointer transition-transform duration-200 bg-white"
        style={{
          transform: `translateX(-${swipeOffset}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={isDragging ? handleMouseMove : undefined}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="font-medium">{expense.description}</div>
              <div className="text-xs text-gray-500">{expense.category}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-semibold">{currencySymbol} {expense.amount}</div>
            <div className="text-xs text-gray-500">{expense.date}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeableExpenseItem;
