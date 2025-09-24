import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Gift, Plus, History, LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { to: '/grab', label: '抢红包', icon: Gift },
  { to: '/create', label: '发红包', icon: Plus },
  { to: '/history', label: '历史记录', icon: History },
];

const Navigation: React.FC = () => {
  const location = useLocation();
  
  return (
    <div className="flex justify-center mb-8">
      <nav className="flex gap-2 bg-white/60 backdrop-blur-sm p-2 rounded-full border border-white/30">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => 
              `flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                isActive || (to === '/grab' && location.pathname === '/')
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg transform scale-105' 
                  : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
export default Navigation;
