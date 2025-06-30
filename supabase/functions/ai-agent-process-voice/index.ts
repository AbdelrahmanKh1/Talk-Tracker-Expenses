import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExpenseItem {
  description: string;
  amount: number;
  category: string;
  confidence: number;
  date?: string;
}

interface ProcessingResult {
  transcription: string;
  expenses: ExpenseItem[];
  suggestions: string[];
  confidence: number;
  session_id: string;
  metadata: any;
}

class AIAgent {
  private supabase: any;
  private userId: string;
  private sessionId: string;

  constructor(supabase: any, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
    this.sessionId = crypto.randomUUID();
  }

  // Utility: Normalize Arabic/Indic digits to Western digits
  private normalizeDigits(text: string): string {
    // Arabic-Indic digits
    const arabicIndic = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
    // Eastern Arabic-Indic digits
    const easternArabicIndic = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    let normalized = text;
    for (let i = 0; i < 10; i++) {
      const re1 = new RegExp(arabicIndic[i], 'g');
      const re2 = new RegExp(easternArabicIndic[i], 'g');
      normalized = normalized.replace(re1, i.toString()).replace(re2, i.toString());
    }
    return normalized;
  }

  // Enhanced expense extraction with AI learning (multilingual)
  async extractExpenses(text: string): Promise<ExpenseItem[]> {
    try {
      // Normalize digits
      const normalizedText = this.normalizeDigits(text);
      // Multilingual system prompt
      const aiPrompt = `SYSTEM PROMPT — MULTILINGUAL EXPENSE PARSER\n\nYou are an AI voice assistant in a personal finance app. A user speaks in Arabic, English, or both, and your job is to extract structured expense data from the voice transcript.\n\n🧠 Input:\nA transcribed sentence from the user, possibly containing multiple expense items like:\n\n"دفعت ١٥ على القهوة"\n\n"Spent 30 on groceries and 20 for gas"\n\n🎯 Your task:\nExtract each expense item into:\n\n"amount" → number (numeric format only)\n\n"description" → short (like "coffee", "bus", "مطعم")\n\n"category" → from the allowed list\n\n✅ Allowed Categories:\n"Food", "Transport", "Groceries", "Health", "Shopping", "Entertainment", "Utilities", "Travel", "Bills", "Other"\n\nChoose the best match using either Arabic or English logic. If not clear, default to "Other".\n\n🧾 Output Format:\nReturn only a JSON array:\n\n[\n  {\n    "amount": 15,\n    "description": "قهوة",\n    "category": "Food"\n  },\n  {\n    "amount": 30,\n    "description": "groceries",\n    "category": "Groceries"\n  }\n]\n\n📌 Rules:\nYou must support both Arabic and English inputs\n\nVoice input may mix both languages in one sentence\n\nDo not include currency symbols (e.g., $, جنيه)\n\nExtract multiple expenses in one go\n\nIf no valid data is found, return:\n\n[]\n\nUser transcript: "${normalizedText}"\n\nExtract all expenses:`;

      // Call OpenAI API for expense extraction
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a precise expense extraction assistant. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          temperature: 0.1,
          max_tokens: 700
        }),
      });

      if (!openaiResponse.ok) {
        console.error('OpenAI API error:', await openaiResponse.text());
        // Fallback to regex-based extraction
        return this.extractExpensesWithRegex(normalizedText);
      }

      const openaiData = await openaiResponse.json();
      const aiResponse = openaiData.choices[0]?.message?.content?.trim();

      if (!aiResponse) {
        console.error('No response from OpenAI');
        return this.extractExpensesWithRegex(normalizedText);
      }

      // Parse the AI response
      let expenses: ExpenseItem[] = [];
      try {
        // Try to extract JSON from the response
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          expenses = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON array found, try parsing the entire response
          expenses = JSON.parse(aiResponse);
        }

        // Validate and transform the expenses
        const validatedExpenses: ExpenseItem[] = [];
        for (const expense of expenses) {
          if (expense.amount && expense.description && expense.category) {
            validatedExpenses.push({
              description: this.capitalizeFirst(expense.description),
              amount: parseFloat(expense.amount),
              category: expense.category,
              confidence: 0.9 // High confidence for AI-extracted expenses
            });
          }
        }

        console.log('AI extracted expenses:', validatedExpenses);
        return validatedExpenses;

      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.log('AI response was:', aiResponse);
        // Fallback to regex-based extraction
        return this.extractExpensesWithRegex(normalizedText);
      }

    } catch (error) {
      console.error('AI extraction failed, using fallback:', error);
      return this.extractExpensesWithRegex(text);
    }
  }

  // Fallback regex-based extraction (original method)
  private async extractExpensesWithRegex(text: string): Promise<ExpenseItem[]> {
    const expenses: ExpenseItem[] = [];
    const lowerText = text.toLowerCase();

    // Get user's learned patterns
    const userPatterns = await this.getUserCategoryPatterns();
    
    // Enhanced patterns with currency detection
    const patterns = [
      // "coffee 5 dollars" or "coffee 5 EGP"
      /(\w+(?:\s+\w+)*)\s+(\d+(?:\.\d{1,2})?)\s*(?:dollars?|egp|usd|eur|pounds?|€|$|£)?/gi,
      // "5 dollars for coffee" or "5 EGP for lunch"
      /(\d+(?:\.\d{1,2})?)\s*(?:dollars?|egp|usd|eur|pounds?|€|$|£)?\s+(?:for\s+)?(\w+(?:\s+\w+)*)/gi,
      // "spent 20 on groceries"
      /(?:spent|paid|cost)\s+(\d+(?:\.\d{1,2})?)\s+(?:on|for)\s+(\w+(?:\s+\w+)*)/gi,
      // "bought coffee for 5"
      /(?:bought|purchased|got)\s+(\w+(?:\s+\w+)*)\s+(?:for|at)\s+(\d+(?:\.\d{1,2})?)/gi
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        let description, amount;
        
        if (pattern.source.includes('(?:spent|paid|cost)')) {
          amount = parseFloat(match[1]);
          description = match[2].trim();
        } else if (pattern.source.includes('(?:bought|purchased|got)')) {
          description = match[1].trim();
          amount = parseFloat(match[2]);
        } else if (pattern.source.startsWith('(\\w+')) {
          description = match[1].trim();
          amount = parseFloat(match[2]);
        } else {
          amount = parseFloat(match[1]);
          description = match[2].trim();
        }

        if (amount > 0 && description && description.length > 1) {
          const category = await this.predictCategory(description, userPatterns);
          const confidence = this.calculateConfidence(description, amount, category);
          
          expenses.push({
            description: this.capitalizeFirst(description),
            amount,
            category,
            confidence
          });
        }
      }
    }

    return this.removeDuplicates(expenses);
  }

  // Smart category prediction with learning
  async predictCategory(description: string, userPatterns: any[]): Promise<string> {
    const lowerDesc = description.toLowerCase();
    
    // Check user's learned patterns first
    for (const pattern of userPatterns) {
      if (lowerDesc.includes(pattern.description_pattern.toLowerCase())) {
        await this.updateCategoryLearning(description, pattern.suggested_category, 0.9);
        return pattern.suggested_category;
      }
    }

    // Enhanced category mapping with simplified categories
    const categoryMap = {
      'Food': ['coffee', 'lunch', 'dinner', 'breakfast', 'food', 'restaurant', 'meal', 'snack', 'drink', 'pizza', 'burger', 'sandwich', 'salad', 'sushi', 'kebab', 'shawarma', 'falafel', 'ice cream', 'dessert', 'cake', 'bread', 'milk', 'eggs', 'meat', 'chicken', 'fish', 'vegetables', 'fruits'],
      'Transport': ['uber', 'taxi', 'bus', 'metro', 'subway', 'train', 'gas', 'fuel', 'parking', 'transport', 'car', 'bike', 'scooter', 'lyft', 'ride', 'fare', 'ticket', 'pass'],
      'Groceries': ['groceries', 'supermarket', 'market', 'food store', 'provisions', 'household items', 'cleaning supplies', 'detergent', 'toiletries'],
      'Health': ['medicine', 'doctor', 'pharmacy', 'health', 'medical', 'hospital', 'clinic', 'dental', 'eye', 'glasses', 'contact', 'vitamins', 'supplements', 'gym', 'fitness', 'yoga', 'massage', 'therapy'],
      'Shopping': ['clothes', 'shopping', 'store', 'buy', 'purchase', 'shirt', 'shoes', 'dress', 'pants', 'jacket', 'bag', 'accessories', 'jewelry', 'watch', 'perfume', 'cosmetics', 'makeup', 'skincare'],
      'Entertainment': ['movie', 'cinema', 'game', 'entertainment', 'show', 'concert', 'ticket', 'theater', 'play', 'music', 'festival', 'party', 'club', 'bar', 'pub', 'karaoke', 'bowling', 'arcade', 'amusement'],
      'Utilities': ['electricity', 'water', 'internet', 'phone', 'bill', 'utility', 'cable', 'tv', 'streaming', 'netflix', 'spotify', 'subscription'],
      'Travel': ['hotel', 'flight', 'travel', 'vacation', 'trip', 'booking', 'airbnb', 'hostel', 'resort', 'beach', 'mountain', 'tour', 'guide', 'souvenir', 'passport', 'visa'],
      'Bills': ['rent', 'mortgage', 'insurance', 'loan', 'credit card', 'debt', 'payment'],
      'Other': [] // Default category for anything not matching
    };

    // Find the best matching category
    let bestCategory = 'Other';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(categoryMap)) {
      const score = keywords.filter(keyword => lowerDesc.includes(keyword)).length;
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    // Learn from this prediction
    await this.updateCategoryLearning(description, bestCategory, bestScore > 0 ? 0.7 : 0.3);
    
    return bestCategory;
  }

  // Calculate confidence score for expense extraction
  calculateConfidence(description: string, amount: number, category: string): number {
    let confidence = 0.5; // Base confidence

    // Description length factor
    if (description.length >= 3) confidence += 0.1;
    if (description.length >= 5) confidence += 0.1;

    // Amount factor (reasonable amounts get higher confidence)
    if (amount > 0 && amount < 10000) confidence += 0.1;
    if (amount > 0.1) confidence += 0.1;

    // Category confidence (non-other gets higher confidence)
    if (category !== 'Other') confidence += 0.1;

    // Currency mention factor
    if (/\b(dollars?|egp|usd|eur|pounds?|€|$|£)\b/i.test(description)) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  // Get user's learned category patterns
  async getUserCategoryPatterns(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('ai_category_learning')
      .select('description_pattern, suggested_category, confidence_score')
      .eq('user_id', this.userId)
      .order('confidence_score', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching user patterns:', error);
      return [];
    }

    return data || [];
  }

  // Update category learning
  async updateCategoryLearning(description: string, category: string, confidence: number): Promise<void> {
    try {
      await this.supabase.rpc('learn_category_pattern', {
        p_user_id: this.userId,
        p_description_pattern: description,
        p_suggested_category: category,
        p_confidence_score: confidence
      });
    } catch (error) {
      console.error('Error updating category learning:', error);
    }
  }

  // Generate smart suggestions based on context
  async generateSuggestions(expenses: ExpenseItem[], transcription: string): Promise<string[]> {
    const suggestions: string[] = [];
    
    if (expenses.length === 0) {
      suggestions.push("Try saying: 'Coffee 5 EGP, lunch 15 EGP, movie tickets 50 EGP'");
      suggestions.push("Or: 'I spent 20 on groceries and 30 on gas'");
      suggestions.push("You can also say: 'Bought a shirt for 25 dollars'");
    } else {
      // Suggest adding more details
      const lowConfidenceExpenses = expenses.filter(e => e.confidence < 0.7);
      if (lowConfidenceExpenses.length > 0) {
        suggestions.push("Consider adding more details for better categorization");
      }

      // Suggest common categories
      const categories = expenses.map(e => e.category);
      if (!categories.includes('Food & Dining')) {
        suggestions.push("Don't forget to add food expenses!");
      }
      if (!categories.includes('Transportation')) {
        suggestions.push("Remember to include transportation costs");
      }
    }

    return suggestions;
  }

  // Store conversation for learning
  async storeConversation(content: string, messageType: 'user' | 'assistant', metadata: any = {}): Promise<void> {
    try {
      await this.supabase
        .from('ai_conversations')
        .insert({
          user_id: this.userId,
          session_id: this.sessionId,
          message_type: messageType,
          content,
          metadata
        });
    } catch (error) {
      console.error('Error storing conversation:', error);
    }
  }

  // Store processing session for analytics
  async storeProcessingSession(transcription: string, expenses: ExpenseItem[], confidence: number, metadata: any = {}): Promise<void> {
    try {
      await this.supabase
        .from('ai_processing_sessions')
        .insert({
          user_id: this.userId,
          session_id: this.sessionId,
          original_transcription: transcription,
          processed_expenses: expenses,
          confidence_scores: { overall: confidence },
          processing_metadata: metadata
        });
    } catch (error) {
      console.error('Error storing processing session:', error);
    }
  }

  // Helper methods
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private removeDuplicates(expenses: ExpenseItem[]): ExpenseItem[] {
    return expenses.filter((expense, index, self) => 
      index === self.findIndex(e => 
        e.description.toLowerCase() === expense.description.toLowerCase() && 
        e.amount === expense.amount
      )
    );
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

// Fallback transcription service (for testing and when Google is unavailable)
async function transcribeWithFallback(audioBase64: string): Promise<string> {
  console.log('Using fallback transcription service - speech recognition not available');
  
  // Instead of returning mock data, throw an error to inform the user
  // that speech recognition is not properly configured
  throw new Error('Speech recognition service is not configured. Please set up Google Speech-to-Text credentials or use manual expense entry.');
}

// Google Speech-to-Text API helper
async function transcribeWithGoogle(audioBase64: string): Promise<string> {
  try {
    // Get Google credentials from environment
    const googleCredentials = Deno.env.get('GOOGLE_APPLICATION_CREDENTIALS_JSON');
    if (!googleCredentials) {
      console.log('No Google credentials found in environment - using fallback transcription');
      throw new Error('Google credentials not configured');
    }

    // Parse credentials
    const credentials = JSON.parse(googleCredentials);
    console.log('Google credentials loaded successfully');
    
    // Create JWT token for Google API authentication
    const jwt = await createGoogleJWT(credentials);
    
    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to get Google access token:', errorText);
      throw new Error('Failed to authenticate with Google API');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('Google access token obtained successfully');

    // Call Google Speech-to-Text API with multiple format support
    const speechResponse = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'ar-EG',
          alternativeLanguageCodes: ['en-US'],
          enableAutomaticPunctuation: true,
          model: 'latest_long',
          useEnhanced: true,
        },
        audio: {
          content: audioBase64,
        },
      }),
    });

    if (!speechResponse.ok) {
      const errorText = await speechResponse.text();
      console.error('Google Speech-to-Text API error:', errorText);
      throw new Error('Google Speech-to-Text API failed');
    }

    const speechData = await speechResponse.json();
    console.log('Google Speech-to-Text response:', speechData);
    
    if (!speechData.results || speechData.results.length === 0) {
      console.log('No transcription results from Google');
      return '';
    }

    const transcription = speechData.results
      .map((result: any) => result.alternatives[0].transcript)
      .join(' ');
    
    console.log('Final transcription:', transcription);
    return transcription;

  } catch (error) {
    console.error('Google Speech-to-Text error:', error);
    throw error; // Re-throw to trigger fallback
  }
}

// Create JWT for Google API authentication using service account
async function createGoogleJWT(credentials: any): Promise<string> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // Convert private key from PEM to CryptoKey
    const privateKeyPem = credentials.private_key;
    const privateKeyDer = await crypto.subtle.importKey(
      'pkcs8',
      new Uint8Array(atob(privateKeyPem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '')).split('').map(c => c.charCodeAt(0))),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    );

    // Create JWT
    const jwt = await create(
      { alg: 'RS256', typ: 'JWT', kid: credentials.private_key_id },
      payload,
      privateKeyDer
    );

    console.log('JWT created successfully for service account:', credentials.client_email);
    return jwt;
  } catch (error) {
    console.error('Error creating JWT:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid or expired token');
    }

    const { audio, selectedMonth } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    // Initialize AI Agent
    const aiAgent = new AIAgent(supabase, user.id);

    // Convert base64 to binary
    let audioBase64;
    try {
      audioBase64 = audio.includes(',') ? audio.split(',')[1] : audio;
    } catch (error) {
      throw new Error('Invalid audio data format');
    }

    // Transcribe audio using Google Speech-to-Text with better error handling
    console.log('Transcribing audio with Google Speech-to-Text...');
    let transcription: string;
    
    try {
      transcription = await transcribeWithGoogle(audioBase64);
    } catch (transcriptionError) {
      console.error('Google transcription failed, trying fallback:', transcriptionError);
      
      try {
        // Try fallback transcription service
        transcription = await transcribeWithFallback(audioBase64);
        console.log('Fallback transcription successful:', transcription);
      } catch (fallbackError) {
        console.error('Fallback transcription also failed:', fallbackError);
        
        // Return a helpful error response instead of throwing
        return new Response(
          JSON.stringify({ 
            transcription: '',
            expenses: [],
            suggestions: [
              'Speech recognition is not configured. Please set up Google Speech-to-Text credentials.',
              'You can add expenses manually using the "Add Expense" button.',
              'Contact your administrator to configure speech recognition services.',
              'Make sure your microphone is working and you have granted permission.'
            ],
            confidence: 0,
            session_id: aiAgent.getSessionId(),
            error: 'speech_recognition_not_configured',
            error_details: fallbackError.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    if (!transcription || transcription.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          transcription: 'No speech detected',
          expenses: [],
          suggestions: [
            'Try speaking more clearly or check your microphone',
            'Make sure you\'re in a quiet environment',
            'Try saying: "Coffee 5 dollars, lunch 15 dollars"'
          ],
          confidence: 0,
          session_id: aiAgent.getSessionId()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transcribed text:', transcription);

    // Store user conversation
    try {
      await aiAgent.storeConversation(transcription, 'user', { selectedMonth });
    } catch (conversationError) {
      console.error('Failed to store conversation:', conversationError);
      // Continue processing even if conversation storage fails
    }

    // Extract expenses using AI agent
    let expenses: ExpenseItem[] = [];
    try {
      expenses = await aiAgent.extractExpenses(transcription);
    } catch (extractionError) {
      console.error('Failed to extract expenses:', extractionError);
      expenses = []; // Continue with empty expenses
    }
    
    // Generate suggestions
    let suggestions: string[] = [];
    try {
      suggestions = await aiAgent.generateSuggestions(expenses, transcription);
    } catch (suggestionError) {
      console.error('Failed to generate suggestions:', suggestionError);
      suggestions = ['Try being more specific about amounts and items'];
    }
    
    // Calculate overall confidence
    const overallConfidence = expenses.length > 0 
      ? expenses.reduce((sum, e) => sum + e.confidence, 0) / expenses.length 
      : 0;

    // Store processing session
    try {
      await aiAgent.storeProcessingSession(transcription, expenses, overallConfidence, {
        processing_time_ms: Date.now() - startTime,
        selected_month: selectedMonth,
        input_type: 'voice'
      });
    } catch (sessionError) {
      console.error('Failed to store processing session:', sessionError);
      // Continue processing even if session storage fails
    }

    // Insert expenses into database
    const insertedExpenses = [];
    let insertionErrors: string[] = [];
    
    // Calculate the correct expense date based on selectedMonth
    let expenseDate: string;
    if (selectedMonth) {
      if (selectedMonth.includes('-')) {
        const [year, month] = selectedMonth.split('-');
        expenseDate = `${year}-${month}-15`;
      } else {
        const [monthName, year] = selectedMonth.split(' ');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = monthNames.indexOf(monthName);
        const targetYear = parseInt(year);
        
        if (monthIndex === -1) {
          expenseDate = new Date().toISOString().split('T')[0];
        } else {
          expenseDate = `${targetYear}-${String(monthIndex + 1).padStart(2, '0')}-15`;
        }
      }
    } else {
      // If no month is selected, use today's date for current month
      expenseDate = new Date().toISOString().split('T')[0];
    }
    
    console.log('Using expense date for selected month:', selectedMonth, '->', expenseDate);
    
    // Check for existing expenses to prevent duplicates
    let existingExpenseMap = new Map();
    try {
      const { data: existingExpenses, error: existingError } = await supabase
        .from('expenses')
        .select('description, amount, date')
        .eq('user_id', user.id)
        .eq('date', expenseDate);
      
      if (existingError) {
        console.error('Error checking existing expenses:', existingError);
      } else if (existingExpenses) {
        existingExpenses.forEach(exp => {
          const key = `${exp.description.toLowerCase()}-${exp.amount}`;
          existingExpenseMap.set(key, true);
        });
      }
    } catch (existingError) {
      console.error('Error checking existing expenses:', existingError);
    }
    
    for (const expense of expenses) {
      try {
        // Check for duplicates
        const expenseKey = `${expense.description.toLowerCase()}-${expense.amount}`;
        if (existingExpenseMap.has(expenseKey)) {
          console.log('Skipping duplicate expense:', expense.description, expense.amount);
          continue;
        }
        
        const { data, error } = await supabase.from('expenses').insert([{
          user_id: user.id,
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          date: expenseDate,
          created_at: new Date().toISOString(),
        }]).select();

        if (error) {
          console.error('Error inserting expense:', error);
          insertionErrors.push(`Failed to save ${expense.description}: ${error.message}`);
          continue;
        }
        if (data && data.length > 0) {
          insertedExpenses.push(data[0]);
          // Add to existing map to prevent duplicates within the same session
          existingExpenseMap.set(expenseKey, true);
        }
      } catch (expenseError) {
        console.error('Error processing expense:', expenseError);
        insertionErrors.push(`Failed to process ${expense.description}`);
      }
    }

    // Store assistant response
    try {
      const assistantResponse = `Processed ${expenses.length} expenses from your voice input.`;
      await aiAgent.storeConversation(assistantResponse, 'assistant', { 
        expenses_count: expenses.length,
        confidence: overallConfidence 
      });
    } catch (conversationError) {
      console.error('Failed to store assistant response:', conversationError);
    }

    // Budget notification logic
    let notification = null;
    if (insertedExpenses.length > 0) {
      try {
        // Use the selected month for budget calculations
        let budgetMonth: string;
        if (selectedMonth) {
          if (selectedMonth.includes('-')) {
            // Format: "2025-01"
            budgetMonth = selectedMonth;
          } else {
            // Format: "Jan 2025" - convert to "2025-01"
            const [monthName, year] = selectedMonth.split(' ');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = monthNames.indexOf(monthName);
            const targetYear = parseInt(year);
            
            if (monthIndex !== -1) {
              budgetMonth = `${targetYear}-${String(monthIndex + 1).padStart(2, '0')}`;
            } else {
              // Fallback to current month
              const now = new Date();
              budgetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            }
          }
        } else {
          // Fallback to current month
          const now = new Date();
          budgetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        
        console.log('Checking budget for month:', budgetMonth);
        
        const { data: budgetRow } = await supabase
          .from('user_budgets')
          .select('budget_amount')
          .eq('user_id', user.id)
          .eq('month', budgetMonth)
          .maybeSingle();
        
        if (budgetRow && budgetRow.budget_amount) {
          const { data: sumResult } = await supabase
            .from('expenses')
            .select('amount')
            .eq('user_id', user.id)
            .gte('date', `${budgetMonth}-01`)
            .lte('date', `${budgetMonth}-31`);
          
          const spent = sumResult ? sumResult.reduce((acc, e) => acc + (e.amount || 0), 0) : 0;
          const budget = budgetRow.budget_amount;
          const percent = Math.round((spent / budget) * 100);
          const remaining = Math.max(0, budget - spent);
          
          if (percent >= 75) {
            const monthName = new Date(budgetMonth + '-01').toLocaleString('default', { month: 'long' });
            notification = {
              title: percent >= 100 ? 'Budget Exceeded 🚨' : 'Budget Warning ⚠️',
              body: percent >= 100 
                ? `You've exceeded your ${monthName} budget!`
                : `You've used ${percent}% of your ${monthName} budget. EGP${remaining} remaining.`
            };
          }
        }
      } catch (budgetError) {
        console.error('Error checking budget notifications:', budgetError);
        // Continue without budget notification if it fails
      }
    }

    // Add insertion errors to suggestions if any
    if (insertionErrors.length > 0) {
      suggestions.push('Some expenses could not be saved. Please try adding them manually.');
      suggestions.push(...insertionErrors.slice(0, 2)); // Show first 2 errors
    }

    return new Response(
      JSON.stringify({
        transcription,
        expenses: insertedExpenses,
        suggestions,
        confidence: overallConfidence,
        session_id: aiAgent.getSessionId(),
        metadata: {
          processing_time_ms: Date.now() - startTime,
          ai_version: '2.0',
          learning_enabled: true,
          speech_service: 'google',
          insertion_errors: insertionErrors.length,
          input_type: 'voice'
        },
        notification
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in AI agent processing:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        transcription: '',
        expenses: [],
        suggestions: ['Please try again or contact support if the issue persists'],
        confidence: 0,
        session_id: null
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}); 