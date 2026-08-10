import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { domainById, knowledgeById } from '@/data/knowledge-base';
import { transformerLessons } from '@/data/transformer-course';
import { colors } from '@/theme/colors';
import type { ReviewSource } from '@/types/course';

type Filter = 'all' | ReviewSource;

export default function ReviewScreen() {
  const { reviewQueue, reviewSchedule, projectProfile, removeFromReview } = useProgress();
  const [filter, setFilter] = useState<Filter>('all');

  const items = useMemo(() => {
    const legacyItems = Object.entries(reviewSchedule)
      .filter(([lessonId]) => !reviewQueue.some((item) => item.source === 'lesson' && item.targetId === lessonId))
      .map(([lessonId, dueAt]) => ({ id: `legacy-${lessonId}`, source: 'lesson' as const, targetId: lessonId, dueAt }));
    return [...reviewQueue, ...legacyItems].filter((item) => filter === 'all' || item.source === filter);
  }, [filter, reviewQueue, reviewSchedule]);

  const openItem = (source: ReviewSource, targetId: string) => {
    if (source === 'lesson') router.push({ pathname: '/lesson/[id]', params: { id: targetId } });
    else if (source === 'knowledge') router.push({ pathname: '/knowledge/[id]', params: { id: targetId } });
    else router.push('/resume');
  };

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
          <Text style={styles.title}>复习</Text>

          <View style={styles.summary}>
            <View><Text style={styles.summaryValue}>{items.length}</Text><Text style={styles.summaryLabel}>待复习</Text></View>
            <View style={styles.summaryStats}>
              <Text style={styles.summaryStatsValue}>{reviewQueue.filter((item) => item.source === 'knowledge').length}</Text>
              <Text style={styles.summaryStatsLabel}>知识卡</Text>
            </View>
            <View style={styles.summaryStats}>
              <Text style={styles.summaryStatsValue}>{reviewQueue.filter((item) => item.source === 'project').length}</Text>
              <Text style={styles.summaryStatsLabel}>项目题</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <FilterChip label="全部" active={filter === 'all'} onPress={() => setFilter('all')} />
            <FilterChip label="课程" active={filter === 'lesson'} onPress={() => setFilter('lesson')} />
            <FilterChip label="知识" active={filter === 'knowledge'} onPress={() => setFilter('knowledge')} />
            <FilterChip label="项目" active={filter === 'project'} onPress={() => setFilter('project')} />
          </ScrollView>

          {items.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>◆</Text>
              <Text style={styles.emptyTitle}>{filter === 'project' && !projectProfile ? '建立项目档案' : '暂无复习'}</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push(filter === 'project' ? '/resume' : '/library')} style={styles.button}>
                <Text style={styles.buttonText}>{filter === 'project' ? '去建立' : '去知识库'}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.list}>
              {items.map((item) => {
                const lesson = item.source === 'lesson' ? transformerLessons.find((entry) => entry.id === item.targetId) : null;
                const card = item.source === 'knowledge' ? knowledgeById[item.targetId] : null;
                const domain = card ? domainById[card.domainId] : null;
                const title = lesson?.shortTitle ?? card?.title ?? projectProfile?.name ?? '项目深挖';
                const sourceLabel = item.source === 'lesson' ? '课程节点' : item.source === 'knowledge' ? '通用知识' : '简历项目';
                const icon = lesson?.icon ?? domain?.icon ?? 'P';
                const color = domain?.color ?? (item.source === 'project' ? colors.success : colors.primary);
                const softColor = domain?.softColor ?? (item.source === 'project' ? colors.successSoft : colors.primarySoft);
                return (
                  <Pressable accessibilityRole="button" accessibilityLabel={`复习：${title}`} key={item.id} onPress={() => openItem(item.source, item.targetId)} style={styles.reviewCard}>
                    <View style={[styles.itemIcon, { backgroundColor: softColor }]}><Text style={[styles.itemIconText, { color }]}>{icon}</Text></View>
                    <View style={styles.itemCopy}>
                      <View style={styles.metaRow}>
                        <Text style={[styles.sourceLabel, { color }]}>{sourceLabel}</Text>
                        <Text style={styles.due}>{new Date(item.dueAt).toLocaleDateString('zh-CN')}</Text>
                      </View>
                      <Text numberOfLines={2} style={styles.itemTitle}>{title}</Text>
                    </View>
                    {!item.id.startsWith('legacy-') && (
                      <Pressable hitSlop={10} onPress={(event) => { event.stopPropagation(); removeFromReview(item.id); }}>
                        <Text style={styles.remove}>×</Text>
                      </Pressable>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.filter, active && styles.filterActive]}><Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 20, paddingBottom: 35 },
  title: { color: colors.text, fontSize: 29, fontWeight: '900' },
  summary: { backgroundColor: colors.primary, borderBottomWidth: 7, borderBottomColor: colors.primaryDark, borderRadius: 22, padding: 18, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryValue: { color: colors.surface, fontSize: 29, fontWeight: '900' },
  summaryLabel: { color: '#DFD9FF', fontSize: 10, marginTop: 3 },
  summaryStats: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 12, minWidth: 68, paddingVertical: 9 },
  summaryStatsValue: { color: colors.surface, fontSize: 17, fontWeight: '900' },
  summaryStatsLabel: { color: '#E5E0FF', fontSize: 9, marginTop: 2 },
  filters: { gap: 8, paddingVertical: 15 },
  filter: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 8 },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: colors.surface },
  empty: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 22, padding: 27, marginTop: 2 },
  emptyIcon: { color: colors.primary, fontSize: 35 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 12 },
  button: { alignSelf: 'stretch', alignItems: 'center', backgroundColor: colors.primary, borderBottomWidth: 5, borderBottomColor: colors.primaryDark, borderRadius: 15, padding: 15, marginTop: 20 },
  buttonText: { color: colors.surface, fontWeight: '900' },
  list: { gap: 10 },
  reviewCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 18, padding: 13 },
  itemIcon: { width: 45, height: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemIconText: { fontSize: 17, fontWeight: '900' },
  itemCopy: { flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sourceLabel: { fontSize: 9, fontWeight: '900' },
  due: { color: colors.textMuted, fontSize: 9 },
  itemTitle: { color: colors.text, fontWeight: '900', lineHeight: 19, marginTop: 4 },
  remove: { color: '#AAA3B6', fontSize: 24, paddingHorizontal: 4 },
});
