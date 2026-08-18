import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAnalytics } from '@/analytics/analytics-context';
import { AppIcon } from '@/components/app-icon';
import { ScreenShell } from '@/components/screen-shell';
import { useProgress } from '@/context/progress-context';
import { colors } from '@/theme/colors';
import { analyzeResume, resumeAnalysisAvailable } from '@/resume/resume-analysis';

export default function ResumeScreen() {
  const { track } = useAnalytics();
  const trackedOpen = useRef(false);
  const { resumeFile, resumeAnalysis, projectProfile, setResumeFile, saveResumeAnalysis, saveProjectProfile, addToReview, reviewQueue } = useProgress();
  const [analyzing, setAnalyzing] = useState(false);
  const [name, setName] = useState(projectProfile?.name ?? '');
  const [role, setRole] = useState(projectProfile?.role ?? '');
  const [summary, setSummary] = useState(projectProfile?.summary ?? '');
  const [stack, setStack] = useState(projectProfile?.stack.join('、') ?? '');
  const [challenge, setChallenge] = useState(projectProfile?.challenge ?? '');

  useEffect(() => {
    if (trackedOpen.current) return;
    trackedOpen.current = true;
    track('resume_feature_opened');
  }, [track]);

  const pickResume = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], multiple: false, copyToCacheDirectory: true });
    if (!result.canceled) {
      const asset = result.assets[0];
      setResumeFile({ name: asset.name, size: asset.size, selectedAt: new Date().toISOString() });
      if (!resumeAnalysisAvailable()) {
        Alert.alert('云端服务尚未配置', '文件没有上传。你仍可手动填写项目档案，公共课程不受影响。');
        return;
      }
      Alert.alert('云端解析简历', '简历将临时上传至腾讯云进行解析。原文件和临时正文会在成功或失败后删除，解析结果需由你确认并只保存在本机。', [
        { text: '取消', style: 'cancel' },
        { text: '同意并解析', onPress: () => void runAnalysis(asset) },
      ]);
    }
  };

  const runAnalysis = async (asset: DocumentPicker.DocumentPickerAsset) => {
    setAnalyzing(true);
    try {
      const result = await analyzeResume(asset);
      saveResumeAnalysis(result);
      setRole(result.responsibilities[0] ?? '');
      setStack(result.technologies.join('、'));
      setSummary([result.experienceType, result.scale].filter(Boolean).join(' · '));
      setChallenge(result.followUps[0] ?? '');
      Alert.alert('解析完成', '请检查并修改提取结果，保存项目档案后才会用于推荐。');
    } catch (error) {
      Alert.alert('解析失败', error instanceof Error ? error.message : '请稍后重试。');
    } finally {
      setAnalyzing(false);
    }
  };

  const save = () => {
    if (!name.trim() || !role.trim() || !summary.trim()) {
      Alert.alert('还差一点', '请至少填写项目名称、你的角色和项目简介。');
      return;
    }
    saveProjectProfile({ name: name.trim(), role: role.trim(), summary: summary.trim(), stack: stack.split(/[、,，]/).map((item) => item.trim()).filter(Boolean), challenge: challenge.trim() });
    if (resumeAnalysis) saveResumeAnalysis({ ...resumeAnalysis, confirmed: true });
    track('project_feature_opened');
    Alert.alert('已保存', '项目档案只保存在当前设备。');
  };

  const scheduled = reviewQueue.some((item) => item.source === 'project' && item.targetId === 'project-core');

  return (
    <ScreenShell>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}><Pressable accessibilityLabel="返回" onPress={() => router.back()}><AppIcon name="chevron-left" size={26} color={colors.text} /></Pressable><Text style={styles.headerTitle}>简历项目深挖</Text><View style={styles.headerSpacer} /></View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.notice}><AppIcon name="shield" size={22} color={colors.successDark} /><View style={styles.noticeCopy}><Text style={styles.noticeTitle}>隐私边界</Text><Text style={styles.noticeText}>简历仅临时上传用于解析，原文件与正文随后删除；你确认的结构化档案只保存在本机。</Text></View></View>

          <Text style={styles.step}>01 · 可选</Text><Text style={styles.title}>上传并解析简历</Text><Text style={styles.description}>支持 PDF 与 DOCX。云端服务未配置时不会上传，并可继续手动填写。</Text>
          {analyzing ? <View style={styles.analysisState}><ActivityIndicator color={colors.primary} /><Text style={styles.analysisText}>正在安全解析，完成后会删除云端临时文件…</Text></View> : null}
          {resumeFile ? (
            <View style={styles.fileCard}><View style={styles.pdfIcon}><AppIcon name="resume" size={22} color={colors.danger} /></View><View style={styles.fileCopy}><Text numberOfLines={1} style={styles.fileName}>{resumeFile.name}</Text><Text style={styles.fileMeta}>{resumeFile.size ? `${(resumeFile.size / 1024 / 1024).toFixed(2)} MB · ` : ''}{resumeAnalysis ? `解析置信度 ${Math.round(resumeAnalysis.confidence * 100)}%` : '尚未形成解析结果'}</Text></View>{!resumeAnalysis ? <Pressable onPress={() => void pickResume()}><Text style={styles.retry}>重选</Text></Pressable> : null}<Pressable onPress={() => { setResumeFile(null); saveResumeAnalysis(null); }}><Text style={styles.delete}>删除</Text></Pressable></View>
          ) : (
            <Pressable disabled={analyzing} onPress={() => void pickResume()} style={styles.upload}><AppIcon name="resume" size={31} color={colors.primary} /><Text style={styles.uploadTitle}>选择简历文件</Text><Text style={styles.uploadText}>PDF / DOCX · 最大 8 MB</Text></Pressable>
          )}

          <View style={styles.divider} />
          <Text style={styles.step}>02 · 立即可用</Text><Text style={styles.title}>手动建立项目档案</Text><Text style={styles.description}>填写你真正做过的内容，系统据此生成固定规则的项目追问；未来 AI 解析也会写入同一结构。</Text>
          <Field label="项目名称 *" value={name} onChangeText={setName} placeholder="例如：基于 RAG 的企业知识问答" />
          <Field label="你的角色 *" value={role} onChangeText={setRole} placeholder="例如：负责检索链路与评测" />
          <Field label="技术栈" value={stack} onChangeText={setStack} placeholder="PyTorch、LangChain、Milvus" />
          <Field label="项目简介 *" value={summary} onChangeText={setSummary} placeholder="任务、数据、方案和结果" multiline />
          <Field label="最难的问题" value={challenge} onChangeText={setChallenge} placeholder="你遇到的瓶颈、定位过程与权衡" multiline />
          <Pressable onPress={save} style={styles.saveButton}><Text style={styles.saveButtonText}>{projectProfile ? '更新项目档案' : '保存项目档案'}</Text></Pressable>

          {projectProfile && (
            <View style={styles.readyCard}><Text style={styles.readyTag}>项目模块已就绪</Text><Text style={styles.readyTitle}>{projectProfile.name}</Text><Text style={styles.readyText}>现在可以进行简历模式模拟面试，并把核心项目追问加入统一复习。</Text><View style={styles.readyActions}><Pressable onPress={() => { track('project_feature_opened'); router.push('/interview'); }} style={styles.readyPrimary}><Text style={styles.readyPrimaryText}>模拟面试</Text></Pressable><Pressable disabled={scheduled} onPress={() => { addToReview('project-core', 'project'); track('review_added', { target_id: 'project-core', review_source: 'project' }); }} style={styles.readySecondary}><Text style={styles.readySecondaryText}>{scheduled ? '已加入复习' : '加入复习'}</Text></Pressable></View></View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}

function Field({ label, multiline, ...props }: { label: string; multiline?: boolean; value: string; onChangeText: (value: string) => void; placeholder: string }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput {...props} multiline={multiline} placeholderTextColor="#A39BAF" style={[styles.input, multiline && styles.multiline]} /></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }, headerTitle: { color: colors.text, fontWeight: '900' }, headerSpacer: { width: 20 }, content: { padding: 20, paddingBottom: 40 },
  notice: { flexDirection: 'row', gap: 11, backgroundColor: colors.successSoft, borderRadius: 17, padding: 14 }, noticeCopy: { flex: 1 }, noticeTitle: { color: colors.successDark, fontSize: 11, fontWeight: '900' }, noticeText: { color: colors.textMuted, fontSize: 10, lineHeight: 16, marginTop: 3 },
  step: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginTop: 22 }, title: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 4 }, description: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 6 },
  upload: { alignItems: 'center', backgroundColor: colors.surface, borderWidth: 2, borderStyle: 'dashed', borderColor: '#CFC5F4', borderRadius: 19, padding: 22, marginTop: 14 }, uploadTitle: { color: colors.text, fontWeight: '900', marginTop: 5 }, uploadText: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  fileCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 17, padding: 13, marginTop: 14 }, pdfIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFF0F3', alignItems: 'center', justifyContent: 'center' }, fileCopy: { flex: 1 }, fileName: { color: colors.text, fontWeight: '900' }, fileMeta: { color: colors.textMuted, fontSize: 9, marginTop: 4 }, delete: { color: colors.danger, fontSize: 11, fontWeight: '900' },
  retry: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  divider: { height: 1, backgroundColor: colors.border, marginTop: 25 }, field: { marginTop: 14 }, fieldLabel: { color: colors.text, fontSize: 11, fontWeight: '900', marginBottom: 7 }, input: { minHeight: 48, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 13, color: colors.text, fontSize: 13 }, multiline: { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' },
  saveButton: { alignItems: 'center', backgroundColor: colors.primary, borderBottomWidth: 5, borderBottomColor: colors.primaryDark, borderRadius: 16, padding: 15, marginTop: 17 }, saveButtonText: { color: colors.surface, fontWeight: '900' },
  readyCard: { backgroundColor: colors.primarySoft, borderRadius: 20, padding: 17, marginTop: 18 }, readyTag: { color: colors.primary, fontSize: 9, fontWeight: '900' }, readyTitle: { color: colors.text, fontSize: 17, fontWeight: '900', marginTop: 5 }, readyText: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 6 }, readyActions: { flexDirection: 'row', gap: 8, marginTop: 13 }, readyPrimary: { flex: 1, alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, padding: 11 }, readyPrimaryText: { color: colors.surface, fontSize: 11, fontWeight: '900' }, readySecondary: { flex: 1, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, padding: 11 }, readySecondaryText: { color: colors.primaryDark, fontSize: 11, fontWeight: '900' },
  analysisState: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primarySoft, borderRadius: 8, padding: 12, marginTop: 12 },
  analysisText: { flex: 1, color: colors.primaryDark, fontSize: 11, lineHeight: 17, fontWeight: '700' },
});
