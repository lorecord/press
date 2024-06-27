import { getEnvConfig, getSiteConfig, getSystemConfig } from "$lib/server/config";
import { createTransport } from 'nodemailer';
import { decrypt } from "$lib/interaction/utils";

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
    let siteConfig = getSiteConfig(site, post.lang || systemConfig.locale.default || 'en');

    if (!systemConfig.private?.email?.admin?.value) {
        return;
    }
    const adminEmail = decrypt(site, systemConfig.private?.email?.admin?.value);
    const transport = getTransport(site);
    transport.sendMail({
        from: `${JSON.stringify(comment.author?.name || comment.author)} <${systemConfig.email.sender}>`,
        to: `${adminEmail}`,
        subject: `Reply <${post.title}> at ${siteConfig.title}`,
        text: `${comment.author?.name || comment.author} replied:

${comment.content}

view <${post.title}> at ${siteConfig.title}
${siteConfig.url}${post.url}#comment-${comment.id.substr(-8)}`,
        // html: emailHtml,
    }).then((result) => {
        console.log(`new comment mail send, id: ${result.messageId}`);
    });
}

export const sendNewReplyMail = async (site: any, post: any, comment: any, replied: any) => {
    let systemConfig = getSystemConfig(site);
    let siteConfig = getSiteConfig(site, post.lang || systemConfig.locale.default || 'en');

    const repliedEmail = decrypt(site, replied.author?.email?.value);

    if (comment.target) {
        const transport = getTransport(site);
        transport.sendMail({
            from: `${JSON.stringify(comment.author?.name || comment.author)} <${systemConfig.email.sender}>`,
            to: `${JSON.stringify(replied.author?.name)} ${repliedEmail}`,
            subject: `Replied <${post.title}> at ${siteConfig.title}`,
            text: `Your comment:

${replied.content}

has been replied by ${comment.author?.name || comment.author}:

${comment.content}

view <${post.title}> at ${siteConfig.title}
${siteConfig.url}${post.url}#comment-${comment.id?.substr(-8)}`,
            // html: emailHtml,
        }).then((result) => {
            console.log(`new reply mail send, id: ${result.messageId}`);
        });
    }
}
