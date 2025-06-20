
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses } from '@/hooks/useExpenses';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import AddExpenseModal from '@/components/AddExpenseModal';
import VoiceRecordingModal from '@/components/VoiceRecordingModal';
import { LogOut, Plus } from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { expenses, isLoading, addExpense, isAddingExpense, getMonthlyTotal, getRecentExpenses } = useExpenses();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
    { label: 'Jun', year: '2025', active: true },
    { label: 'May', year: '2025', active: false },
    { label: 'Apr', year: '2025', active: false },
    { label: 'Mar', year: '2025', active: false },
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

  const handleProcessAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    try {
      // For now, we'll show a placeholder message
      // Later we'll implement the actual AI processing
      toast.success('Voice processing will be implemented next!');
      console.log('Audio blob ready for processing:', audioBlob);
      
      // Close modal after processing
      setIsVoiceModalOpen(false);
      clearRecording();
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process voice recording');
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
          <div className="flex items-center gap-1">
            <span className="text-lg">🇪🇬</span>
            <span>EGP</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
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
          <h2 className="text-gray-600 mb-2">My expenses in June</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-gray-600">EGP</span>
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
                <div key={expense.id} className="bg-white rounded-2xl p-4">
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
                      <div className="font-semibold">EGP {expense.amount}</div>
                      <div className="text-xs text-gray-500">{expense.date}</div>
                    </div>
                  </div>
                </div>
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

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addExpense}
        isLoading={isAddingExpense}
      />

      {/* Voice Recording Modal */}
      <VoiceRecordingModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        isRecording={isRecording}
        audioBlob={audioBlob}
        isProcessing={isProcessing}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onClearRecording={clearRecording}
        onProcessAudio={handleProcessAudio}
      />
    </div>
  );
};

export default Dashboard;
