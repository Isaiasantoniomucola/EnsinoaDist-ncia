import Link from 'next/link';
import Icone from '@/components/Icones';
import Logo from '@/components/Logo';
import { BotaoTema } from '@/components/Tema';

const recursos = [
  { icone: 'video', titulo: 'Aulas em vídeo e PDF', texto: 'Estude online ou descarregue os materiais para consultar sem ligação à internet.' },
  { icone: 'exercicios', titulo: 'Exercícios com correção automática', texto: 'Teste os seus conhecimentos e veja de imediato a pontuação e as respostas certas.' },
  { icone: 'grafico', titulo: 'Acompanhe a sua evolução', texto: 'Resultados e média geral sempre à mão, para saber onde melhorar.' },
  { icone: 'escudo', titulo: 'Conta segura', texto: 'Acesso com e-mail e palavra-passe protegida. Os seus dados ficam só consigo.' },
];

export default function Inicio() {
  return (
    <>
      <section className="hero">
        <div className="contentor">
          <div className="hero-nav">
            <Logo claro />
            <div className="linha">
              <BotaoTema className="sobre-escuro" />
              <Link href="/entrar" className="botao botao-claro botao-peq">Entrar</Link>
              <Link href="/registo" className="botao botao-ouro botao-peq">Criar conta</Link>
            </div>
          </div>
          <div className="hero-corpo">
            <span className="hero-selo"><Icone nome="chapeu" size={16} /> Ensino a Distância</span>
            <h1>Aprenda onde estiver, <em>ao seu ritmo</em></h1>
            <p>Aulas em vídeo e PDF, exercícios com correção automática e o acompanhamento dos seus resultados — no computador, no tablet ou no telemóvel.</p>
            <div className="linha">
              <Link href="/registo" className="botao botao-ouro">Começar agora</Link>
              <Link href="/entrar" className="botao botao-claro">Já tenho conta</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="seccao">
        <div className="contentor">
          <div className="seccao-titulo">
            <h2>Tudo o que precisa para estudar à distância</h2>
            <p className="suave">Uma plataforma simples, rápida e pensada para quem quer aprender com qualidade.</p>
          </div>
          <div className="grelha">
            {recursos.map((r) => (
              <article className="cartao recurso" key={r.titulo}>
                <span className="stat-icone"><Icone nome={r.icone} size={22} /></span>
                <h3>{r.titulo}</h3>
                <p className="suave" style={{ margin: 0 }}>{r.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="seccao" style={{ background: 'var(--superficie)', borderBlock: '1px solid var(--borda)' }}>
        <div className="contentor">
          <div className="seccao-titulo"><h2>Como funciona</h2></div>
          <div className="grelha">
            {[['Crie a sua conta', 'Registe-se em segundos apenas com o seu e-mail.'], ['Assista às aulas', 'Veja os vídeos e leia os documentos de cada módulo.'], ['Pratique e evolua', 'Responda aos exercícios e acompanhe a sua pontuação.']].map(([t, x], i) => (
              <div className="passo" key={t}><span className="passo-n">{i + 1}</span><div><h3>{t}</h3><p className="suave" style={{ margin: 0 }}>{x}</p></div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="seccao">
        <div className="contentor">
          <div className="cta">
            <h2>Pronto para começar?</h2>
            <p>Crie a sua conta gratuita com o seu e-mail e comece a estudar hoje.</p>
            <Link href="/registo" className="botao botao-ouro">Criar conta</Link>
          </div>
        </div>
      </section>

      <footer className="rodape">
        <div className="contentor">© {new Date().getFullYear()} EaD — Ensino a Distância · <Link href="/admin/entrar">Área de administração</Link></div>
      </footer>
    </>
  );
}
