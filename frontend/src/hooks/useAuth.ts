import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const setUser = useAuthStore((state) => state.setUser);

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    setUser,
    isAdmin: user?.role === 'admin',
    hasRole: (roles: string[]) => user ? roles.includes(user.role) : false,
  };
};
