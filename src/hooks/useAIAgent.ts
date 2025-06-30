import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ParsedExpense {
  amount: number;
  category: string;
  description: string;
  confidence: number;
  error?: string;
}

interface ProcessingResult {
  transcription: string;
  expenses: ParsedExpense[];
  suggestions: string[];
  confidence: number;
  session_id: string;
  metadata: any;
  notification?: any;
  error?: string;
  error_details?: string;
}

interface ProcessingError {
  message: string;
  type: 'parsing' | 'database' | 'network' | 'validation';
  retryable: boolean;
}

interface AIAgentState {
  isProcessing: boolean;
  lastResult: ProcessingResult | null;
  sessionHistory: ProcessingResult[];
  userPreferences: any[];
  isLoadingPreferences: boolean;
  processingProgress: string;
}

// Remote Supabase function URL
const SUPABASE_FUNCTION_URL = "https://rslwcgjgzezptoblckua.functions.supabase.co/ai-agent-process-voice";

export const useAIAgent = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [state, setState] = useState<AIAgentState>({
    isProcessing: false,
    lastResult: null,
    sessionHistory: [],
    userPreferences: [],
    isLoadingPreferences: false,
    processingProgress: ''
  });

  // Utility functions
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  // Main processing function with exponential backoff
  const processVoiceInput = async (audio: string, selectedMonth?: string): Promise<ProcessingResult> => {
    const startTime = Date.now();
    const sessionId = crypto.randomUUID();
    
    setState(prev => ({ ...prev, isProcessing: true }));
    setState(prev => ({ ...prev, processingProgress: 'Processing voice input...' }));

    try {
      // Step 1: Get transcription and expenses from AI agent
      setState(prev => ({ ...prev, processingProgress: 'Transcribing audio...' }));
      const response = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ audio, selectedMonth }),
      });

      if (!response.ok) {
        throw new Error(`AI agent error: ${response.status}`);
      }

      const result: ProcessingResult = await response.json();
      
      // Check for specific error types
      if (result.error) {
        if (result.error === 'speech_recognition_not_configured') {
          throw new Error('Speech recognition is not configured. Please contact your administrator or use manual expense entry.');
        } else if (result.error === 'transcription_service_unavailable') {
          throw new Error('Speech recognition service is temporarily unavailable. Please try again later or use manual entry.');
        } else {
          throw new Error(result.error_details || result.error);
        }
      }
      
      if (!result.transcription || result.transcription.trim().length === 0) {
        throw new Error('No speech detected. Please try speaking more clearly or check your microphone.');
      }

      // Step 2: Use the expenses directly from AI agent (they're already inserted)
      setState(prev => ({ ...prev, processingProgress: 'Processing results...' }));
      
      // Convert the AI agent expenses to our ParsedExpense format
      const parsedExpenses: ParsedExpense[] = result.expenses.map((expense: any) => ({
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        confidence: 0.8 // Default confidence for AI-processed expenses
      }));

      // Step 3: Show results to user
      if (parsedExpenses.length > 0) {
        const totalAmount = parsedExpenses.reduce((sum, e) => sum + e.amount, 0);
        toast({
          title: "✅ Expenses Added",
          description: `${parsedExpenses.length} expense(s) totaling $${totalAmount.toFixed(2)} have been added to ${selectedMonth || 'current month'}.`,
        });
      } else {
        toast({
          title: "ℹ️ No Expenses Found",
          description: "No expenses were detected in your voice input. Try being more specific about amounts and items.",
        });
      }

      // Step 4: Show notification if provided by AI agent
      if (result.notification) {
        toast({
          title: result.notification.title,
          description: result.notification.body,
          variant: result.notification.title.includes('Exceeded') ? "destructive" : "default",
        });
      }

      // Step 5: Invalidate caches to update UI immediately
      if (parsedExpenses.length > 0) {
        // Invalidate expenses cache
        await queryClient.invalidateQueries({ queryKey: ['expenses'] });
        // Invalidate budget cache
        await queryClient.invalidateQueries({ queryKey: ['budget-status'] });
        // Invalidate user settings cache
        await queryClient.invalidateQueries({ queryKey: ['userSettings'] });
        
        console.log('Cache invalidated for expenses and budget updates');
      }

      const processingTime = Date.now() - startTime;
      const overallConfidence = result.confidence || 0.8;

      // Track analytics
      await trackAnalytics(sessionId, {
        transcription_length: result.transcription.length,
        expenses_count: parsedExpenses.length,
        processing_time_ms: processingTime,
        confidence: overallConfidence,
        success: true,
        selected_month: selectedMonth
      });

      const finalResult = {
        ...result,
        expenses: parsedExpenses,
        confidence: overallConfidence
      };

      // Update state with result
      setState(prev => ({
        ...prev,
        lastResult: finalResult,
        sessionHistory: [finalResult, ...prev.sessionHistory.slice(0, 9)] // Keep last 10
      }));

      return finalResult;

    } catch (error) {
      console.error('Voice processing error:', error);
      
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Track error analytics
      await trackAnalytics(sessionId, {
        transcription_length: 0,
        expenses_count: 0,
        processing_time_ms: processingTime,
        confidence: 0,
        success: false,
        error_type: error instanceof Error ? error.constructor.name : 'Unknown',
        selected_month: selectedMonth
      });

      toast({
        title: "❌ Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
      setState(prev => ({ ...prev, processingProgress: '' }));
    }
  };

  // Get user preferences and learning data
  const loadUserPreferences = useCallback(async () => {
    if (!session) return;

    setState(prev => ({ ...prev, isLoadingPreferences: true }));

    try {
      const { data, error } = await supabase
        .from('ai_user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .order('confidence_score', { ascending: false });

      if (error) throw error;

      setState(prev => ({
        ...prev,
        userPreferences: data || [],
        isLoadingPreferences: false
      }));

    } catch (error) {
      console.error('Error loading user preferences:', error);
      setState(prev => ({ ...prev, isLoadingPreferences: false }));
    }
  }, [session]);

  // Get conversation history
  const getConversationHistory = useCallback(async (sessionId?: string) => {
    if (!session) return [];

    try {
      let query = supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error loading conversation history:', error);
      return [];
    }
  }, [session]);

  // Get processing analytics
  const getProcessingAnalytics = useCallback(async (days: number = 30) => {
    if (!session) return null;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('ai_voice_analytics')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error) {
      console.error('Error loading analytics:', error);
      return null;
    }
  }, [session]);

  // Provide feedback to improve AI learning
  const provideFeedback = useCallback(async (
    sessionId: string,
    feedback: {
      transcription_accuracy?: number;
      expense_extraction_accuracy?: number;
      category_prediction_accuracy?: number;
      user_notes?: string;
    }
  ) => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('ai_voice_analytics')
        .update({
          user_feedback: feedback
        })
        .eq('session_id', sessionId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      toast.success('Thank you for your feedback! This helps improve the AI.');
    } catch (error) {
      console.error('Error providing feedback:', error);
      toast.error('Failed to submit feedback');
    }
  }, [session]);

  // Clear session history
  const clearSessionHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      sessionHistory: [],
      lastResult: null
    }));
  }, []);

  // Get AI insights and recommendations
  const getAIInsights = useCallback(async () => {
    if (!session) return null;

    try {
      // Get recent processing sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('ai_processing_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (sessionsError) throw sessionsError;

      // Get category learning patterns
      const { data: patterns, error: patternsError } = await supabase
        .from('ai_category_learning')
        .select('*')
        .eq('user_id', session.user.id)
        .order('confidence_score', { ascending: false })
        .limit(20);

      if (patternsError) throw patternsError;

      // Generate insights
      const insights = {
        totalProcessed: sessions?.length || 0,
        averageConfidence: sessions?.reduce((sum, s) => sum + (s.confidence_scores?.overall || 0), 0) / (sessions?.length || 1),
        topCategories: patterns?.slice(0, 5).map(p => p.suggested_category) || [],
        learningProgress: patterns?.length || 0,
        suggestions: []
      };

      // Generate personalized suggestions
      if (insights.averageConfidence < 0.7) {
        insights.suggestions.push('Try speaking more clearly and including amounts with currency');
      }

      if (insights.topCategories.length < 3) {
        insights.suggestions.push('Add more diverse expenses to improve category learning');
      }

      if (insights.totalProcessed < 5) {
        insights.suggestions.push('Use voice input more frequently to improve AI accuracy');
      }

      return insights;

    } catch (error) {
      console.error('Error getting AI insights:', error);
      return null;
    }
  }, [session]);

  // Track analytics for AI processing
  const trackAnalytics = useCallback(async (
    sessionId: string,
    data: {
      transcription_length: number;
      expenses_count: number;
      processing_time_ms: number;
      confidence: number;
      success: boolean;
      error_type?: string;
      selected_month?: string;
    }
  ) => {
    if (!session) return;

    try {
      await supabase
        .from('ai_voice_analytics')
        .insert({
          user_id: session.user.id,
          session_id: sessionId,
          transcription_length: data.transcription_length,
          expenses_count: data.expenses_count,
          processing_time_ms: data.processing_time_ms,
          confidence: data.confidence,
          success: data.success,
          error_type: data.error_type,
          selected_month: data.selected_month,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error tracking analytics:', error);
    }
  }, [session]);

  return {
    // State
    isProcessing: state.isProcessing,
    lastResult: state.lastResult,
    sessionHistory: state.sessionHistory,
    userPreferences: state.userPreferences,
    isLoadingPreferences: state.isLoadingPreferences,
    processingProgress: state.processingProgress,

    // Actions
    processVoiceInput,
    loadUserPreferences,
    getConversationHistory,
    getProcessingAnalytics,
    provideFeedback,
    clearSessionHistory,
    getAIInsights,
    trackAnalytics
  };
}; 