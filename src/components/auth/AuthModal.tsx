import React, { useState } from 'react';
import { X, Mail, Lock, User, KeyRound, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast: (msg: string) => void;
}

type Mode = 'login' | 'signup' | 'reset';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccessToast }) => {
  const { loginEmail, signupEmail, loginGoogle, resetPassword, loginAsGuest } = useAuth();
  
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginEmail(email, password);
        onSuccessToast('Login realizado com sucesso!');
        onClose();
      } else if (mode === 'signup') {
        if (!name.trim()) {
          setError('Por favor, informe seu nome.');
          setLoading(false);
          return;
        }
        await signupEmail(email, password, name.trim());
        onSuccessToast('Conta criada com sucesso!');
        onClose();
      } else if (mode === 'reset') {
        await resetPassword(email);
        onSuccessToast('E-mail de redefinição de senha enviado!');
        setMode('login');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError(err.message || 'Ocorreu um erro ao processar sua solicitação.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginGoogle();
      onSuccessToast('Login com Google realizado!');
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('O login com Google precisa ser habilitado no Firebase Console. Use o "Modo Teste" para acessar imediatamente!');
      } else {
        setError('Erro ao entrar com Google. Tente o Modo Teste.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    loginAsGuest();
    onSuccessToast('Entrou no modo visitante.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 relative animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {mode === 'login' && 'Acessar Pet Care'}
            {mode === 'signup' && 'Criar sua conta'}
            {mode === 'reset' && 'Recuperar senha'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {mode === 'login' && 'Gerencie a saúde dos seus animais de estimação'}
            {mode === 'signup' && 'Crie sua conta para sincronizar todos os seus pets'}
            {mode === 'reset' && 'Enviaremos um link para redefinir sua senha'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nome completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Senha
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl text-xs font-bold text-white bg-[#7D9B76] hover:bg-[#6b8664] shadow-md shadow-[#7d9b7633] transition-all disabled:opacity-50"
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Cadastrar' : 'Enviar e-mail'}
          </button>
        </form>

        {/* Secondary Auth Options */}
        {mode === 'login' && (
          <>
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-[#E8E6DF] dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[10px] uppercase font-bold text-[#A19E95] tracking-wider absolute">
                Ou continue com
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-[#E8E6DF] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-[#FAF9F6] dark:hover:bg-slate-700 text-xs font-semibold text-[#3D3B36] dark:text-slate-200 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={handleGuestMode}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl border border-[#DCE6DA] dark:border-slate-800 bg-[#F0F4EF] dark:bg-slate-800 hover:bg-[#E2EBE0] text-xs font-semibold text-[#7D9B76] dark:text-sage-300 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#7D9B76]" />
                <span>Modo Teste</span>
              </button>
            </div>
          </>
        )}

        {/* Footer Toggle */}
        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          {mode === 'login' && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Não tem uma conta?{' '}
              <button
                onClick={() => setMode('signup')}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Cadastre-se grátis
              </button>
            </p>
          )}

          {mode === 'signup' && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Já possui conta?{' '}
              <button
                onClick={() => setMode('login')}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Faça login
              </button>
            </p>
          )}

          {mode === 'reset' && (
            <button
              onClick={() => setMode('login')}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline"
            >
              Voltar ao login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
