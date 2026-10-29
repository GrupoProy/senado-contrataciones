import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Shield,
  Key,
  Menu as MenuIcon,
  Building2,
  Briefcase,
  ListTree,
  Sliders,
  FileText,
  GitBranch,
  Activity,
  FileSignature,
  ClipboardList,
  ChevronLeft,
  X,
  Send,
  UserPlus,
  Users2,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useMisMenus } from '@/features/menus/hooks/use-mis-menus';

// ─── Mapa de íconos dinámicos ───────────────────────────────────────────────
const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  tools: Sliders,
  briefcase: Briefcase,
  chart: Activity,
  user: Users,
  key: Key,
  lock: Shield,
  menu: MenuIcon,
  sitemap: Building2,
  list: ListTree,
  'layout-dashboard': LayoutDashboard,
  sliders: Sliders,
  'user-plus': UserPlus,
  users: Users2,
  'file-text': FileText,
  'git-branch': GitBranch,
  activity: Activity,
  'file-signature': FileSignature,
  clipboard: ClipboardList,
  dashboard: LayoutDashboard,
  send: Send,
};

function SidebarContent({
  collapsed,
  isMobile,
  onClose,
}: {
  collapsed: boolean;
  isMobile: boolean;
  onClose?: () => void;
}) {
  const { toggleSidebar } = useUIStore();
  const location = useLocation();
  const { data: menus, isLoading } = useMisMenus();

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-sm">
          <Shield className="size-5" />
        </div>
        {(!collapsed || isMobile) && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">Contrataciones</p>
            <p className="truncate text-xs text-muted-foreground">Senado de Bolivia</p>
          </div>
        )}
        {isMobile && (
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          menus?.map((grupo) => {
            // Si el grupo no tiene hijos, lo renderizamos como item directo (ej. Dashboard)
            if (!grupo.hijos || grupo.hijos.length === 0) {
              if (!grupo.ruta) return null; // Ignorar si no tiene ruta

              const Icon = IconMap[grupo.icono || ''] || LayoutDashboard;
              const active = location.pathname.startsWith(grupo.ruta);

              return (
                <div key={grupo.id} className="mb-2">
                  <NavLink
                    to={grupo.ruta}
                    onClick={isMobile ? onClose : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {(!collapsed || isMobile) && <span className="truncate">{grupo.etiqueta}</span>}
                  </NavLink>
                </div>
              );
            }

            // Renderizar grupo con hijos
            return (
              <div key={grupo.id} className="mb-6">
                {(!collapsed || isMobile) && (
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {grupo.etiqueta}
                  </p>
                )}
                <div className="space-y-1">
                  {grupo.hijos.map((item) => {
                    const Icon = IconMap[item.icono || ''] || FileText;
                    const active = location.pathname.startsWith(item.ruta || '');

                    const link = (
                      <NavLink
                        key={item.id}
                        to={item.ruta || '#'}
                        onClick={isMobile ? onClose : undefined}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                        )}
                        <Icon className="size-4 shrink-0" />
                        {(!collapsed || isMobile) && (
                          <span className="truncate">{item.etiqueta}</span>
                        )}
                      </NavLink>
                    );

                    return collapsed && !isMobile ? (
                      <Tooltip key={item.id}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.etiqueta}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </nav>

      {/* Footer toggle (solo desktop) */}
      {!isMobile && (
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={toggleSidebar}
          >
            <ChevronLeft className={cn('transition-transform', collapsed && 'rotate-180')} />
            {!collapsed && <span>Colapsar</span>}
          </Button>
        </div>
      )}
    </>
  );
}

export function AppSidebar() {
  const { sidebarCollapsed, mobileSidebarOpen, closeMobileSidebar } = useUIStore();
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const location = useLocation();

  // Cierra el drawer móvil al cambiar de ruta
  useEffect(() => {
    if (isMobile && mobileSidebarOpen) {
      closeMobileSidebar();
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Bloquea el scroll del body cuando el drawer móvil está abierto
  useEffect(() => {
    if (isMobile && mobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isMobile, mobileSidebarOpen]);

  return (
    <>
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            'flex h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-300 ease-in-out',
            sidebarCollapsed ? 'w-[68px]' : 'w-[260px]'
          )}
        >
          <SidebarContent collapsed={sidebarCollapsed} isMobile={false} />
        </aside>
      )}

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMobile && mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
              onClick={closeMobileSidebar}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col border-r border-border bg-card shadow-2xl"
            >
              <SidebarContent collapsed={false} isMobile={true} onClose={closeMobileSidebar} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
