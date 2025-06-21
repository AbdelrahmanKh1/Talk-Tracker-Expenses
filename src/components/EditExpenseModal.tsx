
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Trash2 } from 'lucide-react';

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
}

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: {
    id: string;
    description: string;
    amount: number;
    category: string;
  } | null;
  onUpdate: (expenseId: string, items: { description: string; amount: number; category: string }[]) => void;
  isLoading: boolean;
}

const categories = [
  'Food', 'Transport', 'Entertainment', 'Health', 'Shopping', 
  'Bills', 'Education', 'Travel', 'Miscellaneous'
];

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  onUpdate,
  isLoading,
}) => {
  const [items, setItems] = useState<ExpenseItem[]>([]);

  React.useEffect(() => {
    if (expense && isOpen) {
      // Try to split compound expenses (e.g., "Coffee 50, Uber 300")
      const description = expense.description;
      const splitPattern = /([^,]+?)(\d+(?:\.\d+)?)/g;
      const matches = [...description.matchAll(splitPattern)];
      
      if (matches.length > 1) {
        // Multiple items detected
        const detectedItems = matches.map((match, index) => ({
          id: `${expense.id}-${index}`,
          description: match[1].trim().replace(/[^\w\s]/g, ''),
          amount: parseFloat(match[2]),
          category: expense.category || 'Miscellaneous',
        }));
        setItems(detectedItems);
      } else {
        // Single item
        setItems([{
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category || 'Miscellaneous',
        }]);
      }
    }
  }, [expense, isOpen]);

  const addNewItem = () => {
    setItems([...items, {
      id: `new-${Date.now()}`,
      description: '',
      amount: 0,
      category: 'Miscellaneous',
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof ExpenseItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSave = () => {
    if (!expense) return;
    
    const validItems = items.filter(item => 
      item.description.trim() && item.amount > 0
    );
    
    if (validItems.length === 0) return;
    
    onUpdate(expense.id, validItems.map(({ description, amount, category }) => ({
      description,
      amount,
      category,
    })));
  };

  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Edit Expense</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Item {index + 1}</span>
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 hover:bg-red-100 rounded-full text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div>
                <Label htmlFor={`description-${item.id}`}>Description</Label>
                <Input
                  id={`description-${item.id}`}
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  placeholder="Enter description"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`amount-${item.id}`}>Amount (EGP)</Label>
                <Input
                  id={`amount-${item.id}`}
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor={`category-${item.id}`}>Category</Label>
                <Select
                  value={item.category}
                  onValueChange={(value) => updateItem(item.id, 'category', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}

          <Button
            onClick={addNewItem}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Another Item
          </Button>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 bg-teal-500 hover:bg-teal-600 text-white"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditExpenseModal;
