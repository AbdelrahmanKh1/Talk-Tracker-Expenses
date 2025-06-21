
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses } from '@/hooks/useExpenses';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useCurrency } from '@/hooks/useCurrency';
import AddExpenseModal from '@/components/AddExpenseModal';
import EditExpenseModal from '@/components/EditExpenseModal';
import VoiceRecordingModal from '@/components/VoiceRecordingModal';
import SwipeableExpenseItem from '@/components/SwipeableExpenseItem';
import { LogOut, Plus } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { currency } = useCurrency();
  const { 
    expenses, 
    isLoading, 
    addExpense, 
    isAddingExpense, 
    addBulkExpenses, 
    isAddingBulkExpenses, 
    updateExpense,
    isUpdatingExpense,
    deleteExpense,
    isDeletingExpense,
    getMonthlyTotal, 
    getRecentExpenses 
  } = useExpenses();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('Jun 2025');

  const {
    isRecording,
    audioBlob,
    isProcessing,
    startRecording,
    stopRecording,
    clearRecording,
    setIsProcessing,
  } = useVoiceRecording();

  const months = [
    { label: 'Jun', year: '2025', active: selectedMonth === 'Jun 2025' },
    { label: 'May', year: '2025', active: selectedMonth === 'May 2025' },
    { label: 'Apr', year: '2025', active: selectedMonth === 'Apr 2025' },
    { label: 'Mar', year: '2025', active: selectedMonth === 'Mar 2025' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserName = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const handleExpenseEdit = (expense) => {
    setSelectedExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleExpenseDelete = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(expenseId);
    }
  };

  const handleUpdateExpense = (expenseId, items) => {
    updateExpense({ expenseId, items });
    setIsEditModalOpen(false);
    setSelectedExpense(null);
  };

  const handleProcessAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error('Failed to convert audio to base64');
        }

        console.log('Sending audio for processing...');
        
        const response = await fetch(`https://rslwcgjgzezptoblckua.supabase.co/functions/v1/process-voice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzbHdjZ2pnemV6cHRvYmxja3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjg4MjcsImV4cCI6MjA2NTk0NDgyN30.YArFJ4YmE6c_E-ieRhTwqzhcEl8_sJgS_8-ukbkWarc'}`,
          },
          body: JSON.stringify({ audio: base64Audio }),
        });

        if (!response.ok) {
          throw new Error(`Processing failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Processing result:', result);

        if (result.expenses && result.expenses.length > 0) {
          addBulkExpenses(result.expenses);
          toast.success(`Found ${result.expenses.length} expenses: "${result.transcription}"`);
        } else {
          toast.info(`Transcribed: "${result.transcription}" - No expenses detected. Try saying something like "Coffee 5 EGP"`);
        }

        setIsVoiceModalOpen(false);
        clearRecording();
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process voice recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const monthlyTotal = getMonthlyTotal();
  const recentExpenses = getRecentExpenses();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Ahlan {getUserName()} 👋</h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2"/>
            </svg>
          </button>
          <button
            onClick={handleSignOut}
            className="p-2 hover:bg-gray-100 rounded-full"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Currency and Plan Info */}
      <div className="px-4 py-2 bg-white border-b">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <button 
            onClick={() => navigate('/currency')}
            className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded"
          >
            <span className="text-lg">{currency.flag}</span>
            <span>{currency.code}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span>FREE</span>
          <div className="flex items-center gap-1">
            <span>{expenses.length}/50</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Expense Summary */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-gray-600 mb-2">My expenses in {selectedMonth.split(' ')[0]}</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-gray-600">{currency.code}</span>
            <span className="text-5xl font-bold">{monthlyTotal.toFixed(0)}</span>
          </div>
        </div>

        {/* Month Selection */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-teal-500 rounded flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="white" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="2"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold">Select Month</h3>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2">
            {months.map((month, index) => (
              <Button
                key={index}
                variant={month.active ? "default" : "outline"}
                className={`flex-shrink-0 rounded-2xl px-6 py-3 ${
                  month.active 
                    ? "bg-teal-500 hover:bg-teal-600 text-white" 
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedMonth(`${month.label} ${month.year}`)}
              >
                <div className="text-center">
                  <div className="font-medium">{month.label}</div>
                  <div className="text-sm opacity-80">{month.year}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Recent Expenses */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Expenses</h3>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Expense
            </button>
          </div>
          
          {recentExpenses.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-gray-500">
              <p>No expenses yet. Add your first expense!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <SwipeableExpenseItem
                  key={expense.id}
                  expense={expense}
                  onEdit={handleExpenseEdit}
                  onDelete={handleExpenseDelete}
                  currencySymbol={currency.symbol}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Voice Input Button */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <button 
          onClick={() => setIsVoiceModalOpen(true)}
          className="w-16 h-16 bg-teal-500 rounded-full shadow-lg flex items-center justify-center hover:bg-teal-600 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="white"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 19v4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 23h8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addExpense}
        isLoading={isAddingExpense}
      />

      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedExpense(null);
        }}
        expense={selectedExpense}
        onUpdate={handleUpdateExpense}
        isLoading={isUpdatingExpense}
      />

      <VoiceRecordingModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        isRecording={isRecording}
        audioBlob={audioBlob}
        isProcessing={isProcessing || isAddingBulkExpenses}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onClearRecording={clearRecording}
        onProcessAudio={handleProcessAudio}
      />
    </div>
  );
};

export default Dashboard;
