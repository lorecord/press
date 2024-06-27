import { getEnvConfig, getSiteConfig, getSystemConfig } from "$lib/server/config";
import { createTransport } from 'nodemailer';

function getTransport(site: any) {

    let systemConfig = getSystemConfig(site);
    let envConfig = getEnvConfig(site);
    let transport = createTransport({
        host: systemConfig.private?.email?.smtp?.host,
        port: systemConfig.private?.email?.smtp?.port,
        secure: !!systemConfig.private?.email?.smtp?.secure,
        auth: {
            user: systemConfig.private?.email?.smtp?.user || systemConfig.private?.email?.smtp?.user,
            pass: envConfig.private?.SMTP_PASS
        }
    });
    return transport;
}

export const sendNewCommentMail = async (site: any, post: any, comment: any) => {
    let systemConfig = getSystemConfig(site);
    let siteConfig = getSiteConfig(site, post.lang || systemConfig.locale.default || 'en');

    if (!systemConfig.private?.email) {
        return;
    }
    const transport = getTransport(site);
    transport.sendMail({
        from: `${JSON.stringify(comment.author)} <${systemConfig.email.sender}>`,
        to: `${systemConfig.private?.email.admin}`,
        subject: `Reply <${post.title}> at ${siteConfig.title}`,
        text: `${comment.author} replied:

${comment.text}

view <${post.title}> at ${siteConfig.title}
${siteConfig.url}${post.url}#comment-${comment.id.substr(-8)}`,
        // html: emailHtml,
    }).then((result)=>{
        console.log(`mail send, id: ${result.messageId}`);
    });
}

export const sendNewReplyMail = async (site: any, post: any, comment: any, replied: any) => {
    let systemConfig = getSystemConfig(site);
    let siteConfig = getSiteConfig(site, post.lang || systemConfig.locale.default || 'en');

    if (!systemConfig.private?.email) {
        return;
    }
    if (comment.reply) {
        const transport = getTransport(site);
        transport.sendMail({
            from: `${JSON.stringify(comment.author)} <${systemConfig.email.sender}>`,
            to: `${replied.email}`,
            subject: `Reply <${post.title}> at ${siteConfig.title}`,
            text: `Your comment:
${replied.text}

has been replied by ${comment.author}:

${comment.text}

view <${post.title}> at ${siteConfig.title}
${siteConfig.url}${post.url}#comment-${comment.id.substr(-8)}`,
            // html: emailHtml,
        }).then((result)=>{
            console.log(`mail send, id: ${result.messageId}`);
        });
    }
}
