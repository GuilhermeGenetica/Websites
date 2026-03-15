import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkbench } from '@/contexts/WorkbenchContext';
import Desktop from '@/workbench/Desktop';
import '../workbench/workbench.css';

const WorkbenchDesktop = () => {
  const { user, loading } = useWorkbench();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/workbench/login', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="wb-boot-screen">
        <div className="wb-boot-logo">
          <div className="wb-boot-logo-mark">WB</div>
          <p className="wb-boot-loading">Loading WorkBench...</p>
          <div className="wb-boot-progress">
            <div className="wb-boot-bar" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <Desktop />;
};

export default WorkbenchDesktop;