# Update Supabase Types

The white screen issue is likely caused by missing type definitions for the AI agent tables that were added in the migration. Here's how to fix it:

## 1. Update Supabase Types

Run this command to regenerate the types with the new AI agent tables:

```bash
# Generate new types from your Supabase database
supabase gen types typescript --project-id rslwcgjgzezptoblckua > src/integrations/supabase/types.ts
```

## 2. Alternative: Manual Type Update

If the above doesn't work, manually add these types to `src/integrations/supabase/types.ts`:

```typescript
// Add these to the Tables section in the Database type:

ai_conversations: {
  Row: {
    id: string
    user_id: string
    session_id: string
    message_type: string
    content: string
    metadata: Json | null
    created_at: string
  }
  Insert: {
    id?: string
    user_id: string
    session_id: string
    message_type: string
    content: string
    metadata?: Json | null
    created_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    session_id?: string
    message_type?: string
    content?: string
    metadata?: Json | null
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "ai_conversations_user_id_fkey"
      columns: ["user_id"]
      isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
  ]
}

ai_user_preferences: {
  Row: {
    id: string
    user_id: string
    preference_type: string
    preference_key: string
    preference_value: Json
    confidence_score: number | null
    usage_count: number | null
    last_used: string | null
    created_at: string
  }
  Insert: {
    id?: string
    user_id: string
    preference_type: string
    preference_key: string
    preference_value: Json
    confidence_score?: number | null
    usage_count?: number | null
    last_used?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    preference_type?: string
    preference_key?: string
    preference_value?: Json
    confidence_score?: number | null
    usage_count?: number | null
    last_used?: string | null
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "ai_user_preferences_user_id_fkey"
      columns: ["user_id"]
      isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
  ]
}

ai_processing_sessions: {
  Row: {
    id: string
    user_id: string
    session_id: string
    original_transcription: string
    processed_expenses: Json
    confidence_scores: Json | null
    processing_metadata: Json | null
    created_at: string
  }
  Insert: {
    id?: string
    user_id: string
    session_id: string
    original_transcription: string
    processed_expenses: Json
    confidence_scores?: Json | null
    processing_metadata?: Json | null
    created_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    session_id?: string
    original_transcription?: string
    processed_expenses?: Json
    confidence_scores?: Json | null
    processing_metadata?: Json | null
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "ai_processing_sessions_user_id_fkey"
      columns: ["user_id"]
      isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
  ]
}

ai_category_learning: {
  Row: {
    id: string
    user_id: string
    description_pattern: string
    suggested_category: string
    confidence_score: number | null
    usage_count: number | null
    last_used: string | null
    created_at: string
  }
  Insert: {
    id?: string
    user_id: string
    description_pattern: string
    suggested_category: string
    confidence_score?: number | null
    usage_count?: number | null
    last_used?: string | null
    created_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    description_pattern?: string
    suggested_category?: string
    confidence_score?: number | null
    usage_count?: number | null
    last_used?: string | null
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "ai_category_learning_user_id_fkey"
      columns: ["user_id"]
      isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
  ]
}

ai_voice_analytics: {
  Row: {
    id: string
    user_id: string
    session_id: string
    processing_time_ms: number | null
    transcription_confidence: number | null
    expense_extraction_confidence: number | null
    category_prediction_accuracy: number | null
    user_feedback: Json | null
    created_at: string
  }
  Insert: {
    id?: string
    user_id: string
    session_id: string
    processing_time_ms?: number | null
    transcription_confidence?: number | null
    expense_extraction_confidence?: number | null
    category_prediction_accuracy?: number | null
    user_feedback?: Json | null
    created_at?: string
  }
  Update: {
    id?: string
    user_id?: string
    session_id?: string
    processing_time_ms?: number | null
    transcription_confidence?: number | null
    expense_extraction_confidence?: number | null
    category_prediction_accuracy?: number | null
    user_feedback?: Json | null
    created_at?: string
  }
  Relationships: [
    {
      foreignKeyName: "ai_voice_analytics_user_id_fkey"
      columns: ["user_id"]
      isOneToOne: false
      referencedRelation: "users"
      referencedColumns: ["id"]
    }
  ]
}
```

## 3. Apply Database Migration

Make sure the AI agent tables are created in your Supabase database:

```bash
# Apply the migration
supabase db push

# Verify the tables exist
supabase db diff
```

## 4. Test the Application

After updating the types:

1. Restart your development server
2. Clear browser cache
3. Test the application

## 5. If Still Having Issues

If you're still getting a white screen, try these debugging steps:

1. **Check Browser Console**: Look for any JavaScript errors
2. **Disable PWA Features Temporarily**: Comment out the `usePWA()` call in App.tsx
3. **Check Network Tab**: See if any requests are failing
4. **Test Without New Components**: Temporarily remove the new components to isolate the issue

## 6. Fallback Solution

If the issue persists, you can temporarily disable the new features:

```typescript
// In App.tsx, comment out these lines:
// import { AccessibilityProvider } from "./components/AccessibilityProvider";
// import { usePWA } from "./hooks/usePWA";

// And remove the providers:
// <AccessibilityProvider>
// usePWA();
```

This will help identify if the issue is with the new components or something else. 