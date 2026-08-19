import { ChatSession, Message } from '../types';

export function formatSessionAsMarkdown(session: ChatSession): string {
  const dateStr = new Date(session.createdAt).toLocaleString('ko-KR');
  let md = `# [기상관측표준화 질의 히스토리] ${session.title}\n\n`;
  md += `- **질의 일시**: ${dateStr}\n`;
  md += `- **근거 문서**: 「2026 기상관측표준화 업무가이드」(156p 전권, 발간등록번호: 11-1360000-100230-14)\n`;
  md += `- **기술 지원**: 광주지방기상청 관측과 (062-720-0553)\n\n`;
  md += `---\n\n`;

  session.messages.forEach((msg, idx) => {
    if (msg.role === 'user') {
      md += `## ❓ 질문 ${idx + 1}\n\n${msg.content}\n\n`;
    } else if (msg.role === 'assistant') {
      md += `## 💡 가이드북 답변\n\n${msg.content}\n\n`;
      if (msg.sources && msg.sources.length > 0) {
        md += `> **근거 조항/페이지**: ${msg.sources.join(', ')}\n\n`;
      }
    }
  });

  md += `---\n*본 문서는 기상청 기상관측표준화 업무가이드 챗봇에서 생성된 질의 히스토리 파일입니다.*`;
  return md;
}

export function formatSessionAsText(session: ChatSession): string {
  const dateStr = new Date(session.createdAt).toLocaleString('ko-KR');
  let txt = `=================================================================\n`;
  txt += `[기상관측표준화 질의 히스토리] ${session.title}\n`;
  txt += `일시: ${dateStr}\n`;
  txt += `근거: 「2026 기상관측표준화 업무가이드」(156p 전권)\n`;
  txt += `문의: 광주지방기상청 관측과 (062-720-0553)\n`;
  txt += `=================================================================\n\n`;

  session.messages.forEach((msg) => {
    if (msg.role === 'user') {
      txt += `[사용자 질문]\n${msg.content}\n\n`;
    } else if (msg.role === 'assistant') {
      txt += `[표준화 가이드 답변]\n${msg.content}\n\n`;
      if (msg.sources && msg.sources.length > 0) {
        txt += `(근거: ${msg.sources.join(', ')})\n\n`;
      }
      txt += `-----------------------------------------------------------------\n\n`;
    }
  });

  return txt;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportSession(session: ChatSession, format: 'md' | 'txt' | 'json' = 'md') {
  const sanitizedTitle = session.title.replace(/[^a-zA-Z0-9가-힣_-]/g, '_').substring(0, 30);
  const timestamp = new Date(session.createdAt).toISOString().slice(0, 10);
  const filename = `표준화질의_${timestamp}_${sanitizedTitle}.${format}`;

  if (format === 'md') {
    const md = formatSessionAsMarkdown(session);
    downloadFile(md, filename, 'text/markdown');
  } else if (format === 'txt') {
    const txt = formatSessionAsText(session);
    downloadFile(txt, filename, 'text/plain');
  } else if (format === 'json') {
    const json = JSON.stringify(session, null, 2);
    downloadFile(json, filename, 'application/json');
  }
}

export function exportAllSessions(sessions: ChatSession[], format: 'md' | 'txt' | 'json' = 'md') {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `기상관측표준화_전체질의히스토리_${timestamp}.${format}`;

  if (format === 'md') {
    let combinedMd = `# 기상관측표준화 전체 질의 히스토리 보관 파일\n\n`;
    combinedMd += `- **추출 일시**: ${new Date().toLocaleString('ko-KR')}\n`;
    combinedMd += `- **총 질의 건수**: ${sessions.length}건\n`;
    combinedMd += `- **근거 문서**: 「2026 기상관측표준화 업무가이드」(156p 전권)\n`;
    combinedMd += `- **기술 지원**: 광주지방기상청 관측과 (062-720-0553)\n\n---\n\n`;

    sessions.forEach((s, idx) => {
      combinedMd += `\n# [세션 ${idx + 1}] ${s.title}\n\n`;
      combinedMd += formatSessionAsMarkdown(s);
      combinedMd += `\n\n=======================================================\n\n`;
    });

    downloadFile(combinedMd, filename, 'text/markdown');
  } else if (format === 'txt') {
    let combinedTxt = `기상관측표준화 전체 질의 히스토리 (${sessions.length}건)\n\n`;
    sessions.forEach((s, idx) => {
      combinedTxt += `\n[기록 ${idx + 1}] ${s.title}\n`;
      combinedTxt += formatSessionAsText(s);
      combinedTxt += `\n========================================================\n\n`;
    });
    downloadFile(combinedTxt, filename, 'text/plain');
  } else if (format === 'json') {
    const json = JSON.stringify({
      exportDate: new Date().toISOString(),
      totalSessions: sessions.length,
      basisDocument: '「2026 기상관측표준화 업무가이드」(156p)',
      sessions,
    }, null, 2);
    downloadFile(json, filename, 'application/json');
  }
}
