import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Apple, Eye, EyeOff, Loader2, Mic, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLogo } from '@/components/AppLogo';

// Password validation utilities
const validatePassword = (password: string) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= minLength;

  return {
    isValid: isLongEnough && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    criteria: {
      length: isLongEnough,
      uppercase: hasUpperCase,
      lowercase: hasLowerCase,
      numbers: hasNumbers,
      special: hasSpecialChar
    }
  };
};

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const sanitizeInput = (input: string) => {
  return input.trim().replace(/[<>]/g, '');
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState(validatePassword(''));
  const [emailValidation, setEmailValidation] = useState(true);
  const { signIn, signUp, signInWithOAuth, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Validate password on change
  useEffect(() => {
    setPasswordValidation(validatePassword(password));
  }, [password]);

  // Validate email on change
  useEffect(() => {
    setEmailValidation(validateEmail(email));
  }, [email]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Input sanitization
      const sanitizedName = sanitizeInput(name);
      const sanitizedEmail = sanitizeInput(email);

      if (!isLogin) {
        if (!sanitizedName || sanitizedName.length < 2) {
          toast.error('Please enter a valid name (minimum 2 characters)');
          setLoading(false);
          return;
        }
        if (sanitizedName.length > 50) {
          toast.error('Name must be less than 50 characters');
          setLoading(false);
          return;
        }
      }

      // Email validation
      if (!validateEmail(sanitizedEmail)) {
        toast.error('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Password validation for signup
      if (!isLogin && !passwordValidation.isValid) {
        toast.error('Password does not meet security requirements');
        setLoading(false);
        return;
      }

      // Rate limiting check (basic implementation)
      const lastAttempt = localStorage.getItem('lastAuthAttempt');
      const now = Date.now();
      if (lastAttempt && (now - parseInt(lastAttempt)) < 2000) {
        toast.error('Please wait a moment before trying again');
        setLoading(false);
        return;
      }
      localStorage.setItem('lastAuthAttempt', now.toString());

      const { error } = isLogin 
        ? await signIn(sanitizedEmail, password)
        : await signUp(sanitizedEmail, password, sanitizedName);

      if (error) {
        toast.error(error);
      } else {
        if (isLogin) {
          toast.success('Successfully signed in!');
          navigate('/dashboard');
        } else {
          toast.success('Check your email to confirm your account');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      // Rate limiting check
      const lastAttempt = localStorage.getItem('lastOAuthAttempt');
      const now = Date.now();
      if (lastAttempt && (now - parseInt(lastAttempt)) < 3000) {
        toast.error('Please wait a moment before trying again');
        setLoading(false);
        return;
      }
      localStorage.setItem('lastOAuthAttempt', now.toString());

      const { error } = await signInWithOAuth(provider);
      if (error) {
        toast.error(error);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Hero Section */}
        <div className="hidden lg:block space-y-8">
          {/* App Logo and Title */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl shadow-lg flex items-center justify-center">
                <AppLogo size="lg" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Talk Tracker Expense</h1>
                <p className="text-gray-600 dark:text-gray-400">Voice-powered expense tracking</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                Track expenses with your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">
                  voice
                </span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                Simply speak your expenses and let AI handle the rest. 
                No more manual entry, no more forgetting transactions.
              </p>
            </div>
          </div>

          {/* Voice Command Examples */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Try saying:</h3>
            <div className="space-y-3">
              {[
                "Coffee $5, lunch $15, movie $10",
                "Uber ride $25, groceries $45.50",
                "Dinner at restaurant $68.75"
              ].map((command, index) => (
                <div 
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-white/20 flex items-center gap-3 group hover:shadow-md transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">{command}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { icon: "🎯", title: "Smart Categorization", desc: "AI automatically categorizes your expenses" },
              { icon: "📊", title: "Real-time Insights", desc: "Get instant spending analysis" },
              { icon: "🔒", title: "Secure & Private", desc: "Your data stays on your device" },
              { icon: "⚡", title: "Lightning Fast", desc: "Process expenses in seconds" }
            ].map((feature, index) => (
              <div key={index} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-2xl mb-2">{feature.icon}</div>
                <h4 className="font-semibold text-gray-900 text-sm">{feature.title}</h4>
                <p className="text-gray-600 text-xs">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex justify-center lg:justify-end">
          <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-0 shadow-2xl dark:bg-gray-800/90 dark:border-gray-700">
            <CardContent className="p-8">
              {/* Mobile Logo */}
              <div className="lg:hidden flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl shadow-lg flex items-center justify-center">
                  <AppLogo size="lg" />
                </div>
              </div>

              {/* Mobile Title */}
              <div className="lg:hidden text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Talk Tracker Expense</h1>
                <p className="text-gray-600 dark:text-gray-400">Voice-powered expense tracking</p>
              </div>

              {/* Form Title */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {isLogin ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {isLogin ? 'Sign in to continue tracking your expenses' : 'Start your voice-powered expense journey'}
                </p>
              </div>

              {/* Social Auth Buttons */}
              <div className="space-y-3 mb-6">
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-12 bg-white text-gray-900 border-gray-200 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Continue with Google
                </Button>

                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-12 bg-white text-gray-900 border-gray-200 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                  onClick={() => handleOAuthSignIn('apple')}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  ) : (
                    <Apple className="w-5 h-5 mr-3" />
                  )}
                  Continue with Apple
                </Button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">Or continue with email</span>
                </div>
              </div>

              {/* Email Auth Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      required={!isLogin}
                      className="h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-teal-400"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-teal-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className={`h-12 rounded-xl border-gray-200 focus:border-teal-500 focus:ring-teal-500 pr-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-teal-400 ${
                        !isLogin && password.length > 0 && !passwordValidation.isValid ? 'border-red-300 focus:border-red-500' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password Validation for Signup */}
                  {!isLogin && password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Password requirements:</p>
                      <div className="space-y-1">
                        {[
                          { key: 'length', label: 'At least 8 characters', met: passwordValidation.criteria.length },
                          { key: 'uppercase', label: 'One uppercase letter', met: passwordValidation.criteria.uppercase },
                          { key: 'lowercase', label: 'One lowercase letter', met: passwordValidation.criteria.lowercase },
                          { key: 'numbers', label: 'One number', met: passwordValidation.criteria.numbers },
                          { key: 'special', label: 'One special character', met: passwordValidation.criteria.special }
                        ].map((requirement) => (
                          <div key={requirement.key} className="flex items-center gap-2 text-xs">
                            {requirement.met ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-red-500" />
                            )}
                            <span className={requirement.met ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {requirement.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </Button>
              </form>

              {/* Toggle between login/signup */}
              <div className="text-center mt-6">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 text-sm font-medium transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>

              {/* Terms and Privacy */}
              <div className="text-center mt-8 text-xs text-gray-500 dark:text-gray-400">
                By continuing, you agree to our{' '}
                <button className="underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Terms of Service</button> and{' '}
                <button className="underline hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Privacy Policy</button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
