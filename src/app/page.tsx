// app/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Mail, Lock, User, Weight, Ruler, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    weight: undefined as number | undefined,
    height: undefined as number | undefined,
    age: undefined as number | undefined
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(data.data.user));
          localStorage.setItem('authToken', data.data.token);
        }
        window.location.href = '/dashboard';
      } else {
        toast.error(data.error || 'Login failed');
        setIsLoading(false);
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerData.name?.trim() || !registerData.email?.trim() || !registerData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (registerData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(data.data.user));
          localStorage.setItem('authToken', data.data.token);
          localStorage.setItem('isNewUser', 'true'); // Flag for goals modal
        }
        window.location.href = '/dashboard';
      } else {
        toast.error(data.error || 'Registration failed');
        setIsLoading(false);
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">FitTracker Pro</h1>
          <p className="text-gray-600">Track your fitness journey</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="space-y-1 pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="space-y-4">
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="password"
                        placeholder="Enter password"
                        className="pl-10"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="John Doe"
                        className="pl-10"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="password"
                        placeholder="At least 6 characters"
                        className="pl-10"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        minLength={6}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Weight (kg)</Label>
                      <Input
                        type="number"
                        placeholder="70"
                        className="text-sm"
                        value={registerData.weight || ''}
                        onChange={(e) => setRegisterData({ 
                          ...registerData, 
                          weight: e.target.value ? Number(e.target.value) : undefined 
                        })}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Height (cm)</Label>
                      <Input
                        type="number"
                        placeholder="175"
                        className="text-sm"
                        value={registerData.height || ''}
                        onChange={(e) => setRegisterData({ 
                          ...registerData, 
                          height: e.target.value ? Number(e.target.value) : undefined 
                        })}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Age</Label>
                      <Input
                        type="number"
                        placeholder="25"
                        className="text-sm"
                        value={registerData.age || ''}
                        onChange={(e) => setRegisterData({ 
                          ...registerData, 
                          age: e.target.value ? Number(e.target.value) : undefined 
                        })}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}