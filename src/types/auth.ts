import { SucursalOperativa } from './index';

export type Rol =
  | 'ADMINISTRADOR'
  | 'RESIDENTE_INTERVENTORIA'
  | 'DIRECTOR_GERENTE_INTERVENTORIA'
  | 'DIRECTOR_OBRA_GERENTE_AREA';

export const ROLES_OFICIALES: Array<{ value: Rol; label: string; descripcion: string }> = [
  {
    value: 'ADMINISTRADOR',
    label: 'Administrador',
    descripcion: 'Control total de la plataforma, aprobación de usuarios y asignación de proyectos.',
  },
  {
    value: 'RESIDENTE_INTERVENTORIA',
    label: 'Residente interventoría',
    descripcion: 'Creación y operación de campo en sus proyectos asignados.',
  },
  {
    value: 'DIRECTOR_GERENTE_INTERVENTORIA',
    label: 'Director/Gerente de interventoría',
    descripcion: 'Consulta de Tableros Gerenciales consolidados de proyectos cargados.',
  },
  {
    value: 'DIRECTOR_OBRA_GERENTE_AREA',
    label: 'Director de obra/Gerente de área',
    descripcion: 'Consulta ejecutiva de Tableros Gerenciales y seguimiento de indicadores.',
  },
];

export const ROL_LABEL: Record<Rol, string> = {
  ADMINISTRADOR: 'Administrador',
  RESIDENTE_INTERVENTORIA: 'Residente interventoría',
  DIRECTOR_GERENTE_INTERVENTORIA: 'Director/Gerente de interventoría',
  DIRECTOR_OBRA_GERENTE_AREA: 'Director de obra/Gerente de área',
};

export type EstadoUsuario = 'PENDIENTE' | 'ACTIVO' | 'RECHAZADO' | 'INACTIVO';

export interface Usuario {
  id: string;
  nombre: string;
  usuario: string;
  correo: string;
  password: string;
  rol: Rol;
  estado: EstadoUsuario;
  sucursal: SucursalOperativa;
  proyectos: string[]; // IDs de proyectos asignados
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
