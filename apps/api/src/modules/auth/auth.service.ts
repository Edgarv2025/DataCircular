import { usersRepository, normalizeEmail, toSafeUser } from '../users/users.repository';
import { hashPassword, verifyPassword } from '../../utils/hash';
import { generateTokens, verifyRefreshToken } from '../../utils/jwt';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  AuthTokens,
} from '@data-circular/shared';

export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthService {
  /**
   * Registra un nuevo usuario en la plataforma.
   * Reglas de negocio y seguridad:
   * - El correo se normaliza a minúsculas y trim.
   * - Se verifica que el correo no esté previamente registrado (409 Conflict).
   * - La contraseña se hashea con Argon2id.
   * - El rol inicial SIEMPRE es forzado a 'USER' para impedir escalada de privilegios en el registro público.
   * - El estado inicial de la cuenta es 'ACTIVE'.
   */
  async register(input: RegisterDto): Promise<AuthResponseDto> {
    const normalizedEmail = normalizeEmail(input.email);

    // Verificar si el correo ya existe
    const existing = await usersRepository.findSafeByEmail(normalizedEmail, true);
    if (existing) {
      throw new AuthError(
        'EMAIL_ALREADY_REGISTERED',
        'El correo electrónico ya se encuentra registrado en el sistema',
        409
      );
    }

    // Hashear la contraseña con Argon2id
    const passwordHash = await hashPassword(input.password);

    // Crear el usuario forzando rol 'USER' (inmune a manipulación del body)
    const safeUser = await usersRepository.create({
      fullName: input.fullName,
      email: normalizedEmail,
      phone: input.phone,
      passwordHash,
      role: 'USER',
    });

    // Generar tokens de sesión
    const tokens = generateTokens(safeUser);

    return {
      user: safeUser,
      tokens,
    };
  }

  /**
   * Inicia sesión validando credenciales de usuario.
   * Reglas de seguridad:
   * - Si el correo no existe o la contraseña es incorrecta, se responde con un mensaje genérico
   *   "Credenciales inválidas" (código 401) para evitar la enumeración de usuarios.
   * - Se verifica que la cuenta esté activa.
   */
  async login(input: LoginDto): Promise<AuthResponseDto> {
    const normalizedEmail = normalizeEmail(input.email);

    // Buscar el usuario por correo electrónico para autenticación interna
    const user = await usersRepository.findByEmailForAuth(normalizedEmail);

    if (!user) {
      throw new AuthError(
        'INVALID_CREDENTIALS',
        'Credenciales inválidas. Comprueba tu correo y contraseña.',
        401
      );
    }

    // Verificar estado de la cuenta
    if (user.status !== 'ACTIVE') {
      throw new AuthError(
        'ACCOUNT_NOT_ACTIVE',
        `Tu cuenta no se encuentra activa (Estado: ${user.status}). Contacta a soporte.`,
        403
      );
    }

    // Verificar contraseña con Argon2id
    const isPasswordValid = await verifyPassword(user.passwordHash, input.password);
    if (!isPasswordValid) {
      throw new AuthError(
        'INVALID_CREDENTIALS',
        'Credenciales inválidas. Comprueba tu correo y contraseña.',
        401
      );
    }

    const safeUser = toSafeUser(user);
    const tokens = generateTokens(safeUser);

    return {
      user: safeUser,
      tokens,
    };
  }

  /**
   * Renueva el Access Token utilizando un Refresh Token válido.
   */
  async refresh(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = verifyRefreshToken(refreshToken);

      const user = await usersRepository.findById(payload.sub, false);
      if (!user || user.status !== 'ACTIVE') {
        throw new AuthError(
          'INVALID_REFRESH_TOKEN',
          'El usuario asociado al token de actualización no es válido o está inactivo',
          401
        );
      }

      return generateTokens(user);
    } catch (err: unknown) {
      if (err instanceof AuthError) throw err;
      throw new AuthError(
        'INVALID_REFRESH_TOKEN',
        'El token de actualización es inválido o ha expirado',
        401
      );
    }
  }
}

export const authService = new AuthService();
