import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { description: string; amount: number; category?: string; created_at: string }) => void;
  isLoading: boolean;
  selectedMonth?: string;
}

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  isLoading,
  selectedMonth 
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Miscellaneous');

  const categories = [
    'Food',
    'Transport',
    'Entertainment',
    'Health',
    'Shopping',
    'Bills',
    'Education',
    'Travel',
    'Miscellaneous'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    // Generate created_at with selected month (YYYY-MM) and today's day/time
    let created_at = new Date().toISOString();
    if (selectedMonth) {
      // selectedMonth is like "May 2024"
      const [monthName, year] = selectedMonth.split(' ');
      const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth(); // JS months are 0-based
      const month = (monthIndex + 1).toString().padStart(2, '0'); // for string, add 1
      const today = new Date();
      let day = today.getDate();
      // Clamp day to last valid day of selected month
      const lastDayOfMonth = new Date(Number(year), monthIndex + 1, 0).getDate();
      if (day > lastDayOfMonth) day = lastDayOfMonth;
      const dayStr = day.toString().padStart(2, '0');
      const time = today.toTimeString().split(' ')[0];
      created_at = `${year}-${month}-${dayStr}T${time}Z`;
    }

    onAdd({
      description,
      amount: parseFloat(amount),
      category,
      created_at
    });

    // Reset form
    setDescription('');
    setAmount('');
    setCategory('Miscellaneous');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Add Expense</h2>
            {selectedMonth && (
              <p className="text-sm text-gray-600 mt-1">
                Adding to {selectedMonth}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Coffee, Lunch, Uber"
              required
            />
          </div>

          <div>
            <Label htmlFor="amount">Amount (EGP)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-teal-500 hover:bg-teal-600">
              {isLoading ? 'Adding...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
