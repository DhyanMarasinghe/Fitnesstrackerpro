// app/progress/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  ArrowLeft,
  TrendingUp,
  Calendar,
  Target,
  Award,
  Footprints,
  Flame
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { User } from '@/lib/types';

interface ChartData {
  date: string;
  steps: number;
  calories: number;
  workouts: number;
}

export default function ProgressPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [stats, setStats] = useState({
    totalSteps: 0,
    totalCalories: 0,
    totalWorkouts: 0,
    averageSteps: 0,
    averageCalories: 0,
    bestStepDay: { date: '', steps: 0 },
    bestCalorieDay: { date: '', calories: 0 },
    streak: 0,
    thisWeekSteps: 0,
    lastWeekSteps: 0,
    thisWeekCalories: 0,
    lastWeekCalories: 0
  });

  useEffect(() => {
    const currentUser = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    
    if (!currentUser || !authToken) {
      router.push('/');
      return;
    }

    try {
      const userData = JSON.parse(currentUser);
      setUser(userData);
      loadProgressData(authToken);
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Helper function to normalize dates
  const normalizeDate = (date: any): string => {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    } else if (typeof date === 'string') {
      // Handle ISO string or YYYY-MM-DD format
      return date.split('T')[0];
    }
    return date;
  };

  const loadProgressData = async (token: string) => {
    try {
      // Load from MongoDB using existing API endpoints
      const [stepsResponse, workoutsResponse] = await Promise.all([
        fetch('/api/steps?days=30', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/workouts?days=30', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      let stepsData = [];
      let workoutsData = [];

      if (stepsResponse.ok) {
        const stepsResult = await stepsResponse.json();
        if (stepsResult.success) {
          stepsData = stepsResult.data;
        }
      }
      
      if (workoutsResponse.ok) {
        const workoutsResult = await workoutsResponse.json();
        if (workoutsResult.success) {
          workoutsData = workoutsResult.data;
        }
      }

      // Fallback to localStorage if no data in MongoDB (only if window is available)
      if (stepsData.length === 0 && typeof window !== 'undefined') {
        const storedSteps = localStorage.getItem(`steps_${user?.id}`);
        stepsData = storedSteps ? JSON.parse(storedSteps) : [];
      }
      if (workoutsData.length === 0 && typeof window !== 'undefined') {
        const storedWorkouts = localStorage.getItem(`workouts_${user?.id}`);
        workoutsData = storedWorkouts ? JSON.parse(storedWorkouts) : [];
      }

      // Debug: Log the data to see what we're working with
      console.log('Progress Page - Steps data:', stepsData);
      console.log('Progress Page - Workouts data:', workoutsData);
      console.log('Progress Page - User ID:', user?.id);

      // Generate last 14 days of data for charts
      const chartData: ChartData[] = [];
      const today = new Date();
      
      for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        console.log('Processing chart date:', dateStr);
        
        // Handle both Date objects and date strings from MongoDB
        const daySteps = stepsData.find((s: any) => {
          const entryDate = normalizeDate(s.date);
          console.log('Comparing steps entry:', entryDate, 'with chart date:', dateStr);
          return entryDate === dateStr;
        });
        
        const dayWorkouts = workoutsData.filter((w: any) => {
          const entryDate = normalizeDate(w.date);
          console.log('Comparing workouts entry:', entryDate, 'with chart date:', dateStr);
          return entryDate === dateStr;
        });
        
        const dayStepsValue = daySteps?.steps || 0;
        const dayCaloriesValue = (daySteps?.caloriesBurned || 0) + dayWorkouts.reduce((sum: number, w: any) => sum + w.caloriesBurned, 0);
        const dayWorkoutsValue = dayWorkouts.length;
        
        console.log(`Chart data for ${dateStr}:`, {
          steps: dayStepsValue,
          calories: dayCaloriesValue,
          workouts: dayWorkoutsValue
        });
        
        chartData.push({
          date: dateStr,
          steps: dayStepsValue,
          calories: dayCaloriesValue,
          workouts: dayWorkoutsValue
        });
      }

      console.log('Final chart data:', chartData);

      setChartData(chartData);

      // Calculate comprehensive stats
      const totalSteps = stepsData.reduce((sum: number, s: any) => sum + s.steps, 0);
      const totalStepsCalories = stepsData.reduce((sum: number, s: any) => sum + s.caloriesBurned, 0);
      const totalWorkoutCalories = workoutsData.reduce((sum: number, w: any) => sum + w.caloriesBurned, 0);
      const totalCalories = totalStepsCalories + totalWorkoutCalories;
      const totalWorkouts = workoutsData.length;
      const averageSteps = stepsData.length > 0 ? Math.round(totalSteps / stepsData.length) : 0;
      const averageCalories = stepsData.length > 0 ? Math.round(totalCalories / Math.max(stepsData.length, workoutsData.length)) : 0;
      
      // Find best days
      const bestStepDay = stepsData.reduce((best: any, current: any) => {
        const currentSteps = current.steps || 0;
        const bestSteps = best?.steps || 0;
        return currentSteps > bestSteps ? current : best;
      }, { date: '', steps: 0 });

      const bestCalorieDay = chartData.reduce((best: any, current: any) => {
        return current.calories > (best?.calories || 0) ? current : best;
      }, { date: '', calories: 0 });

      // Calculate streak (consecutive days with any activity)
      let streak = 0;
      const allActivityDates = [...new Set([
        ...stepsData.map((s: any) => normalizeDate(s.date)),
        ...workoutsData.map((w: any) => normalizeDate(w.date))
      ])].sort().reverse();

      console.log('All activity dates for streak:', allActivityDates);

      const todayStr = new Date().toISOString().split('T')[0];
      let currentDate = new Date(todayStr);
      
      for (const dateStr of allActivityDates) {
        const activityDate = new Date(dateStr);
        const currentDateStr = currentDate.toISOString().split('T')[0];
        console.log('Streak check:', dateStr, 'vs', currentDateStr);
        
        if (dateStr === currentDateStr) {
          streak++;
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (dateStr < todayStr) {
          break;
        }
      }

      console.log('Final streak:', streak);

      // Calculate weekly comparisons
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

      console.log('Week ranges:', {
        thisWeekStart: thisWeekStart.toISOString().split('T')[0],
        lastWeekStart: lastWeekStart.toISOString().split('T')[0],
        lastWeekEnd: lastWeekEnd.toISOString().split('T')[0]
      });

      const thisWeekSteps = stepsData
        .filter((s: any) => {
          const entryDate = new Date(normalizeDate(s.date));
          return entryDate >= thisWeekStart;
        })
        .reduce((sum: number, s: any) => sum + s.steps, 0);

      const lastWeekSteps = stepsData
        .filter((s: any) => {
          const entryDate = new Date(normalizeDate(s.date));
          return entryDate >= lastWeekStart && entryDate <= lastWeekEnd;
        })
        .reduce((sum: number, s: any) => sum + s.steps, 0);

      const thisWeekCalories = stepsData
        .filter((s: any) => {
          const entryDate = new Date(normalizeDate(s.date));
          return entryDate >= thisWeekStart;
        })
        .reduce((sum: number, s: any) => sum + s.caloriesBurned, 0) +
        workoutsData
        .filter((w: any) => {
          const entryDate = new Date(normalizeDate(w.date));
          return entryDate >= thisWeekStart;
        })
        .reduce((sum: number, w: any) => sum + w.caloriesBurned, 0);

      const lastWeekCalories = stepsData
        .filter((s: any) => {
          const entryDate = new Date(normalizeDate(s.date));
          return entryDate >= lastWeekStart && entryDate <= lastWeekEnd;
        })
        .reduce((sum: number, s: any) => sum + s.caloriesBurned, 0) +
        workoutsData
        .filter((w: any) => {
          const entryDate = new Date(normalizeDate(w.date));
          return entryDate >= lastWeekStart && entryDate <= lastWeekEnd;
        })
        .reduce((sum: number, w: any) => sum + w.caloriesBurned, 0);

      console.log('Weekly stats:', {
        thisWeekSteps,
        lastWeekSteps,
        thisWeekCalories,
        lastWeekCalories
      });

      setStats({
        totalSteps,
        totalCalories,
        totalWorkouts,
        averageSteps,
        averageCalories,
        bestStepDay: {
          date: normalizeDate(bestStepDay.date),
          steps: bestStepDay.steps || 0
        },
        bestCalorieDay,
        streak,
        thisWeekSteps,
        lastWeekSteps,
        thisWeekCalories,
        lastWeekCalories
      });

    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getWeeklyChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  const getChangeColor = (current: number, previous: number) => {
    return current >= previous ? 'text-green-600' : 'text-red-600';
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'steps' && `${entry.value.toLocaleString()} steps`}
              {entry.dataKey === 'calories' && `${entry.value} calories`}
              {entry.dataKey === 'workouts' && `${entry.value} workouts`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-blue-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-bold text-gray-900">Progress Tracking</h1>
            </div>
            <div className="text-sm text-gray-600">
              Welcome back, {user.name}!
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Steps</CardTitle>
              <Footprints className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{stats.totalSteps.toLocaleString()}</div>
              <p className="text-xs text-blue-700">
                Avg: {stats.averageSteps.toLocaleString()}/day
              </p>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  This week: {stats.thisWeekSteps.toLocaleString()}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Total Calories</CardTitle>
              <Flame className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{stats.totalCalories}</div>
              <p className="text-xs text-orange-700">
                Avg: {stats.averageCalories}/day
              </p>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  This week: {stats.thisWeekCalories}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Total Workouts</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{stats.totalWorkouts}</div>
              <p className="text-xs text-green-700">
                Exercise sessions completed
              </p>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  Sessions logged
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Current Streak</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats.streak}</div>
              <p className="text-xs text-purple-700">
                {stats.streak === 1 ? 'day' : 'days'} active
              </p>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  Keep it up!
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Weekly Steps Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">This Week</span>
                  <span className="font-semibold text-lg">{stats.thisWeekSteps.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Week</span>
                  <span className="font-semibold text-lg">{stats.lastWeekSteps.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">Change</span>
                  <span className={`font-semibold ${getChangeColor(stats.thisWeekSteps, stats.lastWeekSteps)}`}>
                    {getWeeklyChange(stats.thisWeekSteps, stats.lastWeekSteps)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Flame className="w-5 h-5 mr-2 text-orange-600" />
                Weekly Calories Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">This Week</span>
                  <span className="font-semibold text-lg">{stats.thisWeekCalories}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Last Week</span>
                  <span className="font-semibold text-lg">{stats.lastWeekCalories}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-gray-600">Change</span>
                  <span className={`font-semibold ${getChangeColor(stats.thisWeekCalories, stats.lastWeekCalories)}`}>
                    {getWeeklyChange(stats.thisWeekCalories, stats.lastWeekCalories)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Steps Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Steps Trend (Last 14 Days)</CardTitle>
              <CardDescription>Your daily step count over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="steps" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Calories Burned */}
          <Card>
            <CardHeader>
              <CardTitle>Calories Burned (Last 14 Days)</CardTitle>
              <CardDescription>Daily calories from steps and workouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="calories" 
                      fill="#ea580c"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workout Activity */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Workout Activity (Last 14 Days)</CardTitle>
            <CardDescription>Number of workouts per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="workouts" 
                    fill="#16a34a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        {(stats.bestStepDay.steps > 0 || stats.bestCalorieDay.calories > 0 || stats.streak > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2 text-purple-600" />
                Achievements & Records
              </CardTitle>
              <CardDescription>Your fitness milestones and personal bests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.bestStepDay.steps > 0 && (
                  <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Footprints className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Best Step Day</p>
                      <p className="text-sm text-blue-700">
                        {stats.bestStepDay.steps.toLocaleString()} steps
                      </p>
                      <p className="text-xs text-blue-600">
                        {formatDate(stats.bestStepDay.date)}
                      </p>
                    </div>
                  </div>
                )}
                
                {stats.bestCalorieDay.calories > 0 && (
                  <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-lg">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Flame className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-orange-900">Best Calorie Day</p>
                      <p className="text-sm text-orange-700">
                        {stats.bestCalorieDay.calories} calories
                      </p>
                      <p className="text-xs text-orange-600">
                        {formatDate(stats.bestCalorieDay.date)}
                      </p>
                    </div>
                  </div>
                )}
                
                {stats.streak > 0 && (
                  <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-purple-900">
                        Current Streak
                      </p>
                      <p className="text-sm text-purple-700">
                        {stats.streak} {stats.streak === 1 ? 'day' : 'days'} active
                      </p>
                      <p className="text-xs text-purple-600">
                        Keep it up!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}