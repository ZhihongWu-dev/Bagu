'use strict';

const ids = (id) => document.getElementById(id);
const loadButton = ids('load');
const statusNode = ids('status');

const today = new Date();
const thirtyDaysAgo = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
ids('to').value = dateInput(today);
ids('from').value = dateInput(thirtyDaysAgo);

loadButton.addEventListener('click', loadSummary);

async function loadSummary() {
  const baseUrl = ids('base-url').value.trim().replace(/\/$/, '');
  const token = ids('admin-token').value;
  if (!/^https:\/\//.test(baseUrl) || token.length < 24) return setStatus('请输入 HTTPS 接口地址和有效管理员令牌。', true);
  const query = new URLSearchParams();
  if (ids('from').value) query.set('from', `${ids('from').value}T00:00:00.000Z`);
  if (ids('to').value) query.set('to', `${ids('to').value}T23:59:59.999Z`);
  if (ids('platform').value) query.set('platform', ids('platform').value);
  if (ids('app-version').value.trim()) query.set('app_version', ids('app-version').value.trim());

  loadButton.disabled = true;
  setStatus('正在读取聚合数据…');
  try {
    const response = await fetch(`${baseUrl}/v1/admin/summary?${query}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(response.status === 401 ? '管理员验证失败。' : `接口返回 ${response.status}。`);
    render(await response.json());
    setStatus('汇总数据已更新。');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '无法加载数据。', true);
  } finally {
    loadButton.disabled = false;
  }
}

function render(data) {
  ids('users').textContent = number(data.totals?.anonymous_users);
  ids('sessions').textContent = number(data.totals?.sessions);
  ids('events').textContent = number(data.totals?.events);
  ids('duration').textContent = duration(data.totals?.average_session_duration_ms);

  const funnelLabels = { app_opened: '打开应用', lesson_started: '开始课程', exercise_answered: '完成首次作答', lesson_completed: '完成课程' };
  ids('funnel').replaceChildren(...Object.entries(funnelLabels).map(([key, label]) => block(label, number(data.funnel?.[key]))));
  ids('retention').replaceChildren(...[
    row('次日回访', percent(data.retention?.day_1?.rate), `${number(data.retention?.day_1?.retained)} / ${number(data.retention?.day_1?.eligible)}`),
    row('第 7 日回访', percent(data.retention?.day_7?.rate), `${number(data.retention?.day_7?.retained)} / ${number(data.retention?.day_7?.eligible)}`),
  ]);
  renderRows('dropoff', data.dropoff, (key, value) => row(eventLabel(key), number(value)));
  renderTable('lessons', data.lessons, (id, value) => [id, value.starts, value.completions, percent(value.completion_rate)]);
  renderTable('exercises', data.exercises, (id, value) => [id, value.answers, percent(value.first_correct_rate), value.average_attempts, duration(value.average_duration_ms)]);
  renderRows('features', data.features, (key, value) => row(eventLabel(key), number(value)));
}

function renderRows(targetId, values, factory) {
  const entries = Object.entries(values ?? {}).sort((left, right) => Number(right[1]) - Number(left[1]));
  ids(targetId).replaceChildren(...(entries.length ? entries.map(([key, value]) => factory(key, value)) : [row('暂无数据', '-') ]));
}

function renderTable(targetId, values, mapper) {
  const entries = Object.entries(values ?? {});
  const body = ids(targetId);
  if (!entries.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.className = 'empty-cell';
    td.colSpan = body.parentElement.querySelectorAll('th').length;
    td.textContent = '暂无数据';
    tr.append(td);
    return body.replaceChildren(tr);
  }
  body.replaceChildren(...entries.map(([id, value]) => {
    const tr = document.createElement('tr');
    mapper(id, value).forEach((cell) => { const td = document.createElement('td'); td.textContent = String(cell); tr.append(td); });
    return tr;
  }));
}

function block(label, value) {
  const element = document.createElement('div');
  const span = document.createElement('span');
  const strong = document.createElement('strong');
  span.textContent = label;
  strong.textContent = value;
  element.append(span, strong);
  return element;
}

function row(label, value, detail) {
  const element = document.createElement('div');
  element.className = 'row';
  const span = document.createElement('span');
  const strong = document.createElement('strong');
  span.textContent = detail ? `${label} · ${detail}` : label;
  strong.textContent = value;
  element.append(span, strong);
  return element;
}

function setStatus(message, error = false) {
  statusNode.textContent = message;
  statusNode.classList.toggle('error', error);
}

function number(value) { return Number.isFinite(Number(value)) ? Number(value).toLocaleString('zh-CN') : '-'; }
function percent(value) { return Number.isFinite(Number(value)) ? `${(Number(value) * 100).toFixed(1)}%` : '-'; }
function duration(value) { const seconds = Math.round(Number(value) / 1000); return Number.isFinite(seconds) ? seconds < 60 ? `${seconds} 秒` : `${Math.floor(seconds / 60)}分 ${seconds % 60}秒` : '-'; }
function dateInput(value) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; }
function eventLabel(value) { return ({ screen_viewed: '页面浏览', lesson_started: '课程开始', lesson_completed: '课程完成', exercise_answered: '练习作答', exercise_retried: '错题复练', knowledge_opened: '知识阅读', knowledge_favorited: '知识收藏', review_added: '加入复习', review_completed: '完成复习', resume_feature_opened: '简历入口', project_feature_opened: '项目入口', sound_toggled: '音效设置' })[value] ?? value; }
