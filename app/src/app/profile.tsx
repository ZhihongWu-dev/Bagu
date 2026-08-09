import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { knowledgeCards, knowledgeDomains } from '@/data/knowledge-base';
import { transformerLessons } from '@/data/transformer-course';
import { colors } from '@/theme/colors';

export default function ProfileScreen() {
  const { completedLessonIds, xp, streak, favoriteKnowledgeIds, reviewQueue, resumeFile, projectProfile, soundEnabled, setSoundEnabled } = useProgress();

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.identity}>
            <View style={styles.avatar}><Text style={styles.avatarText}>B</Text></View>
            <View style={styles.identityCopy}>
              <Text style={styles.eyebrow}>校招算法岗学习档案</Text>
              <Text style={styles.title}>我的成长</Text>
              <Text style={styles.subtitle}>数据只保存在当前设备，云端账号尚未接入。</Text>
            </View>
          </View>

          <View style={styles.stats}>
            <Stat value={String(streak)} label="连续天数" icon="🔥" />
            <Stat value={String(xp)} label="总 XP" icon="◆" />
            <Stat value={String(favoriteKnowledgeIds.length)} label="收藏" icon="★" />
            <Stat value={String(reviewQueue.length)} label="复习项" icon="◷" />
          </View>

          <View style={styles.soundCard}>
            <View style={styles.soundIcon}><Text style={styles.soundIconText}>{soundEnabled ? '♪' : '×'}</Text></View>
            <View style={styles.soundCopy}>
              <Text style={styles.soundTitle}>学习音效</Text>
              <Text style={styles.soundText}>答对、答错与课程完成提示音 · 遵循系统静音</Text>
            </View>
            <Switch
              accessibilityLabel="学习音效开关"
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: colors.locked, true: '#B9E9DD' }}
              thumbColor={soundEnabled ? colors.success : colors.surface}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>简历与项目档案</Text>
            <Pressable onPress={() => router.push('/resume')}><Text style={styles.sectionLink}>管理 →</Text></Pressable>
          </View>
          <Pressable onPress={() => router.push('/resume')} style={styles.resumeCard}>
            <View style={styles.resumeIcon}><Text style={styles.resumeIconText}>{projectProfile ? '✓' : 'P'}</Text></View>
            <View style={styles.resumeCopy}>
              <Text style={styles.resumeStatus}>{projectProfile ? '项目档案已建立' : resumeFile ? '简历已选择，等待确认信息' : '尚未上传简历'}</Text>
              <Text style={styles.resumeTitle}>{projectProfile?.name ?? resumeFile?.name ?? '创建你的项目深挖模块'}</Text>
              <Text style={styles.resumeText}>{projectProfile ? `${projectProfile.role} · ${projectProfile.stack.join(' / ') || '待补充技术栈'}` : '不会阻塞通用八股学习，可随时稍后再做。'}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>模块掌握</Text>
            <Text style={styles.sectionMeta}>按当前本地行为估算</Text>
          </View>
          <View style={styles.masteryCard}>
            {knowledgeDomains.map((domain) => {
              const domainCards = knowledgeCards.filter((card) => card.domainId === domain.id);
              const touched = domainCards.filter((card) => favoriteKnowledgeIds.includes(card.id) || reviewQueue.some((item) => item.targetId === card.id)).length;
              const transformerBonus = domain.id === 'transformer' ? completedLessonIds.length : 0;
              const percent = Math.min(100, Math.round(((touched + transformerBonus) / (domainCards.length + (domain.id === 'transformer' ? transformerLessons.length : 0))) * 100));
              return (
                <View key={domain.id} style={styles.masteryRow}>
                  <View style={[styles.masteryIcon, { backgroundColor: domain.softColor }]}><Text style={[styles.masteryIconText, { color: domain.color }]}>{domain.icon}</Text></View>
                  <View style={styles.masteryCopy}>
                    <View style={styles.masteryLabelRow}><Text style={styles.masteryLabel}>{domain.shortLabel}</Text><Text style={styles.masteryPercent}>{percent}%</Text></View>
                    <View style={styles.track}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: domain.color }]} /></View>
                  </View>
                </View>
              );
            })}
          </View>

          <Pressable onPress={() => router.push('/interview')} style={styles.interviewCard}>
            <View><Text style={styles.interviewEyebrow}>MOCK INTERVIEW</Text><Text style={styles.interviewTitle}>开始一场模拟面试</Text><Text style={styles.interviewText}>通用、简历或综合三种模式</Text></View>
            <View style={styles.interviewArrow}><Text style={styles.interviewArrowText}>→</Text></View>
          </Pressable>
        </ScrollView>
        <BottomNav />
      </SafeAreaView>
    </ScreenShell>
  );
}

function Stat({ value, label, icon }: { value: string; label: string; icon: string }) {
  return <View style={styles.stat}><Text style={styles.statIcon}>{icon}</Text><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, content: { padding: 20, paddingBottom: 35 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 62, height: 62, borderRadius: 22, backgroundColor: colors.primary, borderBottomWidth: 6, borderBottomColor: colors.primaryDark, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.surface, fontSize: 27, fontWeight: '900' },
  identityCopy: { flex: 1 }, eyebrow: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900', marginTop: 3 }, subtitle: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 21 }, stat: { flex: 1, alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 16, paddingVertical: 12 },
  statIcon: { fontSize: 15 }, statValue: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 3 }, statLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '700', marginTop: 2 },
  soundCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 18, padding: 13, marginTop: 12 },
  soundIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  soundIconText: { color: colors.primary, fontSize: 18, fontWeight: '900' }, soundCopy: { flex: 1 }, soundTitle: { color: colors.text, fontSize: 13, fontWeight: '900' }, soundText: { color: colors.textMuted, fontSize: 9, lineHeight: 14, marginTop: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' }, sectionLink: { color: colors.primary, fontSize: 11, fontWeight: '900' }, sectionMeta: { color: colors.textMuted, fontSize: 9 },
  resumeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.successSoft, borderBottomWidth: 5, borderBottomColor: '#B8E5D9', borderRadius: 19, padding: 15 },
  resumeIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' }, resumeIconText: { color: colors.surface, fontSize: 18, fontWeight: '900' },
  resumeCopy: { flex: 1 }, resumeStatus: { color: colors.successDark, fontSize: 9, fontWeight: '900' }, resumeTitle: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 4 }, resumeText: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 4 }, chevron: { color: colors.successDark, fontSize: 28 },
  masteryCard: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 20, padding: 15, gap: 13 },
  masteryRow: { flexDirection: 'row', alignItems: 'center', gap: 11 }, masteryIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, masteryIconText: { fontSize: 13, fontWeight: '900' }, masteryCopy: { flex: 1 }, masteryLabelRow: { flexDirection: 'row', justifyContent: 'space-between' }, masteryLabel: { color: colors.text, fontSize: 11, fontWeight: '800' }, masteryPercent: { color: colors.textMuted, fontSize: 9, fontWeight: '800' }, track: { height: 7, backgroundColor: colors.surfaceMuted, borderRadius: 7, marginTop: 6, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 7 },
  interviewCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.primary, borderBottomWidth: 6, borderBottomColor: colors.primaryDark, borderRadius: 20, padding: 18, marginTop: 19 }, interviewEyebrow: { color: '#DCD5FF', fontSize: 9, fontWeight: '900' }, interviewTitle: { color: colors.surface, fontSize: 17, fontWeight: '900', marginTop: 4 }, interviewText: { color: '#E4DFFF', fontSize: 10, marginTop: 4 }, interviewArrow: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, interviewArrowText: { color: colors.primary, fontSize: 20, fontWeight: '900' },
});
