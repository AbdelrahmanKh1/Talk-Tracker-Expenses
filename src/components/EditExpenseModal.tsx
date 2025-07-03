import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Trash2, Utensils, Car, ShoppingBag, HeartPulse, Gamepad2, Receipt, Wallet, Box, Edit3, TrendingUp } from 'lucide-react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { getExchangeRate } from '@/lib/exchangeRate';
import { toast } from 'sonner';
import { currencyOptions } from '@/lib/currencies';
import { CurrencySelector } from '@/components/CurrencySelector';

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  category: string;
  date?: string;
}

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: {
    id: string;
    description: string;
    amount: number;
    category: string;
    date?: string;
  } | null;
  onUpdate: (expenseId: string, items: { description: string; amount: number; category: string; date?: string }[]) => void;
  isLoading: boolean;
}

const CATEGORY_ICONS: Record<string, JSX.Element> = {
  Food: <Utensils size={24} strokeWidth={2.2} className="text-orange-500" />,
  Transport: <Car size={24} strokeWidth={2.2} className="text-blue-500" />,
  Shopping: <ShoppingBag size={24} strokeWidth={2.2} className="text-purple-500" />,
  Health: <HeartPulse size={24} strokeWidth={2.2} className="text-red-500" />,
  Entertainment: <Gamepad2 size={24} strokeWidth={2.2} className="text-green-500" />,
  Bills: <Receipt size={24} strokeWidth={2.2} className="text-yellow-500" />,
  Income: <Wallet size={24} strokeWidth={2.2} className="text-emerald-500" />,
  Others: <Box size={24} strokeWidth={2.2} className="text-gray-500" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300',
  Transport: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300',
  Shopping: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300',
  Health: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300',
  Entertainment: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300',
  Bills: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300',
  Income: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300',
  Others: 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300',
};

const categories = [
  'Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Bills', 'Income', 'Others'
];

const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  onUpdate,
  isLoading,
}) => {
  const { settings } = useUserSettings();
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [itemCurrencies, setItemCurrencies] = useState<Record<string, string>>({});
  const [itemRates, setItemRates] = useState<Record<string, number>>({});
  const [itemConverted, setItemConverted] = useState<Record<string, number>>({});
  const [openCategoryModalId, setOpenCategoryModalId] = useState<string | null>(null);


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
          category: expense.category || 'Others',
          date: expense.date,
        }));
        setItems(detectedItems);
      } else {
        // Single item
        setItems([{
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category || 'Others',
          date: expense.date,
        }]);
      }
      // Set default currency for each item
      const defaultCurrency = expense.currency_code || settings?.base_currency || 'USD';
      setItemCurrencies({});
      setItemRates({});
      setItemConverted({});
      setTimeout(() => {
        setItems((prev) => prev.map(item => {
          setItemCurrencies(curr => ({ ...curr, [item.id]: defaultCurrency }));
          setItemRates(curr => ({ ...curr, [item.id]: 1 }));
          setItemConverted(curr => ({ ...curr, [item.id]: item.amount }));
          return item;
        }));
      }, 0);
    }
  }, [expense, isOpen, settings?.base_currency]);

  const addNewItem = () => {
    setItems([...items, {
      id: `new-${Date.now()}`,
      description: '',
      amount: 0,
      category: 'Others',
      date: new Date().toISOString().split('T')[0],
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleCurrencyChange = async (id: string, newCurrency: string, amount: number) => {
    setItemCurrencies(curr => ({ ...curr, [id]: newCurrency }));
    if (newCurrency !== settings?.base_currency) {
      const rate = await getExchangeRate(newCurrency, settings?.base_currency || 'USD') || 0;
      if (rate === 0) {
        toast.error('Failed to fetch exchange rate. Please try again.');
        setItemRates(curr => ({ ...curr, [id]: 1 }));
        setItemConverted(curr => ({ ...curr, [id]: amount }));
        return;
      }
      setItemRates(curr => ({ ...curr, [id]: rate }));
      setItemConverted(curr => ({ ...curr, [id]: parseFloat((amount * rate).toFixed(2)) }));
    } else {
      setItemRates(curr => ({ ...curr, [id]: 1 }));
      setItemConverted(curr => ({ ...curr, [id]: amount }));
    }
  };

  const updateItem = (id: string, field: keyof ExpenseItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
    if (field === 'amount') {
      const curr = itemCurrencies[id] || settings?.base_currency || 'USD';
      handleCurrencyChange(id, curr, Number(value));
    }
  };

  const handleCurrencyDropdown = (id: string, newCurrency: string) => {
    const item = items.find(i => i.id === id);
    handleCurrencyChange(id, newCurrency, item ? item.amount : 0);
  };

  const handleSave = () => {
    if (!expense) return;
    const validItems = items.filter(item => 
      item.description.trim() && item.amount > 0
    );
    if (validItems.length === 0) return;
    onUpdate(expense.id, validItems.map(({ description, amount, category, date }, idx) => ({
      description,
      amount: itemConverted[items[idx].id] || amount,
      category,
      date,
      original_amount: amount,
      original_currency: itemCurrencies[items[idx].id] || settings?.base_currency || 'USD',
      rate: itemRates[items[idx].id] || 1,
    })));
  };

  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Expense</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Modify expense details and categories
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={item.id} className="border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-6 space-y-4 bg-gray-50/50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Item {index + 1}</span>
                </div>
                {items.length > 1 && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl text-red-500 dark:text-red-400 transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`description-${item.id}`} className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Description
                </Label>
                <Input
                  id={`description-${item.id}`}
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  placeholder="Enter description"
                  className="h-12 text-base border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`amount-${item.id}`} className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Amount ({itemCurrencies[item.id] || settings?.base_currency || 'USD'})
                </Label>
                <div className="relative flex gap-2">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium">
                    {currencyOptions.find(opt => opt.code === (itemCurrencies[item.id] || settings?.base_currency || 'USD'))?.code || settings?.base_currency || 'USD'}
                  </span>
                  <Input
                    id={`amount-${item.id}`}
                    type="number"
                    value={item.amount}
                    onChange={(e) => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="h-12 text-base pl-12 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200 dark:bg-gray-700 dark:text-white"
                  />
                  <div className="w-1/2">
                    <CurrencySelector
                      value={itemCurrencies[item.id] || settings?.base_currency || 'USD'}
                      onChange={(newCurrency) => handleCurrencyDropdown(item.id, newCurrency)}
                      placeholder="Select currency"
                    />
                  </div>
                </div>
                {/* Show converted amount and rate if currency changed */}
                {itemCurrencies[item.id] && itemCurrencies[item.id] !== settings?.base_currency && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Converted: {itemConverted[item.id] || item.amount} {settings?.base_currency || 'USD'} (Rate: {itemRates[item.id] || 1})
                  </div>
                )}
                <small className="text-gray-500 dark:text-gray-400">
                  Transaction currency. Amount will be converted to your base currency ({settings?.base_currency || 'USD'}) for dashboard calculations.
                </small>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`date-${item.id}`} className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Date
                </Label>
                <Input
                  id={`date-${item.id}`}
                  type="date"
                  value={item.date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => updateItem(item.id, 'date', e.target.value)}
                  className="h-12 text-base border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Category
                </Label>
                <button
                  type="button"
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-200 text-left group"
                  onClick={() => setOpenCategoryModalId(item.id)}
                  aria-label={`Current category: ${item.category}. Click to change.`}
                >
                  <div className={`p-2 rounded-lg ${CATEGORY_COLORS[item.category]}`}>
                    {CATEGORY_ICONS[item.category] || CATEGORY_ICONS['Others']}
                  </div>
                  <div className="flex-1">
                    <span className="capitalize font-medium text-gray-900 dark:text-white">{item.category}</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Tap to change category</p>
                  </div>
                  <div className="text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </button>
                
                {/* Category Modal for this item */}
                {openCategoryModalId === item.id && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select Category</h3>
                        <button
                          onClick={() => setOpenCategoryModalId(null)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            aria-label={`Select category: ${cat}`}
                            onClick={() => { updateItem(item.id, 'category', cat); setOpenCategoryModalId(null); }}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                              item.category === cat 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 scale-105 shadow-lg' 
                                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                          >
                            <div className={`p-2 rounded-lg mb-2 ${CATEGORY_COLORS[cat]}`}>
                              {CATEGORY_ICONS[cat] || CATEGORY_ICONS['Others']}
                            </div>
                            <span className="capitalize text-gray-900 dark:text-white">{cat}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add New Item Button */}
          <button
            onClick={addNewItem}
            className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
          >
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <span className="text-gray-600 dark:text-gray-400 font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Add Another Item
              </span>
            </div>
          </button>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isLoading || items.some(item => !item.description.trim() || item.amount <= 0)}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditExpenseModal;
