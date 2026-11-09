import { Usuario, Rol, EstadoUsuario } from '../types/auth';
import { Sucursal } from '../types';

const STORAGE_USERS_KEY = 'interventor_app_usuarios_v1';
const STORAGE_CURRENT_USER_KEY = 'interventor_app_current_user_v1';

const INITIAL_USERS: Usuario[] = [
  {
    id: 'usr-admin-01',
    nombre: 'Felipe Lamus (Administrador)',
    usuario: 'admin',
    correo: 'admin@marval.com.co',
    rol: 'ADMINISTRADOR',
    estado: 'ACTIVO',
    sucursal: 'CALI',
    proyectos: ['BELATERRA PIETRA', 'PIETRA URBANISMO'],
    fechaCreacion: '2026-10-01T08:00:00Z',
  },
  {
    id: 'usr-residente-01',
    nombre: 'Carlos Mario Gómez (Residente Obra)',
    usuario: 'carlos.gomez',
    correo: 'carlos.gomez@marval.com.co',
    rol: 'RESIDENTE_INTERVENTORIA',
    estado: 'ACTIVO',
    sucursal: 'CALI',
    proyectos: ['BELATERRA PIETRA'],
    fechaCreacion: '2026-10-10T09:30:00Z',
  },
  {
    id: 'usr-director-01',
    nombre: 'Ing. Catalina Valdés (Directora Interventoría)',
    usuario: 'catalina.valdes',
    correo: 'catalina.valdes@marval.com.co',
    rol: 'DIRECTOR_INTERVENTORIA',
    estado: 'ACTIVO',
    sucursal: 'CALI',
    proyectos: ['BELATERRA PIETRA', 'PIETRA PARQUEADEROS', 'PIETRA URBANISMO'],
    fechaCreacion: '2026-09-15T08:00:00Z',
  },
  {
    id: 'usr-gerente-01',
    nombre: 'Arq. Roberto Morales (Gerente Interventoría)',
    usuario: 'roberto.morales',
    correo: 'roberto.morales@marval.com.co',
    rol: 'GERENTE_INTERVENTORIA',
    estado: 'ACTIVO',
    sucursal: 'BUCARAMANGA',
    proyectos: ['TODOS'],
    fechaCreacion: '2026-08-01T08:00:00Z',
  },
  {
    id: 'usr-directivo-01',
    nombre: 'Junta Directiva (Acceso Ejecutivo)',
    usuario: 'directivo',
    correo: 'directivo@marval.com.co',
    rol: 'DIRECTIVO',
    estado: 'ACTIVO',
    sucursal: 'BUCARAMANGA',
    proyectos: ['TODOS'],
    fechaCreacion: '2026-08-01T08:00:00Z',
  },
  {
    id: 'usr-pendiente-01',
    nombre: 'Andrés Felipe Morales (Aspirante Residente)',
    usuario: 'andres.morales',
    correo: 'andres.morales@marval.com.co',
    rol: 'RESIDENTE_INTERVENTORIA',
    estado: 'PENDIENTE',
    sucursal: 'BOGOTA',
    proyectos: ['BELATERRA PIETRA'],
    fechaCreacion: '2026-11-08T14:20:00Z',
  },
];

export class AuthService {
  static getUsuarios(): Usuario[] {
    try {
      const data = localStorage.getItem(STORAGE_USERS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error leyendo usuarios de localStorage', e);
    }
    // Inicializar con la semilla
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }

  static saveUsuarios(usuarios: Usuario[]): void {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(usuarios));
    } catch (e) {
      console.error('Error guardando usuarios en localStorage', e);
    }
  }

  static getCurrentUser(): Usuario {
    try {
      const data = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
      if (data) {
        const user = JSON.parse(data) as Usuario;
        // Validar si el usuario sigue existiendo en el listado
        const lista = this.getUsuarios();
        const found = lista.find(u => u.id === user.id);
        if (found) return found;
      }
    } catch (e) {
      console.error('Error leyendo usuario actual', e);
    }
    // Por defecto entrar como Administrador para desarrollo
    const admin = this.getUsuarios().find(u => u.rol === 'ADMINISTRADOR') || INITIAL_USERS[0];
    this.setCurrentUser(admin);
    return admin;
  }

  static setCurrentUser(usuario: Usuario): void {
    try {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(usuario));
      window.dispatchEvent(new Event('auth_state_changed'));
    } catch (e) {
      console.error('Error fijando usuario actual', e);
    }
  }

  static registrarUsuario(datos: {
    nombre: string;
    usuario: string;
    correo: string;
    rolSolicitado: Rol;
    sucursal: Exclude<Sucursal, 'TODAS'>;
    proyecto?: string;
  }): { success: boolean; message: string; usuario?: Usuario } {
    const usuarios = this.getUsuarios();

    const normalizadoUser = datos.usuario.trim().toLowerCase();
    const normalizadoCorreo = datos.correo.trim().toLowerCase();

    if (usuarios.some(u => u.usuario.toLowerCase() === normalizadoUser)) {
      return { success: false, message: 'El nombre de usuario ya está registrado en el sistema.' };
    }
    if (usuarios.some(u => u.correo.toLowerCase() === normalizadoCorreo)) {
      return { success: false, message: 'El correo electrónico ya se encuentra registrado.' };
    }

    const nuevo: Usuario = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nombre: datos.nombre.trim(),
      usuario: normalizadoUser,
      correo: normalizadoCorreo,
      rol: datos.rolSolicitado,
      estado: 'PENDIENTE',
      sucursal: datos.sucursal,
      proyectos: datos.proyecto ? [datos.proyecto] : ['BELATERRA PIETRA'],
      fechaCreacion: new Date().toISOString(),
    };

    usuarios.push(nuevo);
    this.saveUsuarios(usuarios);
    return { 
      success: true, 
      message: 'Solicitud de registro enviada exitosamente. Tu cuenta está en estado PENDIENTE de aprobación por Interventoría.', 
      usuario: nuevo 
    };
  }

  static aprobarUsuario(id: string, rolAsignado: Rol, sucursalAsignada: Exclude<Sucursal, 'TODAS'>, aprobadoPor: string): boolean {
    const usuarios = this.getUsuarios();
    const idx = usuarios.findIndex(u => u.id === id);
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
    return true;
  }

  static rechazarUsuario(id: string, motivo: string, rechazadoPor: string): boolean {
    const usuarios = this.getUsuarios();
    const idx = usuarios.findIndex(u => u.id === id);
    if (idx === -1) return false;

    usuarios[idx] = {
      ...usuarios[idx],
      estado: 'RECHAZADO',
      motivoRechazo: motivo || 'No cumple con los requisitos del perfil o proyecto',
      aprobadoPor: rechazadoPor,
      fechaAprobacion: new Date().toISOString(),
    };

    this.saveUsuarios(usuarios);
    return true;
  }

  static toggleEstado(id: string): boolean {
    const usuarios = this.getUsuarios();
    const idx = usuarios.findIndex(u => u.id === id);
    if (idx === -1) return false;

    const actual = usuarios[idx].estado;
    usuarios[idx].estado = actual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    this.saveUsuarios(usuarios);
    return true;
  }

  static actualizarUsuario(usuarioActualizado: Usuario): boolean {
    const usuarios = this.getUsuarios();
    const idx = usuarios.findIndex(u => u.id === usuarioActualizado.id);
    if (idx === -1) return false;

    usuarios[idx] = { ...usuarioActualizado };
    this.saveUsuarios(usuarios);

    // Si es el usuario activo, actualizarlo
    const current = this.getCurrentUser();
    if (current.id === usuarioActualizado.id) {
      this.setCurrentUser(usuarioActualizado);
    }
    return true;
  }

  static eliminarUsuario(id: string): boolean {
    const usuarios = this.getUsuarios();
    const filtrados = usuarios.filter(u => u.id !== id);
    if (filtrados.length === usuarios.length) return false;
    this.saveUsuarios(filtrados);
    return true;
  }
}
