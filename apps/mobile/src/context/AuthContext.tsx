import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthResponseDto, LoginDto, RegisterDto, SafeUserDto, UpdateProfileDto } from '@data-circular/shared';
import { AuthApi } from '../api/auth.api';
import { UsersApi } from '../api/users.api';
import { StorageService } from '../services/storage';
import { ApiError } from '../api/client';

interface AuthContextType {
  user: SafeUserDto | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginDto) => Promise<{ success: boolean; error?: string; user?: SafeUserDto }>;
  register: (data: RegisterDto) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileDto) => Promise<{ success: boolean; error?: string; user?: SafeUserDto }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SafeUserDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicializar estado de sesión desde almacenamiento seguro
  useEffect(() => {
    async function bootstrap() {
      try {
        const storedToken = await StorageService.getAccessToken();
        const storedUser = await StorageService.getUser();

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            setUser(storedUser);
          }

          // Verificar validez del token contra el backend real
          try {
            const freshUser = await UsersApi.getMe();
            setUser(freshUser);
            await StorageService.saveUser(freshUser);
          } catch (err: any) {
            // Si el token fue revocado o el usuario está inactivo/eliminado
            if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
              await StorageService.clearSession();
              setToken(null);
              setUser(null);
            }
          }
        }
      } catch (err) {
        console.error('[AuthContext] Error restaurando sesión:', err);
      } finally {
        setIsLoading(false);
      }
    }

    bootstrap();
  }, []);

  const login = async (
    credentials: LoginDto
  ): Promise<{ success: boolean; error?: string; user?: SafeUserDto }> => {
    try {
      const response: AuthResponseDto = await AuthApi.login(credentials);
      const { user: loggedUser, tokens } = response;

      await StorageService.saveTokens(tokens.accessToken, tokens.refreshToken);
      await StorageService.saveUser(loggedUser);

      setToken(tokens.accessToken);
      setUser(loggedUser);

      return { success: true, user: loggedUser };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error al iniciar sesión. Verifica tus credenciales.',
      };
    }
  };

  const register = async (data: RegisterDto): Promise<{ success: boolean; error?: string }> => {
    try {
      const response: AuthResponseDto = await AuthApi.register(data);
      const { user: registeredUser, tokens } = response;

      await StorageService.saveTokens(tokens.accessToken, tokens.refreshToken);
      await StorageService.saveUser(registeredUser);

      setToken(tokens.accessToken);
      setUser(registeredUser);

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error al registrar la cuenta.',
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const refreshToken = await StorageService.getRefreshToken();
      await AuthApi.logout(refreshToken || undefined);
    } catch {
      // Ignorar errores en logout remoto para asegurar salida local
    } finally {
      await StorageService.clearSession();
      setToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (
    data: UpdateProfileDto
  ): Promise<{ success: boolean; error?: string; user?: SafeUserDto }> => {
    try {
      const updated = await UsersApi.updateMe(data);
      await StorageService.saveUser(updated);
      setUser(updated);
      return { success: true, user: updated };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error al actualizar el perfil.',
      };
    }
  };

  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await UsersApi.deleteMe();
      await logout();
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error al desactivar la cuenta.',
      };
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      const freshUser = await UsersApi.getMe();
      await StorageService.saveUser(freshUser);
      setUser(freshUser);
    } catch (err) {
      console.error('[AuthContext] Error refrescando perfil:', err);
    }
  };

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        updateProfile,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
