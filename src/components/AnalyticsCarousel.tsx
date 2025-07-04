import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface AnalyticsCarouselProps {
  expenses: any[];
  budget: number;
  spent: number;
  selectedMonth: string;
  baseCurrency: string;
  baseSymbol: string;
}

const slides = [
  {
    key: 'weekly',
    emoji: '💸',
    gradient: 'from-indigo-400 via-blue-300 to-purple-300',
    title: 'Weekly Spending',
    tip: 'Keep an eye on averages – small changes can make a big difference long term!'
  },
  {
    key: 'topcat',
    emoji: '🏆',
    gradient: 'from-pink-400 via-red-300 to-yellow-200',
    title: 'Top Spending Category',
    tip: 'Think about meal prepping next week to see if you can trim that bill! 🥗'
  },
  {
    key: 'trend',
    emoji: '📈',
    gradient: 'from-green-300 via-blue-200 to-indigo-200',
    title: 'Spending Trends',
    tip: 'Keep an eye on where your money’s going—awareness is key!'
  },
  {
    key: 'budget',
    emoji: '💰',
    gradient: 'from-yellow-200 via-green-200 to-teal-200',
    title: 'Budget Status',
    tip: 'Keep up the great work! Those savings are really adding up. 👏'
  },
  {
    key: 'catbreak',
    emoji: '🗂️',
    gradient: 'from-blue-200 via-purple-200 to-pink-200',
    title: 'Spending by Category',
    tip: 'See where your money’s going & maybe tweak next week’s budget!'
  },
  {
    key: 'streak',
    emoji: '🔥',
    gradient: 'from-orange-300 via-yellow-200 to-pink-200',
    title: 'Longest Spending Streak',
    tip: 'Consistency is key! Try to keep your streak going.'
  },
  {
    key: 'lowestday',
    emoji: '🌙',
    gradient: 'from-blue-200 via-indigo-200 to-purple-200',
    title: 'Lowest Spending Day',
    tip: 'Low-spend days help you save more over time.'
  },
  {
    key: 'improvedcat',
    emoji: '📉',
    gradient: 'from-green-200 via-blue-100 to-teal-200',
    title: 'Most Improved Category',
    tip: 'Great job reducing spending in this category!'
  },
  {
    key: 'savings',
    emoji: '💡',
    gradient: 'from-yellow-100 via-green-100 to-blue-100',
    title: 'Savings Opportunity',
    tip: 'Small daily savings add up to big monthly wins.'
  },
  {
    key: 'funfact',
    emoji: '🤖',
    gradient: 'from-purple-200 via-pink-200 to-yellow-100',
    title: 'Did You Know?',
    tip: 'Fun facts and motivation to keep you on track!'
  },
];

function formatCurrency(amount: number, currency: string = 'EGP') {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function useCountUp(value: number, duration = 800) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    let startTime: number | null = null;
    function animate(ts: number) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setDisplay(start + (value - start) * progress);
      if (progress < 1) requestAnimationFrame(animate);
      else setDisplay(value);
    }
    requestAnimationFrame(animate);
    // eslint-disable-next-line
  }, [value]);
  return display;
}

export const AnalyticsCarousel: React.FC<AnalyticsCarouselProps> = ({ expenses, budget, spent, selectedMonth, baseCurrency, baseSymbol }) => {
  const [current, setCurrent] = useState(0);
  const currency = baseCurrency;
  const symbol = baseSymbol;
  const carouselApi = useRef<any>(null);

  // --- Calculations (same as before) ---
  const weekStats = useMemo(() => {
    const weekExpenses = expenses;
    const total = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const count = weekExpenses.length;
    const avg = count > 0 ? total / count : 0;
    return { total, count, avg };
  }, [expenses]);

  const topCategory = useMemo(() => {
    const catTotals: Record<string, { amount: number; count: number }> = {};
    for (const e of expenses) {
      if (!catTotals[e.category]) catTotals[e.category] = { amount: 0, count: 0 };
      catTotals[e.category].amount += e.amount;
      catTotals[e.category].count += 1;
    }
    const sorted = Object.entries(catTotals).sort((a, b) => b[1].amount - a[1].amount);
    if (!sorted.length) return null;
    const [name, data] = sorted[0];
    const percent = spent > 0 ? (data.amount / spent) * 100 : 0;
    return { name, ...data, percent };
  }, [expenses, spent]);

  const trendStats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(startOfWeek.getDate() - 7);
    const lastWeekEnd = new Date(startOfWeek);
    lastWeekEnd.setDate(startOfWeek.getDate() - 1);
    let thisWeekTotal = 0, lastWeekTotal = 0;
    for (const e of expenses) {
      const d = new Date(e.date || e.created_at);
      if (d >= startOfWeek && d <= endOfWeek) thisWeekTotal += e.amount;
      else if (d >= lastWeekStart && d <= lastWeekEnd) lastWeekTotal += e.amount;
    }
    const percent = lastWeekTotal > 0 ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100 : 0;
    return { thisWeekTotal, lastWeekTotal, percent };
  }, [expenses]);

  const budgetStats = useMemo(() => {
    const remaining = Math.max(budget - spent, 0);
    const percent = budget > 0 ? (spent / budget) * 100 : 0;
    return { spent, budget, remaining, percent };
  }, [budget, spent]);

  const categoryBreakdown = useMemo(() => {
    const catTotals: Record<string, { amount: number; count: number }> = {};
    for (const e of expenses) {
      if (!catTotals[e.category]) catTotals[e.category] = { amount: 0, count: 0 };
      catTotals[e.category].amount += e.amount;
      catTotals[e.category].count += 1;
    }
    const sorted = Object.entries(catTotals).sort((a, b) => b[1].amount - a[1].amount);
    return sorted.slice(0, 3).map(([name, data]) => ({ name, ...data, percent: spent > 0 ? (data.amount / spent) * 100 : 0 }));
  }, [expenses, spent]);

  // Longest spending streak
  const streak = useMemo(() => {
    if (!expenses.length) return 0;
    const days = expenses.map(e => new Date(e.date || e.created_at).setHours(0,0,0,0));
    const uniqueDays = Array.from(new Set(days)).sort();
    let maxStreak = 1, curStreak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      if (uniqueDays[i] - uniqueDays[i-1] === 86400000) curStreak++;
      else curStreak = 1;
      if (curStreak > maxStreak) maxStreak = curStreak;
    }
    return maxStreak;
  }, [expenses]);

  // Lowest spending day
  const lowestDay = useMemo(() => {
    if (!expenses.length) return null;
    const dayTotals: Record<string, number> = {};
    for (const e of expenses) {
      const day = (e.date || e.created_at).slice(0,10);
      dayTotals[day] = (dayTotals[day] || 0) + e.amount;
    }
    const sorted = Object.entries(dayTotals).sort((a, b) => a[1] - b[1]);
    return sorted[0]; // [date, amount]
  }, [expenses]);

  // Most improved category (biggest drop vs previous week)
  const improvedCat = useMemo(() => {
    if (!expenses.length) return null;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const lastWeekStart = new Date(startOfWeek);
    lastWeekStart.setDate(startOfWeek.getDate() - 7);
    const lastWeekEnd = new Date(startOfWeek);
    lastWeekEnd.setDate(startOfWeek.getDate() - 1);
    const thisWeek: Record<string, number> = {};
    const lastWeek: Record<string, number> = {};
    for (const e of expenses) {
      const d = new Date(e.date || e.created_at);
      if (d >= startOfWeek) thisWeek[e.category] = (thisWeek[e.category] || 0) + e.amount;
      else if (d >= lastWeekStart && d <= lastWeekEnd) lastWeek[e.category] = (lastWeek[e.category] || 0) + e.amount;
    }
    let bestCat = null, bestDrop = 0;
    for (const cat in lastWeek) {
      const drop = lastWeek[cat] - (thisWeek[cat] || 0);
      if (drop > bestDrop) {
        bestDrop = drop;
        bestCat = cat;
      }
    }
    return bestCat ? { name: bestCat, drop: bestDrop } : null;
  }, [expenses]);

  // Savings opportunity (from SmartInsights)
  const savings = useMemo(() => {
    if (!expenses.length) return null;
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const days = Array.from(new Set(expenses.map(e => (e.date || e.created_at).slice(0,10)))).length;
    const averagePerDay = days > 0 ? totalSpent / days : 0;
    const potentialSavings = averagePerDay * 0.1;
    return { perDay: potentialSavings, perMonth: potentialSavings * 30 };
  }, [expenses]);

  // Fun fact (random pick)
  const funFacts = [
    'Tracking your expenses weekly can help you save up to 20% more! 📊',
    'Did you know? Most people underestimate their monthly spending by 30%.',
    'Small daily savings add up to big wins over time.',
    'You’re building a great financial habit! Keep it up! 💪',
    'AI says: “Consistency beats intensity.”',
    'The best time to save was yesterday. The next best time is now!'
  ];
  const [funFact] = useState(() => funFacts[Math.floor(Math.random() * funFacts.length)]);

  // Date range for this week and last week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const lastWeekStart = new Date(startOfWeek);
  lastWeekStart.setDate(startOfWeek.getDate() - 7);
  const lastWeekEnd = new Date(startOfWeek);
  lastWeekEnd.setDate(startOfWeek.getDate() - 1);
  const formatRange = (start: Date, end: Date) => `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

  // --- Animated numbers ---
  const animatedWeekTotal = useCountUp(weekStats.total);
  const animatedWeekAvg = useCountUp(weekStats.avg);
  const animatedTopCatAmount = useCountUp(topCategory?.amount || 0);
  const animatedTrendPercent = useCountUp(trendStats.percent);
  const animatedBudgetPercent = useCountUp(budgetStats.percent);
  const animatedBudgetSpent = useCountUp(budgetStats.spent);
  const animatedBudgetBudget = useCountUp(budgetStats.budget);
  const animatedBudgetRemaining = useCountUp(budgetStats.remaining);

  // --- Navigation ---
  const goTo = (idx: number) => {
    setCurrent(idx);
    if (carouselApi.current) carouselApi.current.scrollTo(idx);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      {/* Progress Dots */}
      <div className="flex justify-center items-center gap-2 mt-4 mb-6">
        {slides.map((slide, idx) => (
          <button
            key={slide.key}
            onClick={() => goTo(idx)}
            className={`w-8 h-2 rounded-full transition-all duration-300 focus:outline-none ${current === idx ? 'bg-white/90 shadow-lg' : 'bg-white/40'} border-2 border-white/30`}
            aria-label={`Go to ${slide.title}`}
          />
        ))}
      </div>
      {/* Arrows for desktop */}
      <button
        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/60 hover:bg-white/90 dark:bg-gray-800/60 dark:hover:bg-gray-800/90 rounded-full p-2 shadow-lg transition-all"
        style={{ visibility: current > 0 ? 'visible' : 'hidden' }}
        onClick={() => goTo(current - 1)}
        aria-label="Previous slide"
      >
        <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
      </button>
      <button
        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/60 hover:bg-white/90 dark:bg-gray-800/60 dark:hover:bg-gray-800/90 rounded-full p-2 shadow-lg transition-all"
        style={{ visibility: current < slides.length - 1 ? 'visible' : 'hidden' }}
        onClick={() => goTo(current + 1)}
        aria-label="Next slide"
      >
        <ArrowRight className="w-6 h-6 text-gray-700 dark:text-gray-200" />
      </button>
      <Carousel
        opts={{ loop: false }}
        setApi={api => {
          if (api) {
            carouselApi.current = api;
            api.on('select', () => setCurrent(api.selectedScrollSnap()));
          }
        }}
        className="w-full max-w-md mx-auto flex-1"
      >
        <CarouselContent>
          {/* Weekly Spending */}
          <CarouselItem className={`flex flex-col items-center justify-center min-h-[70vh] px-4 bg-gradient-to-br ${slides[0].gradient} rounded-3xl shadow-xl relative`}>
            <div className="absolute top-6 left-6 text-4xl">{slides[0].emoji}</div>
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow">{slides[0].title}</h2>
            <div className="backdrop-blur-md bg-white/30 dark:bg-gray-900/30 rounded-2xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center mb-4">
              <div className="text-4xl font-extrabold text-indigo-900 dark:text-white mb-2">{formatCurrency(animatedWeekTotal, symbol)}</div>
              <div className="text-indigo-800 dark:text-indigo-200 mb-2">{weekStats.count} transactions this week</div>
              <div className="flex gap-8 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-indigo-900 dark:text-white">{weekStats.count}</div>
                  <div className="text-indigo-700 dark:text-indigo-200 text-sm">Transactions</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-indigo-900 dark:text-white">{formatCurrency(animatedWeekAvg, symbol)}</div>
                  <div className="text-indigo-700 dark:text-indigo-200 text-sm">Average</div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-sm text-white/90 text-center px-2">{slides[0].tip}</div>
          </CarouselItem>
          {/* Top Spending Category */}
          <CarouselItem className={`flex flex-col items-center justify-center min-h-[70vh] px-4 bg-gradient-to-br ${slides[1].gradient} rounded-3xl shadow-xl relative`}>
            <div className="absolute top-6 left-6 text-4xl">{slides[1].emoji}</div>
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow">{slides[1].title}</h2>
            <div className="backdrop-blur-md bg-white/30 dark:bg-gray-900/30 rounded-2xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center mb-4">
              <div className="text-white/80 mb-1">{topCategory?.name || 'N/A'}</div>
              <div className="text-4xl font-extrabold text-pink-900 dark:text-white mb-2">{formatCurrency(animatedTopCatAmount, symbol)}</div>
              <div className="text-pink-800 dark:text-pink-200 mb-2">{topCategory ? topCategory.percent.toFixed(2) : '0.00'}% of total spending</div>
              <div className="text-pink-700 dark:text-pink-200 mb-2">{topCategory?.count || 0} transactions in {topCategory?.name || 'N/A'}</div>
            </div>
            <div className="mt-2 text-sm text-white/90 text-center px-2">{slides[1].tip}</div>
          </CarouselItem>
          {/* Spending Trends */}
          <CarouselItem className={`flex flex-col items-center justify-center min-h-[70vh] px-4 bg-gradient-to-br ${slides[2].gradient} rounded-3xl shadow-xl relative`}>
            <div className="absolute top-6 left-6 text-4xl">{slides[2].emoji}</div>
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow">{slides[2].title}</h2>
            <div className="backdrop-blur-md bg-white/30 dark:bg-gray-900/30 rounded-2xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center mb-4">
              <div className="text-4xl font-extrabold text-green-900 dark:text-white mb-2">{animatedTrendPercent.toFixed(2)}%</div>
              <div className="text-green-800 dark:text-green-200 mb-2">{animatedTrendPercent.toFixed(2)}% more than last week</div>
              <div className="flex gap-8 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-900 dark:text-white">{formatCurrency(trendStats.thisWeekTotal, symbol)}</div>
                  <div className="text-green-700 dark:text-green-200 text-sm">This Week</div>
                  <div className="text-green-700 dark:text-green-200 text-xs">{formatRange(startOfWeek, endOfWeek)}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-900 dark:text-white">{formatCurrency(trendStats.lastWeekTotal, symbol)}</div>
                  <div className="text-green-700 dark:text-green-200 text-sm">Last Week</div>
                  <div className="text-green-700 dark:text-green-200 text-xs">{formatRange(lastWeekStart, lastWeekEnd)}</div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-sm text-white/90 text-center px-2">{slides[2].tip}</div>
          </CarouselItem>
          {/* Budget Status */}
          <CarouselItem className={`flex flex-col items-center justify-center min-h-[70vh] px-4 bg-gradient-to-br ${slides[3].gradient} rounded-3xl shadow-xl relative`}>
            <div className="absolute top-6 left-6 text-4xl">{slides[3].emoji}</div>
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow">{slides[3].title}</h2>
            <div className="backdrop-blur-md bg-white/30 dark:bg-gray-900/30 rounded-2xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center mb-4">
              <div className="text-white/80 mb-1">{selectedMonth}</div>
              <div className="text-3xl font-extrabold text-yellow-900 dark:text-white mb-2">{animatedBudgetPercent.toFixed(2)}% used</div>
              <div className="text-yellow-800 dark:text-yellow-200 mb-2">{budgetStats.percent < 100 ? 'Well within budget' : 'Over budget'}</div>
              <div className="flex gap-8 mb-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-900 dark:text-white">{formatCurrency(animatedBudgetSpent, symbol)}</div>
                  <div className="text-yellow-700 dark:text-yellow-200 text-sm">Spent</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-900 dark:text-white">{formatCurrency(animatedBudgetBudget, symbol)}</div>
                  <div className="text-yellow-700 dark:text-yellow-200 text-sm">Budget</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 dark:text-green-300">{formatCurrency(animatedBudgetRemaining, symbol)}</div>
                  <div className="text-yellow-700 dark:text-yellow-200 text-sm">Remaining</div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-sm text-white/90 text-center px-2">{slides[3].tip}</div>
          </CarouselItem>
          {/* Spending by Category */}
          <CarouselItem className={`flex flex-col items-center justify-center min-h-[70vh] px-4 bg-gradient-to-br ${slides[4].gradient} rounded-3xl shadow-xl relative`}>
            <div className="absolute top-6 left-6 text-4xl">{slides[4].emoji}</div>
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow">{slides[4].title}</h2>
            <div className="backdrop-blur-md bg-white/30 dark:bg-gray-900/30 rounded-2xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center mb-4">
              <div className="text-white/80 mb-1">{categoryBreakdown.length} categories</div>
              <div className="w-full max-w-xs mb-4">
                {categoryBreakdown.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between py-2">
                    <span className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${['bg-red-400','bg-green-400','bg-blue-400'][i % 3]} inline-block`}></span> {cat.name}</span>
                    <span className="font-bold text-indigo-900 dark:text-white">{formatCurrency(cat.amount, symbol)}</span>
                    <span className="text-indigo-700 dark:text-indigo-200">{cat.percent.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 text-sm text-white/90 text-center px-2">{slides[4].tip}</div>
          </CarouselItem>
          {/* Longest Spending Streak */}
          <CarouselItem className={`flex flex-col items-center justify-center min-h-[70vh] px-4 bg-gradient-to-br ${slides[5].gradient} rounded-3xl shadow-xl relative`}>
            <div className="absolute top-6 left-6 text-4xl">{slides[5].emoji}</div>
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow">{slides[5].title}</h2>
            <div className="backdrop-blur-md bg-white/30 dark:bg-gray-900/30 rounded-2xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center mb-4">
              <div className="text-4xl font-extrabold text-orange-900 dark:text-white mb-2">{streak} days</div>
              <div className="text-orange-800 dark:text-orange-200 mb-2">Your longest streak of daily spending</div>
            </div>
            <div className="mt-2 text-sm text-white/90 text-center px-2">{slides[5].tip}</div>
          </CarouselItem>
          {/* Lowest Spending Day */}
          <CarouselItem className={`flex flex-col items-center justify-center min-h-[70vh] px-4 bg-gradient-to-br ${slides[6].gradient} rounded-3xl shadow-xl relative`}>
            <div className="absolute top-6 left-6 text-4xl">{slides[6].emoji}</div>
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow">{slides[6].title}</h2>
            <div className="backdrop-blur-md bg-white/30 dark:bg-gray-900/30 rounded-2xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center mb-4">
              <div className="text-4xl font-extrabold text-blue-900 dark:text-white mb-2">{lowestDay ? formatCurrency(lowestDay[1], symbol) : 'N/A'}</div>
              <div className="text-blue-800 dark:text-blue-200 mb-2">{lowestDay ? new Date(lowestDay[0]).toLocaleDateString() : 'No data'}</div>
            </div>
            <div className="mt-2 text-sm text-white/90 text-center px-2">{slides[6].tip}</div>
          </CarouselItem>
          {/* Most Improved Category */}
          <CarouselItem className={`flex flex-col items-center justify-center min-h-[70vh] px-4 bg-gradient-to-br ${slides[7].gradient} rounded-3xl shadow-xl relative`}>
            <div className="absolute top-6 left-6 text-4xl">{slides[7].emoji}</div>
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow">{slides[7].title}</h2>
            <div className="backdrop-blur-md bg-white/30 dark:bg-gray-900/30 rounded-2xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center mb-4">
              <div className="text-4xl font-extrabold text-green-900 dark:text-white mb-2">{improvedCat ? improvedCat.name : 'N/A'}</div>
              <div className="text-green-800 dark:text-green-200 mb-2">{improvedCat ? `↓ ${formatCurrency(improvedCat.drop, symbol)} vs last week` : 'No improvement detected'}</div>
            </div>
            <div className="mt-2 text-sm text-white/90 text-center px-2">{slides[7].tip}</div>
          </CarouselItem>
          {/* Savings Opportunity */}
          <CarouselItem className={`flex flex-col items-center justify-center min-h-[70vh] px-4 bg-gradient-to-br ${slides[8].gradient} rounded-3xl shadow-xl relative`}>
            <div className="absolute top-6 left-6 text-4xl">{slides[8].emoji}</div>
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow">{slides[8].title}</h2>
            <div className="backdrop-blur-md bg-white/30 dark:bg-gray-900/30 rounded-2xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center mb-4">
              <div className="text-4xl font-extrabold text-yellow-900 dark:text-white mb-2">{savings ? formatCurrency(savings.perDay, symbol) : 'N/A'}</div>
              <div className="text-yellow-800 dark:text-yellow-200 mb-2">Potential daily savings</div>
              <div className="text-yellow-700 dark:text-yellow-200 mb-2">{savings ? `Up to ${formatCurrency(savings.perMonth, symbol)} per month` : ''}</div>
            </div>
            <div className="mt-2 text-sm text-white/90 text-center px-2">{slides[8].tip}</div>
          </CarouselItem>
          {/* Fun Fact */}
          <CarouselItem className={`flex flex-col items-center justify-center min-h-[70vh] px-4 bg-gradient-to-br ${slides[9].gradient} rounded-3xl shadow-xl relative`}>
            <div className="absolute top-6 left-6 text-4xl">{slides[9].emoji}</div>
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow">{slides[9].title}</h2>
            <div className="backdrop-blur-md bg-white/30 dark:bg-gray-900/30 rounded-2xl shadow-lg p-6 w-full max-w-xs flex flex-col items-center mb-4">
              <div className="text-2xl font-semibold text-purple-900 dark:text-white mb-2">{funFact}</div>
            </div>
            <div className="mt-2 text-sm text-white/90 text-center px-2">{slides[9].tip}</div>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
      {/* Swipe hint for mobile */}
      <div className="md:hidden text-xs text-white/70 mt-4">Swipe to see more &rarr;</div>
    </div>
  );
}; 