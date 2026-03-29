// src/pages/UserDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle, XSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const UserDetails = () => {
  const { userType, userId } = useParams();
  // The useAuth token might not be synced in a new tab, so we'll read from localStorage.
  const { API_BASE_URL } = useAuth();
  const { toast } = useToast();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      // FIX: Read the token directly from localStorage.
      // This ensures the new tab has immediate access to the credential.
      const storedToken = localStorage.getItem('token');

      if (!storedToken) {
        setError("Authentication required. Please log in as an administrator.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/get_user_details.php?user_type=${userType}&user_id=${userId}`, {
          headers: {
            // Use the token read from localStorage in the request.
            'Authorization': `Bearer ${storedToken}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setUserData(data.data);
        } else {
          throw new Error(data.message || 'Failed to load user data.');
        }
      } catch (err) {
        setError(err.message);
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
    // The dependency on the useAuth token is removed to avoid unnecessary re-execution.
  }, [userType, userId, API_BASE_URL, toast]);

  const formatKey = (key) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase();

  // SOLUTION: Function to render specific values like images
  const renderValue = (key, value) => {
    if (key === 'profile_picture_url' && value) {
      // Use updated_at for cache-busting
      const imageUrl = `${API_BASE_URL.replace('/api', '')}/${value}?v=${userData.updated_at || ''}`;
      return (
        <div className="flex items-center space-x-2">
          <Avatar className="w-10 h-10">
            <AvatarImage src={imageUrl} alt="Profile" />
            <AvatarFallback>{getInitials(userData.full_name)}</AvatarFallback>
          </Avatar>
          <span className="text-gray-400 italic break-all">{value}</span>
        </div>
      );
    }
    
    if (key === 'document_url' && value) {
        return (
            <Button variant="link" asChild className="p-0 h-auto">
                <a href={`${API_BASE_URL.replace('/api', '')}/${value}`} target="_blank" rel="noopener noreferrer">
                    View Document
                </a>
            </Button>
        );
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (value === null || value === '') {
      return <span className="text-gray-400 italic">Not provided</span>;
    }

    return String(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 dark:bg-red-900/20 p-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-red-700 dark:text-red-300">An Error Occurred</h2>
        <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>
      </div>
    );
  }
  
  // Added a null-check for userData to prevent rendering errors.
  if (!userData) {
      return null;
  }

  return (
    <>
      <Helmet>
        <title>Details for {userData?.full_name || 'User'} | Admin</title>
      </Helmet>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                      <CardTitle className="text-2xl font-bold">
                        Details for {formatKey(userType)}
                      </CardTitle>
                      <CardDescription>
                        Complete data view for {userData.full_name}.
                      </CardDescription>
                  </div>
                  <Button onClick={() => window.close()} variant="ghost" size="sm">
                      <XSquare className="w-5 h-5 mr-2" />
                      Close Tab
                  </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {Object.entries(userData).map(([key, value]) => (
                      <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200 w-1/3">{formatKey(key)}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 break-words">
                          {/* SOLUTION: Use the renderValue function */}
                          {renderValue(key, value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default UserDetails;
