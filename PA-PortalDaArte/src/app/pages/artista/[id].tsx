import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  Linking,
  Alert,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
// Mesmo ThemeContext que o seu Contratar.tsx usa (src/components/context/)
import { useTheme } from '../../../components/context/ThemeContext';
// Dados compartilhados com Favoritos e Contratar (src/components/dados/artistas.ts)
import { contratarParams, formatBRL, getArtista } from '../../../components/dados/artistas';
import type { Artist, PortfolioItem, Review } from '../../../components/dados/artistas';

const STAR = '#F5B301';

// Endereços = caminho da pasta dentro de src/app. Ajuste os nomes dos arquivos se forem outros.
const ROUTES = {
  favoritos: '/pages/favoritos/favoritos',
  mensagens: '/pages/mensagens/mensagens',
  contratar: '/pages/contratacoes/Contratar',
  perfilPublico: '/pages/perfil_publico/perfil_publico',
  // Caminho da sua tela de editar perfil. Deixe null enquanto ela não existir.
  editarPerfil: null as string | null,
  artista: (id: string) => `/pages/artista/${id}`,
};

/* ---------- Usuário logado ----------
 * PONTO ÚNICO DE LIGAÇÃO COM O SEU LOGIN.
 * Troque o corpo desta função para devolver o id do usuário logado
 * (do seu contexto de autenticação, AsyncStorage etc.).
 * Enquanto devolver null, ninguém é considerado "dono" do perfil
 * e a tela funciona como visão de visitante.
 *
 * Exemplo, se você tiver um AuthContext:
 *   const { user } = useAuth();
 *   return user ? String(user.id) : null;
 * (hooks precisam ser chamados sempre, no topo do componente)
 */
function useUsuarioLogadoId(): string | null {
  return null;
}

const PORTFOLIO_ICON: Record<PortfolioItem['type'], keyof typeof Feather.glyphMap> = {
  foto: 'image',
  video: 'play-circle',
  audio: 'music',
};

/* ---------- Perfil fictício para teste ----------
 * Serve só para visualizar a tela sem cadastrar artista no MySQL.
 * Visão de visitante: /pages/artista/demo
 * Visão do dono:      /pages/artista/demo?modo=dono
 * Só funciona em desenvolvimento (__DEV__).
 * ATENÇÃO: não confirme contratação nem envie mensagem com este perfil,
 * pois o id "demo" não existe no banco.
 */
const DEMO_ID = 'demo';

const DEMO_ARTIST = {
  id: DEMO_ID,
  name: 'Ana Martins (Demonstração)',
  style: 'Cantora • MPB e Pop',
  city: 'Recife, PE',
  rating: 4.8,
  reviewsCount: 2,
  about:
    'Perfil fictício para testar a experiência do contratante. Nenhuma informação deste perfil foi salva no banco de dados.',
  stats: { shows: 48, years: 5, favorites: 120 },
  tags: ['MPB', 'Pop', 'Voz e violão'],
  priceFrom: 350,
  photoUrl: 'https://i.pravatar.cc/200?img=47',
  icon: 'music',
  iconBg: '#F8E4E5',
  iconBgDark: '#39304F',
  iconColor: '#B83A4B',
  portfolio: [
    { id: 'p1', type: 'foto', title: 'Show no Marco Zero', uri: 'https://picsum.photos/seed/show1/600/400' },
    { id: 'p2', type: 'foto', title: 'Casamento 2025', uri: 'https://picsum.photos/seed/show2/600/400' },
    { id: 'p3', type: 'foto', title: 'Festa privada', uri: 'https://picsum.photos/seed/show3/600/400' },
    { id: 'p4', type: 'video', title: 'Clipe ao vivo', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  ],
  reviews: [
    {
      id: 'r1',
      author: 'Carlos Souza',
      authorId: 'demo-c1',
      authorTipo: 'contratante',
      date: '10/2026',
      rating: 5,
      text: 'Show incrível, superou as expectativas.',
    },
    {
      id: 'r2',
      author: 'Marina Lima',
      authorId: 'demo-c2',
      authorTipo: 'contratante',
      date: '09/2026',
      rating: 4.5,
      text: 'Muito profissional e pontual.',
    },
  ],
} as unknown as Artist;

/* ---------- Tela ---------- */
export default function ArtistProfileScreen() {
  // Todos os hooks ficam aqui no topo, antes de qualquer return.
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const { id, modo } = useLocalSearchParams<{ id: string; modo?: string }>();
  const usuarioLogadoId = useUsuarioLogadoId();

  const [favorite, setFavorite] = useState(true);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState<PortfolioItem | null>(null);
  



  // Perfil demo só em desenvolvimento; os demais ids usam a função existente.
  // TODO: ao ligar a API, busque o artista pelo id da URL no servidor
  const isDemoArtist = __DEV__ && id === DEMO_ID;
  const artist = isDemoArtist ? DEMO_ARTIST : getArtista(id);

  if (!artist) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: 24, gap: 12 }}>
          <Text style={styles.name}>Artista não encontrado</Text>
          <TouchableOpacity onPress={() => router.replace(ROUTES.favoritos as any)}>
            <Text style={styles.link}>Voltar para Favoritos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Dono do perfil: o usuário logado é o próprio artista.
  // Em desenvolvimento, "?modo=dono" na URL simula essa visão para teste.
  const isOwner =
    (usuarioLogadoId !== null && String(usuarioLogadoId) === String(artist.id)) ||
    (__DEV__ && modo === 'dono');

  const openReviewer = (r: Review) =>
    r.authorTipo === 'artista'
      ? router.push(ROUTES.artista(r.authorId) as any)
      : router.push({ pathname: ROUTES.perfilPublico as any, params: { id: r.authorId } });

  const openPortfolioItem = (item: PortfolioItem) => {
    if (item.type === 'foto') setPhotoOpen(item);
    else if (item.url) Linking.openURL(item.url);
  };

  const editProfile = () => {
    if (!ROUTES.editarPerfil) {
      Alert.alert('Editar perfil', 'A tela de edição ainda não foi configurada.');
      return;
    }
    router.push(ROUTES.editarPerfil as any);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Topo: voltar + título + favoritar (só para visitantes) */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace(ROUTES.favoritos as any))}
          accessibilityLabel="Voltar"
        >
          <Feather name="arrow-left" size={20} color={theme.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.topTitle}>{isOwner ? 'Meu perfil' : 'Perfil do artista'}</Text>

        {isOwner ? (
          <View style={styles.iconBtnSpacer} />
        ) : (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setFavorite((f) => !f)}
            accessibilityLabel={favorite ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
          >
            <Ionicons
              name={favorite ? 'heart' : 'heart-outline'}
              size={20}
              color={theme.accent}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avisos */}
        {isDemoArtist && (
          <View style={styles.demoBanner}>
            <Feather name="info" size={14} color={theme.accent} />
            <Text style={styles.demoBannerText}>
              Perfil de demonstração: não está salvo no banco. Não confirme contratação nem envie mensagens.
            </Text>
          </View>
        )}
        {isOwner && (
          <View style={styles.demoBanner}>
            <Feather name="user" size={14} color={theme.accent} />
            <Text style={styles.demoBannerText}>
              Você está vendo o seu próprio perfil, do jeito que os contratantes o veem.
            </Text>
          </View>
        )}

        {/* Cabeçalho do artista */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setAvatarOpen(true)}
            accessibilityLabel="Ampliar foto do artista"
          >
            <ArtistAvatar artist={artist} size={84} styles={styles} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{artist.name}</Text>
            <Text style={styles.sub}>{artist.style}</Text>
            <View style={styles.row}>
              <Feather name="map-pin" size={12} color={theme.textSecondary} />
              <Text style={styles.subSmall}>{artist.city}</Text>
            </View>
            <View style={[styles.row, { marginTop: 6 }]}>
              <Ionicons name="star" size={14} color={STAR} />
              <Text style={styles.ratingBold}>{artist.rating.toFixed(1)}</Text>
              <Text style={styles.subSmall}>({artist.reviewsCount} avaliações)</Text>
            </View>
          </View>
        </View>

        {/* Estatísticas */}
        <View style={[styles.card, styles.statsCard]}>
          <Stat styles={styles} value={artist.stats.shows} label="Shows" />
          <View style={styles.divider} />
          <Stat styles={styles} value={artist.stats.years} label="Anos de carreira" />
          <View style={styles.divider} />
          <Stat styles={styles} value={artist.stats.favorites} label="Favoritos" />
        </View>

        {/* Sobre */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sobre</Text>
          <Text style={styles.body}>{artist.about}</Text>
        </View>

        {/* Estilos e serviços */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estilos e serviços</Text>
          <View style={styles.tags}>
            {artist.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Portfólio */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Portfólio</Text>
            <Text style={styles.subSmall}>{artist.portfolio.length} itens</Text>
          </View>

          {artist.portfolio.length === 0 ? (
            <Text style={styles.body}>
              {isOwner
                ? 'Você ainda não publicou trabalhos no portfólio.'
                : 'Este artista ainda não publicou trabalhos no portfólio.'}
            </Text>
          ) : (
            <View style={styles.grid}>
              {artist.portfolio.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.tile}
                  onPress={() => openPortfolioItem(item)}
                  accessibilityLabel={`${item.type}: ${item.title}`}
                >
                  {item.uri ? (
                    <Image source={{ uri: item.uri }} style={styles.tileImage} />
                  ) : null}
                  <View style={styles.tileOverlay}>
                    <Feather name={PORTFOLIO_ICON[item.type]} size={22} color={theme.accent} />
                  </View>
                  <Text style={styles.tileTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Avaliações */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Avaliações</Text>
            <TouchableOpacity>
              <Text style={styles.link}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {artist.reviews.length === 0 && (
            <Text style={styles.body}>Ainda não há avaliações.</Text>
          )}

          {artist.reviews.map((r, i) => (
            <View key={r.id} style={[styles.review, i > 0 && styles.reviewBorder]}>
              <View style={styles.reviewTop}>
                {/* Toque no avatar ou no nome abre o perfil de quem avaliou */}
                <TouchableOpacity
                  style={styles.reviewWho}
                  onPress={() => openReviewer(r)}
                  accessibilityLabel={`Ver perfil de ${r.author}`}
                >
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>{r.author.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewAuthor}>{r.author}</Text>
                    <Text style={styles.subSmall}>{r.date}</Text>
                  </View>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Ionicons
                      key={n}
                      name={n <= Math.round(r.rating) ? 'star' : 'star-outline'}
                      size={13}
                      color={STAR}
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.body}>{r.text}</Text>
            </View>
          ))}
        </View>

        {/* Espaço para a barra fixa de baixo */}
        <View style={{ height: 96 }} />
      </ScrollView>

      {/* Barra fixa: preço + ações */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.priceLabel}>A partir de</Text>
          <Text style={styles.price}>{formatBRL(artist.priceFrom)}</Text>
        </View>

        <View style={styles.actions}>
          {isOwner ? (
            <TouchableOpacity
              style={styles.hireBtn}
              onPress={editProfile}
              accessibilityLabel="Editar perfil"
            >
              <Text style={styles.hireText}>Editar perfil</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.msgBtn}
                onPress={() =>
                  router.push({ pathname: ROUTES.mensagens as any, params: { artistId: artist.id } })
                }
                accessibilityLabel="Enviar mensagem"
              >
                <Feather name="message-square" size={20} color={theme.accent} />
              </TouchableOpacity>

              <TouchableOpacity
             style={styles.hireBtn}
            onPress={() =>
             router.push({
            pathname: ROUTES.contratar as any,
            params: {
            id: String(artist.id),
           nome: artist.name,
           estilo: artist.style,
           nota: String(artist.rating ?? 0),
           avaliacoes: String(artist.reviewsCount ?? 0),
           valorBase: String(artist.priceFrom ?? 0),
        aceitaNegociar: 'false',
      },
    })
  }
  accessibilityLabel="Contratar artista"
>
  <Text style={styles.hireText}>Contratar</Text>
</TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Foto do artista ampliada */}
      <Modal visible={avatarOpen} transparent animationType="fade" onRequestClose={() => setAvatarOpen(false)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setAvatarOpen(false)}>
          <ArtistAvatar artist={artist} size={240} styles={styles} />
          <Text style={styles.modalCaption}>{artist.name}</Text>
        </TouchableOpacity>
      </Modal>

      {/* Foto do portfólio ampliada */}
      <Modal visible={!!photoOpen} transparent animationType="fade" onRequestClose={() => setPhotoOpen(null)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setPhotoOpen(null)}>
          {photoOpen?.uri ? (
            <Image source={{ uri: photoOpen.uri }} style={styles.modalImage} resizeMode="contain" />
          ) : (
            <View style={[styles.modalImage, styles.modalPlaceholder]}>
              <Feather name="image" size={48} color={theme.accent} />
            </View>
          )}
          <Text style={styles.modalCaption}>{photoOpen?.title}</Text>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

/* ---------- Componentes pequenos ---------- */
function ArtistAvatar({
  artist,
  size,
  styles,
}: {
  artist: Artist;
  size: number;
  styles: ReturnType<typeof makeStyles>;
}) {
  const { isLightMode } = useTheme();
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (artist.photoUrl) {
    return <Image source={{ uri: artist.photoUrl }} style={[styles.avatarImg, box]} />;
  }
  return (
    <View style={[styles.avatar, box, { backgroundColor: isLightMode ? artist.iconBg : artist.iconBgDark }]}>
      <Feather name={artist.icon} size={size * 0.4} color={artist.iconColor} />
    </View>
  );
}

function Stat({
  styles,
  value,
  label,
}: {
  styles: ReturnType<typeof makeStyles>;
  value: number;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ---------- Estilos (dependem do tema claro/escuro) ---------- */
const makeStyles = (theme: Record<string, string>) => {
  const shadow = Platform.select({
    ios: {
      shadowColor: '#8A4B1F',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
    },
    android: { elevation: 2 },
    default: {},
  });

  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.mainBg },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.headerBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    topTitle: { fontSize: 16, fontWeight: '700', color: theme.textPrimary },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderColor,
      backgroundColor: theme.cardBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtnSpacer: { width: 40, height: 40 },

    content: { padding: 16, gap: 14 },

    demoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      borderRadius: 10,
      backgroundColor: theme.cardBg,
      borderWidth: 1,
      borderColor: theme.accent,
    },
    demoBannerText: { flex: 1, fontSize: 12, color: theme.textPrimary },

    header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    avatar: { alignItems: 'center', justifyContent: 'center' },
    avatarImg: { backgroundColor: theme.searchBg },
    name: { fontSize: 24, fontWeight: '800', color: theme.textPrimary },
    sub: { fontSize: 14, color: theme.textSecondary, marginTop: 2 },
    subSmall: { fontSize: 12, color: theme.textSecondary },
    row: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    ratingBold: { fontSize: 14, fontWeight: '700', color: theme.textPrimary },

    card: {
      backgroundColor: theme.cardBg,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.borderColor,
      padding: 16,
      ...shadow,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: { fontSize: 16, fontWeight: '800', color: theme.textPrimary, marginBottom: 8 },
    body: { fontSize: 13, lineHeight: 19, color: theme.textSecondary },
    link: { fontSize: 12, fontWeight: '700', color: theme.accent },

    statsCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '800', color: theme.accent },
    statLabel: { fontSize: 11, color: theme.textSecondary, marginTop: 2 },
    divider: { width: 1, height: 32, backgroundColor: theme.borderColor },

    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag: {
      backgroundColor: theme.accent + '1F', // cor de destaque com ~12% de opacidade
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    tagText: { fontSize: 12, fontWeight: '600', color: theme.accent },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    tile: {
      width: '31%',
      aspectRatio: 1,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: theme.searchBg,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    tileImage: { ...StyleSheet.absoluteFillObject },
    tileOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileTitle: {
      position: 'absolute',
      left: 6,
      right: 6,
      bottom: 4,
      fontSize: 10,
      fontWeight: '600',
      color: theme.textPrimary,
    },

    review: { paddingVertical: 12, gap: 8 },
    reviewBorder: { borderTopWidth: 1, borderTopColor: theme.borderColor },
    reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    reviewWho: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    reviewAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reviewAvatarText: { color: '#fff', fontWeight: '700' },
    reviewAuthor: { fontSize: 13, fontWeight: '700', color: theme.textPrimary },

    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: Platform.OS === 'ios' ? 28 : 16,
      backgroundColor: theme.cardBg,
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
    },
    priceLabel: { fontSize: 12, color: theme.accent },
    price: { fontSize: 20, fontWeight: '800', color: theme.accent },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    msgBtn: {
      width: 46,
      height: 46,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hireBtn: {
      backgroundColor: theme.accent,
      borderRadius: 10,
      paddingHorizontal: 28,
      height: 46,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hireText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    modalBg: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 16,
    },
    modalImage: { width: '100%', height: '70%', borderRadius: 12 },
    modalPlaceholder: {
      backgroundColor: theme.cardBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCaption: { color: '#fff', fontSize: 15, fontWeight: '700' },
  });
};
