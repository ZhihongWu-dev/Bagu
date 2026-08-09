import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { domainById, knowledgeById } from '@/data/knowledge-base';
import { colors } from '@/theme/colors';

export default function KnowledgeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const card = useMemo(() => knowledgeById[id], [id]);
  const [revealed, setRevealed] = useState(false);
  const { favoriteKnowledgeIds, reviewQueue, toggleFavorite, addToReview } = useProgress();

  if (!card) return null;
  const domain = domainById[card.domainId];
  const favorite = favoriteKnowledgeIds.includes(card.id);
  const scheduled = reviewQueue.some((item) => item.source === 'knowledge' && item.targetId === card.id);

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}><Text style={styles.back}>‹</Text></Pressable>
          <Text style={styles.headerTitle}>知识点详情</Text>
          <Pressable onPress={() => toggleFavorite(card.id)} hitSlop={12}>
            <Text style={[styles.favorite, favorite && styles.favoriteActive]}>{favorite ? '★' : '☆'}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.meta}>
            <Text style={[styles.domain, { color: domain.color, backgroundColor: domain.softColor }]}>{domain.label}</Text>
            <Text style={styles.difficulty}>{card.difficulty}</Text>
          </View>
          <Text style={styles.title}>{card.title}</Text>
          <Text style={styles.summary}>{card.summary}</Text>

          {!revealed ? (
            <View style={styles.recallCard}>
              <Text style={styles.recallTimer}>30 秒主动回忆</Text>
              <Text style={styles.recallTitle}>先在心里完整回答</Text>
              <Text style={styles.recallText}>试着说出“原因 → 机制 → 结果”，再对照标准答案。</Text>
              <Pressable onPress={() => setRevealed(true)} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>查看参考回答</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Section title="面试参考回答"><Text style={styles.body}>{card.answer}</Text></Section>
              <View style={styles.intuitionCard}>
                <Text style={styles.intuitionLabel}>直觉理解</Text>
                <Text style={styles.body}>{card.intuition}</Text>
              </View>
              {card.formula && <Text style={styles.formula}>{card.formula}</Text>}
              <Section title="回答关键点">
                {card.keyPoints.map((point) => <Text key={point} style={styles.point}>✓  {point}</Text>)}
              </Section>
              <Section title="面试官可能追问">
                {card.followUps.map((item, index) => <Text key={item} style={styles.followUp}>{index + 1}. {item}</Text>)}
              </Section>
              <Section title="原始资料">
                {card.sources.map((source) => (
                  <Pressable key={source.url} onPress={() => void Linking.openURL(source.url)} style={styles.source}>
                    <View><Text style={styles.sourceKind}>{source.kind === 'paper' ? '经典论文' : '官方资料'}</Text><Text style={styles.sourceTitle}>{source.title}</Text></View>
                    <Text style={styles.sourceArrow}>↗</Text>
                  </Pressable>
                ))}
              </Section>
            </>
          )}
        </ScrollView>
        <View style={styles.actionArea}>
          <Pressable disabled={scheduled} onPress={() => addToReview(card.id)} style={[styles.reviewButton, scheduled && styles.scheduledButton]}>
            <Text style={[styles.reviewButtonText, scheduled && styles.scheduledText]}>{scheduled ? '✓ 已加入明日复习' : '加入复习计划'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ScreenShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  back: { color: colors.text, fontSize: 34, lineHeight: 38 },
  headerTitle: { color: colors.text, fontWeight: '900' },
  favorite: { color: '#B8B0C4', fontSize: 25 },
  favoriteActive: { color: colors.current },
  content: { padding: 21, paddingBottom: 110 },
  meta: { flexDirection: 'row', gap: 8 },
  domain: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, fontSize: 10, fontWeight: '900' },
  difficulty: { color: colors.textMuted, backgroundColor: colors.surfaceMuted, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, fontSize: 10, fontWeight: '900' },
  title: { color: colors.text, fontSize: 27, lineHeight: 36, fontWeight: '900', marginTop: 15 },
  summary: { color: colors.textMuted, lineHeight: 22, marginTop: 8 },
  recallCard: { backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: '#DCD2FF', borderRadius: 22, padding: 20, marginTop: 23 },
  recallTimer: { alignSelf: 'flex-start', color: colors.primaryDark, backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, fontSize: 10, fontWeight: '900' },
  recallTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 16 },
  recallText: { color: colors.textMuted, lineHeight: 20, marginTop: 7 },
  primaryButton: { alignItems: 'center', backgroundColor: colors.primary, borderBottomWidth: 5, borderBottomColor: colors.primaryDark, borderRadius: 15, padding: 15, marginTop: 19 },
  primaryButtonText: { color: colors.surface, fontWeight: '900' },
  section: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 18, padding: 16, marginTop: 15 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: 9 },
  body: { color: colors.text, lineHeight: 23 },
  intuitionCard: { backgroundColor: colors.successSoft, borderRadius: 18, padding: 16, marginTop: 13 },
  intuitionLabel: { color: colors.successDark, fontSize: 11, fontWeight: '900', marginBottom: 7 },
  formula: { color: colors.text, backgroundColor: colors.primarySoft, borderRadius: 16, padding: 17, textAlign: 'center', fontSize: 16, marginTop: 13 },
  point: { color: colors.successDark, lineHeight: 25, fontWeight: '700' },
  followUp: { color: colors.text, lineHeight: 25 },
  source: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  sourceKind: { color: colors.primary, fontSize: 9, fontWeight: '900' },
  sourceTitle: { color: colors.text, fontSize: 12, fontWeight: '800', marginTop: 3, maxWidth: 330 },
  sourceArrow: { color: colors.primary, fontSize: 20 },
  actionArea: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 17, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  reviewButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 15, padding: 15 },
  scheduledButton: { backgroundColor: colors.successSoft },
  reviewButtonText: { color: colors.surface, fontWeight: '900' },
  scheduledText: { color: colors.successDark },
});
