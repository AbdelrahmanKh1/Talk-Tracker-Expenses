-- AI Agent Tables for Enhanced Voice Processing

-- Conversation History Table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Preferences and Learning Data
CREATE TABLE IF NOT EXISTS ai_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL, -- 'category_mapping', 'common_phrases', 'currency_preference'
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  confidence_score FLOAT DEFAULT 1.0,
  usage_count INT DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, preference_type, preference_key)
);

-- Enhanced Expense Processing Results
CREATE TABLE IF NOT EXISTS ai_processing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  original_transcription TEXT NOT NULL,
  processed_expenses JSONB NOT NULL,
  confidence_scores JSONB DEFAULT '{}',
  processing_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Smart Category Learning
CREATE TABLE IF NOT EXISTS ai_category_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description_pattern TEXT NOT NULL,
  suggested_category TEXT NOT NULL,
  confidence_score FLOAT DEFAULT 1.0,
  usage_count INT DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, description_pattern, suggested_category)
);

-- Voice Processing Analytics
CREATE TABLE IF NOT EXISTS ai_voice_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  processing_time_ms INT,
  transcription_confidence FLOAT,
  expense_extraction_confidence FLOAT,
  category_prediction_accuracy FLOAT,
  user_feedback JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_processing_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_category_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_voice_analytics ENABLE ROW LEVEL SECURITY;

-- Conversation Policies
CREATE POLICY "Users can view their own conversations" ON public.ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own conversations" ON public.ai_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own conversations" ON public.ai_conversations FOR DELETE USING (auth.uid() = user_id);

-- Preferences Policies
CREATE POLICY "Users can view their own preferences" ON public.ai_user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON public.ai_user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON public.ai_user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own preferences" ON public.ai_user_preferences FOR DELETE USING (auth.uid() = user_id);

-- Processing Sessions Policies
CREATE POLICY "Users can view their own processing sessions" ON public.ai_processing_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own processing sessions" ON public.ai_processing_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own processing sessions" ON public.ai_processing_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own processing sessions" ON public.ai_processing_sessions FOR DELETE USING (auth.uid() = user_id);

-- Category Learning Policies
CREATE POLICY "Users can view their own category learning" ON public.ai_category_learning FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own category learning" ON public.ai_category_learning FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own category learning" ON public.ai_category_learning FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own category learning" ON public.ai_category_learning FOR DELETE USING (auth.uid() = user_id);

-- Analytics Policies
CREATE POLICY "Users can view their own analytics" ON public.ai_voice_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own analytics" ON public.ai_voice_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own analytics" ON public.ai_voice_analytics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own analytics" ON public.ai_voice_analytics FOR DELETE USING (auth.uid() = user_id);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_session ON public.ai_conversations(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON public.ai_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_user_preferences_user_type ON public.ai_user_preferences(user_id, preference_type);
CREATE INDEX IF NOT EXISTS idx_ai_processing_sessions_user_session ON public.ai_processing_sessions(user_id, session_id);
CREATE INDEX IF NOT EXISTS idx_ai_category_learning_user_pattern ON public.ai_category_learning(user_id, description_pattern);
CREATE INDEX IF NOT EXISTS idx_ai_voice_analytics_user_session ON public.ai_voice_analytics(user_id, session_id);

-- Functions for AI Agent Operations

-- Function to update user preferences with learning
CREATE OR REPLACE FUNCTION update_ai_preference(
  p_user_id UUID,
  p_preference_type TEXT,
  p_preference_key TEXT,
  p_preference_value JSONB,
  p_confidence_score FLOAT DEFAULT 1.0
) RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_user_preferences (user_id, preference_type, preference_key, preference_value, confidence_score)
  VALUES (p_user_id, p_preference_type, p_preference_key, p_preference_value, p_confidence_score)
  ON CONFLICT (user_id, preference_type, preference_key)
  DO UPDATE SET
    preference_value = p_preference_value,
    confidence_score = (ai_user_preferences.confidence_score + p_confidence_score) / 2,
    usage_count = ai_user_preferences.usage_count + 1,
    last_used = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user preferences
CREATE OR REPLACE FUNCTION get_ai_preferences(
  p_user_id UUID,
  p_preference_type TEXT DEFAULT NULL
) RETURNS TABLE (
  preference_type TEXT,
  preference_key TEXT,
  preference_value JSONB,
  confidence_score FLOAT,
  usage_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    aup.preference_type,
    aup.preference_key,
    aup.preference_value,
    aup.confidence_score,
    aup.usage_count
  FROM ai_user_preferences aup
  WHERE aup.user_id = p_user_id
    AND (p_preference_type IS NULL OR aup.preference_type = p_preference_type)
  ORDER BY aup.confidence_score DESC, aup.usage_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to learn from category patterns
CREATE OR REPLACE FUNCTION learn_category_pattern(
  p_user_id UUID,
  p_description_pattern TEXT,
  p_suggested_category TEXT,
  p_confidence_score FLOAT DEFAULT 1.0
) RETURNS VOID AS $$
BEGIN
  INSERT INTO ai_category_learning (user_id, description_pattern, suggested_category, confidence_score)
  VALUES (p_user_id, p_description_pattern, p_suggested_category, p_confidence_score)
  ON CONFLICT (user_id, description_pattern, suggested_category)
  DO UPDATE SET
    confidence_score = (ai_category_learning.confidence_score + p_confidence_score) / 2,
    usage_count = ai_category_learning.usage_count + 1,
    last_used = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 