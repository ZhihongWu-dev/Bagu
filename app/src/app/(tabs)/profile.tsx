import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlignedSwitch } from '@/components/aligned-switch';
import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { knowledgeCards, knowledgeDomains } from '@/data/knowledge-base';
import { transformerNodes } from '@/data/transformer-course';
import { colors } from '@/theme/colors';

export default function ProfileScreen() {
  const {
    completedLessonIds,
    xp,
    streak,
    favoriteKnowledgeIds,
    reviewQueue,
    resumeFile,
    projectProfile,
    soundEnabled,
    setSoundEnabled,
  } = useProgress();

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>我的</Text>
            <View accessibilityLabel="Bagu 用户头像" style={styles.avatar}><Text style={styles.avatarText}>B</Text></View>
          </View>

          <View style={styles.stats}>
            <Stat accessibilityLabel={`连续学习 ${streak} 天`} value={String(streak)} icon="🔥" />
            <Stat accessibilityLabel={`${xp} 经验值`} value={String(xp)} icon="◆" />
            <Stat accessibilityLabel={`${favoriteKnowledgeIds.length} 个收藏`} value={String(favoriteKnowledgeIds.length)} icon="★" />
          </View>

          <View style={styles.soundCard}>
            <View style={styles.soundIcon}><Text style={styles.soundIconText}>♪</Text></View>
            <Text style={styles.soundTitle}>音效</Text>
            <AlignedSwitch
              accessibilityLabel="学习音效开关"
              value={soundEnabled}
              onValueChange={setSoundEnabled}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>项目</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push('/resume')} hitSlop={10}>
              <Text style={styles.sectionLink}>管理</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="打开简历项目档案"
            onPress={() => router.push('/resume')}
            style={({ pressed }) => [styles.resumeCard, pressed && styles.pressed]}>
            <View style={styles.resumeIcon}><Text style={styles.resumeIconText}>{projectProfile ? '✓' : 'P'}</Text></View>
            <View style={styles.resumeCopy}>
              <Text numberOfLines={1} style={styles.resumeTitle}>{projectProfile?.name ?? resumeFile?.name ?? '建立项目档案'}</Text>
              <Text numberOfLines={1} style={styles.resumeMeta}>{projectProfile?.role ?? (resumeFile ? '简历已选择' : '可稍后添加')}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>掌握度</Text>
          </View>
          <View style={styles.masteryCard}>
            {knowledgeDomains.map((domain) => {
              const domainCards = knowledgeCards.filter((card) => card.domainId === domain.id);
              const touched = domainCards.filter((card) => favoriteKnowledgeIds.includes(card.id) || reviewQueue.some((item) => item.targetId === card.id)).length;
              const transformerBonus = domain.id === 'transformer' ? completedLessonIds.length : 0;
              const total = domainCards.length + (domain.id === 'transformer' ? transformerNodes.length : 0);
              const percent = Math.min(100, Math.round(((touched + transformerBonus) / total) * 100));

              return (
                <View key={domain.id} accessibilityLabel={`${domain.shortLabel} 掌握度 ${percent}%`} style={styles.masteryRow}>
                  <View style={[styles.masteryIcon, { backgroundColor: domain.softColor }]}>
                    <Text style={[styles.masteryIconText, { color: domain.color }]}>{domain.icon}</Text>
                  </View>
                  <View style={styles.masteryCopy}>
                    <View style={styles.masteryLabelRow}>
                      <Text style={styles.masteryLabel}>{domain.shortLabel}</Text>
                      <Text style={styles.masteryPercent}>{percent}%</Text>
                    </View>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: domain.color }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

function Stat({ accessibilityLabel, value, icon }: { accessibilityLabel: string; value: string; icon: string }) {
  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.stat}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: 20, paddingBottom: 35 },
  header: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 29, fontWeight: '900' },
  avatar: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderBottomWidth: 5, borderBottomColor: colors.primaryDark, borderRadius: 16 },
  avatarText: { color: colors.surface, fontSize: 20, fontWeight: '900' },
  stats: { flexDirection: 'row', gap: 9, marginTop: 16 },
  stat: { minHeight: 58, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 17 },
  statIcon: { fontSize: 17 },
  statValue: { color: colors.text, fontSize: 17, fontWeight: '900', fontVariant: ['tabular-nums'] },
  soundCard: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 13, marginTop: 12 },
  soundIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, borderRadius: 13 },
  soundIconText: { color: colors.primary, fontSize: 18, lineHeight: 20, fontWeight: '900', textAlign: 'center' },
  soundTitle: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  sectionLink: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  resumeCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.successSoft, borderBottomWidth: 5, borderBottomColor: '#B8E5D9', borderRadius: 19, padding: 14 },
  resumeIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success, borderRadius: 14 },
  resumeIconText: { color: colors.surface, fontSize: 18, fontWeight: '900' },
  resumeCopy: { flex: 1 },
  resumeTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  resumeMeta: { color: colors.textMuted, fontSize: 10, marginTop: 5 },
  chevron: { color: colors.successDark, fontSize: 28 },
  masteryCard: { gap: 13, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 20, padding: 15 },
  masteryRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  masteryIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  masteryIconText: { fontSize: 13, fontWeight: '900' },
  masteryCopy: { flex: 1 },
  masteryLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  masteryLabel: { color: colors.text, fontSize: 11, fontWeight: '800' },
  masteryPercent: { color: colors.textMuted, fontSize: 9, fontWeight: '800', fontVariant: ['tabular-nums'] },
  track: { height: 7, overflow: 'hidden', backgroundColor: colors.surfaceMuted, borderRadius: 7, marginTop: 6, pointerEvents: 'none' },
  fill: { height: '100%', borderRadius: 7 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
