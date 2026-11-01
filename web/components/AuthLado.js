import Link from 'next/link';
import Icone from './Icones';
import Logo from './Logo';

export default function AuthLado({ titulo, texto, itens }) {
  return (
    <aside className="auth-lado">
      <Link href="/"><Logo claro /></Link>
      <div>
        <h2>{titulo}</h2>
        <p>{texto}</p>
        {itens && (
          <ul>
            {itens.map((i) => <li key={i}><Icone nome="check" size={18} />{i}</li>)}
          </ul>
        )}
      </div>
      <small>© {new Date().getFullYear()} EaD — Ensino a Distância</small>
    </aside>
  );
}
