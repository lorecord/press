import { getSiteConfig, getSystemConfig } from "$lib/server/config";
import { loadPost } from "$lib/post/handle-posts";
import { locale } from "$lib/translations";
import YAML from 'yaml';

export async function GET({ locals, params }) {
    const { site } = locals;

    let lang = params.locale || locale.get();

    let { route } = params;

    if (route.endsWith('/')) {
        route = route.substring(0, route.length - 1);
    }
    const post = await loadPost(site, { route, lang: lang || undefined });
    if (!post || !post.content) {
        return new Response('{}', { status: 404 });
    }

    const siteConfig = getSiteConfig(site, 'en');
    const systemConfig = getSystemConfig(site);

    // https://github.com/citation-file-format/citation-file-format/blob/main/README.md
    let cff = post.cff || {};

    cff['cff-version'] = '1.2.0';
    cff.message = 'If you use this content, please cite it as below.';
    cff.authors = cff.authors || [systemConfig.user?.default].flat().map(author => {
        return {
            'family-names': author.familyNames || author,
            'given-names': author.givenNames || author,
            orcid: author.orcid || systemConfig.user?.default.orcid
        };
    });
    cff.contact = [{
        affiliation: '',
        email: ''
    }]
    cff.title = post.title;

    if (post.version) {
        cff.version = '2.0.4';
    }

    cff.identifier = [{ type: 'url', value: post.doi || `${siteConfig.url}${post.url}`, description: '' }];

    cff.doi = '';

    if (post.date) {
        cff['date-released'] = new Date(post.date).toISOString().split('T')[0];
    }

    cff.url = `${siteConfig.url}${post.url}`;
    cff.abstract = post.summary;

    ((license) => {
        if (license) {
            cff.license = license;
        }
    })(post.license || systemConfig.license?.default);

    ((keywords) => {
        if (keywords) {
            cff.keywords = keywords;
        }
    })([...(post.taxonomy?.tag || []), ...(post.taxonomy?.category || []), ...(post.keywords || [])]);

    cff.references = [];
    cff['preferred-citation'] = {};
    cff.type = 'article';

    let responseText = YAML.stringify(cff);

    return new Response(responseText,
        {
            headers: {
                'Content-Type': 'text/plain; charset=utf8'
            }
        }
    );
}