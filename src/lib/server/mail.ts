import { getEnvConfig, getSiteConfig, getSystemConfig } from "$lib/server/config";
import { createTransport } from 'nodemailer';
import { decrypt, hashStringEquals } from "$lib/interaction/utils";
import { t, l } from "$lib/translations";
import { get } from "svelte/store";
import type { Author, HashValue, Interaction, Md5HashValue, Reply, Sha1HashValue, Sha256HashValue } from "$lib/interaction/types";
import type Mail from "nodemailer/lib/mailer";
import { getNativeInteraction } from "$lib/interaction/handle-native";

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

export const sendNewCommentMail = async (site: any, post: any, comment: Reply) => {
    let systemConfig = getSystemConfig(site);

    if (!systemConfig.email) {
        console.log('email not configured, skip send new comment mail');
        return;
    }

    let allowReply = !!systemConfig.postal?.enabled;
    let lang = post.lang || systemConfig.locale.default || 'en';
    let siteConfig = getSiteConfig(site, lang);

    let params: any = {
        site_title: siteConfig.title,
        post_title: post.title,
        comment_author: resolveAuthorName(comment?.author, lang),
        comment_author_user: resolveCommentAuthorUser(comment),
        comment_content: comment.content,
        link: `${siteConfig.url}${post.url}#comment-${comment.id.substr(-8)}`
    }
    let subject = get(l)(lang, `email.new_reply_mail_subject`, params);
    let text = get(l)(lang, allowReply ? `email.new_reply_mail_text_allow_reply` : `email.new_reply_mail_text`, params);

    if (!systemConfig.private?.email?.admin?.value
        || hashStringEquals(systemConfig.private?.email?.admin?.hash, comment.author?.email?.hash as HashValue)) {
        console.log('admin email not found or comment author is admin, skip send new comment mail', systemConfig.private?.email?.admin?.hash, comment.author?.email?.hash);
        return;
    }
    const adminEmail = decrypt(site, systemConfig.private?.email?.admin?.value);
    const transport = getTransport(site);
    transport.sendMail({
        from: `${JSON.stringify(resolveAuthorName(comment.author, lang))} <${systemConfig.email.sender}>`,
        to: `${adminEmail}`,
        subject,
        text,
        messageId: `<${comment.id}@${systemConfig.email.sender.split('@')[1]}>`,
        // html: emailHtml,
    }).then((result) => {
        console.log(`new comment mail send, id: ${result.messageId}`);
    });
}

export const sendNewReplyMail = async (site: any, post: any, comment: Reply, replied: Reply) => {
    let systemConfig = getSystemConfig(site);
    if (!systemConfig.email) {
        console.log('email not configured, skip send replied mail');
        return;
    }
    const adminEmail = decrypt(site, systemConfig.private?.email?.admin?.value);

    let repliedEmail = replied.author?.email?.value && decrypt(site, replied.author?.email?.value) || adminEmail;

    let personInThread = [];
    {
        let current = replied;
        while (current?.target) {
            const { interaction } = getNativeInteraction(site, current.target);

            if (interaction?.type === 'reply') {
                personInThread.push((interaction as Reply).author);
            }

            current = interaction as Reply;
        }
    }


    if (!repliedEmail) {
        console.log('replied email not found, send to admin mail');
        repliedEmail = adminEmail;
    }

    let allowReply = !!systemConfig.postal?.enabled;
    let lang = replied.lang || post.lang || systemConfig.locale.default || 'en';
    let siteConfig = getSiteConfig(site, lang);

    let params: any = {
        site_title: siteConfig.title,
        post_title: post.title,
        replied_author: resolveAuthorName(replied?.author, lang),
        replied_date: new Intl.DateTimeFormat(lang, {
            dateStyle: "short",
            timeStyle: "short",
        }).format(new Date(replied.published)),

        // qoute replied content
        replied_content: '> ' + (replied.content && replied.content.replace(/\n/g, '\n> ')),
        comment_author: resolveAuthorName(comment.author, lang),
        comment_author_user: resolveCommentAuthorUser(comment),
        comment_content: comment.content,
        link: `${siteConfig.url}${post.url}#comment-${comment.id.substr(-8)}`
    }
    if (hashStringEquals(replied.author?.email?.hash as HashValue, comment.author?.email?.hash as HashValue)) {
        console.log('replied author is the same as comment author, skip send replied mail');
        return;
    }

    let subject = get(l)(lang, `email.new_replied_mail_subject`, params);
    let text = get(l)(lang, allowReply ? `email.new_replied_mail_text_allow_reply` : `email.new_replied_mail_text`, params);

    if (comment.target) {
        const transport = getTransport(site);
        let options: Mail.Options = {
            from: `${JSON.stringify(resolveAuthorName(comment.author, lang))} <${systemConfig.email?.sender}>`,
            to: `${JSON.stringify(resolveAuthorName(replied.author, lang))} ${repliedEmail}`,
            subject,
            text,
            messageId: `<${comment.id}@${systemConfig.email?.sender.split('@')[1]}>`,
            inReplyTo: `<${replied.id}@${systemConfig.email?.sender.split('@')[1]}>`,
            // html: emailHtml,
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
            headers: {
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                'X-Auto-Response-Suppress': 'All'
            }
        };
        if (!systemConfig.private?.email?.admin?.value
            || hashStringEquals(systemConfig.private?.email?.admin?.hash, comment.author?.email?.hash as HashValue)
            || (replied.author?.email?.value && repliedEmail === adminEmail)) {
            // do nothing
        } else {
            options.bcc = adminEmail;
        }

        transport.sendMail(options).then((result) => {
            console.log(`new reply mail to ${repliedEmail} send, id: ${result.messageId}`);
        });
    }
}

export const sendReplyMail = async (site: any, post: any, reply: Reply) => {
    let systemConfig = getSystemConfig(site);
    if (!systemConfig.email) {
        console.log('email not configured, skip send replied mail');
        return;
    }
    // const adminEmail = decrypt(site, systemConfig.private?.email?.admin?.value);
    // let authors:
    let replied: Reply | undefined = reply.target ? getNativeInteraction(site, reply.target).interaction as Reply : undefined;
    let replyEmail = reply.author?.email?.value && decrypt(site, reply.author?.email?.value);

    // TODO igonre levels that is too deep
    let uniqueAuthorDataInThread = ((reply) => {
        let personInThread: (Author | undefined)[] = [];

        let current = reply;
        while (current?.target) {
            const { interaction } = getNativeInteraction(site, current.target);

            if (interaction?.type === 'reply') {
                personInThread.push((interaction as Reply).author);
            }

            current = interaction as Reply;
        }

        // TODO resolve authors of post

        personInThread.push({
            email: systemConfig.private?.email?.admin
        });

        let emailHashs = personInThread.map((person) => {
            const { md5, sha256, sha1 } = person?.email?.hash as Md5HashValue & Sha256HashValue & Sha1HashValue;
            return (md5 && `md5:${md5}`)
                || (sha256 && `sha256:${sha256}`)
                || (sha1 && `sha1:${sha1}`);
        }).filter((hash) => !!hash);

        let uniqueEmailHashs = Array.from(new Set(emailHashs));

        return uniqueEmailHashs.map((hash) => {
            return personInThread.find((person) => {
                const { md5, sha256, sha1 } = person?.email?.hash as Md5HashValue & Sha256HashValue & Sha1HashValue;
                return (md5 && `md5:${md5}` === hash)
                    || (sha256 && `sha256:${sha256}` === hash)
                    || (sha1 && `sha1:${sha1}` === hash);
            });
        })
            .map((person) => {
                const { email } = person || {};
                let emailAddress = email?.value && decrypt(site, email.value);

                return {
                    emailAddress,
                    author: person
                }
            })
            .filter((obj) => !!obj.emailAddress);
    })(reply);

    let allowReplyEmail = !!systemConfig.postal?.enabled;

    let lang = replied?.lang || post.lang || systemConfig.locale.default || 'en';
    let siteConfig = getSiteConfig(site, lang);

    let params: any = replied ? {
        site_title: siteConfig.title,
        post_title: post.title,
        replied_author: resolveAuthorName(replied.author, lang),
        replied_date: new Intl.DateTimeFormat(lang, {
            dateStyle: "short",
            timeStyle: "short",
        }).format(new Date(replied.published)),

        // qoute replied content
        replied_content: '> ' + (replied.content && replied.content.replace(/\n/g, '\n> ')),
        comment_author: resolveAuthorName(reply.author, lang),
        comment_author_user: resolveCommentAuthorUser(reply),
        comment_content: reply.content,
        link: `${siteConfig.url}${post.url}#comment-${reply.id.substr(-8)}`
    } : {};

    let subject = get(l)(lang, `email.new_replied_mail_subject`, params);
    let text = get(l)(lang, allowReplyEmail ? `email.new_replied_mail_text_allow_reply` : `email.new_replied_mail_text`, params);

    if (replied) {
        const transport = getTransport(site);

        let recipientArray = uniqueAuthorDataInThread.map((obj) => `${JSON.stringify(resolveAuthorName(obj.author, lang))} <${obj.emailAddress}>`);

        if (recipientArray.length > 0) {
            let options: Mail.Options = {
                from: `${JSON.stringify(resolveAuthorName(reply.author, lang))} <${systemConfig.email?.sender}>`,
                to: recipientArray[0],
                subject,
                text,
                messageId: `<${reply.id}@${systemConfig.email?.sender.split('@')[1]}>`,
                inReplyTo: `<${replied.id}@${systemConfig.email?.sender.split('@')[1]}>`,
                // html: emailHtml,
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
                headers: {
                    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
                    'X-Auto-Response-Suppress': 'All'
                }
            };

            if (uniqueAuthorDataInThread.length > 1) {
                options.bcc = recipientArray.slice(1).join(', ');
            }

            transport.sendMail(options).then((result) => {
                console.log(`new reply mail to ${uniqueAuthorDataInThread.map((obj) => obj.emailAddress).join(', ')} send, id: ${result.messageId}`);
            });
        }
    } else {
        // TODO 
    }
}