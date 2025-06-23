import React, { useState } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DashboardHeader from '@/components/DashboardHeader';
import CurrencyPlanInfo from '@/components/CurrencyPlanInfo';
import ExpenseSummary from '@/components/ExpenseSummary';
import MonthSelector from '@/components/MonthSelector';
import RecentExpensesList from '@/components/RecentExpensesList';
import VoiceInputFab from '@/components/VoiceInputFab';
import DashboardModals from '@/components/DashboardModals';

const Dashboard = () => {
  const { session } = useAuth();
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
    getMonthlyTotal, 
    getExpensesForMonth,
    getRecentExpenses 
  } = useExpenses();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  
  // Initialize with current month
  const getCurrentMonth = () => {
    const now = new Date();
    const monthName = now.toLocaleDateString('en-US', { month: 'short' });
    const year = now.getFullYear();
    return `${monthName} ${year}`;
  };
  
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const {
    isRecording,
    audioBlob,
    isProcessing,
    startRecording,
    stopRecording,
    clearRecording,
    setIsProcessing,
  } = useVoiceRecording();

  const handleExpenseEdit = (expense: any) => {
    setSelectedExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleExpenseDelete = async (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(expenseId);
    }
  };

  const handleUpdateExpense = (expenseId: string, items: any[]) => {
    updateExpense({ expenseId, items });
    setIsEditModalOpen(false);
    setSelectedExpense(null);
  };

  const handleAddExpense = (data: { description: string; amount: number; category?: string }) => {
    addExpense({ ...data, selectedMonth });
  };

  const handleProcessAudio = async () => {
    if (!audioBlob || !session) {
      console.error('No audio blob or session available');
      toast.error('Authentication required');
      return;
    }

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error('Failed to convert audio to base64');
        }

        console.log('Sending audio for processing with auth token...');
        
        const response = await fetch(`https://rslwcgjgzezptoblckua.supabase.co/functions/v1/process-voice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ audio: base64Audio }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Processing failed';
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          
          throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log('Processing result:', result);

        if (result.error) {
          throw new Error(result.error);
        }

        if (result.expenses && result.expenses.length > 0) {
          console.log('Adding expenses:', result.expenses);
          addBulkExpenses({ expenses: result.expenses, selectedMonth });
          toast.success(`Added ${result.expenses.length} expenses from: "${result.transcription}"`);
          setIsVoiceModalOpen(false);
          clearRecording();
        } else {
          toast.info(`Transcribed: "${result.transcription}" - No expenses detected. Try saying something like "Coffee 5 EGP, lunch 15 EGP"`);
        }
      };

      reader.onerror = () => {
        throw new Error('Failed to read audio data');
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error(`Failed to process voice recording: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const monthlyTotal = getMonthlyTotal(selectedMonth);
  const monthExpenses = getExpensesForMonth(selectedMonth);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <CurrencyPlanInfo expenseCount={expenses.length} />

      <div className="px-4 py-6 space-y-6">
        <ExpenseSummary 
          monthlyTotal={monthlyTotal} 
          selectedMonth={selectedMonth}
        />

        <MonthSelector 
          selectedMonth={selectedMonth}
          onMonthSelect={setSelectedMonth}
        />

        <RecentExpensesList
          expenses={monthExpenses}
          onAddExpense={() => setIsAddModalOpen(true)}
          onEditExpense={handleExpenseEdit}
          onDeleteExpense={handleExpenseDelete}
        />
      </div>

      <VoiceInputFab onVoiceClick={() => setIsVoiceModalOpen(true)} />

      <DashboardModals
        isAddModalOpen={isAddModalOpen}
        onAddModalClose={() => setIsAddModalOpen(false)}
        onAddExpense={handleAddExpense}
        isAddingExpense={isAddingExpense}
        selectedMonth={selectedMonth}
        
        isEditModalOpen={isEditModalOpen}
        onEditModalClose={() => {
          setIsEditModalOpen(false);
          setSelectedExpense(null);
        }}
        selectedExpense={selectedExpense}
        onUpdateExpense={handleUpdateExpense}
        isUpdatingExpense={isUpdatingExpense}
        
        isVoiceModalOpen={isVoiceModalOpen}
        onVoiceModalClose={() => setIsVoiceModalOpen(false)}
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
