'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessao } from './AuthProvider';

export default function Protegido({ tipos, entrada, children }) {
  const { sessao, pronto } = useSessao();
  const router = useRouter();
  const permitido = !!sessao && tipos.includes(sessao.utilizador.tipo);

  useEffect(() => { if (pronto && !permitido) router.replace(entrada); }, [pronto, permitido, router, entrada]);

  if (!pronto || !permitido) return <p className="contentor suave" style={{ padding: '2rem 0' }}>A carregar…</p>;
  return children;
}
