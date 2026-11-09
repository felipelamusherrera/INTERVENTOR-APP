import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter, 
  Check, 
  X, 
  Edit2, 
  Trash2, 
  RotateCcw, 
  Save, 
  Building2, 
  Mail, 
  Shield, 
  User, 
  AlertCircle,
  LogIn
} from 'lucide-react';
import { Usuario, Rol, EstadoUsuario, ROL_LABEL, ModuloSistema, MatrizPermisos } from '../../types/auth';
import { Sucursal } from '../../types';
import { AuthService } from '../../services/authService';
import { 
  MODULOS_SISTEMA, 
  PERMISOS_DEFAULT, 
  getMatrizPermisos, 
  saveMatrizPermisos 
} from '../../lib/permisos-roles';

type TabTipo = 'directorio' | 'aprobaciones' | 'permisos';

export const UsuariosView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabTipo>('directorio');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [currentUser, setCurrentUser] = useState<Usuario>(AuthService.getCurrentUser());
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<string>('TODOS');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');

  // Modales
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);

  // Formularios
  const [formNombre, setFormNombre] = useState('');
  const [formUsuario, setFormUsuario] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formRol, setFormRol] = useState<Rol>('RESIDENTE_INTERVENTORIA');
  const [formSucursal, setFormSucursal] = useState<Exclude<Sucursal, 'TODAS'>>('CALI');
  const [formProyecto, setFormProyecto] = useState('BELATERRA PIETRA');
  const [rejectReason, setRejectReason] = useState('');
  const [mensajeToast, setMensajeToast] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Matriz de permisos
  const [matriz, setMatriz] = useState<MatrizPermisos>(getMatrizPermisos());
  const [matrizModificada, setMatrizModificada] = useState(false);

  const cargarDatos = () => {
    setUsuarios(AuthService.getUsuarios());
    setCurrentUser(AuthService.getCurrentUser());
    setMatriz(getMatrizPermisos());
  };

  useEffect(() => {
    cargarDatos();
    const handleAuthChange = () => cargarDatos();
    window.addEventListener('auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('auth_state_changed', handleAuthChange);
  }, []);

  const showToast = (texto: string, tipo: 'success' | 'error' = 'success') => {
    setMensajeToast({ tipo, texto });
    setTimeout(() => setMensajeToast(null), 4000);
  };

  // KPIs
  const totalUsuarios = usuarios.length;
  const activosCount = usuarios.filter(u => u.estado === 'ACTIVO').length;
  const pendientesCount = usuarios.filter(u => u.estado === 'PENDIENTE').length;
  const rechazadosInactivos = usuarios.filter(u => u.estado === 'RECHAZADO' || u.estado === 'INACTIVO').length;

  // Filtrado de usuarios
  const usuariosFiltrados = usuarios.filter(u => {
    const matchSearch = 
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.usuario.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRol = filterRol === 'TODOS' || u.rol === filterRol;
    const matchEstado = filterEstado === 'TODOS' || u.estado === filterEstado;
    return matchSearch && matchRol && matchEstado;
  });

  const pendientesList = usuarios.filter(u => u.estado === 'PENDIENTE');

  // Acciones
  const handleCrearUsuario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre || !formUsuario || !formCorreo) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }
    const res = AuthService.registrarUsuario({
      nombre: formNombre,
      usuario: formUsuario,
      correo: formCorreo,
      rolSolicitado: formRol,
      sucursal: formSucursal,
      proyecto: formProyecto,
    });

    if (res.success) {
      showToast(res.message, 'success');
      setShowNewModal(false);
      setFormNombre('');
      setFormUsuario('');
      setFormCorreo('');
      cargarDatos();
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleSwitchUser = (usuario: Usuario) => {
    AuthService.setCurrentUser(usuario);
    showToast(`Sesión cambiada a: ${usuario.nombre} (${ROL_LABEL[usuario.rol]})`, 'success');
  };

  const handleToggleEstado = (id: string) => {
    AuthService.toggleEstado(id);
    cargarDatos();
    showToast('Estado del usuario actualizado');
  };

  const handleAprobar = (user: Usuario, rolFinal: Rol, sucursalFinal: Exclude<Sucursal, 'TODAS'>) => {
    AuthService.aprobarUsuario(user.id, rolFinal, sucursalFinal, currentUser.nombre);
    setShowApproveModal(false);
    cargarDatos();
    showToast(`Usuario ${user.nombre} APROBADO como ${ROL_LABEL[rolFinal]} en ${sucursalFinal}`, 'success');
  };

  const handleRechazar = (user: Usuario) => {
    if (!rejectReason) {
      showToast('Indica el motivo de rechazo de la solicitud', 'error');
      return;
    }
    AuthService.rechazarUsuario(user.id, rejectReason, currentUser.nombre);
    setShowApproveModal(false);
    setRejectReason('');
    cargarDatos();
    showToast(`Usuario ${user.nombre} marcado como RECHAZADO`, 'error');
  };

  const handleTogglePermiso = (rol: Rol, moduloId: string) => {
    const permitidos = matriz[rol] || [];
    const nuevoPermitidos = permitidos.includes(moduloId)
      ? permitidos.filter(id => id !== moduloId)
      : [...permitidos, moduloId];

    const nuevaMatriz = { ...matriz, [rol]: nuevoPermitidos };
    setMatriz(nuevaMatriz);
    setMatrizModificada(true);
  };

  const handleGuardarPermisos = () => {
    saveMatrizPermisos(matriz);
    setMatrizModificada(false);
    showToast('Matriz de permisos guardada y aplicada con éxito', 'success');
  };

  const handleResetPermisos = () => {
    setMatriz(PERMISOS_DEFAULT);
    saveMatrizPermisos(PERMISOS_DEFAULT);
    setMatrizModificada(false);
    showToast('Permisos restablecidos a los valores predeterminados', 'success');
  };

  const getRolBadgeClass = (rol: Rol) => {
    switch (rol) {
      case 'ADMINISTRADOR': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'GERENTE_INTERVENTORIA': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'DIRECTOR_INTERVENTORIA': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'DIRECTOR_OBRA': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'DIRECTIVO': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'RESIDENTE_INTERVENTORIA': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getEstadoBadgeClass = (estado: EstadoUsuario) => {
    switch (estado) {
      case 'ACTIVO': return 'bg-green-100 text-green-800 border-green-300';
      case 'PENDIENTE': return 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse';
      case 'RECHAZADO': return 'bg-red-100 text-red-800 border-red-300';
      case 'INACTIVO': return 'bg-slate-100 text-slate-600 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {mensajeToast && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-lg transition-all ${
          mensajeToast.tipo === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
            : 'bg-rose-50 text-rose-900 border-rose-300'
        }`}>
          <div className="flex items-center gap-3">
            {mensajeToast.tipo === 'success' ? <Check className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span className="text-sm font-semibold">{mensajeToast.texto}</span>
          </div>
          <button onClick={() => setMensajeToast(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Current User Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Gobernanza y Control de Usuarios</h1>
              <p className="text-sm text-slate-500">Gestión de cuentas, cola de aprobación por interventoría y matriz de permisos por rol</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <User className="w-5 h-5 text-slate-600" />
          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">Sesión activa como:</div>
            <div className="text-sm font-bold text-slate-900">{currentUser.nombre}</div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${getRolBadgeClass(currentUser.rol)}`}>
            {ROL_LABEL[currentUser.rol]}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Total Usuarios</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{totalUsuarios}</div>
          <div className="text-xs text-slate-400 mt-1">Registrados en la plataforma</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Usuarios Activos</span>
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-emerald-700 mt-2">{activosCount}</div>
          <div className="text-xs text-slate-400 mt-1">Con acceso habilitado</div>
        </div>

        <div 
          onClick={() => setActiveTab('aprobaciones')}
          className={`bg-white p-5 rounded-2xl border shadow-sm cursor-pointer transition-all hover:border-amber-400 ${
            pendientesCount > 0 ? 'border-amber-300 bg-amber-50/50 ring-2 ring-amber-200' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-amber-800">Pendientes Aprobación</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-bold text-amber-700 mt-2">{pendientesCount}</div>
          <div className="text-xs text-amber-700 font-medium mt-1">
            {pendientesCount > 0 ? '⚠️ Requieren revisión de Director' : 'Al día, sin solicitudes'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-500">Inactivos / Rechazados</span>
            <Shield className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-3xl font-bold text-slate-700 mt-2">{rechazadosInactivos}</div>
          <div className="text-xs text-slate-400 mt-1">Sin acceso a los módulos</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => setActiveTab('directorio')}
          className={`pb-3 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'directorio'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Directorio de Usuarios ({totalUsuarios})
        </button>

        <button
          onClick={() => setActiveTab('aprobaciones')}
          className={`pb-3 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'aprobaciones'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Aprobaciones Pendientes
          {pendientesCount > 0 && (
            <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {pendientesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('permisos')}
          className={`pb-3 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'permisos'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Matriz de Permisos por Rol
        </button>
      </div>

      {/* TAB 1: DIRECTORIO */}
      {activeTab === 'directorio' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filterRol}
                onChange={e => setFilterRol(e.target.value)}
                className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODOS">Todos los Roles</option>
                <option value="RESIDENTE_INTERVENTORIA">Residente de Interventoría</option>
                <option value="DIRECTOR_OBRA">Director de Obra</option>
                <option value="DIRECTOR_INTERVENTORIA">Director de Interventoría</option>
                <option value="GERENTE_INTERVENTORIA">Gerente de Interventoría</option>
                <option value="DIRECTIVO">Directivo</option>
                <option value="ADMINISTRADOR">Administrador</option>
              </select>

              <select
                value={filterEstado}
                onChange={e => setFilterEstado(e.target.value)}
                className="text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="ACTIVO">Activos</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="INACTIVO">Inactivos</option>
                <option value="RECHAZADO">Rechazados</option>
              </select>
            </div>

            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              Nuevo Usuario
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Rol Asignado</th>
                    <th className="py-3 px-4">Sucursal / Proyectos</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-center">Simular Sesión</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usuariosFiltrados.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{user.nombre}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {user.correo}
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400">@{user.usuario}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-semibold border ${getRolBadgeClass(user.rol)}`}>
                          {ROL_LABEL[user.rol]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {user.sucursal}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {user.proyectos.join(', ') || 'Sin proyecto'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getEstadoBadgeClass(user.estado)}`}>
                          {user.estado}
                        </span>
                        {user.motivoRechazo && (
                          <div className="text-[11px] text-rose-600 mt-1 max-w-xs truncate" title={user.motivoRechazo}>
                            Motivo: {user.motivoRechazo}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleSwitchUser(user)}
                          disabled={user.estado !== 'ACTIVO'}
                          className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 mx-auto border transition-all ${
                            user.id === currentUser.id
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : user.estado === 'ACTIVO'
                              ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                              : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          }`}
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          {user.id === currentUser.id ? 'Sesión Activa' : 'Iniciar Como'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleEstado(user.id)}
                            className="text-xs text-slate-600 hover:text-slate-900 underline font-medium"
                          >
                            {user.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {usuariosFiltrados.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                        No se encontraron usuarios con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APROBACIONES PENDIENTES */}
      {activeTab === 'aprobaciones' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
            <Clock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold text-amber-900">Bandeja de Aprobación de Nuevas Cuentas</h3>
              <p className="text-sm text-amber-800 mt-1">
                Los usuarios registrados a través del portal de ingreso permanecen en estado <strong>PENDIENTE</strong> hasta que la Dirección o Gerencia de Interventoría valide su identidad, confirme su sucursal y asigne el rol contractual definitivo.
              </p>
            </div>
          </div>

          {pendientesList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Check className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-slate-900">No hay solicitudes pendientes</h4>
              <p className="text-sm text-slate-500 mt-1">Todos los usuarios registrados han sido evaluados y aprobados.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendientesList.map(user => (
                <div key={user.id} className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{user.nombre}</h4>
                      <p className="text-xs text-slate-500">{user.correo} • @{user.usuario}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      SOLICITUD PENDIENTE
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Rol Solicitado:</span>
                      <div className="font-bold text-slate-800 mt-0.5">{ROL_LABEL[user.rol]}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Sucursal:</span>
                      <div className="font-bold text-slate-800 mt-0.5">{user.sucursal}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Proyecto Asignado:</span>
                      <div className="font-bold text-slate-800 mt-0.5">{user.proyectos.join(', ')}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Fecha de Solicitud:</span>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {new Date(user.fechaCreacion).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowApproveModal(true);
                      }}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      Evaluar y Aprobar
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        const razon = window.prompt(`Ingresa el motivo de rechazo para ${user.nombre}:`);
                        if (razon) {
                          setRejectReason(razon);
                          handleRechazar(user);
                        }
                      }}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition-all"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MATRIZ DE PERMISOS */}
      {activeTab === 'permisos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">Matriz de Acceso a Módulos por Rol</h3>
              <p className="text-xs text-slate-500 mt-0.5">Controla qué submódulos operativos y tableros gerenciales puede ver cada nivel de usuario.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetPermisos}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restablecer Predeterminados
              </button>
              {matrizModificada && (
                <button
                  onClick={handleGuardarPermisos}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar Permisos
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-bold">Módulo / Submódulo</th>
                    <th className="py-3 px-4 font-bold">Sección</th>
                    <th className="py-3 px-3 text-center font-bold text-blue-700">Residente</th>
                    <th className="py-3 px-3 text-center font-bold text-amber-700">Dir. Obra</th>
                    <th className="py-3 px-3 text-center font-bold text-purple-700">Dir. Interv.</th>
                    <th className="py-3 px-3 text-center font-bold text-emerald-700">Gerente</th>
                    <th className="py-3 px-3 text-center font-bold text-indigo-700">Directivo</th>
                    <th className="py-3 px-3 text-center font-bold text-rose-700">Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MODULOS_SISTEMA.map(modulo => (
                    <tr key={modulo.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {modulo.label}
                          {modulo.badge && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                              {modulo.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
                          {modulo.descripcion}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded text-[11px]">
                          {modulo.seccion}
                        </span>
                      </td>

                      {/* Checkboxes por Rol */}
                      {(['RESIDENTE_INTERVENTORIA', 'DIRECTOR_OBRA', 'DIRECTOR_INTERVENTORIA', 'GERENTE_INTERVENTORIA', 'DIRECTIVO', 'ADMINISTRADOR'] as Rol[]).map(r => {
                        const isChecked = (matriz[r] || []).includes(modulo.id);
                        return (
                          <td key={r} className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermiso(r, modulo.id)}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
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
        </div>
      )}

      {/* MODAL: NUEVO USUARIO */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Registrar Nuevo Usuario</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearUsuario} className="space-y-4 pt-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ing. Pedro Nel Orozco"
                  value={formNombre}
                  onChange={e => setFormNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Usuario (@) *</label>
                  <input
                    type="text"
                    required
                    placeholder="pedro.orozco"
                    value={formUsuario}
                    onChange={e => setFormUsuario(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sucursal *</label>
                  <select
                    value={formSucursal}
                    onChange={e => setFormSucursal(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CALI">Cali</option>
                    <option value="BUCARAMANGA">Bucaramanga</option>
                    <option value="BOGOTA">Bogotá</option>
                    <option value="BARRANQUILLA">Barranquilla</option>
                    <option value="CARTAGENA">Cartagena</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="pedro.orozco@marval.com.co"
                  value={formCorreo}
                  onChange={e => setFormCorreo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rol Solicitado</label>
                <select
                  value={formRol}
                  onChange={e => setFormRol(e.target.value as Rol)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RESIDENTE_INTERVENTORIA">Residente de Interventoría</option>
                  <option value="DIRECTOR_OBRA">Director de Obra</option>
                  <option value="DIRECTOR_INTERVENTORIA">Director de Interventoría</option>
                  <option value="GERENTE_INTERVENTORIA">Gerente de Interventoría</option>
                  <option value="DIRECTIVO">Directivo</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Proyecto Inicial</label>
                <input
                  type="text"
                  placeholder="BELATERRA PIETRA"
                  value={formProyecto}
                  onChange={e => setFormProyecto(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Enviar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EVALUAR Y APROBAR */}
      {showApproveModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Aprobar Usuario</h3>
              <button onClick={() => setShowApproveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
              <div><span className="font-semibold text-slate-500">Nombre:</span> <strong className="text-slate-900">{selectedUser.nombre}</strong></div>
              <div><span className="font-semibold text-slate-500">Correo:</span> {selectedUser.correo}</div>
              <div><span className="font-semibold text-slate-500">Usuario:</span> @{selectedUser.usuario}</div>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Rol Definitivo</label>
                <select
                  defaultValue={selectedUser.rol}
                  id="modal-approve-rol"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="RESIDENTE_INTERVENTORIA">Residente de Interventoría</option>
                  <option value="DIRECTOR_OBRA">Director de Obra</option>
                  <option value="DIRECTOR_INTERVENTORIA">Director de Interventoría</option>
                  <option value="GERENTE_INTERVENTORIA">Gerente de Interventoría</option>
                  <option value="DIRECTIVO">Directivo</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Sucursal</label>
                <select
                  defaultValue={selectedUser.sucursal}
                  id="modal-approve-sucursal"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="CALI">Cali</option>
                  <option value="BUCARAMANGA">Bucaramanga</option>
                  <option value="BOGOTA">Bogotá</option>
                  <option value="BARRANQUILLA">Barranquilla</option>
                  <option value="CARTAGENA">Cartagena</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const rolSelect = document.getElementById('modal-approve-rol') as HTMLSelectElement;
                  const sucSelect = document.getElementById('modal-approve-sucursal') as HTMLSelectElement;
                  handleAprobar(selectedUser, rolSelect.value as Rol, sucSelect.value as any);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Aprobar y Activar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
