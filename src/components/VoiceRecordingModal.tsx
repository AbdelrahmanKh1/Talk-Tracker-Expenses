import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Mic, Square, Play, Trash2 } from 'lucide-react';

interface VoiceRecordingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isRecording: boolean;
  audioBlob: Blob | null;
  isProcessing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearRecording: () => void;
  onProcessAudio: () => void;
}

const VoiceRecordingModal: React.FC<VoiceRecordingModalProps> = ({
  isOpen,
  onClose,
  isRecording,
  audioBlob,
  isProcessing,
  onStartRecording,
  onStopRecording,
  onClearRecording,
  onProcessAudio,
}) => {
  if (!isOpen) return null;

  const handlePlayRecording = () => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.play();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Voice Recording</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="text-center space-y-6">
          {/* Recording Status */}
          <div className="space-y-2">
            {isRecording ? (
              <div className="flex items-center justify-center gap-2 text-red-500 dark:text-red-400">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Recording...</span>
              </div>
            ) : audioBlob ? (
              <div className="text-green-600 dark:text-green-400 font-medium">Recording ready!</div>
            ) : (
              <div className="text-gray-600 dark:text-gray-400">Ready to record</div>
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
                onClick={onProcessAudio}
                disabled={isProcessing}
                className="w-full bg-gradient-to-br from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isProcessing ? 'Processing...' : 'Add Expenses from Voice'}
              </Button>
            </div>
          )}

          {/* Instructions */}
          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>Say something like:</p>
            <p className="italic">"Coffee 5 EGP, lunch 15 EGP, movie tickets 50 EGP"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceRecordingModal;
