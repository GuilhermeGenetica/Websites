import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Stethoscope } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('patient');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { API_BASE_URL } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/forgot_password.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Request Sent",
          description: data.message,
        });
        setMessage(data.message);
      } else {
        throw new Error(data.message || 'An error occurred.');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Recover Password</CardTitle>
          <CardDescription>Enter your email and select your account type to receive a recovery link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={userType} onValueChange={setUserType}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger
                  value="patient"
                  className="transition-all duration-300
                    hover:bg-gradient-to-b hover:from-blue-200 hover:to-blue-100 
                    dark:hover:from-blue-800 dark:hover:to-blue-700 
                    data-[state=active]:bg-gradient-to-b data-[state=active]:from-blue-300 data-[state=active]:to-blue-100 
                    data-[state=active]:text-blue-900 
                    dark:data-[state=active]:from-blue-900 dark:data-[state=active]:to-blue-700 
                    dark:data-[state=active]:text-blue-100"
                >
                  Patient
                </TabsTrigger>

                <TabsTrigger
                  value="doctor"
                  className="transition-all duration-300
                    hover:bg-gradient-to-b hover:from-green-200 hover:to-green-100 
                    dark:hover:from-green-800 dark:hover:to-green-700 
                    data-[state=active]:bg-gradient-to-b data-[state=active]:from-green-300 data-[state=active]:to-green-100 
                    data-[state=active]:text-green-900 
                    dark:data-[state=active]:from-green-900 dark:data-[state=active]:to-green-700 
                    dark:data-[state=active]:text-green-100"
                >
                  Doctor
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Recovery Link'}
            </Button>
          </form>
          {message && <p className="mt-4 text-center text-sm text-green-600">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
