import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import ModalAcesso from '../../components/Modais/ModalAcesso';
import { formatarCPF } from '../../auxiliares/formatters';
import logo from '../../assets/media/logotipos/logo_h_branca.png';

export default function LoginPage() {
  const { login, handleVerificarHorarioAcesso, horarioAcesso, setHorarioAcesso } = useAuth();
  const navigate = useNavigate();
  const [tipo, setTipo] = useState<'email' | 'cpf'>('email');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const trava = useRef(false);
  const [modalAberto, setModalAberto] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trava.current) return;
    if (tipo === 'cpf' && cpf.replace(/\D/g, '').length !== 11) {
      toast.error('Informe um CPF com 11 dígitos.'); return;
    }
    trava.current = true; setOcupado(true);
    try {
      const usuario = await toast.promise(login(tipo === 'cpf' ? cpf : email, senha, tipo), {
        loading: 'Entrando...', success: 'Login realizado com sucesso!',
        error: (err) => err.message || 'Não foi possível entrar.',
      });
      if (usuario.trocarsenha || !usuario.assinatura) {
        navigate('/ajustes', { state: {
          precisaTrocarSenha: usuario.trocarsenha,
          precisaAdicionarAssinatura: !usuario.assinatura,
        } });
      } else navigate('/cursos/meuscursos');
    } catch { /* A mensagem é exibida pelo toast. */ }
    finally { trava.current = false; setOcupado(false); }
  };

  const handleRedefinirSenha = async () => {
    if (!email) { toast.error('Informe seu e-mail para redefinir a senha.'); return; }
    try {
      await toast.promise(sendPasswordResetEmail(getAuth(), email.trim()), {
        loading: 'Enviando link de redefinição...',
        success: 'Enviamos um link de redefinição para seu e-mail.',
        error: 'Não foi possível enviar o e-mail de redefinição.',
      });
    } catch { /* A mensagem é exibida pelo toast. */ }
  };

  return <div className="min-h-screen flex">
    <div className="w-full md:w-1/2 flex items-center justify-center bg-white py-10">
      <form onSubmit={handleLogin} className="max-w-md w-full px-6 space-y-6">
        <h2 className="text-3xl font-bold text-gray-900 text-center">Bem-vindo de Volta</h2>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1" aria-label="Forma de login">
          {(['email', 'cpf'] as const).map(opcao => <button key={opcao} type="button" disabled={ocupado} aria-pressed={tipo === opcao}
            onClick={() => { setTipo(opcao); setSenha(''); setModalAberto(false); setHorarioAcesso(null); }}
            className={`rounded-md px-4 py-2 text-sm font-medium cursor-pointer ${tipo === opcao ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600'}`}>
            {opcao === 'cpf' ? 'Entrar com CPF' : 'Entrar com e-mail'}
          </button>)}
        </div>
        <div className="space-y-2">
          <label htmlFor="identificador-login" className="block text-sm font-medium text-gray-700">{tipo === 'cpf' ? 'CPF' : 'E-mail'}</label>
          <input id="identificador-login" name={tipo} type={tipo === 'cpf' ? 'text' : 'email'} inputMode={tipo === 'cpf' ? 'numeric' : 'email'}
            autoComplete="username" value={tipo === 'cpf' ? formatarCPF(cpf) : email} disabled={ocupado}
            onChange={e => tipo === 'cpf' ? setCpf(e.target.value.replace(/\D/g, '').slice(0, 11)) : setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded text-sm" placeholder={tipo === 'cpf' ? '000.000.000-00' : 'Digite seu e-mail'} required />
          {tipo === 'cpf' && <p className="text-xs text-gray-500">Use seu CPF e a senha de acesso ao sistema.</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="senha-login" className="block text-sm font-medium text-gray-700">Senha</label>
          <input id="senha-login" type="password" autoComplete="current-password" value={senha} disabled={ocupado}
            onChange={e => setSenha(e.target.value)} className="w-full px-4 py-2 border rounded text-sm" placeholder="••••••••" required />
          {tipo === 'email' && <div className="text-right"><button type="button" disabled={ocupado} onClick={handleRedefinirSenha} className="text-sm text-blue-600 hover:underline cursor-pointer">Esqueceu a senha?</button></div>}
        </div>
        <button type="submit" disabled={ocupado} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded cursor-pointer disabled:opacity-50">{ocupado ? 'Entrando...' : 'Entrar'}</button>
        {tipo === 'email' && <div className="text-center"><button type="button" disabled={ocupado} className="cursor-pointer text-sm text-gray-600 hover:text-blue-600 hover:underline" onClick={() => {
          if (!email) { setHorarioAcesso(null); toast.error('Por favor, insira um e-mail'); return; }
          setModalAberto(true); handleVerificarHorarioAcesso(email);
        }}>Verificar horários de acesso</button></div>}
        <ModalAcesso aberto={modalAberto} onClose={() => setModalAberto(false)} horarios={horarioAcesso || []} />
      </form>
    </div>
    <div className="hidden md:flex md:w-1/2 bg-blue-600 text-white flex-col justify-center p-12">
      <img src={logo} alt="Saber Seguro Treinamentos" className="w-60" />
      <h2 className="text-3xl font-bold mb-4">Aprimore seus conhecimentos em Saúde e Segurança do Trabalho</h2>
      <p className="text-blue-100 mb-6">Treinamentos online desenvolvidos para capacitar profissionais de segurança e saúde no trabalho com conteúdo atualizado, prático e com certificação.</p>
      <div className="flex items-center -space-x-4">
        <img className="w-10 h-10 border-2 border-white rounded-full" src="https://randomuser.me/api/portraits/women/79.jpg" alt="" />
        <img className="w-10 h-10 border-2 border-white rounded-full" src="https://randomuser.me/api/portraits/men/85.jpg" alt="" />
        <img className="w-10 h-10 border-2 border-white rounded-full" src="https://randomuser.me/api/portraits/women/65.jpg" alt="" />
        <img className="w-10 h-10 border-2 border-white rounded-full" src="https://randomuser.me/api/portraits/men/32.jpg" alt="" />
        <span className="ml-6 text-sm text-blue-100">Mais de <strong>15 mil</strong> profissionais capacitados</span>
      </div>
    </div>
  </div>;
}
