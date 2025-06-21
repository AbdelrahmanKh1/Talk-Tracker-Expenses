
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const DashboardHeader = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserName = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  return (
    <div className="bg-white px-4 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Ahlan {getUserName()} 👋</h1>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => navigate('/settings')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2"/>
          </svg>
        </button>
        <button
          onClick={handleSignOut}
          className="p-2 hover:bg-gray-100 rounded-full"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;
