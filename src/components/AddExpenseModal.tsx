import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Utensils, Car, ShoppingBag, HeartPulse, Gamepad2, Receipt, Wallet, Box, Plus, TrendingUp, BookOpen, Plane, Scissors, Home, Briefcase } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useUserSettings } from '@/hooks/useUserSettings';
import { getExchangeRate } from '@/lib/exchangeRate';
import { toast } from 'sonner';
import { currencyOptions } from '@/lib/currencies';
import { CurrencySelector } from '@/components/CurrencySelector';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { description: string; amount: number; original_amount: number; original_currency: string; base_currency: string; category?: string; created_at: string; rate: number }) => void;
  isLoading: boolean;
  selectedMonth?: string;
}

const CATEGORY_ICONS: Record<string, JSX.Element> = {
  Food: <Utensils size={24} strokeWidth={2.2} className="text-orange-500" />,
  Transportation: <Car size={24} strokeWidth={2.2} className="text-blue-500" />,
  Shopping: <ShoppingBag size={24} strokeWidth={2.2} className="text-purple-500" />,
  Utilities: <Receipt size={24} strokeWidth={2.2} className="text-yellow-500" />,
  Entertainment: <Gamepad2 size={24} strokeWidth={2.2} className="text-green-500" />,
  Health: <HeartPulse size={24} strokeWidth={2.2} className="text-red-500" />,
  Fitness: <TrendingUp size={24} strokeWidth={2.2} className="text-pink-500" />,
  Education: <BookOpen size={24} strokeWidth={2.2} className="text-indigo-500" />,
  Travel: <Plane size={24} strokeWidth={2.2} className="text-cyan-500" />,
  'Personal care': <Scissors size={24} strokeWidth={2.2} className="text-rose-500" />,
  Home: <Home size={24} strokeWidth={2.2} className="text-lime-500" />,
  Work: <Briefcase size={24} strokeWidth={2.2} className="text-blue-900 dark:text-amber-400" />,
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

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  isLoading,
  selectedMonth 
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Others');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const { settings, isLoading: isSettingsLoading } = useUserSettings();
  const [currency, setCurrency] = useState(settings?.base_currency || 'USD');

  const { currency: useCurrencyCurrency } = useCurrency();

  const categories = [
    'Food',
    'Transportation',
    'Shopping',
    'Utilities',
    'Entertainment',
    'Health',
    'Fitness',
    'Education',
    'Travel',
    'Personal care',
    'Home',
    'Work',
    'Others',
  ];

  useEffect(() => {
    if (settings?.base_currency) setCurrency(settings.base_currency);
  }, [settings?.base_currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    let convertedAmount = parseFloat(amount);
    let rate = 1;
    if (currency !== settings?.base_currency && settings?.base_currency) {
      rate = await getExchangeRate(currency, settings.base_currency) || 0;
      if (rate === 0) {
        toast.error('Failed to fetch exchange rate. Please try again.');
        return;
      }
      convertedAmount = parseFloat((parseFloat(amount) * rate).toFixed(2));
    }

    onAdd({
      description,
      amount: convertedAmount,
      original_amount: parseFloat(amount),
      original_currency: currency,
      base_currency: settings?.base_currency,
      category,
      created_at: new Date().toISOString(),
      rate,
    });

    setDescription('');
    setAmount('');
    setCategory('Others');
    setCurrency(settings?.base_currency || 'USD');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl flex flex-col mx-0 sm:mx-0 max-h-[90vh] overflow-y-auto border border-white/20 dark:border-gray-700 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Expense</h2>
              {selectedMonth && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Adding to {selectedMonth}
                </p>
              )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Coffee 15, Uber ride 30, category: Food, date: 2024-07-01"
              className="h-12 text-base border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500/20 rounded-xl transition-all duration-200 dark:bg-gray-700 dark:text-white"
              required
            />
            <small className="text-gray-500 dark:text-gray-400">
              Example: Coffee 15, category: Food, date: 2024-07-01. Categories: Food, Transportation, Shopping, Utilities, Entertainment, Health, Fitness, Education, Travel, Personal care, Home, Work, Others.
            </small>
          </div>

          {/* Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Amount ({settings?.base_currency || 'USD'})
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium">
                {settings?.base_currency || 'USD'}
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-12 text-base pl-12 border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500/20 rounded-xl transition-all duration-200 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Currency Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="currency" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Transaction Currency
            </Label>
            <CurrencySelector
              value={currency}
              onChange={setCurrency}
              placeholder="Select transaction currency"
            />
            <small className="text-gray-500 dark:text-gray-400">
              Select the currency of this transaction. The amount will be converted to your base currency ({settings?.base_currency || 'USD'}) for dashboard calculations.
            </small>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Category
            </Label>
            <button
              type="button"
              className="w-full flex items-center gap-4 px-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-teal-300 dark:hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-all duration-200 text-left group"
              onClick={() => setIsCategoryModalOpen(true)}
              aria-label={`Current category: ${category}. Click to change.`}
            >
              <div className={`p-2 rounded-lg ${CATEGORY_COLORS[category]}`}>
                {CATEGORY_ICONS[category] || CATEGORY_ICONS['Others']}
              </div>
              <span className="font-semibold text-base text-gray-800 dark:text-white">{category}</span>
              <span className="ml-auto text-xs text-gray-400 group-hover:text-teal-500">Change</span>
            </button>
          {isCategoryModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setIsCategoryModalOpen(false)}>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Select Category</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                        className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all duration-150 focus:outline-none ${category === cat ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-teal-300 dark:hover:border-teal-500 hover:bg-teal-50/50 dark:hover:bg-teal-900/20'}`}
                      onClick={() => { setCategory(cat); setIsCategoryModalOpen(false); }}
                        aria-label={cat}
                    >
                        <div className="mb-1">{CATEGORY_ICONS[cat] || CATEGORY_ICONS['Others']}</div>
                        <span className="text-sm font-medium text-gray-800 dark:text-white">{cat}</span>
                    </button>
                  ))}
                  </div>
                  <button className="mt-6 w-full py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-150" onClick={() => setIsCategoryModalOpen(false)}>Cancel</button>
                </div>
              </div>
            )}
            </div>

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
              type="submit" 
              disabled={isLoading || !description || !amount}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Adding...
                </div>
              ) : (
                'Add Expense'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
