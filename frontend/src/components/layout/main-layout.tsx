import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AppSidebar } from './app-sidebar';
import { AppTopbar } from './app-topbar';

export function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"
        >
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  );
}
