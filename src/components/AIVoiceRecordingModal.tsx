import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, Mic, Square, Play, Trash2, Brain, Lightbulb, TrendingUp, History, Settings } from 'lucide-react';
import { useAIAgent } from '@/hooks/useAIAgent';

interface AIVoiceRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRecording: boolean;
  audioBlob: Blob | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearRecording: () => void;
  selectedMonth: string;
}

const AIVoiceRecordingModal: React.FC<AIVoiceRecordingModalProps> = ({
  isOpen,
  onClose,
  isRecording,
  audioBlob,
  onStartRecording,
  onStopRecording,
  onClearRecording,
  selectedMonth,
}) => {
  const {
    processVoiceWithAI,
    isProcessing,
    lastResult,
    sessionHistory,
    getAIInsights,
    provideFeedback
  } = useAIAgent();

  const [aiInsights, setAiInsights] = useState<any>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [feedback, setFeedback] = useState({
    transcription_accuracy: 5,
    expense_extraction_accuracy: 5,
    category_prediction_accuracy: 5,
    user_notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadAIInsights();
    }
  }, [isOpen]);

  const loadAIInsights = async () => {
    const insights = await getAIInsights();
    setAiInsights(insights);
  };

  const handlePlayRecording = () => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.play();
    }
  };

  const handleProcessAudio = async () => {
    if (!audioBlob) return;

    const result = await processVoiceWithAI(audioBlob, selectedMonth);
    if (result) {
      // Clear recording after successful processing
      onClearRecording();
    }
  };

  const handleFeedbackSubmit = async () => {
    if (lastResult?.session_id) {
      await provideFeedback(lastResult.session_id, feedback);
      setFeedback({
        transcription_accuracy: 5,
        expense_extraction_accuracy: 5,
        category_prediction_accuracy: 5,
        user_notes: ''
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Voice Assistant</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Powered by intelligent expense recognition</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* AI Insights Panel */}
          {aiInsights && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  AI Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Sessions Processed</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{aiInsights.totalProcessed}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Avg Confidence</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {(aiInsights.averageConfidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Categories Learned</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{aiInsights.learningProgress}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Top Category</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {aiInsights.topCategories[0] || 'None'}
                    </p>
                  </div>
                </div>
                {aiInsights.suggestions.length > 0 && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Suggestions:</p>
                    {aiInsights.suggestions.map((suggestion: string, index: number) => (
                      <p key={index} className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-yellow-500" />
                        {suggestion}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recording Status */}
          <div className="text-center space-y-2">
            {isRecording ? (
              <div className="flex items-center justify-center gap-2 text-red-500 dark:text-red-400">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Recording...</span>
              </div>
            ) : audioBlob ? (
              <div className="text-green-600 dark:text-green-400 font-medium">Recording ready for AI processing!</div>
            ) : (
              <div className="text-gray-600 dark:text-gray-400">Ready to record with AI assistance</div>
            )}
          </div>

          {/* Main Action Button */}
          <div className="flex justify-center">
            {!isRecording && !audioBlob && (
              <Button
                onClick={onStartRecording}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <Mic className="w-8 h-8" />
              </Button>
            )}

            {isRecording && (
              <Button
                onClick={onStopRecording}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <Square className="w-8 h-8" />
              </Button>
            )}
          </div>

          {/* Audio Controls */}
          {audioBlob && !isRecording && (
            <div className="space-y-4">
              <div className="flex justify-center gap-3">
                <Button
                  onClick={handlePlayRecording}
                  variant="outline"
                  className="flex items-center gap-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-teal-200 dark:hover:border-teal-600"
                >
                  <Play className="w-4 h-4" />
                  Play
                </Button>
                <Button
                  onClick={onClearRecording}
                  variant="outline"
                  className="flex items-center gap-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-red-200 dark:hover:border-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </Button>
              </div>

              <Button
                onClick={handleProcessAudio}
                disabled={isProcessing}
                className="w-full bg-gradient-to-br from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    AI Processing...
                  </div>
                ) : (
                  'Process with AI Assistant'
                )}
              </Button>
            </div>
          )}

          {/* Last Result Display */}
          {lastResult && (
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
                  <Brain className="w-4 h-4" />
                  AI Processing Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Transcription:</p>
                  <p className="text-sm text-gray-900 dark:text-white italic">"{lastResult.transcription}"</p>
                </div>
                
                {lastResult.expenses && lastResult.expenses.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Extracted Expenses:</p>
                    <div className="space-y-1">
                      {lastResult.expenses.map((expense: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{expense.description}</p>
                            <Badge variant="secondary" className="text-xs">{expense.category}</Badge>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            EGP {expense.amount}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Confidence:</p>
                  <Progress value={lastResult.confidence * 100} className="flex-1 h-2" />
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {(lastResult.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {lastResult.suggestions && lastResult.suggestions.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">AI Suggestions:</p>
                    {lastResult.suggestions.map((suggestion: string, index: number) => (
                      <p key={index} className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3 text-yellow-500" />
                        {suggestion}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
            <p className="font-medium">Try these voice commands:</p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <p className="italic">"Coffee 5 EGP, lunch 15 EGP, movie tickets 50 EGP"</p>
              <p className="italic">"I spent 20 on groceries and 30 on gas"</p>
              <p className="italic">"Bought a shirt for 25 dollars"</p>
              <p className="italic">"Paid 100 for electricity bill"</p>
            </div>
          </div>

          {/* Session History Toggle */}
          {sessionHistory.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <Button
                variant="ghost"
                onClick={() => setShowInsights(!showInsights)}
                className="w-full flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <History className="w-4 h-4" />
                {showInsights ? 'Hide' : 'Show'} Session History ({sessionHistory.length})
              </Button>
            </div>
          )}

          {/* Session History */}
          {showInsights && sessionHistory.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {sessionHistory.slice(0, 5).map((session, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {new Date().toLocaleTimeString()}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white mb-1">
                    "{session.transcription}"
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {session.expenses?.length || 0} expenses
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {(session.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIVoiceRecordingModal; 