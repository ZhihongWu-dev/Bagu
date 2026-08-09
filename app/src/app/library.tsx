import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { knowledgeCards, knowledgeDomains } from '@/data/knowledge-base';
import { colors } from '@/theme/colors';
import type { KnowledgeDomainId } from '@/types/course';

type Filter = 'all' | 'favorite' | KnowledgeDomainId;

export default function LibraryScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const { favoriteKnowledgeIds, toggleFavorite } = useProgress();

  const visibleCards = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return knowledgeCards.filter((card) => {
      const matchesFilter = filter === 'all'
        || (filter === 'favorite' && favoriteKnowledgeIds.includes(card.id))
        || card.domainId === filter;
      const haystack = [card.title, card.summary, ...card.aliases].join(' ').toLowerCase();
      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
  }, [favoriteKnowledgeIds, filter, query]);

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.eyebrow}>STRUCTURED KNOWLEDGE</Text>
          <Text style={styles.title}>算法知识库</Text>
          <Text style={styles.subtitle}>先用 30 秒回答，再展开解释与经典资料。内容均为结构化总结。</Text>

          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="搜索 Attention、LoRA、PPO…"
              placeholderTextColor="#9A92A7"
              style={styles.searchInput}
            />
            {query ? <Pressable onPress={() => setQuery('')}><Text style={styles.clear}>×</Text></Pressable> : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <FilterChip label="全部" active={filter === 'all'} onPress={() => setFilter('all')} />
            <FilterChip label={`收藏 ${favoriteKnowledgeIds.length}`} active={filter === 'favorite'} onPress={() => setFilter('favorite')} />
            {knowledgeDomains.map((domain) => (
              <FilterChip key={domain.id} label={domain.shortLabel} active={filter === domain.id} onPress={() => setFilter(domain.id)} />
            ))}
          </ScrollView>

          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>{filter === 'favorite' ? '我的收藏' : '知识卡片'}</Text>
            <Text style={styles.count}>{visibleCards.length} 条</Text>
          </View>

          <View style={styles.cards}>
            {visibleCards.map((card) => {
              const domain = knowledgeDomains.find((item) => item.id === card.domainId)!;
              const favorite = favoriteKnowledgeIds.includes(card.id);
              return (
                <Pressable
                  key={card.id}
                  onPress={() => router.push({ pathname: '/knowledge/[id]', params: { id: card.id } })}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                  <View style={[styles.domainIcon, { backgroundColor: domain.softColor }]}>
                    <Text style={[styles.domainIconText, { color: domain.color }]}>{domain.icon}</Text>
                  </View>
                  <View style={styles.cardCopy}>
                    <View style={styles.metaRow}>
                      <Text style={[styles.domainLabel, { color: domain.color }]}>{domain.shortLabel}</Text>
                      <Text style={styles.difficulty}>{card.difficulty}</Text>
                    </View>
                    <Text style={styles.cardTitle}>{card.title}</Text>
                    <Text numberOfLines={2} style={styles.cardSummary}>{card.summary}</Text>
                  </View>
                  <Pressable hitSlop={10} onPress={(event) => { event.stopPropagation(); toggleFavorite(card.id); }}>
                    <Text style={[styles.favorite, favorite && styles.favoriteActive]}>{favorite ? '★' : '☆'}</Text>
                  </Pressable>
                </Pressable>
              );
            })}
          </View>

          {visibleCards.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⌕</Text>
              <Text style={styles.emptyTitle}>没有找到匹配内容</Text>
              <Text style={styles.emptyText}>换一个关键词，或切回“全部”看看。</Text>
            </View>
          )}
        </ScrollView>
        <BottomNav />
      </SafeAreaView>
    </ScreenShell>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 20, paddingBottom: 35 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 29, fontWeight: '900', marginTop: 6 },
  subtitle: { color: colors.textMuted, lineHeight: 20, marginTop: 7 },
  searchBox: { height: 50, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 14, marginTop: 19 },
  searchIcon: { color: colors.primary, fontSize: 21, fontWeight: '900' },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, outlineStyle: 'none' } as never,
  clear: { color: colors.textMuted, fontSize: 22 },
  filters: { gap: 8, paddingVertical: 14 },
  filterChip: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: colors.surface },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3, marginBottom: 10 },
  resultTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  count: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  cards: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 18, padding: 14 },
  cardPressed: { transform: [{ scale: 0.99 }], borderColor: colors.primary },
  domainIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  domainIconText: { fontSize: 17, fontWeight: '900' },
  cardCopy: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  domainLabel: { fontSize: 10, fontWeight: '900' },
  difficulty: { color: colors.textMuted, backgroundColor: colors.surfaceMuted, borderRadius: 7, paddingHorizontal: 6, paddingVertical: 3, fontSize: 9, fontWeight: '800' },
  cardTitle: { color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: '900', marginTop: 5 },
  cardSummary: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  favorite: { color: '#B8B0C4', fontSize: 24 },
  favoriteActive: { color: colors.current },
  empty: { alignItems: 'center', padding: 35, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border },
  emptyIcon: { color: colors.primary, fontSize: 32 },
  emptyTitle: { color: colors.text, fontWeight: '900', marginTop: 9 },
  emptyText: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
});
