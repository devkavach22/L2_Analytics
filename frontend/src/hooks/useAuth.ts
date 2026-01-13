// ============================================
// USE AUTH HOOK - AUTHENTICATION STATE
// ============================================

import { useAppSelector } from '@/store/hooks';

export const useAuth = () => {
  const { user, token, isAuthenticated, isAdmin, isLoading, error } = useAppSelector(
    (state) => state.auth
  );

  return {
    user,
    token,
    isAuth: isAuthenticated,
    isAuthenticated,
    isAdmin,
    isLoading,
    error,
  };
};

export default useAuth;
