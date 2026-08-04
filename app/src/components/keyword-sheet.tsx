import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import type { KnowledgeKeyword } from '@/types/course';

type Props = {
  keyword: KnowledgeKeyword | null;
  onClose: () => void;
};

export function KeywordSheet({ keyword, onClose }: Props) {
  return (
    <Modal visible={Boolean(keyword)} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modal}>
        <Pressable accessibilityLabel="关闭关键词解释" style={styles.backdrop} onPress={onClose} />
        {keyword && (
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.tag}>核心关键词</Text>
            <Text style={styles.title}>{keyword.label}</Text>
            <Text style={styles.definition}>{keyword.definition}</Text>
            <View style={styles.intuitionCard}>
              <Text style={styles.intuitionLabel}>直觉理解</Text>
              <Text style={styles.intuition}>{keyword.intuition}</Text>
            </View>
            {keyword.formula && <Text style={styles.formula}>{keyword.formula}</Text>}
            <Pressable onPress={onClose} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
              <Text style={styles.buttonText}>知道了，回到题目</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(31, 25, 46, 0.42)' },
  sheet: {
    backgroundColor: colors.surface,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: { width: 52, height: 5, borderRadius: 6, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 18 },
  tag: { alignSelf: 'flex-start', color: colors.primary, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, fontSize: 11, fontWeight: '900' },
  title: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 13 },
  definition: { color: colors.textMuted, fontSize: 15, lineHeight: 23, marginTop: 8 },
  intuitionCard: { backgroundColor: colors.successSoft, borderRadius: 15, padding: 14, marginTop: 16 },
  intuitionLabel: { color: colors.successDark, fontSize: 11, fontWeight: '900' },
  intuition: { color: colors.text, lineHeight: 21, marginTop: 5 },
  formula: { color: colors.text, backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: 15, textAlign: 'center', fontSize: 17, marginTop: 13 },
  button: { backgroundColor: colors.primary, borderBottomWidth: 5, borderBottomColor: colors.primaryDark, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 18 },
  buttonPressed: { transform: [{ translateY: 3 }], borderBottomWidth: 2 },
  buttonText: { color: colors.surface, fontWeight: '900' },
});
