import { dev } from "$app/environment";

type LanguageConfig = {
    name: string;
    code: string;
    chars: RegExp;
    commonWords: string[];
    ngrams: string[];
    category: 'ascii' | 'cyrillic' | 'chinese' | 'latin';
}

type LanguageConfigMap = {
    [key: string]: LanguageConfig;
}

export const languages: LanguageConfigMap = {
    'zh': {
        name: 'Chinese',
        code: 'zh',
        chars: /[\u4e00-\u9fff\u3400-\u4dbf]/,
        commonWords: ['的', '一', '是', '在', '不', '了', '有', '和', '人', '这', '中', '大', '为', '上', '个', '国', '我', '以', '要', '他', '时', '来', '用', '们', '生', '到', '作', '地', '于', '出', '就', '分', '对', '成', '会', '可', '主', '发', '年', '动', '同', '工', '也', '能', '下', '过', '子', '说', '产', '种', '面', '而', '方', '后', '多', '定', '行', '学', '法', '所', '民', '得', '经', '十', '三', '之', '进', '着', '等', '部', '度', '家', '电', '力', '里', '如', '水', '化', '高', '自', '二', '理', '起', '小', '物', '现', '实', '加', '量', '都', '两', '体', '制', '机', '当', '使', '点', '从', '业', '本', '去', '把', '性', '好', '应', '开', '它', '合', '还', '因', '由', '其', '些', '然', '前', '外', '天', '政', '四', '日', '那', '社', '义', '事', '平', '形', '相', '全', '表', '间', '样', '与', '关', '各', '重', '新', '线', '内', '数', '正', '心', '反', '你', '明', '看', '原', '又', '么', '利', '比', '或', '但', '质', '气', '第', '向', '道', '命', '此', '变', '条', '只'],
        ngrams: [],
        category: 'chinese',
    },
    'en': {
        name: 'English',
        code: 'en',
        chars: /[a-zA-Z]/,
        commonWords: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'],
        ngrams: ['th', 'he', 'in', 'er', 'an'],
        category: 'ascii',
    },
    'ru': {
        name: 'Russian',
        code: 'ru',
        chars: /[а-яА-ЯЁё]/,
        commonWords: ['и', 'в', 'не', 'на', 'с', 'что', 'как', 'а', 'то', 'он', 'она', 'это', 'но', 'я', 'ты', 'мы', 'вы', 'они', 'так', 'же', 'по', 'от', 'за', 'для', 'или', 'чтобы', 'поэтому', 'потому', 'что', 'если', 'когда', 'где', 'кто', 'чем', 'чему', 'кому'],
        ngrams: ['ст', 'ов', 'но'],
        category: 'cyrillic',
    }
};

function getCategory(char: string) {
    const code = char.codePointAt(0);

    if (code) {
        if (code >= 0x0000 && code <= 0x007F) {
            return 'ascii';
        } else if (code >= 0x0080 && code <= 0x00FF) {
            return 'latin';
        } else if (code >= 0x4E00 && code <= 0x9FFF) {
            return 'chinese';
        } else if (code >= 0x0400 && code <= 0x04FF) {
            return 'cyrillic';
        }
    }
    return 'other';
}

export const detectLanguageWithConfig = <T extends LanguageConfigMap>(text: string, configs: T): ({
    [key in keyof T]: number;
}) => {
    const scores: { [key in keyof T]: number } = {} as { [key in keyof T]: number };

    for (let i = 0; i < text.length; i++) {
        const category = getCategory(text[i]);

        for (const key in configs) {
            if (!scores[key]) {
                scores[key] = 0;
            }

            const config = configs[key];
            if (config.category === category) {
                scores[key] += 1;
            }
        }
    }

    if (dev) {
        console.log(`detecting #1`, scores);
    }

    for (let lang in configs) {
        scores[lang] = scores[lang] || 0;

        const charMatches = text.match(configs[lang].chars);

        if (charMatches) {
            scores[lang] += charMatches.length;
        } else {
            continue;
        }

        const config = configs[lang];

        const wordMatches = config.commonWords.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0);
        const ngramMatches = config.ngrams.reduce((count, ngram) => count + (text.includes(ngram) ? 1 : 0), 0);

        const wordScore = config.commonWords.length > 0 ? (wordMatches / config.commonWords.length) : 0.5;
        const ngramScore = config.ngrams.length > 0 ? (ngramMatches / config.ngrams.length) : 0.5;

        scores[lang] += charMatches.length * (1 + wordScore * 2 + ngramScore * 3);

        if (dev) {
            console.log(`detecting #2`, lang, scores[lang]);
        }
    }

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    let probabilities: { [key in keyof T]: number } = {} as { [key in keyof T]: number };

    for (let lang in scores) {
        probabilities[lang] = totalScore ? scores[lang] / totalScore : 0;
    }

    probabilities = Object.fromEntries(
        Object.entries(probabilities).sort(([, a], [, b]) => b - a)
    ) as { [key in keyof T]: number };


    if (dev) {
        console.log(`detecting #3`, probabilities);
    }

    return probabilities;
}

export const detectLanguage = (text: string) => detectLanguageWithConfig(text, languages);