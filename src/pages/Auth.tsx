
import React from 'react';
import { Button } from '@/components/ui/button';
import { Apple } from 'lucide-react';

const Auth = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6 py-12">
      <div className="max-w-sm mx-auto w-full">
        {/* App Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4z" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Title and Subtitle */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Track expenses with your voice
          </h1>
          <p className="text-gray-600 text-lg">
            Just speak, we'll handle the rest
          </p>
        </div>

        {/* Example Voice Command */}
        <div className="bg-white rounded-2xl p-4 mb-12 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="white"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19v4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 23h8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-gray-700">Coffee $5, lunch $15, movie $10</span>
          </div>
        </div>

        {/* Authentication Buttons */}
        <div className="space-y-4">
          <Button 
            className="w-full h-14 bg-white text-black border border-gray-200 hover:bg-gray-50 rounded-2xl text-base font-medium"
            onClick={() => console.log('Continue with Apple')}
          >
            <Apple className="w-5 h-5 mr-3" />
            Continue with Apple
          </Button>

          <Button 
            className="w-full h-14 bg-gray-900 text-white hover:bg-gray-800 rounded-2xl text-base font-medium"
            onClick={() => console.log('Continue with Google')}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <Button 
            variant="ghost" 
            className="w-full h-14 text-gray-600 hover:text-gray-800 text-base font-medium"
            onClick={() => console.log('Continue with Email')}
          >
            Continue with Email
          </Button>
        </div>

        {/* Terms and Privacy */}
        <div className="text-center mt-8 text-sm text-gray-500">
          By continuing, you agree to our{' '}
          <button className="underline">Terms</button> and{' '}
          <button className="underline">Privacy Policy</button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
