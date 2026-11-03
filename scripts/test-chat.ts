import assert from 'node:assert/strict';
import { test } from 'node:test';
import handler, { answerFromLocalIndex, extractCitedSources, findRelevantPages, parseHistory } from '../api/chat';

async function request(body: unknown, method = 'POST') {
  let status = 200;
  let data: any;
  const headers: Record<string, string> = {};
  const response = {
    setHeader(name: string, value: string) { headers[name] = value; },
    status(code: number) { status = code; return response; },
    json(value: unknown) { data = value; },
  };
  await handler({ method, body }, response);
  return { status, data, headers };
}

test('installation wording retrieves procedure and installation standards', () => {
  for (const message of ['강수량계 설치단계에 대해 알려줘', '강수량계 설치 단계에 대해 알려줘', '강수량계 신규 설치 절차를 알려줘']) {
    const pages = findRelevantPages(message).map((page) => page.page);
    assert.ok(pages.includes(30), `${message}: installation standards missing`);
    assert.ok(pages.includes(33), `${message}: procedure missing`);
  }
});

test('known installation questions return grounded answers without an API key', async () => {
  const savedKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    for (const message of ['강수량계 설치단계에 대해 알려줘', '강수량계 설치기준을 알려줘', '강수량계 수수구의 표준 설치 높이는 얼마인가요?']) {
      const result = await request({ message });
      assert.equal(result.status, 200);
      assert.equal(result.data.answerMode, 'guide-extract');
      assert.match(result.data.reply, /30cm 이상/);
      assert.match(result.data.reply, /0\.5배 이상/);
      assert.ok(result.data.sources.some((source: string) => source.endsWith('p.30')));
      assert.doesNotMatch(result.data.reply, /기상청 651/);
      if (message.includes('단계')) {
        assert.match(result.data.reply, /계획이 반영/);
        assert.match(result.data.reply, /표준지점번호 신청서/);
        assert.ok(result.data.sources.some((source: string) => source.endsWith('p.33')));
      }
    }
  } finally {
    if (savedKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = savedKey;
  }
});

test('missing evidence skips the model and returns no citations', async () => {
  const result = await request({ message: '피자 만드는 방법을 알려줘' });
  assert.equal(result.status, 200);
  assert.match(result.data.reply, /확인되지 않습니다/);
  assert.deepEqual(result.data.sources, []);
  let calls = 0;
  await answerFromLocalIndex({ models: { generateContent() { calls++; } } }, 'unknown', []);
  assert.equal(calls, 0);
});

test('a hung provider is stopped by the application deadline even if it ignores abort', async () => {
  let signal: AbortSignal | undefined;
  const ai = { models: { generateContent(options: any) {
    signal = options.config.abortSignal;
    return new Promise(() => {});
  } } };
  const started = performance.now();
  await assert.rejects(answerFromLocalIndex(ai, '풍향계', findRelevantPages('풍향계'), 30), /AI_RESPONSE_TIMEOUT/);
  assert.ok(signal?.aborted);
  assert.ok(performance.now() - started < 1000, 'provider must not hold the request indefinitely');
});

test('default mode sends matched pages plus neighbours with a 25-second limit and no retries', async () => {
  let options: any;
  const expected = { text: '가이드 근거를 바탕으로 한 답변' };
  const ai = { models: { generateContent(request: any) { options = request; return Promise.resolve(expected); } } };
  const pages = findRelevantPages('풍향풍속계 옥상 설치 높이', 10);
  const result = await answerFromLocalIndex(ai, '풍향풍속계 옥상 설치 높이', pages);
  assert.equal(result, expected);
  assert.equal(options.config.httpOptions.timeout, 25000);
  assert.equal(options.config.httpOptions.retryOptions.attempts, 1);
  assert.equal(options.config.abortSignal.aborted, false);
  assert.match(options.contents, /2026 기상관측표준화 업무가이드/);
  assert.match(options.contents, /\[p\.30\]/);
  assert.match(options.contents, /\[p\.31\]/, 'neighbour page should be included');
  const pageCount = (options.contents.match(/\[p\.\d+\]/g) || []).length;
  assert.ok(pageCount <= 30, `too many pages sent: ${pageCount}`);
  assert.match(options.contents, /질문: 풍향풍속계/);
});

test('CHAT_CONTEXT=full sends the whole guide', async () => {
  process.env.CHAT_CONTEXT = 'full';
  try {
    let options: any;
    const ai = { models: { generateContent(request: any) { options = request; return Promise.resolve({ text: 'ok' }); } } };
    await answerFromLocalIndex(ai, '풍향계', findRelevantPages('풍향계'));
    assert.match(options.config.systemInstruction, /\[p\.30\]/);
    assert.match(options.config.systemInstruction, /\[p\.150\]/);
  } finally {
    delete process.env.CHAT_CONTEXT;
  }
});

test('busy or over-quota model falls back to the next model', async () => {
  const tried: string[] = [];
  const ai = { models: { generateContent(request: any) {
    tried.push(request.model);
    if (tried.length === 1) return Promise.reject(new Error('{"error":{"code":503,"status":"UNAVAILABLE"}}'));
    return Promise.resolve({ text: '정상 답변' });
  } } };
  const result = await answerFromLocalIndex(ai, '풍향계', findRelevantPages('풍향계'));
  assert.equal(result.text, '정상 답변');
  assert.equal(tried.length, 2);
});

test('an invalid model name falls back to a working model', async () => {
  const savedModel = process.env.GEMINI_MODEL;
  process.env.GEMINI_MODEL = 'gemini-3.7-flash';
  const tried: string[] = [];
  const ai = { models: { generateContent(request: any) {
    tried.push(request.model);
    if (request.model === 'gemini-3.7-flash') return Promise.reject(new Error('404 NOT_FOUND: models/gemini-3.7-flash is not found'));
    return Promise.resolve({ text: '정상 답변' });
  } } };
  try {
    const result = await answerFromLocalIndex(ai, '풍향계', findRelevantPages('풍향계'));
    assert.equal(result.text, '정상 답변');
    assert.deepEqual(tried, ['gemini-3.7-flash', 'gemini-3.6-flash']);
  } finally {
    if (savedModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = savedModel;
  }
});

test('cited page line becomes the source list and is removed from the reply', () => {
  const { reply, pages } = extractCitedSources('질문에 답변드립니다.\n\n본문\n\n근거: p.30, p.33, p.999');
  assert.deepEqual(pages, [30, 33]);
  assert.doesNotMatch(reply, /근거/);
});

test('conversation history drops the welcome message and the current question', () => {
  const history = parseHistory([
    { id: 'welcome-1', role: 'assistant', content: '안녕하세요' },
    { id: 'a', role: 'user', content: '강수량계 설치 높이는?' },
    { id: 'b', role: 'assistant', content: '30cm 이상입니다.' },
    { id: 'c', role: 'user', content: '그럼 옥상은?' },
  ], '그럼 옥상은?');
  assert.deepEqual(history.map((turn) => turn.content), ['강수량계 설치 높이는?', '30cm 이상입니다.']);
});

test('provider failures propagate immediately without waiting for the deadline', async () => {
  const error = new Error('simulated quota error');
  const ai = { models: { generateContent() { return Promise.reject(error); } } };
  await assert.rejects(answerFromLocalIndex(ai, '검정', findRelevantPages('검정')), (actual: unknown) => actual === error);
});

test('empty model output is treated as generation failure, not missing document evidence', async () => {
  const ai = { models: { generateContent() { return Promise.resolve({ text: '  ' }); } } };
  assert.equal(await answerFromLocalIndex(ai, '검정', findRelevantPages('검정')), undefined);
});

test('input validation remains intact', async () => {
  assert.equal((await request({ message: '' })).status, 400);
  assert.equal((await request({ message: '가'.repeat(2001) })).status, 413);
  assert.equal((await request({}, 'DELETE')).status, 405);
});
