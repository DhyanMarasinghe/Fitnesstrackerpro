// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Activity, 
  TrendingUp, 
  Calendar, 
  Footprints, 
  Flame, 
  Plus,
  BarChart3,
  LogOut,
  User as UserIcon,
  Save,
  Target,
  CalendarDays,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { User, StepsEntry, Workout } from '@/lib/types';

interface UserData {
  todaySteps: number;
  todayCalories: number;
  todayWorkouts: number;
  weeklySteps: number;
  weeklyCalories: number;
  weeklyWorkouts: number;
  recentActivities: Array<{
    id: string;
    type: 'steps' | 'workout';
    title: string;
    subtitle: string;
    calories: number;
    date: string;
  }>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    todaySteps: 0,
    todayCalories: 0,
    todayWorkouts: 0,
    weeklySteps: 0,
    weeklyCalories: 0,
    weeklyWorkouts: 0,
    recentActivities: []
  });

  // Goals state
  const [goals, setGoals] = useState({
    steps: 10000,
    calories: 500,
    workouts: 1
  });

  // Modal states
  const [stepsModalOpen, setStepsModalOpen] = useState(false);
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [newUserGoalsModalOpen, setNewUserGoalsModalOpen] = useState(false);

  // Form states
  const [stepsForm, setStepsForm] = useState({
    steps: '',
    duration: '',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [workoutForm, setWorkoutForm] = useState({
    name: '',
    type: 'cardio' as const,
    duration: '',
    intensity: 'medium' as const,
    date: new Date().toISOString().split('T')[0]
  });
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    weight: '',
    height: '',
    age: ''
  });
  
  const [goalsForm, setGoalsForm] = useState({
    steps: 10000,
    calories: 500,
    workouts: 1
  });

  // Get date range (today and 14 days before)
  const getDateRange = () => {
    const today = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(today.getDate() - 14);
    
    return {
      min: twoWeeksAgo.toISOString().split('T')[0],
      max: today.toISOString().split('T')[0]
    };
  };

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    const authToken = localStorage.getItem('authToken');
    
    if (!currentUser || !authToken) {
      router.push('/');
      return;
    }

    try {
      const userData = JSON.parse(currentUser);
      setUser(userData);
      setProfileForm({
        name: userData.name || '',
        weight: userData.profile?.weight?.toString() || '',
        height: userData.profile?.height?.toString() || '',
        age: userData.profile?.age?.toString() || ''
      });
      
      // Check if user is new and load data
      checkIfNewUser(authToken);
      loadUserGoals(authToken);
      loadUserData(authToken);
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const checkIfNewUser = async (token: string) => {
    try {
      const response = await fetch('/api/user/goals', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 404) {
        // No goals found, user is new
        setIsNewUser(true);
        setNewUserGoalsModalOpen(true);
      } else if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const userGoals = result.data;
          setGoals(userGoals);
          setGoalsForm(userGoals);
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }
  };

  const loadUserGoals = async (token: string) => {
    try {
      const response = await fetch('/api/user/goals', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const userGoals = result.data;
          setGoals(userGoals);
          setGoalsForm(userGoals);
        }
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

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

  const loadUserData = async (token: string) => {
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

      // Get today's date in local timezone (in case of timezone issues)
      const today = new Date().toISOString().split('T')[0];
      const todayLocal = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
      
      console.log('Today (ISO):', today);
      console.log('Today (Local):', todayLocal);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      // Debug: Log the data to see what we're working with
      console.log('Today:', today);
      console.log('Steps data:', stepsData);
      console.log('Workouts data:', workoutsData);
      
      // Process data - handle both Date objects and date strings
      const todaySteps = stepsData.find((s: any) => {
        const entryDate = normalizeDate(s.date);
        console.log('Comparing step entry:', entryDate, 'with today:', today, 'or local:', todayLocal);
        return entryDate === today || entryDate === todayLocal;
      });
      
      const todayWorkouts = workoutsData.filter((w: any) => {
        const entryDate = normalizeDate(w.date);
        console.log('Comparing workout entry:', entryDate, 'with today:', today, 'or local:', todayLocal);
        return entryDate === today || entryDate === todayLocal;
      });
      
      console.log('Today steps found:', todaySteps);
      console.log('Today workouts found:', todayWorkouts);
      
      const weeklySteps = stepsData
        .filter((s: any) => {
          const entryDate = new Date(normalizeDate(s.date));
          return entryDate >= weekAgo;
        })
        .reduce((sum: number, s: any) => sum + s.steps, 0);
      
      const weeklyStepsCalories = stepsData
        .filter((s: any) => {
          const entryDate = new Date(normalizeDate(s.date));
          return entryDate >= weekAgo;
        })
        .reduce((sum: number, s: any) => sum + s.caloriesBurned, 0);
      
      const weeklyWorkoutCalories = workoutsData
        .filter((w: any) => {
          const entryDate = new Date(normalizeDate(w.date));
          return entryDate >= weekAgo;
        })
        .reduce((sum: number, w: any) => sum + w.caloriesBurned, 0);

      const recentActivities = [
        ...stepsData.slice(-3).map((s: any) => ({
          id: s._id || s.id,
          type: 'steps' as const,
          title: `${s.steps.toLocaleString()} steps`,
          subtitle: `${s.duration} minutes active`,
          calories: s.caloriesBurned,
          date: normalizeDate(s.date)
        })),
        ...workoutsData.slice(-2).map((w: any) => ({
          id: w._id || w.id,
          type: 'workout' as const,
          title: w.name,
          subtitle: `${w.duration} min • ${w.intensity} intensity`,
          calories: w.caloriesBurned,
          date: normalizeDate(w.date)
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

      setUserData({
        todaySteps: todaySteps?.steps || 0,
        todayCalories: (todaySteps?.caloriesBurned || 0) + todayWorkouts.reduce((sum: number, w: any) => sum + w.caloriesBurned, 0),
        todayWorkouts: todayWorkouts.length,
        weeklySteps,
        weeklyCalories: weeklyStepsCalories + weeklyWorkoutCalories,
        weeklyWorkouts: workoutsData.filter((w: any) => {
          const entryDate = new Date(normalizeDate(w.date));
          return entryDate >= weekAgo;
        }).length,
        recentActivities
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSaveNewUserGoals = async () => {
    if (!user) return;
    
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }
    
    try {
      const response = await fetch('/api/user/goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          steps: goalsForm.steps,
          calories: goalsForm.calories,
          workouts: goalsForm.workouts
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setGoals(goalsForm);
        setNewUserGoalsModalOpen(false);
        setIsNewUser(false);
        toast.success('Welcome! Your goals have been set!');
      } else {
        throw new Error(result.error || 'Failed to save goals');
      }
    } catch (error) {
      console.error('Error saving goals:', error);
      toast.error('Failed to save goals');
    }
  };

  const handleSaveGoals = async () => {
    if (!user) return;
    
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }
    
    try {
      const response = await fetch('/api/user/goals', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          steps: goalsForm.steps,
          calories: goalsForm.calories,
          workouts: goalsForm.workouts
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setGoals(goalsForm);
        setGoalsModalOpen(false);
        toast.success('Goals updated!');
      } else {
        throw new Error(result.error || 'Failed to update goals');
      }
    } catch (error) {
      console.error('Error updating goals:', error);
      toast.error('Failed to update goals');
    }
  };

  const handleLogSteps = async () => {
    if (!user || !stepsForm.steps || !stepsForm.duration || !stepsForm.date) {
      toast.error('Please fill in all fields');
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }

    try {
      const response = await fetch('/api/steps', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: stepsForm.date,
          steps: parseInt(stepsForm.steps),
          duration: parseInt(stepsForm.duration)
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStepsForm({ steps: '', duration: '', date: new Date().toISOString().split('T')[0] });
        setStepsModalOpen(false);
        loadUserData(authToken);
        toast.success('Steps logged successfully!');
      } else {
        throw new Error(result.error || 'Failed to log steps');
      }
    } catch (error) {
      console.error('Error logging steps:', error);
      toast.error('Failed to log steps');
    }
  };

  const handleAddWorkout = async () => {
    if (!user || !workoutForm.name || !workoutForm.duration || !workoutForm.date) {
      toast.error('Please fill in all fields');
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: workoutForm.date,
          type: workoutForm.type,
          name: workoutForm.name,
          duration: parseInt(workoutForm.duration),
          intensity: workoutForm.intensity
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setWorkoutForm({ 
          name: '', 
          type: 'cardio', 
          duration: '', 
          intensity: 'medium',
          date: new Date().toISOString().split('T')[0]
        });
        setWorkoutModalOpen(false);
        loadUserData(authToken);
        toast.success('Workout added successfully!');
      } else {
        throw new Error(result.error || 'Failed to add workout');
      }
    } catch (error) {
      console.error('Error adding workout:', error);
      toast.error('Failed to add workout');
    }
  };

  const handleUpdateProfile = async () => {
    if (!user || !profileForm.name) {
      toast.error('Name is required');
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Authentication required');
      return;
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileForm.name,
          weight: profileForm.weight ? parseInt(profileForm.weight) : null,
          height: profileForm.height ? parseInt(profileForm.height) : null,
          age: profileForm.age ? parseInt(profileForm.age) : null
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const updatedUser = {
          ...user,
          name: result.data.name,
          profile: result.data.profile
        };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setProfileEditMode(false);
        toast.success('Profile updated successfully!');
      } else {
        throw new Error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const stepsProgress = Math.min(100, Math.round((userData.todaySteps / goals.steps) * 100));
  const caloriesProgress = Math.min(100, Math.round((userData.todayCalories / goals.calories) * 100));
  const workoutsProgress = Math.min(100, Math.round((userData.todayWorkouts / goals.workouts) * 100));

  const getActivityLevel = (steps: number) => {
    if (steps < 5000) return { level: 'Sedentary', color: 'text-red-600', bg: 'bg-red-50' };
    if (steps < 7500) return { level: 'Lightly Active', color: 'text-orange-600', bg: 'bg-orange-50' };
    if (steps < 10000) return { level: 'Moderately Active', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (steps < 12500) return { level: 'Very Active', color: 'text-green-600', bg: 'bg-green-50' };
    return { level: 'Highly Active', color: 'text-blue-600', bg: 'bg-blue-50' };
  };

  const activityLevel = getActivityLevel(userData.todaySteps);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const dateRange = getDateRange();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* New User Goals Modal */}
      <Dialog open={newUserGoalsModalOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-600" />
              Welcome to FitTracker Pro!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">Let's set up your fitness goals to get started:</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Daily Steps Goal</Label>
                <Input
                  type="number"
                  value={goalsForm.steps}
                  onChange={(e) => setGoalsForm({ ...goalsForm, steps: parseInt(e.target.value) || 0 })}
                  placeholder="10000"
                />
                <p className="text-xs text-gray-500">Recommended: 8,000 - 12,000 steps</p>
              </div>
              <div className="space-y-2">
                <Label>Daily Calories Goal</Label>
                <Input
                  type="number"
                  value={goalsForm.calories}
                  onChange={(e) => setGoalsForm({ ...goalsForm, calories: parseInt(e.target.value) || 0 })}
                  placeholder="500"
                />
                <p className="text-xs text-gray-500">Recommended: 300 - 800 calories</p>
              </div>
              <div className="space-y-2">
                <Label>Daily Workouts Goal</Label>
                <Input
                  type="number"
                  value={goalsForm.workouts}
                  onChange={(e) => setGoalsForm({ ...goalsForm, workouts: parseInt(e.target.value) || 0 })}
                  placeholder="1"
                />
                <p className="text-xs text-gray-500">Recommended: 1 - 2 workouts</p>
              </div>
              <Button onClick={handleSaveNewUserGoals} className="w-full bg-purple-600 hover:bg-purple-700">
                <Target className="w-4 h-4 mr-2" />
                Set My Goals
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Activity className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">FitTracker Pro</h1>
            </div>

            <nav className="hidden md:flex items-center space-x-6">
              <Button
                variant="ghost"
                onClick={() => router.push('/progress')}
                className="text-gray-600 hover:text-blue-600"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Progress
              </Button>
            </nav>

            <div className="flex items-center space-x-4">
              {/* Enhanced Profile Modal */}
              <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">{user.name}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                      <span className="flex items-center">
                        <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
                        Profile
                      </span>
                      {!profileEditMode && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setProfileEditMode(true)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </DialogTitle>
                  </DialogHeader>
                  
                  {!profileEditMode ? (
                    // View Mode
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                          <p className="text-lg font-semibold text-gray-900">{user.name || 'Not set'}</p>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Weight</Label>
                            <p className="text-lg font-semibold text-gray-900">
                              {user.profile?.weight ? `${user.profile.weight} kg` : 'Not set'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Height</Label>
                            <p className="text-lg font-semibold text-gray-900">
                              {user.profile?.height ? `${user.profile.height} cm` : 'Not set'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Age</Label>
                            <p className="text-lg font-semibold text-gray-900">
                              {user.profile?.age ? `${user.profile.age} years` : 'Not set'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => setProfileEditMode(true)} 
                        className="w-full"
                        variant="outline"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Weight (kg)</Label>
                          <Input
                            type="number"
                            value={profileForm.weight}
                            onChange={(e) => setProfileForm({ ...profileForm, weight: e.target.value })}
                            placeholder="70"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Height (cm)</Label>
                          <Input
                            type="number"
                            value={profileForm.height}
                            onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })}
                            placeholder="175"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Age</Label>
                          <Input
                            type="number"
                            value={profileForm.age}
                            onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                            placeholder="25"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleUpdateProfile} className="flex-1">
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setProfileEditMode(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {getGreeting()}, {user.name}!
          </h2>
          <p className="text-gray-600">Here's your fitness summary for today</p>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Today's Steps</CardTitle>
              <Footprints className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 mb-2">
                {userData.todaySteps.toLocaleString()}
              </div>
              <Progress value={stepsProgress} className="mb-2 h-2" />
              <p className="text-xs text-blue-700">
                {stepsProgress}% of {goals.steps.toLocaleString()} goal
              </p>
              <Badge variant="secondary" className={`mt-2 ${activityLevel.color} ${activityLevel.bg}`}>
                {activityLevel.level}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Calories Burned</CardTitle>
              <Flame className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 mb-2">
                {userData.todayCalories}
              </div>
              <Progress value={caloriesProgress} className="mb-2 h-2" />
              <p className="text-xs text-orange-700">
                {caloriesProgress}% of {goals.calories} goal
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Workouts</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 mb-2">
                {userData.todayWorkouts}
              </div>
              <Progress value={workoutsProgress} className="mb-2 h-2" />
              <p className="text-xs text-green-700">
                {workoutsProgress}% of {goals.workouts} goal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions with Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="w-5 h-5 mr-2 text-blue-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>Log your fitness data and manage goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {/* Enhanced Log Steps Modal */}
                <Dialog open={stepsModalOpen} onOpenChange={setStepsModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Footprints className="w-4 h-4 mr-2" />
                      Log Steps
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center">
                        <CalendarDays className="w-5 h-5 mr-2 text-blue-600" />
                        Log Steps
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={stepsForm.date}
                          onChange={(e) => setStepsForm({ ...stepsForm, date: e.target.value })}
                          min={dateRange.min}
                          max={dateRange.max}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">
                          You can log data for today or up to 2 weeks ago
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Number of Steps</Label>
                        <Input
                          type="number"
                          value={stepsForm.steps}
                          onChange={(e) => setStepsForm({ ...stepsForm, steps: e.target.value })}
                          placeholder="8500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={stepsForm.duration}
                          onChange={(e) => setStepsForm({ ...stepsForm, duration: e.target.value })}
                          placeholder="60"
                        />
                      </div>
                      <Button onClick={handleLogSteps} className="w-full">
                        Save Steps
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Enhanced Add Workout Modal */}
                <Dialog open={workoutModalOpen} onOpenChange={setWorkoutModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Activity className="w-4 h-4 mr-2" />
                      Add Workout
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center">
                        <CalendarDays className="w-5 h-5 mr-2 text-green-600" />
                        Add Workout
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={workoutForm.date}
                          onChange={(e) => setWorkoutForm({ ...workoutForm, date: e.target.value })}
                          min={dateRange.min}
                          max={dateRange.max}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500">
                          You can log workouts for today or up to 2 weeks ago
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Workout Name</Label>
                        <Input
                          value={workoutForm.name}
                          onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })}
                          placeholder="Morning Run"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select value={workoutForm.type} onValueChange={(value: any) => setWorkoutForm({ ...workoutForm, type: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cardio">Cardio</SelectItem>
                              <SelectItem value="strength">Strength</SelectItem>
                              <SelectItem value="yoga">Yoga</SelectItem>
                              <SelectItem value="sports">Sports</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Intensity</Label>
                          <Select value={workoutForm.intensity} onValueChange={(value: any) => setWorkoutForm({ ...workoutForm, intensity: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={workoutForm.duration}
                          onChange={(e) => setWorkoutForm({ ...workoutForm, duration: e.target.value })}
                          placeholder="30"
                        />
                      </div>
                      <Button onClick={handleAddWorkout} className="w-full">
                        Save Workout
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Set Goals */}
                <Dialog open={goalsModalOpen} onOpenChange={setGoalsModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                      <Target className="w-4 h-4 mr-2" />
                      Set Goals
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Your Goals</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Daily Steps Goal</Label>
                        <Input
                          type="number"
                          value={goalsForm.steps}
                          onChange={(e) => setGoalsForm({ ...goalsForm, steps: parseInt(e.target.value) || 0 })}
                          placeholder="10000"
                        />
                        <p className="text-xs text-gray-500">Recommended: 8,000 - 12,000</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Daily Calories Goal</Label>
                        <Input
                          type="number"
                          value={goalsForm.calories}
                          onChange={(e) => setGoalsForm({ ...goalsForm, calories: parseInt(e.target.value) || 0 })}
                          placeholder="500"
                        />
                        <p className="text-xs text-gray-500">Recommended: 300 - 800</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Daily Workouts Goal</Label>
                        <Input
                          type="number"
                          value={goalsForm.workouts}
                          onChange={(e) => setGoalsForm({ ...goalsForm, workouts: parseInt(e.target.value) || 0 })}
                          placeholder="1"
                        />
                        <p className="text-xs text-gray-500">Recommended: 1 - 2</p>
                      </div>
                      <Button onClick={handleSaveGoals} className="w-full bg-purple-600 hover:bg-purple-700">
                        Update Goals
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                This Week
              </CardTitle>
              <CardDescription>Your weekly progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Steps</span>
                  <span className="font-semibold">{userData.weeklySteps.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Calories</span>
                  <span className="font-semibold">{userData.weeklyCalories}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Workouts</span>
                  <span className="font-semibold">{userData.weeklyWorkouts}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {userData.recentActivities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userData.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${activity.type === 'steps' ? 'bg-blue-100' : 'bg-green-100'}`}>
                        {activity.type === 'steps' ? (
                          <Footprints className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Activity className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.subtitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-800">{activity.calories} cal</p>
                      <p className="text-sm text-gray-600">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}