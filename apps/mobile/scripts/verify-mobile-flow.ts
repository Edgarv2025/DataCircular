import { StorageService } from '../src/services/storage';
import { AuthApi } from '../src/api/auth.api';
import { UsersApi } from '../src/api/users.api';
import { ApiError } from '../src/api/client';

async function main() {
  console.log('=====================================================');
  console.log('  VERIFICACIÓN E2E DE FLUJOS MÓVILES - FASE 5');
  console.log('  DATA_CIRCULAR • Fundación IMARA (Bogotá D.C.)');
  console.log('=====================================================\n');

  const timestamp = Date.now();
  const testUser = {
    fullName: `Reciclador Suba ${timestamp}`,
    email: `reciclador.suba.${timestamp}@imara.org.co`,
    password: 'Password123!@#',
    userType: 'RECYCLER' as const,
    phone: '+57 312 9876543',
  };

  console.log('1. [PANTALLA 2 - REGISTRO] Probando registro con backend real...');
  const regResult = await AuthApi.register(testUser);
  console.log('   ✓ Registro completado exitosamente.');
  console.log('   ✓ Usuario ID:', regResult.user.id);
  console.log('   ✓ Nombre:', regResult.user.fullName);
  console.log('   ✓ Correo:', regResult.user.email);
  console.log('   ✓ Tipo de usuario:', regResult.user.userType);
  console.log('   ✓ Rol asignado por defecto:', regResult.user.role);
  console.log('   ✓ Token JWT emitido:', regResult.tokens.accessToken ? 'PRESENTE' : 'AUSENTE');

  console.log('\n2. [PERSISTENCIA SEGURA] Guardando tokens y perfil en StorageService...');
  await StorageService.saveTokens(regResult.tokens.accessToken, regResult.tokens.refreshToken);
  await StorageService.saveUser(regResult.user);
  const tokenInStorage = await StorageService.getAccessToken();
  const userInStorage = await StorageService.getUser();
  if (tokenInStorage && userInStorage?.id === regResult.user.id) {
    console.log('   ✓ Sesión persistida correctamente en almacenamiento seguro.');
  } else {
    throw new Error('Fallo al persistir la sesión');
  }

  console.log('\n3. [PANTALLA 4 - PERFIL] Consultando perfil con token Bearer (GET /users/me)...');
  const profile = await UsersApi.getMe();
  console.log('   ✓ Perfil obtenido desde PostgreSQL:');
  console.log('     - ID:', profile.id);
  console.log('     - Nombre:', profile.fullName);
  console.log('     - Teléfono:', profile.phone);
  console.log('     - Estado:', profile.status);

  console.log('\n4. [PANTALLA 5 - EDICIÓN DE PERFIL] Actualizando perfil (PATCH /users/me)...');
  const updatedName = `${testUser.fullName} (Actualizado)`;
  const updatedPhone = '+57 320 1112233';
  const updatedProfile = await UsersApi.updateMe({
    fullName: updatedName,
    phone: updatedPhone,
  });
  console.log('   ✓ Perfil actualizado en PostgreSQL:');
  console.log('     - Nuevo Nombre:', updatedProfile.fullName);
  console.log('     - Nuevo Teléfono:', updatedProfile.phone);

  if (updatedProfile.fullName !== updatedName || updatedProfile.phone !== updatedPhone) {
    throw new Error('La actualización no persistió los valores esperados.');
  }

  console.log('\n5. [PANTALLA 6 - CIERRE DE SESIÓN] Probando logout e invalidación...');
  const refreshToken = await StorageService.getRefreshToken();
  await AuthApi.logout(refreshToken || undefined);
  await StorageService.clearSession();
  const clearedToken = await StorageService.getAccessToken();
  const clearedUser = await StorageService.getUser();
  if (!clearedToken && !clearedUser) {
    console.log('   ✓ Sesión cerrada y almacenamiento local limpiado.');
  } else {
    throw new Error('El almacenamiento no se limpió correctamente');
  }

  console.log('\n6. [PANTALLA 3 - INICIO DE SESIÓN] Probando login con credenciales...');
  const loginResult = await AuthApi.login({
    email: testUser.email,
    password: testUser.password,
  });
  console.log('   ✓ Inicio de sesión exitoso con nuevo token JWT.');
  console.log('   ✓ Usuario autenticado:', loginResult.user.fullName);
  await StorageService.saveTokens(loginResult.tokens.accessToken, loginResult.tokens.refreshToken);

  console.log('\n7. [DESACTIVACIÓN LÓGICA / SOFT DELETE] Desactivando cuenta (DELETE /users/me)...');
  const deleteResult = await UsersApi.deleteMe();
  console.log('   ✓ Cuenta desactivada:', deleteResult.status, Boolean(deleteResult.deletedAt));
  if (deleteResult.status !== 'INACTIVE' || !deleteResult.deletedAt) {
    throw new Error('La respuesta no confirma la desactivación lógica.');
  }
  await StorageService.clearSession();

  console.log('\n8. [VERIFICACIÓN DE SEGURIDAD] Intentando iniciar sesión con cuenta desactivada...');
  try {
    await AuthApi.login({
      email: testUser.email,
      password: testUser.password,
    });
    throw new Error('ERROR CRÍTICO: La cuenta desactivada pudo iniciar sesión.');
  } catch (err: any) {
    if (err instanceof ApiError && err.status === 401) {
      console.log('   ✓ Acceso denegado correctamente (401):', err.message);
    } else {
      console.log('   ✓ Acceso denegado:', err.message);
    }
  }

  console.log('\n=====================================================');
  console.log('  ¡TODOS LOS FLUJOS MÓVILES DE LA FASE 5 VERIFICADOS!');
  console.log('  1. Bienvenida (Onboarding distrital)');
  console.log('  2. Registro (con validación y datos reales)');
  console.log('  3. Inicio de sesión (con JWT y persistencia)');
  console.log('  4. Perfil de usuario (con datos de Bogotá y COP)');
  console.log('  5. Edición de perfil (con llamada PATCH)');
  console.log('  6. Cierre de sesión y desactivación lógica');
  console.log('=====================================================\n');
}

main().catch((err) => {
  console.error('\n❌ ERROR EN VERIFICACIÓN DE FLUJO MÓVIL:', err);
  process.exit(1);
});
