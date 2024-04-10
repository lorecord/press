import { refractor } from 'refractor/lib/all.js';
import rehypePrismGenerator from 'rehype-prism-plus/generator'

refractor.alias('regex', 'regexp');

export const rehypePrism = rehypePrismGenerator(refractor);