# Voice Recognition Setup Guide

This guide explains how to set up voice recognition for the expense tracker app.

## Current Status

The app currently supports two input modes:
1. **Voice Input** (requires Google Speech-to-Text setup)
2. **Text Input** (fallback when voice is not available)

## Voice Recognition Setup

### Option 1: Google Speech-to-Text (Recommended)

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Speech-to-Text API

2. **Create a Service Account**
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name like "speech-to-text-service"
   - Grant "Cloud Speech-to-Text Admin" role

3. **Download Credentials**
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Download the JSON file

4. **Set Environment Variable**
   - Go to your Supabase project dashboard
   - Navigate to Settings > Functions
   - Add a new secret: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - Copy the entire content of the downloaded JSON file as the value

5. **Deploy the Function**
   ```bash
   supabase functions deploy ai-agent-process-voice
   ```

### Option 2: Alternative Speech Services

You can modify the `transcribeWithFallback` function in `supabase/functions/ai-agent-process-voice/index.ts` to use other services:

- **Azure Speech Services**
- **AWS Transcribe**
- **AssemblyAI**
- **OpenAI Whisper**

### Option 3: Text Input Only

If you don't want to set up voice recognition, the app will automatically fall back to text input mode when voice processing fails.

## Testing

1. **Voice Input Test**
   - Click the microphone button
   - Say something like "Coffee 5 dollars, lunch 15 dollars"
   - The app should transcribe and process your expenses

2. **Text Input Test**
   - If voice fails, click "Use Text Input"
   - Type: "Coffee 5 dollars, lunch 15 dollars"
   - Click "Process Text"

## Troubleshooting

### Common Issues

1. **"Speech recognition is not configured"**
   - Set up Google Speech-to-Text credentials (see Option 1 above)
   - Or use text input mode

2. **"No speech detected"**
   - Check microphone permissions
   - Speak more clearly
   - Try in a quieter environment

3. **"Processing failed"**
   - Check Supabase function logs
   - Verify database connections
   - Check network connectivity

### Debug Steps

1. **Check Function Logs**
   ```bash
   supabase functions logs ai-agent-process-voice
   ```

2. **Test Function Locally**
   ```bash
   supabase functions serve ai-agent-process-voice
   ```

3. **Verify Environment Variables**
   - Check Supabase dashboard for `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - Ensure the JSON is valid

## Cost Considerations

- **Google Speech-to-Text**: ~$0.006 per 15 seconds
- **Text Processing**: Free (uses the same AI processing)
- **Database Storage**: Minimal cost for storing expenses

## Security Notes

- Service account credentials are stored securely in Supabase
- Audio data is not stored permanently
- All processing happens server-side
- User authentication is required for all operations

## Future Enhancements

- Support for multiple languages
- Offline voice processing
- Custom vocabulary training
- Voice command shortcuts 