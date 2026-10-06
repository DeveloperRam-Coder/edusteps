import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AttendanceStats {
  total_records: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  attendance_rate: number;
  last_updated: Date;
}

interface AttendanceContextType {
  stats: AttendanceStats | null;
  updateStats: (newStats: Partial<AttendanceStats>) => void;
  triggerRefresh: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const [stats, setStats] = useState<AttendanceStats | null>(null);

  const updateStats = useCallback((newStats: Partial<AttendanceStats>) => {
    setStats((prev) => ({
      ...prev,
      ...newStats,
      last_updated: new Date(),
    } as AttendanceStats));
  }, []);

  const triggerRefresh = useCallback(() => {
    setStats((prev) => (prev ? { ...prev, last_updated: new Date() } : null));
  }, []);

  return (
    <AttendanceContext.Provider value={{ stats, updateStats, triggerRefresh }}>
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within AttendanceProvider');
  }
  return context;
};
