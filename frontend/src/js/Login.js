import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const navigate = useNavigate();
  const { login: loginContext } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mustChange, setMustChange] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'administrador' })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al iniciar sesión');

      if (data.user.must_change_password) {
        setMustChange(true);
        setUserInfo({
          token: data.token,
          tenant_id: data.user.tenant_id,
          user_id: data.user.id,
          role: data.user.role
        });
        return;
      }

      localStorage.setItem('username', data.user.username);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('adminTenantId', data.user.tenant_id);
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminRole', data.user.role);
      loginContext(data.user.role, data.user);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (mustChange && userInfo) {
    return <ChangeCredentialsForm userInfo={userInfo} onSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-indigo-600 px-8 py-8 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package size={28} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">StockManagerPro</h1>
          <p className="text-indigo-200 text-sm mt-1">Sistema de gestión de inventario</p>
        </div>

        {/* Form */}
        <div className="px-8 py-8">
          {error && (
            <div className="mb-5 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Ingresa tu usuario"
                  required
                  autoComplete="username"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Ingresa tu contraseña"
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-11 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-md shadow-indigo-200 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center px-8 pb-6 text-xs text-slate-400">
          StockManagerPro v1.0.0 · © 2024 Todos los derechos reservados
        </div>
      </div>
    </div>
  );
}

function ChangeCredentialsForm({ userInfo, onSuccess }) {
  const [form, setForm] = useState({ new_username: '', new_password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.new_username || !form.new_password) {
      setError('Debes ingresar un nuevo usuario y contraseña.');
      return;
    }
    if (form.new_password !== form.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userInfo.tenant_id}/${userInfo.user_id}/change-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({ new_username: form.new_username, new_password: form.new_password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al cambiar credenciales');
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="bg-indigo-600 px-8 py-8 text-center">
          <h1 className="text-xl font-bold text-white">Cambia tus credenciales</h1>
          <p className="text-indigo-200 text-sm mt-1">Por seguridad, define tu usuario y contraseña antes de continuar.</p>
        </div>
        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
          {error && <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-4 py-3">{error}</div>}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nuevo usuario</label>
            <input type="text" name="new_username" value={form.new_username} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nueva contraseña</label>
            <input type="password" name="new_password" value={form.new_password} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirmar contraseña</label>
            <input type="password" name="confirm" value={form.confirm} onChange={handleChange} className={inputClass} required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors shadow-md shadow-indigo-200">
            {loading ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
