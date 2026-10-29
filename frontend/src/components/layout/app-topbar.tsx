import { Bell, Search, LogOut, User, Settings, Sun, Moon, Monitor, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export function AppTopbar() {
  const { usuario, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { toggleMobileSidebar } = useUIStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      /* noop */
    }
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  const initials = usuario ? getInitials(usuario.nombres, usuario.primerApellido) : '??';

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border px-4 lg:px-6">
      {/* Botón hamburguesa (móvil) */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleMobileSidebar}
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </Button>

      {/* Búsqueda */}
      <Button
        variant="outline"
        className="hidden w-full max-w-sm justify-start text-muted-foreground sm:flex"
      >
        <Search className="size-4" />
        <span>Buscar…</span>
        <kbd className="ml-auto inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium">
          ⌘K
        </kbd>
      </Button>

      {/* Botón de búsqueda compacto (móvil) */}
      <Button variant="ghost" size="icon" className="sm:hidden">
        <Search className="size-4" />
      </Button>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive ring-2 ring-background" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              {theme === 'light' && <Sun className="size-4" />}
              {theme === 'dark' && <Moon className="size-4" />}
              {theme === 'system' && <Monitor className="size-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 size-4" /> Claro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 size-4" /> Oscuro
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="mr-2 size-4" /> Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-1 pr-2 sm:pr-3">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-medium leading-tight">
                  {usuario?.nombres} {usuario?.primerApellido}
                </p>
                <p className="text-[10px] leading-tight text-muted-foreground">
                  {usuario?.rol.nombre}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm">
                  {usuario?.nombres} {usuario?.primerApellido}
                </span>
                <span className="text-xs font-normal text-muted-foreground">{usuario?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/perfil')}>
              <User className="mr-2 size-4" /> Mi perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/perfil/cambiar-password')}>
              <Settings className="mr-2 size-4" /> Cambiar contraseña
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 size-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
