import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAnalytics } from '@/analytics/analytics-context';
import { AlignedSwitch } from '@/components/aligned-switch';
import { AnalyticsDataDetails } from '@/components/analytics-consent';
import { AppIcon } from '@/components/app-icon';
import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { knowledgeCards, knowledgeDomains } from '@/data/knowledge-base';
import { questionReviewEnabled } from '@/question-review/config';
import { roleById, roleCatalog } from '@/data/role-catalog';
import { transformerNodes } from '@/data/transformer-course';
import { colors } from '@/theme/colors';
import type { AppIconName } from '@/types/icons';

export default function ProfileScreen() {
  const { consent, ready: analyticsReady, grant, deny, track } = useAnalytics();
  const [showAnalyticsDetails, setShowAnalyticsDetails] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
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
    targetRole,
    setTargetRole,
  } = useProgress();

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>我的</Text>
            <View accessibilityLabel="Bagu 用户头像" style={styles.avatar}><AppIcon name="user" size={23} color={colors.surface} /></View>
          </View>

          <View style={styles.stats}>
            <Stat accessibilityLabel={`连续学习 ${streak} 天`} value={String(streak)} icon="flame" color={colors.flame} />
            <Stat accessibilityLabel={`${xp} 经验值`} value={String(xp)} badge="XP" color={colors.primary} />
            <Stat accessibilityLabel={`${favoriteKnowledgeIds.length} 个收藏`} value={String(favoriteKnowledgeIds.length)} icon="star" color={colors.currentDark} />
          </View>

          {targetRole ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`当前目标岗位：${roleById[targetRole].title}，点击切换`}
              onPress={() => setShowRoleMenu(true)}
              style={({ pressed }) => [styles.roleCard, { backgroundColor: roleById[targetRole].softColor }, pressed && styles.pressed]}>
              <View style={[styles.roleIcon, { backgroundColor: roleById[targetRole].color }]}>
                <AppIcon name={roleById[targetRole].icon} size={21} color={colors.surface} />
              </View>
              <View style={styles.roleCopy}>
                <Text style={styles.roleLabel}>当前目标岗位</Text>
                <Text style={styles.roleTitle}>{roleById[targetRole].title}</Text>
              </View>
              <AppIcon name="chevron-right" size={22} color={roleById[targetRole].darkColor} />
            </Pressable>
          ) : null}

          <View style={styles.soundCard}>
            <View style={styles.soundIcon}><AppIcon name="volume" size={21} color={colors.primary} /></View>
            <Text style={styles.soundTitle}>音效</Text>
            <AlignedSwitch
              accessibilityLabel="学习音效开关"
              value={soundEnabled}
              onValueChange={(enabled) => { setSoundEnabled(enabled); track('sound_toggled', { enabled }); }}
            />
          </View>

          <View style={styles.analyticsCard}>
            <View style={styles.analyticsIcon}><AppIcon name="shield" size={21} color={colors.successDark} /></View>
            <Pressable accessibilityRole="button" onPress={() => setShowAnalyticsDetails(true)} style={styles.analyticsCopy}>
              <Text style={styles.analyticsTitle}>匿名体验分析</Text>
              <Text style={styles.analyticsMeta}>{consent === 'granted' ? '已开启 · 查看数据说明' : '已关闭 · 仅离线使用'}</Text>
            </Pressable>
            <AlignedSwitch
              accessibilityLabel="匿名体验分析开关"
              disabled={!analyticsReady}
              value={consent === 'granted'}
              onValueChange={(enabled) => void (enabled ? grant() : deny())}
            />
          </View>

          {questionReviewEnabled ? (
            <Pressable accessibilityRole="button" onPress={() => router.push('/question-review' as Href)} style={({ pressed }) => [styles.reviewTool, pressed && styles.pressed]}>
              <View style={styles.reviewToolIcon}><AppIcon name="check" size={21} color={colors.surface} /></View>
              <View style={styles.reviewToolCopy}>
                <Text style={styles.reviewToolTitle}>题库人工标注</Text>
                <Text style={styles.reviewToolMeta}>仅开发环境 · 本地保存</Text>
              </View>
              <AppIcon name="chevron-right" size={22} color={colors.primary} />
            </Pressable>
          ) : null}

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
            <View style={styles.resumeIcon}><AppIcon name={projectProfile ? 'check' : 'resume'} size={23} color={colors.surface} /></View>
            <View style={styles.resumeCopy}>
              <Text numberOfLines={1} style={styles.resumeTitle}>{projectProfile?.name ?? resumeFile?.name ?? '建立项目档案'}</Text>
              <Text numberOfLines={1} style={styles.resumeMeta}>{projectProfile?.role ?? (resumeFile ? '简历已选择' : '可稍后添加')}</Text>
            </View>
            <AppIcon name="chevron-right" size={22} color={colors.successDark} />
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>掌握度</Text>
          </View>
          <View style={styles.masteryCard}>
            {knowledgeDomains.map((domain) => {
              const domainCards = knowledgeCards.filter((card) => card.domainId === domain.id);
              const touched = domainCards.filter((card) => favoriteKnowledgeIds.includes(card.id) || reviewQueue.some((item) => item.targetId === card.id)).length;
              const transformerBonus = domain.id === 'transformer' ? transformerNodes.filter((node) => completedLessonIds.includes(node.id)).length : 0;
              const total = domainCards.length + (domain.id === 'transformer' ? transformerNodes.length : 0);
              const percent = Math.min(100, Math.round(((touched + transformerBonus) / total) * 100));

              return (
                <View key={domain.id} accessibilityLabel={`${domain.shortLabel} 掌握度 ${percent}%`} style={styles.masteryRow}>
                  <View style={[styles.masteryIcon, { backgroundColor: domain.softColor }]}>
                    <AppIcon name={domain.icon} size={19} color={domain.color} />
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
        <AnalyticsDataDetails visible={showAnalyticsDetails} onClose={() => setShowAnalyticsDetails(false)} />
        <Modal animationType="fade" transparent visible={showRoleMenu} onRequestClose={() => setShowRoleMenu(false)}>
          <Pressable style={styles.roleOverlay} onPress={() => setShowRoleMenu(false)}>
            <View style={styles.roleMenu} accessibilityViewIsModal>
              <Text style={styles.roleMenuTitle}>切换目标岗位</Text>
              {roleCatalog.map((role) => {
                const selected = role.id === targetRole;
                return (
                  <Pressable
                    key={role.id}
                    accessibilityRole="button"
                    onPress={() => { setTargetRole(role.id); setShowRoleMenu(false); }}
                    style={[styles.roleOption, selected && { backgroundColor: role.softColor, borderColor: role.color }]}>
                    <AppIcon name={role.icon} size={22} color={role.color} />
                    <View style={styles.roleOptionCopy}>
                      <Text style={styles.roleOptionTitle}>{role.title}</Text>
                      <Text style={styles.roleOptionMeta}>{role.description}</Text>
                    </View>
                    {selected ? <AppIcon name="check" size={21} color={role.color} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </ScreenShell>
  );
}

function Stat({ accessibilityLabel, value, icon, badge, color }: { accessibilityLabel: string; value: string; icon?: AppIconName; badge?: string; color: string }) {
  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.stat}>
      {icon ? <AppIcon name={icon} size={19} color={color} /> : <Text style={[styles.statBadge, { color }]}>{badge}</Text>}
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
  stats: { flexDirection: 'row', gap: 9, marginTop: 16 },
  roleCard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 8, paddingHorizontal: 13, marginTop: 12 },
  roleIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  roleCopy: { flex: 1 },
  roleLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '800' },
  roleTitle: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 4 },
  stat: { minHeight: 58, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 17 },
  statValue: { color: colors.text, fontSize: 17, fontWeight: '900', fontVariant: ['tabular-nums'] },
  statBadge: { fontSize: 11, fontWeight: '900' },
  soundCard: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 13, marginTop: 12 },
  soundIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft, borderRadius: 13 },
  soundTitle: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '900' },
  analyticsCard: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 13, marginTop: 12 },
  analyticsIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successSoft, borderRadius: 8 },
  analyticsCopy: { flex: 1, paddingVertical: 10 },
  analyticsTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  analyticsMeta: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  reviewTool: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 8, paddingHorizontal: 13, marginTop: 12, backgroundColor: colors.primarySoft },
  reviewToolIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.primary },
  reviewToolCopy: { flex: 1 },
  reviewToolTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  reviewToolMeta: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  sectionLink: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  resumeCard: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.successSoft, borderBottomWidth: 5, borderBottomColor: '#B8E5D9', borderRadius: 19, padding: 14 },
  resumeIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success, borderRadius: 14 },
  resumeCopy: { flex: 1 },
  resumeTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  resumeMeta: { color: colors.textMuted, fontSize: 10, marginTop: 5 },
  masteryCard: { gap: 13, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 20, padding: 15 },
  masteryRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  masteryIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  masteryCopy: { flex: 1 },
  masteryLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  masteryLabel: { color: colors.text, fontSize: 11, fontWeight: '800' },
  masteryPercent: { color: colors.textMuted, fontSize: 9, fontWeight: '800', fontVariant: ['tabular-nums'] },
  track: { height: 7, overflow: 'hidden', backgroundColor: colors.surfaceMuted, borderRadius: 7, marginTop: 6, pointerEvents: 'none' },
  fill: { height: '100%', borderRadius: 7 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  roleOverlay: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: 'rgba(32, 27, 50, 0.48)' },
  roleMenu: { width: '100%', maxWidth: 390, alignSelf: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 8, padding: 18 },
  roleMenuTitle: { color: colors.text, fontSize: 19, fontWeight: '900', marginBottom: 4 },
  roleOption: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: colors.border, borderRadius: 8, padding: 13 },
  roleOptionCopy: { flex: 1 },
  roleOptionTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  roleOptionMeta: { color: colors.textMuted, fontSize: 10, lineHeight: 16, marginTop: 4 },
});
