import Icone from './Icones';

export default function Logo({ claro = false }) {
  return (
    <span className={`logo${claro ? ' claro' : ''}`}>
      <span className="logo-marca"><Icone nome="chapeu" size={20} /></span>
      <span className="logo-txt"><b>EaD</b><small>Ensino a Distância</small></span>
    </span>
  );
}
