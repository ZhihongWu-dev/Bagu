import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAnalytics } from '@/analytics/analytics-context';
import { AppIcon } from '@/components/app-icon';
import { useProgress } from '@/context/progress-context';
import { colors } from '@/theme/colors';

export function AnalyticsConsentGate() {
  const { consent, ready, grant, deny } = useAnalytics();
  const { targetRole } = useProgress();
  const [showDetails, setShowDetails] = useState(false);

  if (!targetRole || !ready || consent !== 'unknown') return null;

  return (
    <>
      <Modal animationType="fade" transparent visible onRequestClose={() => undefined}>
        <View style={styles.overlay}>
          <View style={styles.dialog} accessibilityViewIsModal>
            <View style={styles.icon}><AppIcon name="shield" size={29} color={colors.primary} /></View>
            <Text style={styles.title}>帮助改进 Bagu</Text>
            <Text style={styles.description}>允许发送不含身份信息的使用事件，帮助我们发现课程中难懂或容易退出的位置。</Text>
            <View style={styles.boundary}>
              <Text style={styles.boundaryText}>不会上传简历、项目内容、题目正文、答案内容或设备永久标识。</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => setShowDetails(true)} hitSlop={8}>
              <Text style={styles.detailLink}>查看数据说明</Text>
            </Pressable>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={() => void grant()} style={({ pressed }) => [styles.action, styles.primaryAction, pressed && styles.pressed]}>
                <Text style={styles.primaryText}>同意匿名体验分析</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => void deny()} style={({ pressed }) => [styles.action, styles.offlineAction, pressed && styles.pressed]}>
                <Text style={styles.offlineText}>仅离线使用</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <AnalyticsDataDetails visible={showDetails} onClose={() => setShowDetails(false)} />
    </>
  );
}

export function AnalyticsDataDetails({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>匿名体验分析说明</Text>
            <Pressable accessibilityLabel="关闭数据说明" onPress={onClose} hitSlop={10}><AppIcon name="close" size={23} color={colors.textMuted} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetContent}>
            <InfoSection title="会记录什么" text="页面进入、课程开始与完成、练习是否答对、作答次数和耗时，以及收藏、复习与设置变化。" />
            <InfoSection title="不会记录什么" text="姓名、手机号、邮箱、设备永久标识、精确位置、简历文件与正文、项目描述、自由输入文字、题目或答案正文。" />
            <InfoSection title="如何保存" text="事件先保存在本机，联网后批量发送至中国大陆 CloudBase 环境。原始事件最长保留 90 天。" />
            <InfoSection title="你的选择" text="拒绝不会影响任何学习功能。你可以随时在“我的”页面重新开启或撤回；撤回会清空本机队列并请求删除当前匿名身份的数据。" />
            <Text style={styles.ageText}>首版面向 16 岁以上用户，14 岁以下儿童不属于目标用户。</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function InfoSection({ title, text }: { title: string; text: string }) {
  return <View style={styles.infoSection}><Text style={styles.infoTitle}>{title}</Text><Text style={styles.infoText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22, backgroundColor: 'rgba(32, 27, 50, 0.52)' },
  dialog: { width: '100%', maxWidth: 390, backgroundColor: colors.surface, borderRadius: 8, padding: 22 },
  icon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: colors.primarySoft },
  title: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 16 },
  description: { color: colors.text, fontSize: 14, lineHeight: 22, marginTop: 9 },
  boundary: { backgroundColor: colors.successSoft, borderRadius: 8, padding: 12, marginTop: 14 },
  boundaryText: { color: colors.successDark, fontSize: 11, lineHeight: 17, fontWeight: '700' },
  detailLink: { color: colors.primary, fontSize: 12, fontWeight: '900', marginTop: 14 },
  actions: { gap: 10, marginTop: 20 },
  action: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 8, paddingHorizontal: 14 },
  primaryAction: { backgroundColor: colors.primary },
  offlineAction: { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border },
  primaryText: { color: colors.surface, fontWeight: '900' },
  offlineText: { color: colors.text, fontWeight: '900' },
  pressed: { opacity: 0.78 },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(32, 27, 50, 0.45)' },
  sheet: { maxHeight: '82%', backgroundColor: colors.surface, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  sheetHeader: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  sheetTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  sheetContent: { padding: 20, paddingBottom: 36 },
  infoSection: { marginBottom: 18 },
  infoTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  infoText: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginTop: 6 },
  ageText: { color: colors.textMuted, fontSize: 11, lineHeight: 18, paddingTop: 4, borderTopWidth: 1, borderTopColor: colors.border },
});
