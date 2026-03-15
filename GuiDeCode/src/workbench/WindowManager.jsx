import React from 'react';
import { useWorkbench } from '@/contexts/WorkbenchContext';
import Window from './Window';

const WindowManager = () => {
  const { openWindows } = useWorkbench();

  return (
    <div className="wb-window-manager">
      {openWindows.map(win => (
        <Window key={win.id} win={win} />
      ))}
    </div>
  );
};

export default WindowManager;