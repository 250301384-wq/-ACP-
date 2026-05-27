import fs from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';
import mammoth from 'mammoth';

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, 'source');
const outputDir = path.join(rootDir, 'public');
const directDocxPath = path.join(sourceDir, 'ACP大数据工程师.docx');
const splitZipPath = path.join(sourceDir, 'ACP大数据工程师_备考拆分Word包.zip');
const version = '2026-05-27';
const expectedSplitQuestionCount = 831;
const splitSourceLabels = [
  'ACP大数据工程师_02_MaxCompute_ODPS专项.docx',
  'ACP大数据工程师_03_DataWorks_DataIDE_DataX专项.docx',
  'ACP大数据工程师_04_AnalyticDB_ADS_QuickBI专项.docx',
  'ACP大数据工程师_05_RDS_DRDS_数据库专项.docx',
  'ACP大数据工程师_06_实时计算_云产品_安全专项.docx',
];

const knowledgeRules = [
  ['MaxCompute', ['MaxCompute', 'maxcompute', '大数据计算服务']],
  ['ODPS', ['ODPS', 'odps']],
  ['DataWorks', ['DataWorks', 'dataworks']],
  ['DataIDE', ['DataIDE', 'dataide']],
  ['DataX', ['DataX', 'datax']],
  ['AnalyticDB', ['AnalyticDB', 'analyticdb']],
  ['ADS', ['ADS', 'ads']],
  ['RDS', ['RDS', 'rds']],
  ['DRDS', ['DRDS', 'drds']],
  ['OTS', ['OTS', 'ots']],
  ['TableStore', ['TableStore', 'tablestore', '表格存储']],
  ['OSS', ['OSS', 'oss', '对象存储']],
  ['ECS', ['ECS', 'ecs', '云服务器']],
  ['云盾', ['云盾']],
  ['DDoS', ['DDoS', 'ddos']],
  ['WAF', ['WAF', 'waf']],
  ['SQL注入', ['SQL注入', 'SQL 注入', 'sql注入', 'sql 注入']],
  ['XSS', ['XSS', 'xss']],
  ['实时计算', ['实时计算', '流计算']],
  ['Flink', ['Flink', 'flink']],
  ['Spark', ['Spark', 'spark']],
  ['Storm', ['Storm', 'storm']],
  ['Quick BI', ['Quick BI', 'QuickBI', 'quick bi', 'quickbi']],
  ['Tunnel', ['Tunnel', 'tunnel']],
  ['LabelSecurity', ['LabelSecurity', 'labelsecurity', 'Label Security', '标签安全']],
  ['Package', ['Package', 'package']],
  ['MapReduce', ['MapReduce', 'mapreduce']],
];

function compact(value) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .trim();
}

function oneLine(value) {
  return compact(value).replace(/\n+/g, ' ').trim();
}

function normalizeText(value) {
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+$/gm, '')
    .trim();
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function extractDocxText(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return normalizeText(result.value);
}

async function loadSources() {
  const sources = [];

  if (await fileExists(directDocxPath)) {
    const buffer = await fs.readFile(directDocxPath);
    sources.push({
      name: 'ACP大数据工程师.docx',
      text: await extractDocxText(buffer),
    });
    return sources;
  }

  if (!(await fileExists(splitZipPath))) {
    throw new Error(
      '未找到题库源文件。请将 ACP大数据工程师.docx 或 ACP大数据工程师_备考拆分Word包.zip 放入 source/ 目录。',
    );
  }

  const zipBuffer = await fs.readFile(splitZipPath);
  const zip = await JSZip.loadAsync(zipBuffer);
  const entries = Object.values(zip.files)
    .filter((entry) => !entry.dir && /ACP大数据工程师_0[2-6]_.*\.docx$/u.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

  for (const [index, entry] of entries.entries()) {
    const buffer = await entry.async('nodebuffer');
    sources.push({
      name: splitSourceLabels[index] ?? path.basename(entry.name),
      text: await extractDocxText(buffer),
    });
  }

  return sources;
}

function sliceOriginalQuestionArea(text) {
  const marker = text.indexOf('二、专项原题');
  if (marker >= 0) {
    return text.slice(marker + '二、专项原题'.length).trim();
  }
  return text;
}

function extractQuestionBlocks(text) {
  const body = sliceOriginalQuestionArea(text);
  const startPattern = /(?:^|\n)(\d{1,4})[.．、]\s*/gu;
  const starts = [];
  let match;

  while ((match = startPattern.exec(body)) !== null) {
    const index = match[0].startsWith('\n') ? match.index + 1 : match.index;
    starts.push({ index, originalNumber: Number(match[1]) });
  }

  return starts.map((start, position) => {
    const next = starts[position + 1];
    return {
      originalNumber: start.originalNumber,
      text: body.slice(start.index, next?.index ?? body.length).trim(),
    };
  });
}

function parseOptions(beforeAnswer) {
  const optionPattern = /(?:^|\n)\s*([A-H])[.．、]\s*/gu;
  const starts = [];
  let match;

  while ((match = optionPattern.exec(beforeAnswer)) !== null) {
    starts.push({
      key: match[1].toUpperCase(),
      index: match.index,
      markerEnd: optionPattern.lastIndex,
    });
  }

  if (starts.length === 0) {
    return { stem: oneLine(beforeAnswer), options: [] };
  }

  const stem = oneLine(beforeAnswer.slice(0, starts[0].index));
  const options = starts.map((start, position) => {
    const next = starts[position + 1];
    return {
      key: start.key,
      text: oneLine(beforeAnswer.slice(start.markerEnd, next?.index ?? beforeAnswer.length)),
    };
  });

  const seen = new Set();
  return {
    stem,
    options: options.filter((option) => {
      if (!option.text || seen.has(option.key)) return false;
      seen.add(option.key);
      return true;
    }),
  };
}

function findMarker(value, pattern, type) {
  const match = value.match(pattern);
  if (!match || match.index === undefined) return null;
  return {
    type,
    index: match.index,
    end: match.index + match[0].length,
  };
}

function extractKnowledgePoints(text) {
  const matched = [];
  const lowerText = text.toLowerCase();

  for (const [label, aliases] of knowledgeRules) {
    if (aliases.some((alias) => lowerText.includes(alias.toLowerCase()))) {
      matched.push(label);
    }
  }

  if (matched.length === 0) {
    matched.push('综合大数据');
  }

  return matched;
}

function inferDifficulty(question) {
  const text = `${question.stem}\n${question.officialExplanation}\n${question.aiExplanation}`;
  if (/错误|不正确|不支持|不能|不会|失效|脏数据|陷阱|不包括/u.test(text)) {
    return '易错题';
  }
  if (/场景|架构|设计|迁移|性能|优化|解决方案|项目空间|跨项目|分库分表/u.test(text)) {
    return '综合题';
  }
  if (question.type === 'multiple' || text.length > 520) {
    return '进阶';
  }
  if (question.knowledgePoints.some((point) => ['MaxCompute', 'ODPS', 'DataWorks', 'RDS', 'AnalyticDB'].includes(point))) {
    return '高频考点';
  }
  return '基础';
}

function buildTags(question, difficulty) {
  const tags = [question.type === 'single' ? '单选题' : '多选题', difficulty];
  if (/错误|不正确|不支持|不能|不会/u.test(question.stem)) tags.push('否定题');
  if (difficulty === '易错题' && !tags.includes('易错题')) tags.push('易错题');
  for (const point of question.knowledgePoints.slice(0, 3)) {
    if (!tags.includes(point)) tags.push(point);
  }
  return tags;
}

function parseQuestionBlock(block, sourceName) {
  const header = block.text.match(/^(\d{1,4})[.．、]\s*([\s\S]*)$/u);
  const originalNumber = header ? Number(header[1]) : block.originalNumber;
  const body = header ? header[2].trim() : block.text;
  const answerMarker = body.match(/(?:^|\n)\s*答案\s*[:：]\s*/u);
  const reasons = [];

  if (!answerMarker || answerMarker.index === undefined) {
    return {
      question: null,
      error: {
        sourceName,
        originalNumber,
        reason: '未找到答案标记',
        preview: oneLine(block.text).slice(0, 220),
      },
    };
  }

  const beforeAnswer = body.slice(0, answerMarker.index).trim();
  const afterAnswer = body.slice(answerMarker.index + answerMarker[0].length).trim();
  const firstExplanationMarkers = [
    findMarker(afterAnswer, /(?:^|[\n ])(?:官方)?解析\s*[:：]\s*/u, 'official'),
    findMarker(afterAnswer, /(?:^|[\n ])AI\s*解析\s*[:：]\s*/iu, 'ai'),
  ]
    .filter(Boolean)
    .sort((a, b) => a.index - b.index);
  const firstExplanationMarker = firstExplanationMarkers[0];
  const answerRaw = firstExplanationMarker ? afterAnswer.slice(0, firstExplanationMarker.index).trim() : afterAnswer;
  let officialExplanation = '';
  let aiExplanation = '';

  if (firstExplanationMarker?.type === 'ai') {
    aiExplanation = afterAnswer.slice(firstExplanationMarker.end).trim();
  } else if (firstExplanationMarker?.type === 'official') {
    const explanationRaw = afterAnswer.slice(firstExplanationMarker.end).trim();
    const aiMarker = findMarker(explanationRaw, /(?:^|[\n ])AI\s*解析\s*[:：]\s*/iu, 'ai');
    officialExplanation = aiMarker ? explanationRaw.slice(0, aiMarker.index).trim() : explanationRaw;
    aiExplanation = aiMarker ? explanationRaw.slice(aiMarker.end).trim() : '';
  }
  const { stem, options } = parseOptions(beforeAnswer);
  const answer = Array.from(new Set((answerRaw.match(/[A-H]/giu) ?? []).map((item) => item.toUpperCase()))).sort();

  if (!stem) reasons.push('题干为空');
  if (options.length < 2) reasons.push('选项少于 2 个');
  if (answer.length === 0) reasons.push('答案为空或未识别');
  if (!officialExplanation) reasons.push('缺少官方解析');
  if (!aiExplanation) reasons.push('缺少 AI 解析');

  const question = {
    id: 0,
    originalNumber,
    stem,
    type: answer.length > 1 ? 'multiple' : 'single',
    options,
    answer,
    officialExplanation: compact(officialExplanation),
    aiExplanation: compact(aiExplanation),
    knowledgePoints: extractKnowledgePoints(`${stem}\n${officialExplanation}\n${aiExplanation}`),
    difficulty: '基础',
    tags: [],
    source: 'ACP大数据工程师题库',
    sourceFile: sourceName,
    version,
  };
  question.difficulty = inferDifficulty(question);
  question.tags = buildTags(question, question.difficulty);

  return {
    question,
    error:
      reasons.length > 0
        ? {
            sourceName,
            originalNumber,
            reason: reasons.join('；'),
            preview: oneLine(block.text).slice(0, 240),
          }
        : null,
  };
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });

  const sources = await loadSources();
  const questions = [];
  const errors = [];

  for (const source of sources) {
    const blocks = extractQuestionBlocks(source.text);
    for (const block of blocks) {
      const { question, error } = parseQuestionBlock(block, source.name);
      if (question) {
        questions.push(question);
      }
      if (error) {
        errors.push(error);
      }
    }
  }

  questions.forEach((question, index) => {
    question.id = index + 1;
  });

  if (sources.length > 1 && questions.length !== expectedSplitQuestionCount) {
    errors.push({
      sourceName: '导入汇总',
      originalNumber: 0,
      reason: `拆分题库预期 ${expectedSplitQuestionCount} 题，实际识别 ${questions.length} 题，请检查源文件格式。`,
      preview: sources.map((source) => source.name).join('；'),
    });
  }

  const meta = {
    version,
    generatedAt: new Date().toISOString(),
    sources: sources.map((source) => source.name),
    totalQuestions: questions.length,
    successfulQuestions: questions.length,
    failedItems: errors.length,
    expectedQuestions: sources.length > 1 ? expectedSplitQuestionCount : null,
  };

  await fs.writeFile(path.join(outputDir, 'questions.json'), `${JSON.stringify(questions, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(outputDir, 'import_errors.json'), `${JSON.stringify(errors, null, 2)}\n`, 'utf8');
  await fs.writeFile(path.join(outputDir, 'question_meta.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8');

  console.log(`Parsed ${questions.length} questions from ${sources.length} source file(s).`);
  console.log(`Import warnings/errors: ${errors.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
