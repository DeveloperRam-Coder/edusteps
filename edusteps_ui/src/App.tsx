import { AuthProvider } from './auth/AuthProvider';
import Router from './router/Router';
import './styles/global.css';
import { NotificationProvider } from './core/components/NotificationProvider';
import { ThemeProvider } from './core/theme/ThemeProvider';
import ApiStatusBanner from './core/components/ApiStatusBanner';
import { ActivityProvider } from './core/components/ActivityContext';
import { AttendanceProvider } from './contexts/AttendanceContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AttendanceProvider>
            <ActivityProvider>
              <ApiStatusBanner />
              <Router />
            </ActivityProvider>
          </AttendanceProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
