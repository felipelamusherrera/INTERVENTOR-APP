import { Sucursal } from './index';

export type Rol = 
  | 'RESIDENTE_INTERVENTORIA'
  | 'DIRECTOR_OBRA'
  | 'DIRECTOR_INTERVENTORIA'
  | 'GERENTE_INTERVENTORIA'
  | 'DIRECTIVO'
  | 'ADMINISTRADOR';

export const ROL_LABEL: Record<Rol, string> = {
  RESIDENTE_INTERVENTORIA: 'Residente de Interventoría',
  DIRECTOR_OBRA: 'Director de Obra',
  DIRECTOR_INTERVENTORIA: 'Director de Interventoría',
  GERENTE_INTERVENTORIA: 'Gerente de Interventoría',
  DIRECTIVO: 'Directivo / Ejecutivo',
  ADMINISTRADOR: 'Administrador del Sistema',
};

export type EstadoUsuario = 'PENDIENTE' | 'ACTIVO' | 'RECHAZADO' | 'INACTIVO';

export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  correo: string;
  password?: string;
  rol: Rol;
  estado: EstadoUsuario;
  sucursal: Exclude<Sucursal, 'TODAS'>;
  proyectos: string[];
  aprobadoPor?: string;
  fechaAprobacion?: string;
  motivoRechazo?: string;
  ultimoAcceso?: string;
  fechaCreacion: string;
}

export interface ModuloSistema {
  id: string;
  label: string;
  seccion: 'Operación Campo' | 'Control & Programación' | 'Gestión Gerencial' | 'Administración';
  descripcion: string;
  icono: string;
  badge?: string;
}

export type MatrizPermisos = Record<Rol, string[]>;
