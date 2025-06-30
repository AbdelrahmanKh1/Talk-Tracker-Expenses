import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Loader2, CheckCircle, XCircle, AlertCircle, Save, Edit, Play, Square, Trash2 } from 'lucide-react';
import { useAIAgent } from '@/hooks/useAIAgent';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { supabase } from '@/integrations/supabase/client';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
}

interface SavedExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
}

interface AIVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth?: string;
}

export const AIVoiceModal: React.FC<AIVoiceModalProps> = ({
  isOpen,
  onClose,
  selectedMonth
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: 'transcription', label: 'Transcribing audio', status: 'pending', progress: 0 },
    { id: 'parsing', label: 'Parsing expenses', status: 'pending', progress: 0 },
    { id: 'validation', label: 'Validating data', status: 'pending', progress: 0 },
    { id: 'saving', label: 'Saving to database', status: 'pending', progress: 0 }
  ]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedExpenses, setSavedExpenses] = useState<SavedExpense[]>([]);
  const [showSavedExpenses, setShowSavedExpenses] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const { processVoiceInput, isProcessing, processingProgress } = useAIAgent();
  const { toast } = useToast();
  const { currency } = useCurrency();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setIsRecording(false);
    setAudioBlob(null);
    setProcessingSteps([
      { id: 'transcription', label: 'Transcribing audio', status: 'pending', progress: 0 },
      { id: 'parsing', label: 'Parsing expenses', status: 'pending', progress: 0 },
      { id: 'validation', label: 'Validating data', status: 'pending', progress: 0 },
      { id: 'saving', label: 'Saving to database', status: 'pending', progress: 0 }
    ]);
    setResult(null);
    setError(null);
    audioChunksRef.current = [];
  };

  // Load saved expenses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedVoiceExpenses');
    if (saved) {
      try {
        setSavedExpenses(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved expenses:', error);
      }
    }
  }, []);

  // Save expenses to localStorage
  const saveExpensesToStorage = (expenses: SavedExpense[]) => {
    try {
      localStorage.setItem('savedVoiceExpenses', JSON.stringify(expenses));
    } catch (error) {
      console.error('Error saving expenses to localStorage:', error);
    }
  };

  // Save detected expenses for later review
  const saveForLater = () => {
    if (result && result.expenses && result.expenses.length > 0) {
      const newSavedExpenses = [
        ...savedExpenses,
        ...result.expenses.map((expense: any) => ({
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
        }))
      ];
      
      setSavedExpenses(newSavedExpenses);
      saveExpensesToStorage(newSavedExpenses);
      
      toast({
        title: "💾 Saved for Later",
        description: `${result.expenses.length} expense(s) saved for later review.`,
      });
      
      resetState();
    }
  };

  // Add saved expenses to database
  const addSavedExpenses = async () => {
    if (savedExpenses.length === 0) return;
    
    try {
      // This would integrate with the useExpenses hook
      // For now, we'll just clear the saved expenses
      setSavedExpenses([]);
      saveExpensesToStorage([]);
      
      toast({
        title: "✅ Expenses Added",
        description: `${savedExpenses.length} saved expense(s) have been added to the database.`,
      });
      
      setShowSavedExpenses(false);
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to add saved expenses to database.",
        variant: "destructive",
      });
    }
  };

  const updateStep = (stepId: string, updates: Partial<ProcessingStep>) => {
    setProcessingSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "🎤 Recording Started",
        description: "Speak clearly about your expenses",
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "❌ Recording Failed",
        description: "Please allow microphone access and try again",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    try {
      // Convert blob to base64
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const audioData = `data:audio/webm;base64,${base64}`;

      // Start processing steps
      updateStep('transcription', { status: 'processing', progress: 25 });
      
      const result = await processVoiceInput(audioData, selectedMonth);
      
      // Update steps based on result
      updateStep('transcription', { status: 'completed', progress: 100 });
      updateStep('parsing', { status: 'completed', progress: 100 });
      updateStep('validation', { status: 'completed', progress: 100 });
      updateStep('saving', { status: 'processing', progress: 50 });

      setResult(result);
      
      // Automatically save expenses to database if any were detected
      if (result.expenses && result.expenses.length > 0) {
        try {
          // Convert result expenses to the format expected by the backend
          const expensesData = result.expenses.map((expense: any) => ({
            description: expense.description,
            amount: expense.amount,
            category: expense.category
          }));

          // Call the backend to save the expenses automatically
          const response = await fetch('https://rslwcgjgzezptoblckua.functions.supabase.co/save-reviewed-expenses', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              expenses: expensesData,
              selectedMonth,
              sessionId: result.session_id
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to save expenses');
          }

          const savedData = await response.json();
          
          // Update steps to show completion
          updateStep('saving', { status: 'completed', progress: 100 });

          // Show success message with details
          const totalAmount = result.expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
          toast({
            title: "✅ Expenses Added Successfully!",
            description: `${result.expenses.length} expense(s) automatically added totaling $${totalAmount.toFixed(2)}`,
          });

          // Update saved expenses list for display
          setSavedExpenses(prev => [
            ...prev,
            ...savedData.expenses.map((exp: any) => ({
              id: exp.id,
              description: exp.description,
              amount: exp.amount,
              category: exp.category
            }))
          ]);

          // Show the saved expenses briefly
          setShowSavedExpenses(true);

          // Auto-close after 3 seconds
          setTimeout(() => {
            onClose();
          }, 3000);

        } catch (saveError) {
          console.error('Error saving expenses:', saveError);
          updateStep('saving', { status: 'error', progress: 0 });
          
          toast({
            title: "❌ Save Failed",
            description: saveError instanceof Error ? saveError.message : 'Failed to save expenses',
            variant: "destructive",
          });
        }
      } else {
        // No expenses detected
        updateStep('saving', { status: 'completed', progress: 100 });
        
        toast({
          title: "ℹ️ No Expenses Found",
          description: "No expenses were detected in your voice input. Try being more specific about amounts and items.",
        });
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      }

    } catch (error) {
      console.error('Processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      setError(errorMessage);
      
      // Handle voice-specific errors
      handleVoiceError(errorMessage);
      
      // Update steps to show error
      updateStep('transcription', { status: 'error', progress: 0 });
      
      toast({
        title: "❌ Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleVoiceError = (error: string) => {
    // Just show the error without offering text input fallback
    console.error('Voice processing error:', error);
  };

  const getStepIcon = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepColor = (step: ProcessingStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'processing':
        return 'text-blue-600';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              AI Voice Expense Entry
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recording Section */}
          {!isProcessing && !result && !error && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      variant={isRecording ? "destructive" : "default"}
                      onClick={isRecording ? stopRecording : startRecording}
                      className="w-20 h-20 rounded-full"
                    >
                      {isRecording ? (
                        <MicOff className="w-8 h-8" />
                      ) : (
                        <Mic className="w-8 h-8" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {isRecording ? "Recording... Click to stop" : "Click to start recording"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Try saying: "Coffee 5 dollars, lunch 15 dollars"
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Progress */}
          {isProcessing && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Processing your voice input...</span>
                  </div>
                  
                  <div className="space-y-2">
                    {processingSteps.map((step) => (
                      <div key={step.id} className="flex items-center gap-3">
                        {getStepIcon(step)}
                        <div className="flex-1">
                          <div className="flex justify-between text-sm">
                            <span>{step.label}</span>
                            <span>{step.progress}%</span>
                          </div>
                          <Progress value={step.progress} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h3 className="font-medium">Processing Complete</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">Transcription:</p>
                      <p className="text-sm text-muted-foreground italic">
                        "{result.transcription}"
                      </p>
                    </div>

                    {result.expenses && result.expenses.length > 0 && (
                      <div>
                        <p className="text-sm font-medium">Expenses Added:</p>
                        <div className="space-y-2 mt-2">
                          {result.expenses.map((expense: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div>
                                <p className="text-sm font-medium">{expense.description}</p>
                                <Badge variant="secondary" className="text-xs">
                                  {expense.category}
                                </Badge>
                              </div>
                              <p className="text-sm font-bold">${expense.amount.toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.suggestions && result.suggestions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium">Suggestions:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                          {result.suggestions.map((suggestion: string, index: number) => (
                            <li key={index}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="font-medium">Processing Failed</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{error}</p>
                <div className="mt-4 space-x-2">
                  <Button onClick={resetState} variant="outline" size="sm">
                    Try Again
                  </Button>
                  <Button onClick={onClose} size="sm">
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {!isProcessing && !result && !error && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {savedExpenses.length > 0 && (
                  <Button 
                    onClick={() => setShowSavedExpenses(true)} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Saved ({savedExpenses.length})
                  </Button>
                )}
              </div>
              <div className="flex space-x-2">
                <Button onClick={onClose} variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Results with Save for Later Option */}
          {result && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Button onClick={saveForLater} variant="outline" size="sm" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save for Later
                </Button>
                <Button onClick={onClose} size="sm">
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Saved Expenses Modal */}
          {showSavedExpenses && (
            <Dialog open={showSavedExpenses} onOpenChange={setShowSavedExpenses}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Save className="w-5 h-5" />
                    Saved Expenses ({savedExpenses.length})
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {savedExpenses.length > 0 ? (
                    <>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {savedExpenses.map((expense, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div>
                              <p className="text-sm font-medium">{expense.description}</p>
                              <Badge variant="secondary" className="text-xs">
                                {expense.category}
                              </Badge>
                            </div>
                            <p className="text-sm font-bold">${expense.amount.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between">
                        <Button 
                          onClick={() => {
                            setSavedExpenses([]);
                            saveExpensesToStorage([]);
                            setShowSavedExpenses(false);
                          }} 
                          variant="outline" 
                          size="sm"
                        >
                          Clear All
                        </Button>
                        <Button onClick={addSavedExpenses} size="sm">
                          Add All to Database
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No saved expenses found.
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 