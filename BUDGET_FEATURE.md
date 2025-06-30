# Budget Feature Implementation

## Overview
The budget feature allows users to set monthly spending limits and receive smart notifications when they reach certain thresholds.

## Features Implemented

### 1. Monthly Budget Management
- Users can set their monthly budget in the Settings page
- Budget is stored per user per month in the `user_budgets` table
- Budget can be edited at any time

### 2. Budget Tracking
- Real-time calculation of spending vs budget
- Visual progress bar with color coding:
  - Green: < 80% of budget
  - Orange: 80-99% of budget  
  - Red: 100%+ of budget
- Status labels: "On Track", "Warning", "Over Budget"

### 3. Smart Notifications
- Automatic notifications at 50%, 75%, and 100% thresholds
- Notifications are sent only once per threshold per month
- Stored in `user_notifications` table for history

### 4. Multi-Page Integration
- **Dashboard**: Shows budget summary with progress bar
- **Settings**: Budget input and management
- **Currency**: Budget display in selected currency

## Database Schema

### user_budgets table
```sql
CREATE TABLE user_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- e.g. "2025-06"
  budget_amount FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### user_notifications table
```sql
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT,
  type TEXT, -- e.g. 'budget'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Edge Functions

### 1. get-budget-status.ts
- Calculates current month's spending vs budget
- Returns budget status with spent amount, percentage, and remaining

### 2. set-budget.ts
- Creates or updates user's monthly budget
- Uses upsert to handle existing budgets

### 3. check-budget-notifications.ts
- Checks if notification thresholds have been crossed
- Creates notifications and prevents duplicates
- Returns notification data for UI display

## React Hooks

### useBudget Hook
```typescript
const {
  budgetStatus,        // Current budget status
  isLoading,          // Loading state
  setBudget,          // Function to set budget
  isSettingBudget,    // Setting budget state
  checkNotifications, // Check for notifications
  getBudgetForMonth   // Get budget for specific month
} = useBudget();
```

### Enhanced useExpenses Hook
- Automatically triggers budget notifications when expenses are added/updated/deleted
- Integrates with budget checking logic

## Components

### BudgetSummary Component
- Displays budget progress with visual indicators
- Allows inline budget editing
- Shows spending status and remaining amount

## Notification Logic

### Thresholds
- **50%**: "You've spent 50% of your [Month] budget. EGP[X] remaining."
- **75%**: "You've used 75% of your [Month] budget. Be cautious!"
- **100%**: "You've exceeded your [Month] budget!"

### Duplicate Prevention
- Notifications are only sent once per threshold per month
- Checks existing notifications before creating new ones

## Security

### Row Level Security (RLS)
- All budget and notification tables have RLS enabled
- Users can only access their own data
- Proper policies for SELECT, INSERT, UPDATE, DELETE operations

## Usage Examples

### Setting a Budget
```typescript
const { setBudget } = useBudget();
setBudget({ month: '2025-06', budgetAmount: 1000 });
```

### Checking Budget Status
```typescript
const { budgetStatus } = useBudget();
if (budgetStatus) {
  console.log(`Spent: ${budgetStatus.spent}/${budgetStatus.budget} (${budgetStatus.percent}%)`);
}
```

### Manual Notification Check
```typescript
const { checkNotifications } = useBudget();
checkNotifications({ month: '2025-06' });
```

## Voice Recording Integration
- Voice expenses automatically trigger budget notifications
- Free users: voice expenses count against budget limit (50 per month)
- Manual expenses are allowed but don't affect free quota

## Future Enhancements
1. Budget history and trends
2. Category-based budgets
3. Budget sharing between users
4. Export budget reports
5. Budget templates for common scenarios 