import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { domainById, knowledgeById } from '@/data/knowledge-base';
import { colors } from '@/theme/colors';

export default function KnowledgeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const card = useMemo(() => knowledgeById[id], [id]);
  const { favoriteKnowledgeIds, reviewQueue, toggleFavorite, addToReview } = useProgress();

  if (!card) {
    return (
      <ScreenShell><SafeAreaView style={styles.centered}><Text style={styles.title}>知识点不存在</Text><Pressable onPress={() => router.replace('/library')} style={styles.reviewButton}><Text style={styles.reviewButtonText}>返回知识库</Text></Pressable></SafeAreaView></ScreenShell>
    );
  }

  const domain = domainById[card.domainId];
  const favorite = favoriteKnowledgeIds.includes(card.id);
  const scheduled = reviewQueue.some((item) => item.source === 'knowledge' && item.targetId === card.id);
  const relatedCards = (card.relatedIds ?? []).map((relatedId) => knowledgeById[relatedId]).filter(Boolean);

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="返回" onPress={() => router.back()} hitSlop={12}><AppIcon name="chevron-left" size={26} color={colors.text} /></Pressable>
          <Text style={styles.headerTitle}>知识手册</Text>
          <Pressable accessibilityLabel={favorite ? '取消收藏' : '收藏'} onPress={() => toggleFavorite(card.id)} hitSlop={12}><AppIcon name="star" size={25} color={favorite ? colors.current : '#B8B0C4'} strokeWidth={favorite ? 2.7 : 2.2} /></Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.meta}>
            <Text style={[styles.domain, { color: domain.color, backgroundColor: domain.softColor }]}>{domain.label}</Text>
            <Text style={styles.difficulty}>{card.difficulty}</Text>
          </View>
          <Text style={styles.title}>{card.title}</Text>
          <View style={[styles.summaryCard, { backgroundColor: domain.softColor }]}><Text style={[styles.summaryLabel, { color: domain.color }]}>一句话</Text><Text style={styles.summary}>{card.summary}</Text></View>

          <CollapsibleSection title="核心概念" defaultOpen><Text style={styles.body}>{card.intuition}</Text></CollapsibleSection>
          <CollapsibleSection title="工作机制" defaultOpen><Text style={styles.body}>{card.answer}</Text></CollapsibleSection>
          {card.formula ? <View style={styles.formulaCard}><Text style={styles.formulaLabel}>公式与流程</Text><Text style={styles.formula}>{card.formula}</Text></View> : null}
          <CollapsibleSection title="关键结论">
            {card.keyPoints.map((point) => <IconBullet key={point} icon="check" color={colors.successDark} text={point} />)}
          </CollapsibleSection>
          {(card.misconceptions?.length ?? 0) > 0 ? (
            <CollapsibleSection title="常见误区">
              {card.misconceptions!.map((item) => <IconBullet key={item} icon="close" color="#B13C52" text={item} />)}
            </CollapsibleSection>
          ) : null}
          {(card.comparison?.length ?? 0) > 0 ? (
            <CollapsibleSection title="对比与边界">
              {card.comparison!.map((item) => <View key={item.label} style={styles.comparisonRow}><Text style={styles.comparisonLabel}>{item.label}</Text><Text style={styles.comparisonValue}>{item.value}</Text></View>)}
            </CollapsibleSection>
          ) : null}
          <CollapsibleSection title="面试追问">
            <Text style={styles.answerGuide}>先说结论，再说机制，最后补充边界条件。</Text>
            {card.followUps.map((item, index) => <Text key={item} style={styles.followUp}>{index + 1}. {item}</Text>)}
          </CollapsibleSection>

          {relatedCards.length > 0 ? (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedTitle}>相关知识</Text>
              <View style={styles.relatedRow}>{relatedCards.map((related) => <Pressable key={related.id} onPress={() => router.push({ pathname: '/knowledge/[id]', params: { id: related.id } })} style={styles.relatedChip}><Text style={styles.relatedChipText}>{related.title}</Text></Pressable>)}</View>
            </View>
          ) : null}

          <CollapsibleSection title="参考来源">
            {card.sources.map((source) => (
              <Pressable accessibilityRole="link" key={source.url} onPress={() => void Linking.openURL(source.url)} style={styles.source}>
                <View style={styles.sourceCopy}><Text style={styles.sourceKind}>{source.kind === 'paper' ? '经典论文' : '官方资料'}</Text><Text style={styles.sourceTitle}>{source.title}</Text></View><AppIcon name="external-link" size={19} color={colors.primary} />
              </Pressable>
            ))}
          </CollapsibleSection>
        </ScrollView>

        <View style={styles.actionArea}>
          <Pressable accessibilityRole="button" disabled={scheduled} onPress={() => addToReview(card.id)} style={[styles.reviewButton, scheduled && styles.scheduledButton]}>
            <View style={styles.buttonContent}>{scheduled ? <AppIcon name="check" size={18} color={colors.successDark} /> : null}<Text style={[styles.reviewButtonText, scheduled && styles.scheduledText]}>{scheduled ? '已加入复习' : '加入复习'}</Text></View>
          </Pressable>
        </View>
      </SafeAreaView>
    </ScreenShell>
  );
}

function CollapsibleSection({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.section}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text><View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}><AppIcon name="chevron-right" size={19} color={colors.primary} /></View>
      </Pressable>
      {open ? <View style={styles.sectionBody}>{children}</View> : null}
    </View>
  );
}

function IconBullet({ icon, color, text }: { icon: 'check' | 'close'; color: string; text: string }) {
  return <View style={styles.bulletRow}><AppIcon name={icon} size={16} color={color} strokeWidth={2.7} /><Text style={[styles.bulletText, { color }]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  headerTitle: { color: colors.text, fontWeight: '900' },
  content: { padding: 21, paddingBottom: 105 },
  meta: { flexDirection: 'row', gap: 8 },
  domain: { borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, fontSize: 10, fontWeight: '900' },
  difficulty: { color: colors.textMuted, backgroundColor: colors.surfaceMuted, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, fontSize: 10, fontWeight: '900' },
  title: { color: colors.text, fontSize: 27, lineHeight: 36, fontWeight: '900', marginTop: 15 },
  summaryCard: { borderRadius: 18, padding: 16, marginTop: 14 },
  summaryLabel: { fontSize: 10, fontWeight: '900' },
  summary: { color: colors.text, lineHeight: 22, fontWeight: '700', marginTop: 6 },
  section: { overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 17, marginTop: 12 },
  sectionHeader: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 16 },
  body: { color: colors.text, lineHeight: 23 },
  formulaCard: { backgroundColor: colors.primarySoft, borderRadius: 17, padding: 16, marginTop: 12 },
  formulaLabel: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  formula: { color: colors.text, textAlign: 'center', fontSize: 16, marginTop: 9 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 6 },
  bulletText: { flex: 1, lineHeight: 22, fontWeight: '700' },
  answerGuide: { color: colors.textMuted, lineHeight: 20, marginBottom: 8 },
  followUp: { color: colors.text, lineHeight: 25 },
  comparisonRow: { gap: 4, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  comparisonLabel: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  comparisonValue: { color: colors.text, lineHeight: 20 },
  relatedSection: { marginTop: 18 },
  relatedTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  relatedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
  relatedChip: { maxWidth: '100%', backgroundColor: colors.primarySoft, borderRadius: 11, paddingHorizontal: 11, paddingVertical: 9 },
  relatedChipText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
  source: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  sourceCopy: { flex: 1 },
  sourceKind: { color: colors.primary, fontSize: 9, fontWeight: '900' },
  sourceTitle: { color: colors.text, fontSize: 12, fontWeight: '800', lineHeight: 17, marginTop: 3 },
  actionArea: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 15, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  reviewButton: { minWidth: 180, minHeight: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: 15, paddingHorizontal: 18 },
  scheduledButton: { backgroundColor: colors.successSoft },
  reviewButtonText: { color: colors.surface, fontWeight: '900' },
  scheduledText: { color: colors.successDark },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
