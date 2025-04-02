import fetch from 'node-fetch';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const DOMAIN = process.env.DOMAIN;

const createSubdomain = async (projectName, ipAddress) => {
    try {
        const subdomain = `${projectName.toLowerCase()}.${DOMAIN}`;
        
        const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'A',
                name: subdomain,
                content: ipAddress,
                ttl: 1,
                proxied: true
            })
        });

        const data = await response.json();
        
        if (data.success) {
            return subdomain;
        } else {
            throw new Error(`Failed to create DNS record: ${JSON.stringify(data.errors)}`);
        }
    } catch (error) {
        console.error('Error creating subdomain:', error);
        throw error;
    }
};

export default createSubdomain;
