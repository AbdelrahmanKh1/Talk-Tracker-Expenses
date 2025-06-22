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

// Category icon and color mapping
const categoryMap: Record<string, { icon: JSX.Element; color: string }> = {
  Food: {
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M4 10h16M9 21V3m6 18V3" stroke="#0d9488" strokeWidth="2" strokeLinecap="round"/></svg>,
    color: 'bg-teal-100 text-teal-700',
  },
  Transport: {
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="6" rx="2" stroke="#0d9488" strokeWidth="2"/><circle cx="7.5" cy="17.5" r="1.5" fill="#0d9488"/><circle cx="16.5" cy="17.5" r="1.5" fill="#0d9488"/></svg>,
    color: 'bg-blue-100 text-blue-700',
  },
  Shopping: {
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M6 6h15l-1.5 9h-13z" stroke="#0d9488" strokeWidth="2"/><circle cx="9" cy="20" r="1" fill="#0d9488"/><circle cx="18" cy="20" r="1" fill="#0d9488"/></svg>,
    color: 'bg-pink-100 text-pink-700',
  },
  Health: {
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 21C12 21 4 13.5 4 8.5C4 5.5 6.5 3 9.5 3C11.24 3 12.91 4.01 13.44 5.5C13.97 4.01 15.64 3 17.38 3C20.38 3 22.88 5.5 22.88 8.5C22.88 13.5 15 21 15 21H12Z" stroke="#0d9488" strokeWidth="2"/></svg>,
    color: 'bg-green-100 text-green-700',
  },
  Entertainment: {
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="2" stroke="#0d9488" strokeWidth="2"/><path d="M8 7V5a4 4 0 1 1 8 0v2" stroke="#0d9488" strokeWidth="2"/></svg>,
    color: 'bg-yellow-100 text-yellow-700',
  },
  Bills: {
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2" stroke="#0d9488" strokeWidth="2"/><path d="M8 10h8M8 14h6" stroke="#0d9488" strokeWidth="2"/></svg>,
    color: 'bg-purple-100 text-purple-700',
  },
  Education: {
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 3L2 8l10 5 10-5-10-5zm0 13v5m-7-7v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" stroke="#0d9488" strokeWidth="2"/></svg>,
    color: 'bg-orange-100 text-orange-700',
  },
  Miscellaneous: {
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="#0d9488" strokeWidth="2"/><circle cx="12" cy="12" r="4" stroke="#0d9488" strokeWidth="2"/></svg>,
    color: 'bg-gray-100 text-gray-700',
  },
  Travel: {
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8" stroke="#0d9488" strokeWidth="2"/><path d="M3 16h18M8 16v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2" stroke="#0d9488" strokeWidth="2"/></svg>,
    color: 'bg-indigo-100 text-indigo-700',
  },
};

const getCategoryMeta = (category: string) => {
  return categoryMap[category] || categoryMap['Miscellaneous'];
};

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

  const meta = getCategoryMeta(expense.category);

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl shadow-md">
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${meta.color}`}>
              {meta.icon}
            </div>
            <div>
              <div className="font-medium text-base">{expense.description}</div>
              <div className={`inline-block text-xs px-2 py-0.5 rounded ${meta.color} mt-1`}>{expense.category}</div>
            </div>
          </div>
          <div className="text-right min-w-[80px]">
            <div className="font-semibold text-lg">{currencySymbol} {expense.amount}</div>
            <div className="text-xs text-gray-500">{new Date(expense.date).toISOString().slice(0, 10)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeableExpenseItem;
