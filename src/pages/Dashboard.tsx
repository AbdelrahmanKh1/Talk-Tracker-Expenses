
import React, { useState } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { toast } from 'sonner';
import DashboardHeader from '@/components/DashboardHeader';
import CurrencyPlanInfo from '@/components/CurrencyPlanInfo';
import ExpenseSummary from '@/components/ExpenseSummary';
import MonthSelector from '@/components/MonthSelector';
import RecentExpensesList from '@/components/RecentExpensesList';
import VoiceInputFab from '@/components/VoiceInputFab';
import DashboardModals from '@/components/DashboardModals';

const Dashboard = () => {
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
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzbHdjZ2pnemV6cHRvYmxja3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjg4MjcsImV4cCI6MjA2NTk0NDgyN30.YArFJ4YmE6c_E-ieRhTwqzhcEl8_sJgS_8-ukbkWarc`,
          },
          body: JSON.stringify({ audio: base64Audio }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Processing failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Processing result:', result);

        if (result.error) {
          throw new Error(result.error);
        }

        if (result.expenses && result.expenses.length > 0) {
          console.log('Adding expenses:', result.expenses);
          addBulkExpenses(result.expenses);
          toast.success(`Added ${result.expenses.length} expenses from: "${result.transcription}"`);
          setIsVoiceModalOpen(false);
          clearRecording();
        } else {
          toast.info(`Transcribed: "${result.transcription}" - No expenses detected. Try saying something like "Coffee 5 dollars, lunch 15 dollars"`);
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
          expenses={recentExpenses}
          onAddExpense={() => setIsAddModalOpen(true)}
          onEditExpense={handleExpenseEdit}
          onDeleteExpense={handleExpenseDelete}
        />
      </div>

      <VoiceInputFab onVoiceClick={() => setIsVoiceModalOpen(true)} />

      <DashboardModals
        isAddModalOpen={isAddModalOpen}
        onAddModalClose={() => setIsAddModalOpen(false)}
        onAddExpense={addExpense}
        isAddingExpense={isAddingExpense}
        
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
