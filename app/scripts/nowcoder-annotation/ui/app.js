(function runAnnotationApp() {
  'use strict';

  const stateTools = window.AnnotationState;
  const state = { candidates: [], annotations: {}, taxonomy: null, currentSourceId: null, dirty: false };
  const byId = (id) => document.getElementById(id);

  function setStatus(message, error = false) {
    const element = byId('status-message');
    element.textContent = message;
    element.classList.toggle('error', error);
  }

  function optionMarkup(containerId, values, labels, inputType = 'checkbox', name = containerId) {
    const container = byId(containerId);
    container.replaceChildren();
    for (const value of values) {
      const label = document.createElement('label');
      label.className = 'option-label';
      const input = document.createElement('input');
      input.type = inputType;
      input.name = name;
      input.value = value;
      const text = document.createElement('span');
      text.textContent = labels[value];
      label.append(input, text);
      container.append(label);
    }
  }

  function selectOptions(selectId, values, labels) {
    const select = byId(selectId);
    for (const value of values) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = labels[value];
      select.append(option);
    }
  }

  function initializeTaxonomy() {
    const taxonomy = state.taxonomy;
    optionMarkup('relevance-options', taxonomy.relevances, taxonomy.labels.relevance, 'radio', 'relevance');
    optionMarkup('topic-options', taxonomy.topicIds, taxonomy.labels.topic);
    optionMarkup('followup-options', taxonomy.followUpTypes, taxonomy.labels.followUp);
    optionMarkup('misconception-options', taxonomy.misconceptionTypes, taxonomy.labels.misconception);
    optionMarkup('cognitive-options', taxonomy.cognitiveLevels, taxonomy.labels.cognitiveLevel, 'radio', 'cognitiveLevel');
    optionMarkup('distractor-options', taxonomy.distractorTypes, taxonomy.labels.distractor);
    optionMarkup('cue-options', taxonomy.answerCueTypes, taxonomy.labels.answerCue);
    selectOptions('role-select', taxonomy.roles.filter((value) => value !== 'unknown'), taxonomy.labels.role);
    selectOptions('stage-select', taxonomy.recruitingStages, taxonomy.labels.recruitingStage);
    selectOptions('skip-reason', taxonomy.skipReasons, taxonomy.labels.skipReason);
  }

  function checkedValues(containerId) {
    return [...byId(containerId).querySelectorAll('input:checked')].map((input) => input.value);
  }

  function setChecked(containerId, values) {
    const selected = new Set(values ?? []);
    for (const input of byId(containerId).querySelectorAll('input')) input.checked = selected.has(input.value);
  }

  function selectedRadio(containerId) {
    return byId(containerId).querySelector('input:checked')?.value;
  }

  function renderMetrics() {
    const progress = stateTools.progress(state.candidates, state.annotations);
    for (const key of ['completed', 'pending', 'skipped', 'total']) byId(`metric-${key}`).textContent = String(progress[key]);
  }

  function renderSourceList() {
    const filter = byId('status-filter').value;
    const list = byId('source-list');
    list.replaceChildren();
    for (const candidate of stateTools.filteredCandidates(state.candidates, state.annotations, filter)) {
      const status = stateTools.statusFor(candidate.sourceId, state.annotations);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `source-item${candidate.sourceId === state.currentSourceId ? ' active' : ''}`;
      button.dataset.sourceId = candidate.sourceId;
      const title = document.createElement('strong');
      title.textContent = `${candidate.sourceId} · ${candidate.discoveryQuery}`;
      const detail = document.createElement('span');
      detail.className = `status-${status}`;
      detail.textContent = `${candidate.pageType === 'interview' ? '面经' : '选择题'} · ${status === 'pending' ? '待处理' : status === 'completed' ? '已完成' : '已跳过'}`;
      button.append(title, detail);
      button.addEventListener('click', () => selectSource(candidate.sourceId));
      list.append(button);
    }
  }

  function updateFieldVisibility() {
    const candidate = state.candidates.find((item) => item.sourceId === state.currentSourceId);
    const relevant = selectedRadio('relevance-options') === 'relevant';
    byId('signal-fields').hidden = !relevant;
    byId('choice-fields').hidden = !(relevant && candidate?.pageType === 'multiple-choice');
  }

  function resetForm(candidate) {
    byId('annotation-form').reset();
    const annotation = state.annotations[candidate.sourceId];
    if (annotation?.relevance) setChecked('relevance-options', [annotation.relevance]);
    byId('role-select').value = annotation?.role ?? '';
    byId('stage-select').value = annotation?.recruitingStage ?? '';
    setChecked('topic-options', annotation?.topicIds);
    setChecked('followup-options', annotation?.followUpTypes);
    setChecked('misconception-options', annotation?.misconceptionTypes);
    if (annotation?.choiceSignals?.cognitiveLevel) setChecked('cognitive-options', [annotation.choiceSignals.cognitiveLevel]);
    setChecked('distractor-options', annotation?.choiceSignals?.distractorTypes);
    setChecked('cue-options', annotation?.choiceSignals?.answerCueTypes);
    byId('summary-input').value = annotation?.summary ?? '';
    byId('skip-reason').value = annotation?.skipReason ?? '';
    byId('skip-note').value = annotation?.skipNote ?? '';
    byId('summary-count').textContent = `${Array.from(byId('summary-input').value).length}/100`;
    state.dirty = false;
    updateFieldVisibility();
  }

  function selectSource(sourceId, force = false) {
    if (!force && state.dirty && !window.confirm('当前修改尚未保存，确定切换来源吗？')) return;
    const candidate = state.candidates.find((item) => item.sourceId === sourceId);
    if (!candidate) return;
    state.currentSourceId = sourceId;
    byId('source-meta').textContent = `${candidate.sourceId} · ${candidate.pageType === 'interview' ? '面经' : '选择题'} · 自动采集状态 ${candidate.approvalStatus}`;
    byId('source-query').textContent = candidate.discoveryQuery;
    byId('source-note').hidden = !candidate.reviewNote;
    byId('source-note').textContent = candidate.reviewNote ?? '';
    byId('open-source').href = candidate.url;
    resetForm(candidate);
    renderSourceList();
    setStatus('');
  }

  function buildCompletedPayload() {
    const candidate = state.candidates.find((item) => item.sourceId === state.currentSourceId);
    const relevance = selectedRadio('relevance-options');
    if (!relevance) throw new Error('请选择相关性');
    const payload = { sourceId: candidate.sourceId, status: 'completed', relevance, updatedAt: new Date().toISOString() };
    const summary = byId('summary-input').value.trim();
    if (summary) payload.summary = summary;
    if (relevance !== 'relevant') return payload;
    payload.role = byId('role-select').value;
    payload.recruitingStage = byId('stage-select').value;
    payload.topicIds = checkedValues('topic-options');
    payload.followUpTypes = checkedValues('followup-options');
    payload.misconceptionTypes = checkedValues('misconception-options');
    if (candidate.pageType === 'multiple-choice') {
      payload.choiceSignals = {
        cognitiveLevel: selectedRadio('cognitive-options'),
        distractorTypes: checkedValues('distractor-options'),
        answerCueTypes: checkedValues('cue-options'),
      };
    }
    return payload;
  }

  async function savePayload(payload) {
    const response = await fetch(`/api/annotations/${encodeURIComponent(payload.sourceId)}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? '保存失败');
    state.annotations[payload.sourceId] = result.annotation;
    state.dirty = false;
    renderMetrics();
    renderSourceList();
    return result;
  }

  async function submitCompleted(event) {
    event.preventDefault();
    const button = byId('save-button');
    button.disabled = true;
    try {
      const payload = buildCompletedPayload();
      await savePayload(payload);
      const next = stateTools.nextPending(state.candidates, state.annotations, payload.sourceId);
      if (next) selectSource(next, true);
      setStatus(next ? '已保存，已进入下一条待处理来源。' : '已保存，当前没有待处理来源。');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '保存失败', true);
    } finally {
      button.disabled = false;
    }
  }

  async function skipSource() {
    const skipReason = byId('skip-reason').value;
    if (!skipReason) { setStatus('请先选择跳过原因。', true); return; }
    const sourceId = state.currentSourceId;
    const button = byId('skip-button');
    button.disabled = true;
    try {
      const skipNote = byId('skip-note').value.trim();
      await savePayload({ sourceId, status: 'skipped', skipReason, ...(skipNote ? { skipNote } : {}), updatedAt: new Date().toISOString() });
      const next = stateTools.nextPending(state.candidates, state.annotations, sourceId);
      if (next) selectSource(next, true);
      setStatus(next ? '已跳过，已进入下一条待处理来源。' : '已跳过，当前没有待处理来源。');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '跳过失败', true);
    } finally {
      button.disabled = false;
    }
  }

  async function exportResults() {
    const button = byId('export-button');
    button.disabled = true;
    try {
      const response = await fetch('/api/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? '导出失败');
      setStatus(`已导出到 ${result.directory}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '导出失败', true);
    } finally {
      button.disabled = false;
    }
  }

  async function generateSubmission() {
    const button = byId('submission-button');
    button.disabled = true;
    try {
      const response = await fetch('/api/submission', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const result = await response.json();
      if (!response.ok) {
        if (result.error === 'submission_incomplete') {
          const progress = stateTools.progress(state.candidates, state.annotations);
          throw new Error(`请先处理全部来源，当前还有 ${progress.pending} 条待处理。`);
        }
        throw new Error(result.error ?? '生成提交文件失败');
      }
      setStatus(`已生成 ${result.path}\n先运行：${result.validationCommand}\n然后在仓库根目录运行：\n${result.gitCommands.join('\n')}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '生成提交文件失败', true);
    } finally {
      button.disabled = false;
    }
  }

  async function bootstrap() {
    try {
      const response = await fetch('/api/bootstrap');
      if (!response.ok) throw new Error('无法载入标注数据');
      const result = await response.json();
      state.candidates = result.candidates;
      state.annotations = result.annotations;
      state.taxonomy = result.taxonomy;
      initializeTaxonomy();
      renderMetrics();
      const first = result.progress.nextSourceId ?? state.candidates[0]?.sourceId;
      if (first) selectSource(first, true);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '启动失败', true);
    }
  }

  byId('annotation-form').addEventListener('submit', submitCompleted);
  byId('skip-button').addEventListener('click', skipSource);
  byId('export-button').addEventListener('click', exportResults);
  byId('submission-button').addEventListener('click', generateSubmission);
  byId('status-filter').addEventListener('change', renderSourceList);
  byId('annotation-form').addEventListener('input', (event) => {
    state.dirty = true;
    if (event.target.name === 'relevance') updateFieldVisibility();
    if (event.target.id === 'summary-input') byId('summary-count').textContent = `${Array.from(event.target.value).length}/100`;
  });
  window.addEventListener('beforeunload', (event) => { if (state.dirty) event.preventDefault(); });
  bootstrap();
})();
