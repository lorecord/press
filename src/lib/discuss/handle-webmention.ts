import fs from 'fs';
import YAML from 'yaml';
import path from 'path';

export function loadMentions(site: any, postPath: string) {

    const filepath = path.dirname(postPath) + '/mention/source.yaml';

    if (!fs.existsSync(filepath)) {
        console.error(`No webmention file found for ${filepath}.`);
        return [];
    }
    let file = fs.readFileSync(filepath, 'utf8');
    let parsed = YAML.parse(file);

    parsed.forEach((mention: any) => {

    });
    return parsed;
}