import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// ...os outros imports que já existiam

const URL_API = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000'; // só uma vez

export function useMeuId(): string | null {
  const [meuId, setMeuId] = useState<string | null>(null);
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) return;
        const r = await fetch(`${URL_API}/api/perfis/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await r.json();
        const d = j?.dados;
        const id = d?.usuario_id ?? d?.id;
        if (ativo && id != null) setMeuId(String(id));
      } catch {
        // sem rede ou sem login: ninguém é considerado dono
      }
    })();
    return () => { ativo = false; };
  }, []);
  return meuId;
}



export type Review = {
  id: string;
  authorId: string;
  authorTipo: 'cliente' | 'artista';
  author: string;
  date: string;
  rating: number;
  text: string;
};

export type PortfolioItem = {
  id: string;
  type: 'foto' | 'video' | 'audio';
  title: string;
  uri?: string; // imagem / miniatura
  url?: string; // link do vídeo ou áudio
};

export type Artist = {
  id: string;
  name: string;
  style: string; // ex: "MPB • Cantora"
  city: string;
  rating: number;
  reviewsCount: number;
  priceFrom: number;
  negotiable: boolean; // false = valor fixo (some a opção de negociar no formulário)
  minPrice?: number; // menor proposta aceita pelo artista
  photoUrl?: string;
  icon: 'music' | 'headphones' | 'mic';
  iconColor: string;
  iconBg: string; // fundo do avatar no modo claro
  iconBgDark: string; // fundo do avatar no modo escuro
  about: string;
  tags: string[];
  stats: { shows: number; years: number; favorites: number };
  portfolio: PortfolioItem[];
  reviews: Review[];
};

export const ARTISTAS: Artist[] = [
  {
    id: '1',
    name: 'Lucas Andrade',
    style: 'Violão e Voz',
    city: 'Caruaru, PE',
    rating: 4.8,
    reviewsCount: 95,
    priceFrom: 450,
    negotiable: true,
    minPrice: 300,
    icon: 'music',
    iconColor: '#E05A10',
    iconBg: '#FDE4D9',
    iconBgDark: '#3D2218',
    about:
      'Voz e violão para ambientes intimistas: restaurantes, aniversários e cerimônias. Repertório de MPB, pop e sertanejo acústico, adaptado ao clima do evento.',
    tags: ['Voz e Violão', 'Acústico', 'Aniversários', 'Restaurantes'],
    stats: { shows: 64, years: 5, favorites: 142 },
    portfolio: [
      { id: 'p1', type: 'foto', title: 'Show em restaurante' },
      { id: 'p2', type: 'video', title: 'Voz e violão ao vivo', url: 'https://youtube.com' },
      { id: 'p3', type: 'foto', title: 'Aniversário de 15 anos' },
    ],
    reviews: [
      {
        id: '1',
        authorId: '12',
        authorTipo: 'cliente',
        author: 'Clara Mendonça',
        date: '02/09/2026',
        rating: 5,
        text: 'Deixou o jantar muito mais especial. Simpático e pontual.',
      },
    ],
  },
  {
    id: '2',
    name: 'Banda Vereda',
    style: 'Forró • 5 integrantes',
    city: 'Recife, PE',
    rating: 4.9,
    reviewsCount: 215,
    priceFrom: 1200,
    negotiable: false,
    icon: 'music',
    iconColor: '#E05A10',
    iconBg: '#FDE4D9',
    iconBgDark: '#412C1B',
    about:
      'Banda de forró pé de serra com cinco integrantes, equipamento de som próprio e repertório para festas juninas, casamentos e eventos corporativos.',
    tags: ['Forró', 'Banda', 'Festas juninas', 'Casamentos'],
    stats: { shows: 210, years: 11, favorites: 389 },
    portfolio: [
      { id: 'p1', type: 'video', title: 'São João ao vivo', url: 'https://youtube.com' },
      { id: 'p2', type: 'foto', title: 'Casamento no sítio' },
      { id: 'p3', type: 'foto', title: 'Festa junina corporativa' },
      { id: 'p4', type: 'audio', title: 'EP Pé de Serra', url: 'https://soundcloud.com' },
    ],
    reviews: [
      {
        id: '1',
        authorId: '7',
        authorTipo: 'artista',
        author: 'Rafael Souza',
        date: '18/08/2026',
        rating: 5,
        text: 'Animaram a festa inteira, ninguém ficou sentado.',
      },
    ],
  },
  {
    id: '3',
    name: 'DJ Marina',
    style: 'Eletrônica • DJ Set',
    city: 'Recife, PE',
    rating: 4.7,
    reviewsCount: 83,
    priceFrom: 600,
    negotiable: true,
    minPrice: 450,
    icon: 'headphones',
    iconColor: '#8C52FF',
    iconBg: '#EBE4FA',
    iconBgDark: '#2E2243',
    about:
      'DJ de música eletrônica com sets de 2 a 5 horas para festas, formaturas e eventos de marca. Leva equipamento completo e iluminação básica.',
    tags: ['Eletrônica', 'DJ Set', 'Formaturas', 'Festas privadas'],
    stats: { shows: 97, years: 6, favorites: 176 },
    portfolio: [
      { id: 'p1', type: 'video', title: 'Set de 1 hora', url: 'https://youtube.com' },
      { id: 'p2', type: 'foto', title: 'Festa de formatura' },
    ],
    reviews: [
      {
        id: '1',
        authorId: '12',
        authorTipo: 'cliente',
        author: 'Clara Mendonça',
        date: '15/08/2026',
        rating: 5,
        text: 'Pista cheia a noite toda. Ótima leitura do público.',
      },
    ],
  },
  {
    id: '4',
    name: 'Juliana Diniz',
    style: 'MPB • Cantora',
    city: 'Recife, PE',
    rating: 4.9,
    reviewsCount: 128,
    priceFrom: 800,
    negotiable: true,
    minPrice: 600,
    icon: 'mic',
    iconColor: '#20B2AA',
    iconBg: '#E0F2F1',
    iconBgDark: '#1B3736',
    about:
      'Cantora de MPB com repertório que vai de clássicos a releituras autorais. Atende casamentos, eventos corporativos e festas privadas, com voz e violão ou banda completa.',
    tags: ['MPB', 'Voz e Violão', 'Casamentos', 'Eventos corporativos'],
    stats: { shows: 86, years: 7, favorites: 214 },
    portfolio: [
      { id: 'p1', type: 'foto', title: 'Casamento na praia' },
      { id: 'p2', type: 'video', title: 'Show ao vivo', url: 'https://youtube.com' },
      { id: 'p3', type: 'audio', title: 'Single autoral', url: 'https://soundcloud.com' },
      { id: 'p4', type: 'foto', title: 'Evento corporativo' },
      { id: 'p5', type: 'video', title: 'Voz e violão', url: 'https://youtube.com' },
      { id: 'p6', type: 'foto', title: 'Festival de inverno' },
    ],
    reviews: [
      {
        id: '1',
        authorId: '12',
        authorTipo: 'cliente',
        author: 'Clara Mendonça',
        date: '10/09/2026',
        rating: 5,
        text: 'Apresentação linda, todos os convidados elogiaram. Pontual e muito profissional.',
      },
      {
        id: '2',
        authorId: '7',
        authorTipo: 'artista',
        author: 'Rafael Souza',
        date: '22/08/2026',
        rating: 5,
        text: 'Repertório perfeito para o nosso evento. Super recomendo!',
      },
    ],
  },
];

export const getArtista = (id?: string): Artist | undefined =>
  ARTISTAS.find((a) => a.id === id);

export const formatBRL = (v: number): string =>
  'R$ ' + v.toLocaleString('pt-BR', { minimumFractionDigits: 0 });

/** Parâmetros que o formulário Contratar.tsx lê da URL (tudo precisa ser texto). */
export const contratarParams = (a: Artist) => ({
  artistId: a.id,
  nome: a.name,
  estilo: a.style,
  nota: String(a.rating),
  avaliacoes: String(a.reviewsCount),
  valorBase: String(a.priceFrom),
  aceitaNegociar: a.negotiable ? '1' : '0',
  valorMinimo: a.minPrice ? String(a.minPrice) : '',
});
