import { apiClient } from '@/lib/api-client';
import type { Menu, MenuArbol } from '../types/menu-types';

export const menusApi = {
  listar: () => apiClient.get<Menu[]>('/menus'),
  misMenus: () => apiClient.get<MenuArbol[]>('/menus/mis-menus'),
  crear: (input: Partial<Menu>) => apiClient.post<Menu>('/menus', input),
  cambiarEstado: (id: number, estado: 'ACT' | 'INA') =>
    apiClient.patch<{ message: string }>(`/menus/${id}/estado`, { estado }),
};
