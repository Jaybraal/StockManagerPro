import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, User, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login: loginContext } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'administrador'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mustChange, setMustChange] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [createAdmin, setCreateAdmin] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Login response:', data, response);
      console.log('Usuario recibido:', data.user);

      if (!response.ok) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // Si el backend indica que hay que crear un admin real
      // if (data.force_create_admin || (data.user && data.user.must_create_admin)) {
      //   setCreateAdmin(true);
      //   setUserInfo({
      //     token: data.token,
      //     tenant_id: data.user.tenant_id,
      //     user_id: data.user.id,
      //     role: data.user.role
      //   });
      //   return;
      // }

      // Si requiere cambio de credenciales, mostrar formulario especial
      if (data.user.must_change_password) {
        setMustChange(true);
        setUserInfo({
          token: data.token,
          tenant_id: data.user.tenant_id,
          user_id: data.user.id || data.user.user_id || null,
          role: data.user.role
        });
        return;
      }

      // Guardar token y datos del usuario - guardar ambos tenant_ids para compatibilidad
      localStorage.setItem('username', data.user.username);
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('adminTenantId', data.user.tenant_id);

      loginContext(data.user.role, data.user);
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminRole', data.user.role);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (createAdmin && userInfo) {
    // return <CreateAdminForm userInfo={userInfo} onSuccess={() => {
    //   setCreateAdmin(false);
    //   setUserInfo(null);
    //   navigate('/login');
    // }} />;
  }

  if (mustChange && userInfo) {
    return <ChangeCredentialsForm userInfo={userInfo} onSuccess={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f6f8fd] to-[#f1f5f9] p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-[420px] overflow-hidden transition-all duration-300">
        <div className="p-8 pb-6 text-center border-b border-[#e0e0e0]">
          <img src="/logo192.png" alt="Logo" width={56} height={56} className="mx-auto mb-3" />
          <h1 className="text-[1.75rem] text-[#4361ee] font-bold mb-2">StockManagerPro</h1>
          <p className="text-[#666] text-sm">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 text-[#dc2626] text-sm bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#333] mb-2">
              {t('login.username')}
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" strokeWidth={2} />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 border border-[#e0e0e0] rounded-lg text-sm transition-all duration-300 focus:outline-none focus:border-[#4361ee] focus:ring-3 focus:ring-[rgba(67,97,238,0.1)]"
                placeholder="Ingresa tu usuario"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#333] mb-2">
              {t('login.password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" strokeWidth={2} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 border border-[#e0e0e0] rounded-lg text-sm transition-all duration-300 focus:outline-none focus:border-[#4361ee] focus:ring-3 focus:ring-[rgba(67,97,238,0.1)]"
                placeholder="Ingresa tu contraseña"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4361ee] text-white py-3.5 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-[#3251d4] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('app.loading')}
              </>
            ) : (
              <>
                <Package className="w-5 h-5" strokeWidth={2} />
                {t('login.submit')}
              </>
            )}
          </button>
        </form>

        <div className="text-center p-6 border-t border-[#e0e0e0] text-[#666] text-xs">
          <p>StockManagerPro v1.0.0</p>
          <p className="mt-1 opacity-70">© 2024 Todos los derechos reservados</p>
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
        body: JSON.stringify({
          new_username: form.new_username,
          new_password: form.new_password
        })
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f6f8fd] to-[#f1f5f9] p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-[420px] overflow-hidden transition-all duration-300">
        <div className="p-8 pb-6 text-center border-b border-[#e0e0e0]">
          <h1 className="text-[1.5rem] text-[#4361ee] font-bold mb-2">Cambia tus credenciales</h1>
          <p className="text-[#666] text-sm">Por seguridad, debes cambiar tu usuario y contraseña antes de continuar.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8">
          {error && <div className="mb-6 text-[#dc2626] text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#333] mb-2">Nuevo usuario</label>
            <input type="text" name="new_username" value={form.new_username} onChange={handleChange} className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:border-[#4361ee]" required />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#333] mb-2">Nueva contraseña</label>
            <input type="password" name="new_password" value={form.new_password} onChange={handleChange} className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:border-[#4361ee]" required />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#333] mb-2">Confirmar contraseña</label>
            <input type="password" name="confirm" value={form.confirm} onChange={handleChange} className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:border-[#4361ee]" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#4361ee] text-white py-3.5 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-[#3251d4] disabled:opacity-70 flex items-center justify-center gap-2">
            {loading ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateAdminForm({ userInfo, onSuccess }) {
  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) {
      setError('Debes ingresar usuario y contraseña.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userInfo.tenant_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userInfo.token}`
        },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          role: 'administrador'
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error al crear usuario');
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f6f8fd] to-[#f1f5f9] p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-[420px] overflow-hidden transition-all duration-300">
        <div className="p-8 pb-6 text-center border-b border-[#e0e0e0]">
          <h1 className="text-[1.5rem] text-[#4361ee] font-bold mb-2">Crea tu usuario administrador</h1>
          <p className="text-[#666] text-sm">Por seguridad, crea tu usuario y contraseña de administrador.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8">
          {error && <div className="mb-6 text-[#dc2626] text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#333] mb-2">Usuario</label>
            <input type="text" name="username" value={form.username} onChange={handleChange} className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:border-[#4361ee]" required />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#333] mb-2">Contraseña</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:border-[#4361ee]" required />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#333] mb-2">Confirmar contraseña</label>
            <input type="password" name="confirm" value={form.confirm} onChange={handleChange} className="w-full px-4 py-3 border border-[#e0e0e0] rounded-lg text-sm focus:outline-none focus:border-[#4361ee]" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#4361ee] text-white py-3.5 rounded-lg text-sm font-medium transition-all duration-300 hover:bg-[#3251d4] disabled:opacity-70 flex items-center justify-center gap-2">
            {loading ? 'Creando...' : 'Crear y continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login; 