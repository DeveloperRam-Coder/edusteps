import { createContext, useContext, useState } from 'react';

interface ActivityCtx {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
}

const ActivityContext = createContext<ActivityCtx>({ unreadCount: 0, setUnreadCount: () => {} });

export const ActivityProvider = ({ children }: { children: React.ReactNode }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  return (
    <ActivityContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivityContext = () => useContext(ActivityContext);
