import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Currency } from '@/types';

const defaultCurrencies: Currency[] = [
  // Middle East & Africa
  { code: 'EGP', symbol: 'ج.م', name: 'Egyptian Pound', flag: '🇪🇬' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', flag: '🇸🇦' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal', flag: '🇶🇦' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', flag: '🇰🇼' },
  { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar', flag: '🇧🇭' },
  { code: 'OMR', symbol: 'ر.ع.', name: 'Omani Rial', flag: '🇴🇲' },
  { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar', flag: '🇯🇴' },
  { code: 'LBP', symbol: 'ل.ل', name: 'Lebanese Pound', flag: '🇱🇧' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham', flag: '🇲🇦' },
  { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar', flag: '🇹🇳' },
  
  // Major Global Currencies
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  
  // Asia Pacific
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', flag: '🇻🇳' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', flag: '🇹🇼' },
  
  // Europe
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', flag: '🇩🇰' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Złoty', flag: '🇵🇱' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', flag: '🇨🇿' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', flag: '🇭🇺' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', flag: '🇷🇺' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso', flag: '🇦🇷' },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso', flag: '🇨🇱' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso', flag: '🇨🇴' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', flag: '🇵🇪' },
];

const defaultCurrency: Currency = defaultCurrencies[0];

export const useCurrency = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Test function to verify database connectivity
  const testDatabaseConnection = async () => {
    if (!user) return;
    
    console.log('Testing database connection...');
    
    try {
      // Test 1: Check if we can query the user_settings table
      const { data: testData, error: testError } = await supabase
        .from('user_settings')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Database connection test failed:', testError);
        return false;
      }
      
      console.log('Database connection test passed');
      return true;
    } catch (error) {
      console.error('Database connection test exception:', error);
      return false;
    }
  };

  // Fetch user's currency preference
  const { data: userCurrencyCode, isLoading, error } = useQuery({
    queryKey: ['user-currency', user?.id],
    queryFn: async (): Promise<string> => {
      if (!user) {
        console.log('No user, returning default currency:', defaultCurrency.code);
        return defaultCurrency.code;
      }
      
      console.log('Fetching currency for user:', user.id);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('user_settings')
          .select('active_currency')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching currency:', fetchError);
          console.error('Error details:', {
            code: fetchError.code,
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint
          });
          
          // If it's a table not found error, return default
          if (fetchError.code === '42P01') {
            console.error('user_settings table does not exist');
            return defaultCurrency.code;
          }
          
          // If it's an RLS error, log it
          if (fetchError.code === '42501') {
            console.error('RLS policy error - user may not have permission');
            return defaultCurrency.code;
          }
          
          return defaultCurrency.code;
        }

        console.log('Fetched currency data:', data);
        const currencyCode = data?.active_currency || defaultCurrency.code;
        console.log('Using currency code:', currencyCode);
        return currencyCode;
      } catch (error) {
        console.error('Exception during currency fetch:', error);
        return defaultCurrency.code;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get the current currency object
  const currency = defaultCurrencies.find(c => c.code === userCurrencyCode) || defaultCurrency;
  
  console.log('useCurrency hook - userCurrencyCode:', userCurrencyCode, 'currency:', currency);

  // Mutation to update currency
  const updateCurrencyMutation = useMutation({
    mutationFn: async (currencyCode: string): Promise<void> => {
      if (!user) throw new Error('User not authenticated');

      console.log('Updating currency to:', currencyCode, 'for user:', user.id);
      console.log('User session info:', {
        id: user.id,
        email: user.email,
        aud: user.aud,
        role: user.role
      });
      
      // Test database connection first
      const dbConnectionOk = await testDatabaseConnection();
      if (!dbConnectionOk) {
        throw new Error('Database connection failed. Please check your internet connection.');
      }
      
      try {
        // First, try to check if user_settings table exists and user has a record
        const { data: existingSettings, error: checkError } = await supabase
          .from('user_settings')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing settings:', checkError);
          // If table doesn't exist, we'll try to create it via upsert
        }

        // Try to upsert the currency setting
        const { error: updateError } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            active_currency: currencyCode,
            // Add default values for other required fields
            theme: 'system',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { 
            onConflict: 'user_id',
            ignoreDuplicates: false 
          });

        if (updateError) {
          console.error('Supabase error updating currency:', updateError);
          console.error('Error details:', {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint
          });
          
          // If it's a table not found error, try to create the table structure
          if (updateError.code === '42P01') { // Table doesn't exist
            console.error('user_settings table does not exist. Please run migrations.');
            throw new Error('Database table not found. Please contact support.');
          }
          
          // If it's an RLS error
          if (updateError.code === '42501') {
            console.error('RLS policy error - user may not have permission to update settings');
            throw new Error('Permission denied. Please try logging out and back in.');
          }
          
          // If it's a foreign key constraint error
          if (updateError.code === '23503') {
            console.error('Foreign key constraint error - user may not exist in auth.users');
            throw new Error('User account issue. Please try logging out and back in.');
          }
          
          throw new Error(`Failed to update currency: ${updateError.message}`);
        }
        
        console.log('Currency updated successfully');
      } catch (error) {
        console.error('Exception during currency update:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Currency mutation successful, invalidating queries');
      // Invalidate and refetch currency data with the specific user ID
      queryClient.invalidateQueries({ queryKey: ['user-currency', user?.id] });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      // Invalidate expenses to refresh currency display
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      // Force refetch the currency query immediately
      queryClient.refetchQueries({ queryKey: ['user-currency', user?.id] });
    },
    onError: (error) => {
      console.error('Error updating currency:', error);
    },
  });

  const setCurrency = async (currencyCode: string): Promise<void> => {
    await updateCurrencyMutation.mutateAsync(currencyCode);
  };

  return {
    currency,
    currencies: defaultCurrencies,
    setCurrency,
    isLoading,
    error: error?.message || null,
    refetch: () => queryClient.refetchQueries({ queryKey: ['user-currency', user?.id] }),
    testDatabaseConnection,
  };
};
