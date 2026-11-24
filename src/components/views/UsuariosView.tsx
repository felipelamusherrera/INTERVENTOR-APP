import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  ShieldCheck,
  Search,
  Check,
  X,
  Trash2,
  RotateCcw,
  Save,
  Building2,
  Mail,
  Shield,
  User,
  AlertCircle,
  FolderKanban,
  Plus,
} from 'lucide-react';
import {
  Usuario,
  Rol,
  EstadoUsuario,
  ROL_LABEL,
  ROLES_OFICIALES,
  MatrizPermisos,
} from '../../types/auth';
import { SUCURSALES_OFICIALES, SucursalOperativa } from '../../types';
import { AuthService } from '../../services/authService';
import {
  ProjectService,
  SolicitudAsignacionProyecto,
  ProyectoMaestro,
} from '../../services/projectService';
import {
  MODULOS_SISTEMA,
  PERMISOS_DEFAULT,
  getMatrizPermisos,
  saveMatrizPermisos,
} from '../../lib/permisos-roles';

type TabTipo = 'directorio' | 'aprobaciones' | 'solicitudes' | 'permisos';

export const UsuariosView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabTipo>('aprobaciones');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudAsignacionProyecto[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoMaestro[]>([]);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(AuthService.getCurrentUser());

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<string>('TODOS');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');

  // Modales
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveRol, setApproveRol] = useState<Rol>('RESIDENTE_INTERVENTORIA');
  const [approveSucursal, setApproveSucursal] = useState<SucursalOperativa>('CALI');
  const [rejectReason, setRejectReason] = useState('');

  // Form crear usuario directo
  const [formNombre, setFormNombre] = useState('');
  const [formUsuario, setFormUsuario] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRol, setFormRol] = useState<Rol>('RESIDENTE_INTERVENTORIA');
  const [formSucursal, setFormSucursal] = useState<SucursalOperativa>('CALI');

  // Matriz de permisos
  const [matriz, setMatriz] = useState<MatrizPermisos>(getMatrizPermisos());
  const [matrizModificada, setMatrizModificada] = useState(false);

  const [mensajeToast, setMensajeToast] = useState<{
    tipo: 'success' | 'error';
    texto: string;
  } | null>(null);

  const cargarDatos = () => {
    setUsuarios(AuthService.getUsuarios());
    setSolicitudes(ProjectService.getSolicitudesAsignacion());
    setProyectos(ProjectService.getAllProjects());
    setCurrentUser(AuthService.getCurrentUser());
    setMatriz(getMatrizPermisos());
  };

  useEffect(() => {
    cargarDatos();
    const handleRefresh = () => cargarDatos();
    window.addEventListener('auth_state_changed', handleRefresh);
    window.addEventListener('marval_solicitudes_updated', handleRefresh);
    window.addEventListener('marval_projects_updated', handleRefresh);
    return () => {
      window.removeEventListener('auth_state_changed', handleRefresh);
      window.removeEventListener('marval_solicitudes_updated', handleRefresh);
      window.removeEventListener('marval_projects_updated', handleRefresh);
    };
  }, []);

  const showToast = (texto: string, tipo: 'success' | 'error' = 'success') => {
    setMensajeToast({ tipo, texto });
    setTimeout(() => setMensajeToast(null), 4000);
  };

  const totalUsuarios = usuarios.length;
  const activosCount = usuarios.filter((u) => u.estado === 'ACTIVO').length;
  const pendientesCount = usuarios.filter((u) => u.estado === 'PENDIENTE').length;
  const solicitudesPendientesCount = solicitudes.filter((s) => s.estado === 'PENDIENTE').length;

  const usuariosFiltrados = usuarios.filter((u) => {
    const matchSearch =
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.usuario.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRol = filterRol === 'TODOS' || u.rol === filterRol;
    const matchEstado = filterEstado === 'TODOS' || u.estado === filterEstado;
    return matchSearch && matchRol && matchEstado;
  });

  const pendientesList = usuarios.filter((u) => u.estado === 'PENDIENTE');

  const handleCrearUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    const res = AuthService.registrarUsuario({
      nombre: formNombre,
      usuario: formUsuario,
      correo: formCorreo,
      password: formPassword,
      rolSolicitado: formRol,
      sucursal: formSucursal,
    });
    if (!res.success) {
      showToast(res.message, 'error');
      return;
    }
    if (res.usuario) {
      AuthService.aprobarUsuario(
        res.usuario.id,
        formRol,
        formSucursal,
        currentUser?.nombre || 'Administrador'
      );
    }
    showToast('Usuario creado y activado con éxito.', 'success');
    setShowNewModal(false);
    setFormNombre('');
    setFormUsuario('');
    setFormCorreo('');
    setFormPassword('');
    cargarDatos();
  };

  const handleOpenApprove = (u: Usuario) => {
    setSelectedUser(u);
    setApproveRol(u.rol);
    setApproveSucursal(u.sucursal);
    setRejectReason('');
    setShowApproveModal(true);
  };

  const handleAprobarUsuario = () => {
    if (!selectedUser) return;
    AuthService.aprobarUsuario(
      selectedUser.id,
      approveRol,
      approveSucursal,
      currentUser?.nombre || 'Administrador'
    );
    setShowApproveModal(false);
    cargarDatos();
    showToast(`Usuario ${selectedUser.nombre} APROBADO como ${ROL_LABEL[approveRol]}.`, 'success');
  };

  const handleRechazarUsuario = () => {
    if (!selectedUser) return;
    if (!rejectReason.trim()) {
      showToast('Indica el motivo del rechazo.', 'error');
      return;
    }
    AuthService.rechazarUsuario(
      selectedUser.id,
      rejectReason.trim(),
      currentUser?.nombre || 'Administrador'
    );
    setShowApproveModal(false);
    setRejectReason('');
    cargarDatos();
    showToast(`Usuario ${selectedUser.nombre} marcado como RECHAZADO.`, 'error');
  };

  const handleResolverSolicitudProyecto = (sol: SolicitudAsignacionProyecto, aprobar: boolean) => {
    ProjectService.resolverSolicitudAsignacion(
      sol.id,
      aprobar,
      currentUser?.nombre || 'Administrador'
    );
    cargarDatos();
    showToast(
      aprobar
        ? `Solicitud aprobada: ${sol.solicitanteNombre} ahora tiene acceso al proyecto "${sol.proyectoNombre}".`
        : `Solicitud de asignación rechazada para ${sol.solicitanteNombre}.`,
      aprobar ? 'success' : 'error'
    );
  };

  const handleTogglePermiso = (rol: Rol, moduloId: string) => {
    const permitidos = matriz[rol] || [];
    const nuevoPermitidos = permitidos.includes(moduloId)
      ? permitidos.filter((id) => id !== moduloId)
      : [...permitidos, moduloId];
    setMatriz({ ...matriz, [rol]: nuevoPermitidos });
    setMatrizModificada(true);
  };

  const handleGuardarPermisos = () => {
    saveMatrizPermisos(matriz);
    setMatrizModificada(false);
    showToast('Matriz de permisos guardada y aplicada.', 'success');
  };

  const handleResetPermisos = () => {
    setMatriz(PERMISOS_DEFAULT);
    saveMatrizPermisos(PERMISOS_DEFAULT);
    setMatrizModificada(false);
    showToast('Permisos restablecidos a los valores predeterminados.', 'success');
  };

  const getRolBadgeClass = (rol: Rol) => {
    switch (rol) {
      case 'ADMINISTRADOR':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'RESIDENTE_INTERVENTORIA':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DIRECTOR_GERENTE_INTERVENTORIA':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'DIRECTOR_OBRA_GERENTE_AREA':
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  const getEstadoBadgeClass = (estado: EstadoUsuario) => {
    switch (estado) {
      case 'ACTIVO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'PENDIENTE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'INACTIVO':
        return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  const getProjectNamesForUser = (u: Usuario) => {
    const ownedOrAssigned = proyectos.filter(
      (p) =>
        p.creadoPorUsuarioId === u.id ||
        p.usuariosAsignados.includes(u.id) ||
        u.proyectos.includes(p.id)
    );
    return ownedOrAssigned.map((p) => p.nombreJde);
  };

  return (
    <div className="space-y-6">
      {mensajeToast && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-lg ${
            mensajeToast.tipo === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {mensajeToast.tipo === 'success' ? (
              <Check className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <span className="text-sm font-semibold">{mensajeToast.texto}</span>
          </div>
          <button onClick={() => setMensajeToast(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Panel de Administración · Usuarios &amp; Proyectos
            </h1>
            <p className="text-sm text-slate-500">
              Aprobación de cuentas registradas, gestión de solicitudes de asignación de proyectos (HC) y permisos de los 4 roles.
            </p>
          </div>
        </div>

        {currentUser && (
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <User className="w-5 h-5 text-slate-600" />
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Sesión activa:</div>
              <div className="text-sm font-bold text-slate-900">{currentUser.nombre}</div>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${getRolBadgeClass(
                currentUser.rol
              )}`}
            >
              {ROL_LABEL[currentUser.rol]}
            </span>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('directorio')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Usuarios Activos</span>
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-emerald-700 mt-2">{activosCount}</div>
          <div className="text-xs text-slate-400 mt-1">De {totalUsuarios} registrados</div>
        </div>

        <div
          onClick={() => setActiveTab('aprobaciones')}
          className={`bg-white p-5 rounded-2xl border shadow-sm cursor-pointer transition ${
            pendientesCount > 0 ? 'border-amber-300 bg-amber-50/50 ring-2 ring-amber-200' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-amber-800">Usuarios Pendientes</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-amber-700 mt-2">{pendientesCount}</div>
          <div className="text-xs text-amber-700 font-medium mt-1">
            {pendientesCount > 0 ? 'Requieren aprobación Admin' : 'Sin cuentas pendientes'}
          </div>
        </div>

        <div
          onClick={() => setActiveTab('solicitudes')}
          className={`bg-white p-5 rounded-2xl border shadow-sm cursor-pointer transition ${
            solicitudesPendientesCount > 0
              ? 'border-indigo-300 bg-indigo-50/50 ring-2 ring-indigo-200'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-indigo-800">Solicitudes Proyecto (HC)</span>
            <FolderKanban className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-bold text-indigo-700 mt-2">{solicitudesPendientesCount}</div>
          <div className="text-xs text-indigo-700 font-medium mt-1">
            {solicitudesPendientesCount > 0 ? 'Asignaciones por revisar' : 'Sin solicitudes abiertas'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Proyectos en SharePoint</span>
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{proyectos.length}</div>
          <div className="text-xs text-slate-400 mt-1">Registrados por residentes</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-4">
        <button
          onClick={() => setActiveTab('aprobaciones')}
          className={`pb-3 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'aprobaciones'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Aprobación de Usuarios
          {pendientesCount > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {pendientesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('solicitudes')}
          className={`pb-3 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'solicitudes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          Solicitudes de Proyectos
          {solicitudesPendientesCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {solicitudesPendientesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('directorio')}
          className={`pb-3 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'directorio'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Directorio ({totalUsuarios})
        </button>

        <button
          onClick={() => setActiveTab('permisos')}
          className={`pb-3 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition ${
            activeTab === 'permisos'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Matriz de Permisos (4 Roles)
        </button>
      </div>

      {/* TAB: APROBACIONES DE USUARIOS */}
      {activeTab === 'aprobaciones' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Cuentas Pendientes de Aprobación ({pendientesList.length})
            </h3>
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Usuario</span>
            </button>
          </div>

          {pendientesList.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
              No hay solicitudes de registro de usuarios pendientes de aprobación.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {pendientesList.map((u) => (
                <div
                  key={u.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{u.nombre}</span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${getRolBadgeClass(
                          u.rol
                        )}`}
                      >
                        {ROL_LABEL[u.rol]}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3.5 h-3.5" /> @{u.usuario}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" /> {u.correo}
                      </span>
                      <span className="font-semibold text-slate-700">Sucursal: {u.sucursal}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenApprove(u)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    Revisar / Aprobar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: SOLICITUDES DE ASIGNACIÓN DE PROYECTOS (HC DUPLICADO) */}
      {activeTab === 'solicitudes' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Solicitudes de Asignación de Proyecto ({solicitudes.length})
            </h3>
            <p className="text-xs text-slate-500">
              Solicitudes generadas automáticamente cuando un residente intenta crear un proyecto con un código <code>HC</code> ya existente en SharePoint.
            </p>
          </div>

          {solicitudes.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
              Aún no se han recibido solicitudes de asignación de proyectos.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {solicitudes.map((sol) => (
                <div
                  key={sol.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {sol.proyectoNombre}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono font-bold">
                        HC {sol.hcConflicto}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          sol.estado === 'PENDIENTE'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : sol.estado === 'APROBADA'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-red-100 text-red-800 border-red-300'
                        }`}
                      >
                        {sol.estado}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      Solicitante: <strong>{sol.solicitanteNombre}</strong> ({sol.solicitanteCorreo}) · Sucursal{' '}
                      <strong>{sol.sucursal}</strong>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Fecha solicitud: {new Date(sol.fechaSolicitud).toLocaleString()}
                    </div>
                  </div>

                  {sol.estado === 'PENDIENTE' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleResolverSolicitudProyecto(sol, true)}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprobar Asignación</span>
                      </button>
                      <button
                        onClick={() => handleResolverSolicitudProyecto(sol, false)}
                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: DIRECTORIO */}
      {activeTab === 'directorio' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, usuario o correo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filterRol}
                onChange={(e) => setFilterRol(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold"
              >
                <option value="TODOS">Todos los roles</option>
                {ROLES_OFICIALES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>

              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="RECHAZADO">Rechazado</option>
              </select>
            </div>

            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Usuario</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Sucursal</th>
                  <th className="py-3 px-4">Proyectos Asignados</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.map((u) => {
                  const projs = getProjectNamesForUser(u);
                  const isSeedAdmin = u.usuario.toLowerCase() === 'admin';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{u.nombre}</div>
                        <div className="text-[11px] text-slate-500">
                          @{u.usuario} · {u.correo}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${getRolBadgeClass(
                            u.rol
                          )}`}
                        >
                          {ROL_LABEL[u.rol]}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{u.sucursal}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {projs.length > 0 ? projs.join(', ') : <span className="text-slate-400">Ninguno</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getEstadoBadgeClass(
                            u.estado
                          )}`}
                        >
                          {u.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {u.estado === 'PENDIENTE' && (
                            <button
                              onClick={() => handleOpenApprove(u)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700"
                            >
                              Aprobar
                            </button>
                          )}
                          {!isSeedAdmin && u.estado !== 'PENDIENTE' && (
                            <button
                              onClick={() => {
                                AuthService.toggleEstado(u.id);
                                cargarDatos();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                            >
                              {u.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                            </button>
                          )}
                          {!isSeedAdmin && (
                            <button
                              onClick={() => {
                                AuthService.eliminarUsuario(u.id);
                                cargarDatos();
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: MATRIZ DE PERMISOS (4 ROLES) */}
      {activeTab === 'permisos' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Matriz de Permisos por Rol (4 Roles Oficiales)
              </h3>
              <p className="text-xs text-slate-500">
                Define qué módulos puede visualizar cada perfil de usuario.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetPermisos}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>
              <button
                onClick={handleGuardarPermisos}
                disabled={!matrizModificada}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold text-[10px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Módulo</th>
                  {ROLES_OFICIALES.map((r) => (
                    <th key={r.value} className="py-3 px-3 text-center">
                      {r.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MODULOS_SISTEMA.map((mod) => (
                  <tr key={mod.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-slate-900">{mod.label}</div>
                      <div className="text-[10px] text-slate-500">{mod.seccion}</div>
                    </td>
                    {ROLES_OFICIALES.map((r) => {
                      const checked = (matriz[r.value] || []).includes(mod.id);
                      return (
                        <td key={r.value} className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleTogglePermiso(r.value, mod.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL APROBAR / RECHAZAR USUARIO */}
      {showApproveModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Revisar Solicitud de Usuario
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedUser.nombre} (@{selectedUser.usuario})
                </p>
              </div>
              <button onClick={() => setShowApproveModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Rol a asignar</label>
                <select
                  value={approveRol}
                  onChange={(e) => setApproveRol(e.target.value as Rol)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                >
                  {ROLES_OFICIALES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sucursal</label>
                <select
                  value={approveSucursal}
                  onChange={(e) => setApproveSucursal(e.target.value as SucursalOperativa)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                >
                  {SUCURSALES_OFICIALES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Motivo de rechazo (solo si rechaza)
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej. Correo no corporativo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={handleRechazarUsuario}
                className="px-4 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold"
              >
                Rechazar
              </button>
              <button
                onClick={handleAprobarUsuario}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold"
              >
                Aprobar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR USUARIO DIRECTO */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Crear Nuevo Usuario</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearUsuario} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre completo *</label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Usuario *</label>
                  <input
                    type="text"
                    required
                    value={formUsuario}
                    onChange={(e) => setFormUsuario(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contraseña *</label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Correo *</label>
                <input
                  type="email"
                  required
                  value={formCorreo}
                  onChange={(e) => setFormCorreo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rol *</label>
                  <select
                    value={formRol}
                    onChange={(e) => setFormRol(e.target.value as Rol)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                  >
                    {ROLES_OFICIALES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sucursal *</label>
                  <select
                    value={formSucursal}
                    onChange={(e) => setFormSucursal(e.target.value as SucursalOperativa)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold"
                  >
                    {SUCURSALES_OFICIALES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold"
                >
                  Crear y Activar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
