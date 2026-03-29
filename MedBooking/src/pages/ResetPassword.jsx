import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationState, setValidationState] = useState({
    isValidating: true,
    isValid: false,
    email: '',
    error: ''
  });

  const { API_BASE_URL } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get('token');
    const userTypeFromUrl = params.get('type');

    if (!tokenFromUrl || !userTypeFromUrl) {
      setValidationState({ isValidating: false, isValid: false, error: "Invalid or incomplete recovery link." });
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/validate_reset_token.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl, userType: userTypeFromUrl }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setValidationState({ isValidating: false, isValid: true, email: data.email, error: '' });
        } else {
          throw new Error(data.message || 'Unknown validation error.');
        }
      } catch (error) {
        setValidationState({ isValidating: false, isValid: false, error: error.message });
      }
    };

    validateToken();
  }, [location, API_BASE_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userType = params.get('type');

    try {
      const response = await fetch(`${API_BASE_URL}/reset_password.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userType, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        navigate('/');
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
  
  const renderContent = () => {
    if (validationState.isValidating) {
      return <p className="text-center">Validating your recovery link...</p>;
    }

    if (!validationState.isValid) {
      return (
        <div className="text-center">
            <p className="text-red-600 mb-4">{validationState.error}</p>
            <Button asChild>
                <Link to="/forgot-password">Request a new link</Link>
            </Button>
        </div>
      );
    }

    return (
      <>
        <CardDescription>
          Resetting password for the account: <strong>{validationState.email}</strong>
        </CardDescription>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
