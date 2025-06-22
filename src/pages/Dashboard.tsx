
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
        console.log('Audio size:', audioBlob.size, 'bytes');
        console.log('Base64 audio length:', base64Audio.length);
        
        const response = await fetch(`https://rslwcgjgzezptoblckua.supabase.co/functions/v1/process-voice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzbHdjZ2pnemV6cHRvYmxja3VhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjg4MjcsImV4cCI6MjA2NTk0NDgyN30.YArFJ4YmE6c_E-ieRhTwqzhcEl8_sJgS_8-ukbkWarc`,
          },
          body: JSON.stringify({ audio: base64Audio }),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Processing failed:', errorData);
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
          const message = result.transcription ? 
            `Transcribed: "${result.transcription}" - No expenses detected. Try saying something like "Coffee 5 dollars, lunch 15 dollars"` :
            'No speech detected. Please try recording again with clearer audio.';
          toast.info(message);
        }
      };

      reader.onerror = () => {
        throw new Error('Failed to read audio data');
      };
    } catch (error) {
      console.error('Error processing audio:', error);
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to process voice recording';
      
      if (error.message.includes('rate limit')) {
        errorMessage = 'OpenAI API rate limit reached. Please wait a moment and try again.';
      } else if (error.message.includes('quota') || error.message.includes('insufficient_quota')) {
        errorMessage = 'OpenAI API quota exceeded. Please check your OpenAI account at platform.openai.com';
      } else if (error.message.includes('invalid') && error.message.includes('key')) {
        errorMessage = 'OpenAI API key issue. Please contact support.';
      } else if (error.message.includes('too large')) {
        errorMessage = 'Audio recording is too long. Please record a shorter message.';
      } else if (error.message.includes('Bad request')) {
        errorMessage = 'Invalid audio format. Please try recording again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      console.log('Full error details:', error);
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
