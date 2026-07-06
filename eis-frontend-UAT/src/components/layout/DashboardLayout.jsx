// src/components/layout/DashboardLayout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header  from './Header';

export default function DashboardLayout({ children, breadcrumb, title }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans transition-colors">
            <Sidebar 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
                isCollapsed={sidebarCollapsed}
            />
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                <Header
                    onMenuClick={() => setSidebarOpen(v => !v)}
                    onToggleCollapse={() => setSidebarCollapsed(v => !v)}
                    isCollapsed={sidebarCollapsed}
                    breadcrumb={breadcrumb}
                    title={title}
                />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900 transition-colors">
                    {children || <Outlet />}
                </main>
            </div>
        </div>
    );
}