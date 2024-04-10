import { getSiteConfig, getSystemConfig } from "$lib/server/config";
import { Client } from '@sendgrid/client/';
import { MailService } from '@sendgrid/mail';

function getSendgridClient(site: any) {

    let systemConfig = getSystemConfig(site);

    let smtpConfig = systemConfig.private?.email?.provider === "sendgrid"
        ? {
            host: 'smtp.sendgrid.net',
            port: 587,
            auth: {
                user: 'apikey',
                pass: systemConfig.private?.email?.sendgrid?.key || process.env.SENDGRID_API_KEY
            }
        } : {
            host: systemConfig.private?.email?.smtp?.host,
            port: systemConfig.private?.email?.smtp?.port,
            auth: {
                user: systemConfig.private?.email?.smtp?.user,
                pass: systemConfig.private?.email?.smtp?.pass
            }
        };

    let sendgridClient = new Client();
    let sendgridService = new MailService();

    sendgridService.setClient(sendgridClient);

    sendgridService.setApiKey(systemConfig.private?.email?.sendgrid?.key || process.env.SENDGRID_API_KEY);

    return sendgridService;
}

export const sendNewCommentMail = async (site: any, post: any, comment: any) => {
    let systemConfig = getSystemConfig(site);
    let siteConfig = getSiteConfig(site, post.lang || systemConfig.locale.default || 'en');

    if (!systemConfig.private?.email) {
        return;
    }
    const sendgrid = getSendgridClient(site);
    sendgrid.send({
        from: `${JSON.stringify(comment.author)} <${systemConfig.email.sender}>`,
        to: `${systemConfig.private?.email.admin}`,
        subject: `Reply <${post.title}> at ${siteConfig.title}`,
        text: `${comment.author} replied:

${comment.text}

view <${post.title}> at ${siteConfig.title}
${siteConfig.url}${post.url}#comment-${comment.id.substr(-8)}`,
        // html: emailHtml,
    });

}

export const sendNewReplyMail = async (site: any, post: any, comment: any, replied: any) => {
    let systemConfig = getSystemConfig(site);
    let siteConfig = getSiteConfig(site, post.lang || systemConfig.locale.default || 'en');

    if (!systemConfig.private?.email) {
        return;
    }
    const sendgrid = getSendgridClient(site);
    if (comment.reply) {
        sendgrid.send({
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
        });
    }
}
