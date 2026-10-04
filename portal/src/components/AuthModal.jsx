import React, { useState } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from '../firebase';
import { Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function AuthModal({ onClose }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      setError('Error al conectar con Google. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegister && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Email o contraseña incorrectos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Ya existe una cuenta con este email. Inicia sesión.');
      } else {
        setError('Ocurrió un error al procesar tu solicitud: ' + (err.message || ''));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#141a14] border border-[#232f23] rounded-2xl p-8 shadow-2xl relative">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 bg-[#8EB486]/10 rounded-full flex items-center justify-center border border-[#8EB486]/20">
            <span className="text-xl">🌿</span>
          </div>
          <h2 className="text-2xl font-serif text-[#E2E8F0]">
            {isRegister ? 'Crear cuenta de paciente' : 'Iniciar sesión'}
          </h2>
          <p className="text-sm text-[#8F9B8D] mt-1">
            Accedé a tus audioguías y recursos terapéuticos
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 bg-[#1a231a] hover:bg-[#232f23] border border-[#8EB486]/20 rounded-xl text-sm font-medium text-[#E2E8F0] transition flex items-center justify-center gap-3 mb-5 disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continuar con Google
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-[#232f23]"></div>
          <span className="text-xs text-[#8F9B8D] uppercase tracking-wider">o con tu email</span>
          <div className="flex-1 h-px bg-[#232f23]"></div>
        </div>

        {/* Formulario Email / Password */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#8F9B8D] mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8F9B8D] absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full bg-[#0e130e] border border-[#232f23] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#E2E8F0] placeholder-[#8F9B8D]/50 focus:outline-none focus:border-[#8EB486]/60 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8F9B8D] mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8F9B8D] absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0e130e] border border-[#232f23] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#E2E8F0] placeholder-[#8F9B8D]/50 focus:outline-none focus:border-[#8EB486]/60 transition"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-[#8F9B8D] mb-1.5">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8F9B8D] absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0e130e] border border-[#232f23] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#E2E8F0] placeholder-[#8F9B8D]/50 focus:outline-none focus:border-[#8EB486]/60 transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#8EB486] hover:bg-[#7CA074] text-[#0A0D0A] font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 mt-2 shadow-lg shadow-[#8EB486]/10 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Procesando...' : isRegister ? 'Registrarme' : 'Entrar a mi biblioteca'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center mt-6 pt-4 border-t border-[#232f23]">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-[#8EB486] hover:text-[#B5CFB0] transition cursor-pointer"
          >
            {isRegister
              ? '¿Ya tenés una cuenta? Iniciar sesión'
              : '¿Primera vez acá? Crear una cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}
