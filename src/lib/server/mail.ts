import { getEnvConfig, getSiteConfig, getSystemConfig } from "$lib/server/config";
import { createTransport } from 'nodemailer';
import { decrypt } from "$lib/interaction/utils";
import { t, l } from "$lib/translations";
import { get } from "svelte/store";
import type { Author, Reply, Md5HashValue, Sha1HashValue, Sha256HashValue } from "$lib/interaction/types";
import type Mail from "nodemailer/lib/mailer";
import { getNativeInteraction } from "$lib/interaction/handle-native";
import { loadPost } from "$lib/post/handle-posts";

const TO_HOLDER = "undisclosed-recipients:;";

function escapeEmailName(name: String): String {
    const trimmedName = name.trim();
    if (!trimmedName) {
        return '';
    }

    const escapedName = trimmedName.replace(/(["\\])/g, '\\$1');

    if (/[,<>@"]/g.test(trimmedName)) {
        return `"${escapedName}"`;
    }

    return escapedName;
}

function buildEmailAddress(name: String, adress: String): String {
    return name ? `${escapeEmailName(name)} <${adress}>` : adress;
}

function getTransport(site: any) {

    let systemConfig = getSystemConfig(site);
    let envConfig = getEnvConfig(site);
    let transport = createTransport({
        host: systemConfig.private?.email?.smtp?.host,
        port: systemConfig.private?.email?.smtp?.port,
        secure: !!systemConfig.private?.email?.smtp?.secure,
        auth: {
            type: 'login',
            user: systemConfig.private?.email?.smtp?.user,
            pass: envConfig.private?.SMTP_PASS
        },
        ignoreTLS: true,
        // tls: {
        //     rejectUnauthorized: false,
        //     ciphers: 'DEFAULT@SECLEVEL=0'
        // },
    });
    return transport;
}

function resolveCommentAuthorUser(comment: Reply) {
    return comment.author?.user
        || (comment.author?.email?.hash as Sha256HashValue)?.sha256
        || (comment.author?.email?.hash as Md5HashValue)?.md5
        || comment.id;
}

function resolveAuthorName(author: Author | undefined, lang: string) {
    return author?.name || (author?.email?.value ? get(l)(lang, `common.comment_nobody`) : get(l)(lang, `common.comment_anonymous`));
}

function buildAuthorData(site: any, author: Author, lang: string) {
    const { email } = author;
    let emailAddress = email?.value && decrypt(site, email.value);

    return {
        emailAddress,
        author,
        lang
    }
}

export const sendNewReplyMail = async (site: any, post: any, reply: Reply) => {
    let systemConfig = getSystemConfig(site);
    if (!systemConfig.email) {
        console.log('email not configured, skip send reply mail');
        return;
    }

    let replyAuthorData = buildAuthorData(site, reply?.author || {}, reply?.lang || post.lang || systemConfig.locale?.default || 'en');

    let replied: Reply | undefined = reply.target ? getNativeInteraction(site, reply.target).interaction as Reply : undefined;

    let repliedAuthorData = buildAuthorData(site, replied?.author || {}, replied?.lang || post.lang || systemConfig.locale?.default || 'en');

    let uniqueAuthorDataInThread = ((reply, level) => {
        const authorsInThread: Author[] = [];

        let current = replied;
        let deep = 1;
        while (current?.target) {
            const { interaction } = getNativeInteraction(site, current.target);

            if (interaction?.type === 'reply') {
                let author = (interaction as Reply).author;
                author && authorsInThread.push(author);
            }

            current = interaction as Reply;
            deep++;

            if (deep > level) {
                // igonre levels that is too deep
                break;
            }
        }

        // TODO resolve authors of post
        const authorsRelatedToThread = [...authorsInThread, {
            name: site.unique,
            email: systemConfig.private?.email?.admin,
            lang: post.lang || systemConfig.locale?.default || 'en'
        } as Author];

        const uniqueEmailHashs = Array.from(new Set(authorsRelatedToThread
            .map((person) => {
                const { md5, sha256, sha1 } = person?.email?.hash as Md5HashValue & Sha256HashValue & Sha1HashValue;
                return (sha256 && `sha256:${sha256}`)
                    || (sha1 && `sha1:${sha1}`)
                    || (md5 && `md5:${md5}`);
            })
            .filter((hash) => !!hash)
            .filter((hash) => {
                const { md5, sha256, sha1 } = reply?.author?.email?.hash as Md5HashValue & Sha256HashValue & Sha1HashValue;
                return (!sha256 || `sha256:${sha256}` !== hash)
                    && (!sha1 || `sha1:${sha1}` !== hash)
                    && (!md5 || `md5:${md5}` !== hash);
            })
            .filter((hash) => {
                const { md5, sha256, sha1 } = replied?.author?.email?.hash as Md5HashValue & Sha256HashValue & Sha1HashValue;
                return (!sha256 || `sha256:${sha256}` !== hash)
                    && (!sha1 || `sha1:${sha1}` !== hash)
                    && (!md5 || `md5:${md5}` !== hash);
            })
        ));

        return uniqueEmailHashs.map((hash) => {
            return authorsRelatedToThread.find((person) => {
                const { md5, sha256, sha1 } = person?.email?.hash as Md5HashValue & Sha256HashValue & Sha1HashValue;
                return (sha256 && `sha256:${sha256}` === hash)
                    || (sha1 && `sha1:${sha1}` === hash)
                    || (md5 && `md5:${md5}` === hash);
            }) || {};
        })
            .map((author) => buildAuthorData(site, author, reply.lang || post.lang || systemConfig.locale?.default || 'en'))
            .filter((obj) => !!obj.emailAddress);
    })(reply, 4);

    let allowReplyEmail = !!systemConfig.postal?.enabled;

    let emailConfigOfLang: {
        [lang: string]: {
            subject: String,
            text: String,
            list: Mail.ListHeaders | undefined,
            params: any,
        }
    } = {};

    async function getEmailConfigParams(lang: string) {
        let cache = emailConfigOfLang[lang];
        if (cache) {
            return cache;
        }

        let siteConfig = getSiteConfig(site, lang);
        let postWithLang = post.lang != lang ? await loadPost(site, { route: post.slug, lang }) : undefined;

        let params: any = {
            site_title: siteConfig.title,
            post_title: postWithLang?.title || post.title,
            replied_author: resolveAuthorName(replied?.author, lang),
            replied_date: new Intl.DateTimeFormat(lang, {
                dateStyle: "short",
                timeStyle: "short",
            }).format(replied ? new Date(replied?.published) : new Date()),

            // qoute replied content
            replied_content: '> ' + (replied?.content && replied.content.replace(/\n/g, '\n> ')),
            comment_author: resolveAuthorName(reply.author, lang),
            comment_author_user: resolveCommentAuthorUser(reply),
            comment_content: reply.content,
            link: `${siteConfig.url}${post.url}#comment-${reply.id.substr(-8)}`
        };

        let subject: String, text: String;
        if (replied) {
            subject = get(l)(lang, `email.new_replied_mail_subject`, params);
            text = get(l)(lang, allowReplyEmail ? `email.new_replied_mail_text_allow_reply` : `email.new_replied_mail_text`, params);
        } else {
            subject = get(l)(lang, `email.new_reply_mail_subject`, params);
            text = get(l)(lang, allowReplyEmail ? `email.new_reply_mail_text_allow_reply` : `email.new_reply_mail_text`, params);
        }

        subject += ` [${lang}]`;

        emailConfigOfLang[lang] = {
            subject,
            text,
            list: {
                id: `${siteConfig.url}${post.url}`,
                help: [{ url: `${systemConfig.email?.sender}?subject=Help`, comment: 'Help' }],
                subscribe: [{
                    url: `${systemConfig.email?.sender}?subject=Subscribe`,
                    comment: 'Subscribe'
                }],
                unsubscribe: [{
                    url: `${systemConfig.email?.sender}?subject=Unsubscribe`,
                    comment: 'Unsubscribe'
                }, {
                    url: `${systemConfig.email?.sender}?subject=Unsubscribe&all=1`,
                    comment: 'Unsubscribe All'
                }, `${siteConfig.url}${post.url}`],
                post: [{
                    url: `${systemConfig.email?.sender}?subject=Post`,
                    comment: 'Post'
                },
                `${siteConfig.url}${post.url}#comments`],
                archive: `${siteConfig.url}${post.url}`
            },
            params
        }

        return emailConfigOfLang[lang];
    }

    if (!replyAuthorData?.emailAddress && uniqueAuthorDataInThread.length == 0) {
        console.log('no email address found, skip send replied mail');
        return;
    }
    const transport = getTransport(site);

    if (repliedAuthorData?.emailAddress) {
        let lang = replied?.lang || post.lang || systemConfig.locale?.default || 'en';
        let { subject, text, list, params } = await getEmailConfigParams(lang);
        let options: Mail.Options = {
            from: buildEmailAddress(resolveAuthorName(replyAuthorData.author, lang), systemConfig.email?.sender) as string,
            to: buildEmailAddress(resolveAuthorName(repliedAuthorData.author, lang), repliedAuthorData.emailAddress) as string,
            subject: subject as string,
            text: text as string,
            messageId: `<${reply.id}@${systemConfig.email?.sender.split('@')[1]}>`,
            // html: emailHtml,
            headers: {
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                'X-Auto-Response-Suppress': 'All'
            },
            list
        };
        if (replied) {
            options.inReplyTo = `<${replied.id}@${systemConfig.email?.sender.split('@')[1]}>`;
        }

        transport.sendMail(options).then((result) => {
            console.log(`new reply mail in ${lang} to ${options.to} send, id: ${result.messageId}`);
        });
    }

    let recipientsOfLang: {
        [lang: string]: {
            emailAddress: string | undefined;
            author: Author;
            lang: string;
        }[]
    } = {};

    uniqueAuthorDataInThread.forEach((authorData) => {
        let authorDataArray = recipientsOfLang[authorData.lang];
        if (!authorDataArray) {
            authorDataArray = [];
            recipientsOfLang[authorData.lang] = authorDataArray;
        }
        authorDataArray.push(authorData);
    });

    for (let lang in recipientsOfLang) {
        let authorDataArray = recipientsOfLang[lang];
        let { subject, text, list } = await getEmailConfigParams(lang);
        let options: Mail.Options = {
            from: buildEmailAddress(resolveAuthorName(replyAuthorData.author, lang), systemConfig.email?.sender) as string,
            to: TO_HOLDER,
            subject: subject as string,
            text: text as string,
            messageId: `<${reply.id}@${systemConfig.email?.sender.split('@')[1]}>`,
            // html: emailHtml,
            headers: {
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                'X-Auto-Response-Suppress': 'All'
            },
            list
        };
        if (replied) {
            options.inReplyTo = `<${replied.id}@${systemConfig.email?.sender.split('@')[1]}>`;
        }

        let recipientArray = authorDataArray.map((obj) => buildEmailAddress(resolveAuthorName(obj.author, lang), obj.emailAddress as String));
        if (recipientArray.length > 0) {
            options.bcc = recipientArray.join(', ');
            transport.sendMail(options).then((result) => {
                console.log(`new reply mail in ${lang} bcc ${options.bcc} send, id: ${result.messageId}`);
            });
        }
    }
}