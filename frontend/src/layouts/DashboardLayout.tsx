import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const DashboardLayout: React.FC = () => {
  const { user, switchRole } = useAuth();

  const userRole = user?.role || 'Airport Head';

  // Role-filtered sidebar navigation per AGENTS.md Section 7 & 11
  const rawNavGroups = [
    {
      title: 'Operations',
      items: [
        { name: 'Dashboard', path: '/dashboard', roles: ['Airport Head', 'Gate Manager', 'Flight Manager', 'Ground Crew'] },
        { name: 'Gate Allocation', path: '/allocations', roles: ['Airport Head', 'Gate Manager'] },
        { name: 'Gate Timeline', path: '/timeline', roles: ['Airport Head', 'Gate Manager', 'Flight Manager'] },
        { name: 'Flights', path: '/flights', roles: ['Airport Head', 'Gate Manager', 'Flight Manager'] },
        { name: 'Gates', path: '/gates', roles: ['Airport Head', 'Gate Manager', 'Flight Manager'] }
      ]
    },
    {
      title: 'Infrastructure',
      items: [
        { name: 'Terminals', path: '/terminals', roles: ['Airport Head', 'Gate Manager'] },
        { name: 'Maintenance', path: '/maintenance', roles: ['Airport Head', 'Gate Manager'] }
      ]
    },
    {
      title: 'Resources',
      items: [
        { name: 'Airlines', path: '/airlines', roles: ['Airport Head', 'Flight Manager'] },
        { name: 'Aircraft', path: '/aircraft', roles: ['Airport Head', 'Flight Manager'] },
        { name: 'Employees', path: '/employees', roles: ['Airport Head'] }
      ]
    },
    {
      title: 'Station & Analytics',
      items: [
        { name: 'Airport & Tower', path: '/airport', roles: ['Airport Head', 'Gate Manager', 'Flight Manager'] },
        { name: 'Gate Utilization', path: '/analytics', roles: ['Airport Head', 'Gate Manager'] }
      ]
    }
  ];

  const navGroups = rawNavGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => item.roles.includes(userRole))
    }))
    .filter(group => group.items.length > 0);

  return (
    <div className="flex h-screen bg-aviation-bg text-aviation-text overflow-hidden font-sans">
      {/* Professional Corporate Aviation Sidebar */}
      <aside className="w-60 border-r border-aviation-dark bg-aviation-navy text-slate-300 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between">
          <NavLink to="/" className="flex items-baseline gap-2 group">
            <span className="font-display font-semibold text-xl tracking-tight text-white group-hover:text-aviation-cyan transition-colors">
              AGAMS
            </span>
            <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-aviation-cyan/80 font-tabular">
              Operations
            </span>
          </NavLink>
        </div>

        {/* Corporate Navigation Groups Filtered by Role */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {navGroups.map((group) => (
            <div key={group.title}>
              <div className="px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 mb-2">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `block px-2.5 py-1.5 text-[13px] rounded-[3px] transition-colors relative ${
                        isActive
                          ? 'text-white bg-white/10 font-medium pl-3 border-l-2 border-aviation-blue'
                          : 'text-slate-300 hover:text-white hover:bg-white/5 pl-3 border-l-2 border-transparent'
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-aviation-border bg-white px-8 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3 text-[12px]">
            <span className="font-semibold tracking-wide text-aviation-text font-tabular">
              DUBAI INTERNATIONAL AIRPORT
            </span>
            <span className="text-aviation-border">|</span>
            <span className="text-aviation-muted font-medium">
              Concourse Stand Allocation & Dispatch
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-aviation-bg px-3 py-1.5 rounded-[4px] border border-aviation-border text-[12px]">
              <span className="text-aviation-muted font-medium">Console:</span>
              <select
                value={userRole}
                onChange={(e) => switchRole(e.target.value as any)}
                className="bg-transparent font-semibold text-aviation-navy border-none outline-hidden cursor-pointer"
                aria-label="Operational Role Console"
              >
                <option value="Airport Head">Airport Head</option>
                <option value="Gate Manager">Gate Manager</option>
                <option value="Flight Manager">Flight Manager</option>
              </select>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-tabular text-stone">
              <span className="w-2 h-2 rounded-full bg-status-available animate-pulse"></span>
              <span className="font-semibold text-ink">LIVE</span>
            </div>
          </div>
        </header>


        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-aviation-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
