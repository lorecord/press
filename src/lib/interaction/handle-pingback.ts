import xmlrpc from 'xmlrpc';

const sendPingback = async (sourceURI: string, targetURI: string) => {
    const client = xmlrpc.createClient({ url: 'https://target-website.com/xmlrpc.php' });

    client.methodCall('pingback.ping', [sourceURI, targetURI], (error, value) => {
        if (error) {
            console.error('Failed to send Pingback:', error);
        } else {
            console.log('Pingback sent successfully:', value);
        }
    });
}
