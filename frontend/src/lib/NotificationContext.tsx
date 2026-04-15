import { createContext, useContext, useState, ReactNode } from 'react';
import { CheckSquare } from 'lucide-react';

interface NotificationContextType {
  notifyComplete: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<string | null>(null);

  const notifyComplete = (message: string) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  return (
    <NotificationContext.Provider value={{ notifyComplete }}>
      {children}
      {notification && (
        <div className="fixed top-6 right-6 z-[100] animate-slideDown">
          <div className="bg-bright-blue text-white px-6 py-4 shadow-2xl flex items-center gap-4 min-w-[300px]">
             <CheckSquare className="shrink-0" size={24} />
             <div className="font-bold text-sm tracking-wide">{notification}</div>
             <div className="absolute top-0 left-0 w-full h-1 bg-white/30 animate-[shrinkX_4s_linear]" />
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used within NotificationProvider");
  return context;
}
