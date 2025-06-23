
import React from 'react';
import AddExpenseModal from './AddExpenseModal';
import EditExpenseModal from './EditExpenseModal';
import VoiceRecordingModal from './VoiceRecordingModal';

interface DashboardModalsProps {
  isAddModalOpen: boolean;
  onAddModalClose: () => void;
  onAddExpense: (data: { description: string; amount: number; category?: string }) => void;
  isAddingExpense: boolean;
  selectedMonth?: string;
  
  isEditModalOpen: boolean;
  onEditModalClose: () => void;
  selectedExpense: any;
  onUpdateExpense: (expenseId: string, items: any[]) => void;
  isUpdatingExpense: boolean;
  
  isVoiceModalOpen: boolean;
  onVoiceModalClose: () => void;
  isRecording: boolean;
  audioBlob: Blob | null;
  isProcessing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearRecording: () => void;
  onProcessAudio: () => void;
}

const DashboardModals = ({
  isAddModalOpen,
  onAddModalClose,
  onAddExpense,
  isAddingExpense,
  selectedMonth,
  
  isEditModalOpen,
  onEditModalClose,
  selectedExpense,
  onUpdateExpense,
  isUpdatingExpense,
  
  isVoiceModalOpen,
  onVoiceModalClose,
  isRecording,
  audioBlob,
  isProcessing,
  onStartRecording,
  onStopRecording,
  onClearRecording,
  onProcessAudio,
}: DashboardModalsProps) => {
  return (
    <>
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={onAddModalClose}
        onAdd={onAddExpense}
        isLoading={isAddingExpense}
        selectedMonth={selectedMonth}
      />

      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={onEditModalClose}
        expense={selectedExpense}
        onUpdate={onUpdateExpense}
        isLoading={isUpdatingExpense}
      />

      <VoiceRecordingModal
        isOpen={isVoiceModalOpen}
        onClose={onVoiceModalClose}
        isRecording={isRecording}
        audioBlob={audioBlob}
        isProcessing={isProcessing}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        onClearRecording={onClearRecording}
        onProcessAudio={onProcessAudio}
      />
    </>
  );
};

export default DashboardModals;
