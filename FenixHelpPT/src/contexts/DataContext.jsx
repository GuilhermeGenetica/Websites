import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

const API_URL = import.meta.env.DEV 
  ? '/api/api.php'
  : 'https://fenixpt.onnetweb.com/api/api.php';

export const DataProvider = ({ children }) => {
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [actions, setActions] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recordsResponse, usersResponse, actionsResponse, postsResponse] = await Promise.all([
        fetch(`${API_URL}?endpoint=records`),
        fetch(`${API_URL}?endpoint=users`),
        fetch(`${API_URL}?endpoint=actions`),
        fetch(`${API_URL}?endpoint=posts`)
      ]);

      if (!recordsResponse.ok) throw new Error(`Failed to fetch records (${recordsResponse.status})`);
      if (!usersResponse.ok) throw new Error(`Failed to fetch users (${usersResponse.status})`);
      if (!actionsResponse.ok) throw new Error(`Failed to fetch actions (${actionsResponse.status})`);
      if (!postsResponse.ok) throw new Error(`Failed to fetch posts (${postsResponse.status})`);

      const recordsData = await recordsResponse.json();
      const usersData = await usersResponse.json();
      const actionsData = await actionsResponse.json();
      const postsData = await postsResponse.json();

      setRecords(recordsData);
      setUsers(usersData);
      setActions(actionsData);
      setPosts(postsData);

    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      setError("Não foi possível carregar os dados. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addUser = async (user) => {
    try {
      const response = await fetch(`${API_URL}?endpoint=users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (!response.ok) throw new Error('Failed to register');
      fetchData();
      return await response.json();
    } catch (error) {
      console.error("Add user failed:", error);
      throw error;
    }
  };

  const addRecord = async (record) => {
    try {
      const response = await fetch(`${API_URL}?endpoint=records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (!response.ok) throw new Error('Failed to add record');
      fetchData();
      return await response.json();
    } catch (error) {
      console.error("Add record failed:", error);
      throw error;
    }
  };

  const addAction = async (action) => {
    try {
      const response = await fetch(`${API_URL}?endpoint=actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });
      if (!response.ok) throw new Error('Failed to add action');
      fetchData();
      return await response.json();
    } catch (error) {
      console.error("Add action failed:", error);
      throw error;
    }
  };

  const addPost = async (post) => {
    try {
      const response = await fetch(`${API_URL}?endpoint=posts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(post),
      });
      if (!response.ok) throw new Error('Failed to add post');
      fetchData();
    } catch (error) { console.error("Add post failed:", error); throw error; }
  };

  const updateRecord = async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}?endpoint=records&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update record');
      fetchData();
    } catch (error) {
      console.error("Update record failed:", error);
      throw error;
    }
  };

  const updateUser = async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}?endpoint=users&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update user');
      fetchData();
    } catch (error) {
      console.error("Update user failed:", error);
      throw error;
    }
  };
  
  const updateAction = async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}?endpoint=actions&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update action');
      fetchData();
    } catch (error) {
      console.error("Update action failed:", error);
      throw error;
    }
  };

  const updatePost = async (post) => {
    try {
      const response = await fetch(`${API_URL}?endpoint=posts&id=${post.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(post),
      });
      if (!response.ok) throw new Error('Failed to update post');
      fetchData();
    } catch (error) { console.error("Update post failed:", error); throw error; }
  };

  const deleteRecord = async (id) => {
    try {
      const response = await fetch(`${API_URL}?endpoint=records&id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete record');
      fetchData();
    } catch (error) {
      console.error("Delete record failed:", error);
      throw error;
    }
  };

  const deleteUser = async (id) => {
    try {
      const response = await fetch(`${API_URL}?endpoint=users&id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to delete user');
      }
      fetchData();
    } catch (error) {
      console.error("Delete user failed:", error);
      throw error;
    }
  };

  const deleteAction = async (id) => {
    try {
      const response = await fetch(`${API_URL}?endpoint=actions&id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete action');
      fetchData();
    } catch (error) {
      console.error("Delete action failed:", error);
      throw error;
    }
  };

  const deletePost = async (id) => {
    try {
      const response = await fetch(`${API_URL}?endpoint=posts&id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete post');
      fetchData();
    } catch (error) { console.error("Delete post failed:", error); throw error; }
  };
  
  const loginUser = async (credentials) => {
     try {
      const response = await fetch(`${API_URL}?endpoint=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
          throw new Error(data.message || 'Login failed');
      }
      sessionStorage.setItem('fenixUser', JSON.stringify(data.user));
      return data.user;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const getActiveRecords = () => records.filter(record => record.status === 'active');
  const getPendingRecords = () => records.filter(record => record.status === 'pending');
  const getActiveActions = () => actions.filter(action => action.status === 'active');
  const getPendingActions = () => actions.filter(action => action.status === 'pending');

  const getStats = () => {
    const helpRequests = records.filter(r => r.type === 'help');
    const offers = records.filter(r => r.type === 'offer');
    const activeHelp = helpRequests.filter(r => r.status === 'active');
    return {
      familiesSupported: activeHelp.length,
      offersReceived: offers.length,
      volunteersRegistered: offers.filter(r => 
        r.phases?.shortTerm?.includes('voluntariado') || 
        r.phases?.mediumTerm?.includes('voluntariado-competencias')
      ).length
    };
  };

  return (
    <DataContext.Provider value={{
      records, users, actions, posts, loading, error,
      addUser, addRecord, addAction, addPost,
      updateRecord, updateUser, updateAction, updatePost,
      deleteRecord, deleteUser, deleteAction, deletePost,
      loginUser,
      getActiveRecords, getPendingRecords,
      getActiveActions, getPendingActions,
      getStats
    }}>
      {children}
    </DataContext.Provider>
  );
};
