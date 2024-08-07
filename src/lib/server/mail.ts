import { getEnvConfig, getSiteConfig, getSystemConfig } from "$lib/server/config";
import { createTransport } from 'nodemailer';
import { decrypt } from "$lib/interaction/utils";
import { t, l } from "$lib/translations";
import { get } from "svelte/store";

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

export const sendNewCommentMail = async (site: any, post: any, comment: any) => {
    let systemConfig = getSystemConfig(site);

    if (!systemConfig.email) {
        console.log('email not configured, skip send new comment mail');
        return;
    }

    let lang = post.lang || systemConfig.locale.default || 'en';
    let siteConfig = getSiteConfig(site, lang);

    let params: any = {
        site_title: siteConfig.title,
        post_title: post.title,
        comment_author: comment.author?.name || (comment.author?.email?.value ? get(l)(lang, `common.comment_nobody`) : get(l)(lang, `common.comment_anonymous`)),
        comment_author_user: comment.author?.user || comment.author?.email?.hash?.sha256 || comment.author?.email?.hash?.md5 || comment.id,
        comment_content: comment.content,
        link: `${siteConfig.url}${post.url}#comment-${comment.id.substr(-8)}`
    }
    let subject = get(l)(lang, `email.new_reply_mail_subject`, params);
    let text = get(l)(lang, `email.new_reply_mail_text`, params);

    if (!systemConfig.private?.email?.admin?.value || systemConfig.private?.email?.admin?.hash?.md5 === comment.author?.email?.hash?.md5 || systemConfig.private?.email?.admin?.hash?.sha256 === comment.author?.email?.hash?.sha256) {
        return;
    }
    const adminEmail = decrypt(site, systemConfig.private?.email?.admin?.value);
    const transport = getTransport(site);
    transport.sendMail({
        from: `${JSON.stringify(comment.author?.name || (comment.author?.email?.value ? get(l)(lang, `common.comment_nobody`) : get(l)(lang, `common.comment_anonymous`)))} <${systemConfig.email.sender}>`,
        to: `${adminEmail}`,
        subject,
        text,
        messageId: `<${comment.id}@${systemConfig.email.sender.split('@')[1]}>`,
        // html: emailHtml,
    }).then((result) => {
        console.log(`new comment mail send, id: ${result.messageId}`);
    });
}

export const sendNewReplyMail = async (site: any, post: any, comment: any, replied: any) => {
    let systemConfig = getSystemConfig(site);
    if (!systemConfig.email) {
        console.log('email not configured, skip send new reply mail');
        return;
    }
    let lang = replied.lang || post.lang || systemConfig.locale.default || 'en';
    let siteConfig = getSiteConfig(site, lang);

    let params: any = {
        site_title: siteConfig.title,
        post_title: post.title,
        replied_content: replied.content,
        comment_author: comment.author?.name || (comment.author?.email?.value ? get(l)(lang, `common.comment_nobody`) : get(l)(lang, `common.comment_anonymous`)),
        comment_author_user: comment.author?.user || comment.author?.email?.hash?.sha256 || comment.author?.email?.hash?.md5 || comment.id,
        comment_content: comment.content,
        link: `${siteConfig.url}${post.url}#comment-${comment.id.substr(-8)}`
    }

    if (replied.author?.email?.hash?.md5 === comment.author?.email?.hash?.md5
        || replied.author?.email?.hash?.sha256 === comment.author?.email?.hash?.sha256
    ) {
        return;
    }

    let subject = get(l)(lang, `email.new_replied_mail_subject`, params);
    let text = get(l)(lang, `email.new_replied_mail_text`, params);

    const repliedEmail = decrypt(site, replied.author?.email?.value);

    if (comment.target) {
        const transport = getTransport(site);
        let options: any = {
            from: `${JSON.stringify(comment.author?.name || (comment.author?.email?.value ? get(l)(lang, `common.comment_nobody`) : get(l)(lang, `common.comment_anonymous`)))} <${systemConfig.email?.sender}>`,
            to: `${JSON.stringify(replied.author?.name || (replied.author?.email?.value ? get(l)(lang, `common.comment_nobody`) : get(l)(lang, `common.comment_anonymous`)))} ${repliedEmail}`,
            subject,
            text,
            messageId: `<${comment.id}@${systemConfig.email?.sender.split('@')[1]}>`,
            inReplyTo: `<${replied.id}@${systemConfig.email?.sender.split('@')[1]}>`,
            // html: emailHtml,
        };

        const adminEmail = decrypt(site, systemConfig.private?.email?.admin?.value);

        if (!systemConfig.private?.email?.admin?.value || systemConfig.private?.email?.admin?.hash?.md5 === comment.author?.email?.hash?.md5 || systemConfig.private?.email?.admin?.hash?.sha256 === comment.author?.email?.hash?.sha256 || systemConfig.private?.email?.admin?.hash?.md5 === replied.author?.email?.hash?.md5 || systemConfig.private?.email?.admin?.hash?.sha256 === replied.author?.email?.hash?.sha256) {
            // do nothing
        } else {
            options.bcc = adminEmail;
        }

        transport.sendMail(options).then((result) => {
            console.log(`new reply mail send, id: ${result.messageId}`);
        });
    }
}
