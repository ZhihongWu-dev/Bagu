import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { knowledgeCards } from '@/data/knowledge-base';
import { colors } from '@/theme/colors';
import type { AppIconName } from '@/types/icons';

type Mode = 'general' | 'resume' | 'combined';

type InterviewQuestion = { id: string; source: '通用八股' | '简历项目'; prompt: string; answer: string };

export default function InterviewScreen() {
  const { projectProfile } = useProgress();
  const [mode, setMode] = useState<Mode | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const generalQuestions = useMemo<InterviewQuestion[]>(() => knowledgeCards.slice(0, 6).map((card) => ({ id: card.id, source: '通用八股', prompt: card.interviewQuestion ?? card.title, answer: card.answer })), []);
  const projectQuestions = useMemo<InterviewQuestion[]>(() => projectProfile ? [
    { id: 'project-overview', source: '简历项目', prompt: `请用 2 分钟介绍“${projectProfile.name}”，重点讲清你的贡献。`, answer: `建议结构：项目目标与约束 → 你负责的 ${projectProfile.role} → 核心方案 → 可量化结果。当前档案摘要：${projectProfile.summary}` },
    { id: 'project-choice', source: '简历项目', prompt: `为什么选择 ${projectProfile.stack.join('、') || '当前技术方案'}？替代方案是什么？`, answer: '从业务约束、数据规模、性能、开发成本和可维护性解释；给出至少一个被放弃方案及取舍，避免只罗列技术名词。' },
    { id: 'project-challenge', source: '简历项目', prompt: '项目中最难的问题是什么？你如何定位并验证解决方案？', answer: projectProfile.challenge ? `基于你的档案继续展开：${projectProfile.challenge}。回答时补齐现象、假设、实验、结论和复盘。` : '用“现象 → 定位假设 → 对照实验 → 解决方案 → 指标变化 → 复盘”组织答案。' },
  ] : [], [projectProfile]);

  const questions = mode === 'resume' ? projectQuestions : mode === 'combined' ? [...generalQuestions.slice(0, 3), ...projectQuestions] : generalQuestions;
  const question = questions[index];

  const chooseMode = (nextMode: Mode) => { setMode(nextMode); setIndex(0); setRevealed(false); };
  const next = () => { if (index < questions.length - 1) { setIndex((value) => value + 1); setRevealed(false); } else setMode(null); };

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}><Pressable accessibilityLabel="返回" onPress={() => mode ? setMode(null) : router.back()}><AppIcon name="chevron-left" size={26} color={colors.text} /></Pressable><Text style={styles.headerTitle}>模拟面试</Text><View style={styles.headerSpacer} /></View>
        {!mode ? (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.eyebrow}>CHOOSE YOUR SESSION</Text>
            <Text style={styles.title}>选择面试模式</Text>
            <Text style={styles.subtitle}>当前是本地结构化训练，不调用 AI。后续 Agent 会在这个入口动态追问和评价。</Text>
            <ModeCard icon="network" title="通用八股面试" description="从 Transformer、LLM、微调、损失函数、深度学习和强化学习中抽题。" badge="无需简历" color={colors.primary} softColor={colors.primarySoft} onPress={() => chooseMode('general')} />
            <ModeCard icon="resume" title="简历项目面试" description="围绕你的项目贡献、技术选型、难点和可量化结果追问。" badge={projectProfile ? '已就绪' : '需项目档案'} color={colors.successDark} softColor={colors.successSoft} disabled={!projectProfile} onPress={() => chooseMode('resume')} />
            <ModeCard icon="branch" title="综合模拟面试" description="通用基础与项目深挖交替出现，更接近真实面试节奏。" badge={projectProfile ? '已就绪' : '需项目档案'} color={colors.currentDark} softColor={colors.currentSoft} disabled={!projectProfile} onPress={() => chooseMode('combined')} />
            {!projectProfile && <Pressable onPress={() => router.push('/resume')} style={styles.resumeLink}><Text style={styles.resumeLinkText}>建立项目档案，解锁后两种模式</Text><AppIcon name="chevron-right" size={17} color={colors.primary} /></Pressable>}
          </ScrollView>
        ) : question ? (
          <View style={styles.session}>
            <View style={styles.progressRow}><Text style={styles.progressText}>{index + 1} / {questions.length}</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((index + 1) / questions.length) * 100}%` }]} /></View></View>
            <ScrollView contentContainerStyle={styles.questionContent}>
              <Text style={styles.source}>{question.source}</Text>
              <Text style={styles.question}>{question.prompt}</Text>
              <View style={styles.thinkCard}><AppIcon name="clock" size={23} color={colors.currentDark} /><View style={styles.thinkCopy}><Text style={styles.thinkTitle}>先口述，再看提示</Text><Text style={styles.thinkText}>真实面试里先给结论，再用 2–3 个关键点展开。</Text></View></View>
              {revealed && <View style={styles.answerCard}><Text style={styles.answerLabel}>参考组织方式</Text><Text style={styles.answer}>{question.answer}</Text></View>}
            </ScrollView>
            <View style={styles.actionArea}>{!revealed ? <Pressable onPress={() => setRevealed(true)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>查看回答框架</Text></Pressable> : <Pressable onPress={next} style={[styles.primaryButton, styles.nextButton]}><Text style={styles.primaryButtonText}>{index === questions.length - 1 ? '完成本次模拟' : '下一题'}</Text></Pressable>}</View>
          </View>
        ) : null}
      </SafeAreaView>
    </ScreenShell>
  );
}

function ModeCard({ icon, title, description, badge, color, softColor, disabled, onPress }: { icon: AppIconName; title: string; description: string; badge: string; color: string; softColor: string; disabled?: boolean; onPress: () => void }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.modeCard, disabled && styles.modeDisabled]}><View style={[styles.modeIcon, { backgroundColor: softColor }]}><AppIcon name={icon} size={24} color={color} /></View><View style={styles.modeCopy}><View style={styles.modeTitleRow}><Text style={styles.modeTitle}>{title}</Text><Text style={[styles.modeBadge, { color, backgroundColor: softColor }]}>{badge}</Text></View><Text style={styles.modeDescription}>{description}</Text></View><AppIcon name={disabled ? 'lock' : 'chevron-right'} size={disabled ? 18 : 22} color={color} /></Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }, headerTitle: { color: colors.text, fontWeight: '900' }, headerSpacer: { width: 20 },
  content: { padding: 21, paddingBottom: 35 }, eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, title: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 6 }, subtitle: { color: colors.textMuted, lineHeight: 20, marginTop: 7, marginBottom: 18 },
  modeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 20, padding: 14, marginBottom: 11 }, modeDisabled: { opacity: 0.58 }, modeIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, modeCopy: { flex: 1 }, modeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }, modeTitle: { color: colors.text, fontSize: 15, fontWeight: '900' }, modeBadge: { fontSize: 8, fontWeight: '900', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 4 }, modeDescription: { color: colors.textMuted, fontSize: 10, lineHeight: 16, marginTop: 6 }, resumeLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, padding: 13 }, resumeLinkText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  session: { flex: 1 }, progressRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 18 }, progressText: { color: colors.primary, fontSize: 11, fontWeight: '900' }, progressTrack: { flex: 1, height: 8, backgroundColor: colors.surfaceMuted, borderRadius: 8, overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 8 }, questionContent: { padding: 21, paddingBottom: 110 }, source: { alignSelf: 'flex-start', color: colors.primary, backgroundColor: colors.primarySoft, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 6, fontSize: 9, fontWeight: '900' }, question: { color: colors.text, fontSize: 25, lineHeight: 35, fontWeight: '900', marginTop: 16 }, thinkCard: { flexDirection: 'row', gap: 11, backgroundColor: colors.currentSoft, borderRadius: 17, padding: 14, marginTop: 22 }, thinkCopy: { flex: 1 }, thinkTitle: { color: colors.text, fontWeight: '900' }, thinkText: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 4 }, answerCard: { backgroundColor: colors.successSoft, borderWidth: 1.5, borderColor: '#BDE9DD', borderRadius: 19, padding: 17, marginTop: 14 }, answerLabel: { color: colors.successDark, fontSize: 10, fontWeight: '900' }, answer: { color: colors.text, lineHeight: 23, marginTop: 8 }, actionArea: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 18, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }, primaryButton: { alignItems: 'center', backgroundColor: colors.primary, borderBottomWidth: 5, borderBottomColor: colors.primaryDark, borderRadius: 16, padding: 15 }, nextButton: { backgroundColor: colors.success, borderBottomColor: colors.successDark }, primaryButtonText: { color: colors.surface, fontWeight: '900' },
});
