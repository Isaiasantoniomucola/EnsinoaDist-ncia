'use client';
import { useEffect, useRef } from 'react';
import Icone from './Icones';

export default function Modal({ titulo, onFechar, children, largura = 640 }) {
  const fechar = useRef(onFechar);
  fechar.current = onFechar;

  useEffect(() => {
    const tecla = (e) => e.key === 'Escape' && fechar.current();
    document.addEventListener('keydown', tecla);
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', tecla); document.body.style.overflow = anterior; };
  }, []);

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo} style={{ maxWidth: largura }}>
        <div className="modal-topo">
          <h2>{titulo}</h2>
          <button className="icone-btn" onClick={onFechar} aria-label="Fechar"><Icone nome="fechar" /></button>
        </div>
        <div className="modal-corpo">{children}</div>
      </div>
    </div>
  );
}
