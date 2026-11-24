import { Usuario, Rol } from '../types/auth';
import { SucursalOperativa } from '../types';
import { SharePointService, SHAREPOINT_LISTS } from './sharepointService';

const STORAGE_USERS_KEY = 'interventor_app_usuarios_v2';
const STORAGE_SESSION_KEY = 'interventor_app_session_v2';
const STORAGE_REMEMBER_USER_KEY = 'interventor_app_remember_user_v2';

const ADMIN_SEED_USER: Usuario = {
  id: 'usr-admin-01',
  nombre: 'Administrador Marval',
  usuario: 'admin',
  correo: 'admin@marval.com.co',
  password: 'prueba',
  rol: 'ADMINISTRADOR',
  estado: 'ACTIVO',
  sucursal: 'CALI',
  proyectos: [],
  aprobadoPor: 'Sistema',
  fechaAprobacion: '2026-11-01T08:00:00Z',
  fechaCreacion: '2026-11-01T08:00:00Z',
};

export class AuthService {
  static getUsuarios(): Usuario[] {
    try {
      const data = localStorage.getItem(STORAGE_USERS_KEY);
      if (data) {
        const parsed = JSON.parse(data) as Usuario[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Garantizar que exista el usuario admin de prueba si no está
          if (!parsed.some((u) => u.usuario.toLowerCase() === 'admin')) {
            const withAdmin = [ADMIN_SEED_USER, ...parsed];
            this.saveUsuarios(withAdmin);
            return withAdmin;
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('[AuthService] Error leyendo usuarios de localStorage', e);
    }
    const seed = [ADMIN_SEED_USER];
    this.saveUsuarios(seed);
    return seed;
  }

  static saveUsuarios(usuarios: Usuario[]): void {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(usuarios));
    } catch (e) {
      console.error('[AuthService] Error guardando usuarios en localStorage', e);
    }
  }

  static getRememberedUsername(): string {
    try {
      return localStorage.getItem(STORAGE_REMEMBER_USER_KEY) || '';
    } catch {
      return '';
    }
  }

  static getCurrentUser(): Usuario | null {
    try {
      const data = localStorage.getItem(STORAGE_SESSION_KEY);
      if (!data) return null;
      const sessionUser = JSON.parse(data) as { id: string };
      if (!sessionUser?.id) return null;
      const lista = this.getUsuarios();
      const found = lista.find((u) => u.id === sessionUser.id);
      if (found && found.estado === 'ACTIVO') {
        return found;
      }
      localStorage.removeItem(STORAGE_SESSION_KEY);
      return null;
    } catch (e) {
      console.error('[AuthService] Error leyendo sesión actual', e);
      return null;
    }
  }

  static setCurrentUser(usuario: Usuario | null): void {
    try {
      if (!usuario) {
        localStorage.removeItem(STORAGE_SESSION_KEY);
      } else {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify({ id: usuario.id }));
      }
      window.dispatchEvent(new Event('auth_state_changed'));
    } catch (e) {
      console.error('[AuthService] Error fijando sesión actual', e);
    }
  }

  static login(
    identificador: string,
    password: string,
    rememberUser: boolean = false
  ): { success: boolean; message: string; usuario?: Usuario } {
    const cleanId = identificador.trim().toLowerCase();
    const cleanPass = password;

    if (!cleanId || !cleanPass) {
      return { success: false, message: 'Ingrese su nombre de usuario o correo y contraseña.' };
    }

    const usuarios = this.getUsuarios();
    const foundIdx = usuarios.findIndex(
      (u) =>
        u.usuario.toLowerCase() === cleanId ||
        u.correo.toLowerCase() === cleanId
    );

    if (foundIdx === -1) {
      return { success: false, message: 'Usuario o contraseña incorrectos.' };
    }

    const found = usuarios[foundIdx];
    if (found.password !== cleanPass) {
      return { success: false, message: 'Usuario o contraseña incorrectos.' };
    }

    if (found.estado === 'PENDIENTE') {
      return {
        success: false,
        message: 'Tu cuenta se encuentra PENDIENTE de aprobación por el usuario Administrador.',
      };
    }

    if (found.estado === 'RECHAZADO') {
      return {
        success: false,
        message: `Tu solicitud de registro fue rechazada.${found.motivoRechazo ? ` Motivo: ${found.motivoRechazo}` : ''}`,
      };
    }

    if (found.estado === 'INACTIVO') {
      return {
        success: false,
        message: 'Tu cuenta se encuentra INACTIVA. Contacta al Administrador del sistema.',
      };
    }

    const updatedUser: Usuario = {
      ...found,
      ultimoAcceso: new Date().toISOString(),
    };
    usuarios[foundIdx] = updatedUser;
    this.saveUsuarios(usuarios);

    try {
      if (rememberUser) {
        localStorage.setItem(STORAGE_REMEMBER_USER_KEY, identificador.trim());
      } else {
        localStorage.removeItem(STORAGE_REMEMBER_USER_KEY);
      }
    } catch {
      // ignore storage error
    }

    this.setCurrentUser(updatedUser);
    return {
      success: true,
      message: `Bienvenido, ${updatedUser.nombre}.`,
      usuario: updatedUser,
    };
  }

  static logout(): void {
    this.setCurrentUser(null);
  }

  static registrarUsuario(datos: {
    nombre: string;
    usuario: string;
    correo: string;
    password: string;
    rolSolicitado: Rol;
    sucursal: SucursalOperativa;
  }): { success: boolean; message: string; usuario?: Usuario } {
    const usuarios = this.getUsuarios();

    const normalizadoUser = datos.usuario.trim().toLowerCase();
    const normalizadoCorreo = datos.correo.trim().toLowerCase();

    if (!datos.nombre.trim() || !normalizadoUser || !normalizadoCorreo || !datos.password) {
      return { success: false, message: 'Todos los campos del registro son obligatorios.' };
    }

    if (datos.password.length < 4) {
      return { success: false, message: 'La contraseña debe tener al menos 4 caracteres.' };
    }

    if (usuarios.some((u) => u.usuario.toLowerCase() === normalizadoUser)) {
      return { success: false, message: 'El nombre de usuario ya está registrado en el sistema.' };
    }
    if (usuarios.some((u) => u.correo.toLowerCase() === normalizadoCorreo)) {
      return { success: false, message: 'El correo electrónico ya se encuentra registrado.' };
    }

    const nuevo: Usuario = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nombre: datos.nombre.trim(),
      usuario: normalizadoUser,
      correo: normalizadoCorreo,
      password: datos.password,
      rol: datos.rolSolicitado,
      estado: 'PENDIENTE',
      sucursal: datos.sucursal,
      proyectos: [],
      fechaCreacion: new Date().toISOString(),
    };

    usuarios.push(nuevo);
    this.saveUsuarios(usuarios);

    SharePointService.enqueueRecord(SHAREPOINT_LISTS.USUARIOS, 'CREATE', nuevo.id, {
      nombre: nuevo.nombre,
      usuario: nuevo.usuario,
      correo: nuevo.correo,
      rol: nuevo.rol,
      estado: nuevo.estado,
      sucursal: nuevo.sucursal,
      fechaCreacion: nuevo.fechaCreacion,
    });

    window.dispatchEvent(new Event('auth_state_changed'));

    return {
      success: true,
      message:
        'Solicitud de registro enviada. Tu cuenta quedó en estado PENDIENTE hasta que el Administrador la apruebe.',
      usuario: nuevo,
    };
  }

  static aprobarUsuario(
    id: string,
    rolAsignado: Rol,
    sucursalAsignada: SucursalOperativa,
    aprobadoPor: string
  ): boolean {
    const usuarios = this.getUsuarios();
    const idx = usuarios.findIndex((u) => u.id === id);
    if (idx === -1) return false;

    usuarios[idx] = {
      ...usuarios[idx],
      rol: rolAsignado,
      sucursal: sucursalAsignada,
      estado: 'ACTIVO',
      aprobadoPor,
      fechaAprobacion: new Date().toISOString(),
      motivoRechazo: undefined,
    };

    this.saveUsuarios(usuarios);
    SharePointService.enqueueRecord(SHAREPOINT_LISTS.USUARIOS, 'UPDATE', id, {
      estado: 'ACTIVO',
      rol: rolAsignado,
      sucursal: sucursalAsignada,
      aprobadoPor,
    });
    window.dispatchEvent(new Event('auth_state_changed'));
    return true;
  }

  static rechazarUsuario(id: string, motivo: string, rechazadoPor: string): boolean {
    const usuarios = this.getUsuarios();
    const idx = usuarios.findIndex((u) => u.id === id);
    if (idx === -1) return false;

    usuarios[idx] = {
      ...usuarios[idx],
      estado: 'RECHAZADO',
      motivoRechazo: motivo || 'No cumple con los requisitos del perfil o proyecto',
      aprobadoPor: rechazadoPor,
      fechaAprobacion: new Date().toISOString(),
    };

    this.saveUsuarios(usuarios);
    SharePointService.enqueueRecord(SHAREPOINT_LISTS.USUARIOS, 'UPDATE', id, {
      estado: 'RECHAZADO',
      motivoRechazo: usuarios[idx].motivoRechazo,
      aprobadoPor: rechazadoPor,
    });
    window.dispatchEvent(new Event('auth_state_changed'));
    return true;
  }

  static toggleEstado(id: string): boolean {
    const usuarios = this.getUsuarios();
    const idx = usuarios.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    if (usuarios[idx].usuario.toLowerCase() === 'admin') return false;

    const actual = usuarios[idx].estado;
    usuarios[idx].estado = actual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.saveUsuarios(usuarios);
    window.dispatchEvent(new Event('auth_state_changed'));
    return true;
  }

  static asignarProyectoAUsuario(userId: string, proyectoId: string): boolean {
    const usuarios = this.getUsuarios();
    const idx = usuarios.findIndex((u) => u.id === userId);
    if (idx === -1) return false;

    const actuales = new Set(usuarios[idx].proyectos || []);
    actuales.add(proyectoId);
    usuarios[idx] = {
      ...usuarios[idx],
      proyectos: Array.from(actuales),
    };
    this.saveUsuarios(usuarios);
    window.dispatchEvent(new Event('auth_state_changed'));
    return true;
  }

  static actualizarUsuario(usuarioActualizado: Usuario): boolean {
    const usuarios = this.getUsuarios();
    const idx = usuarios.findIndex((u) => u.id === usuarioActualizado.id);
    if (idx === -1) return false;

    usuarios[idx] = { ...usuarioActualizado };
    this.saveUsuarios(usuarios);
    window.dispatchEvent(new Event('auth_state_changed'));
    return true;
  }

  static eliminarUsuario(id: string): boolean {
    const usuarios = this.getUsuarios();
    const target = usuarios.find((u) => u.id === id);
    if (target && target.usuario.toLowerCase() === 'admin') return false;
    const filtrados = usuarios.filter((u) => u.id !== id);
    if (filtrados.length === usuarios.length) return false;
    this.saveUsuarios(filtrados);
    window.dispatchEvent(new Event('auth_state_changed'));
    return true;
  }
}
