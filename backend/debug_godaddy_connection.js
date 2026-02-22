import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.GODADDY_API_KEY;
const apiSecret = process.env.GODADDY_API_SECRET;
const isProduction = process.env.GODADDY_ENV === 'production';
const baseURL = process.env.GODADDY_API_URL ||
    (isProduction ? 'https://api.godaddy.com' : 'https://api.ote-godaddy.com');

console.log('--- GoDaddy API Debugger ---');
console.log(`Environment: ${process.env.GODADDY_ENV}`);
console.log(`Base URL: ${baseURL}`);
console.log(`API Key (first 4): ${apiKey ? apiKey.substring(0, 4) : 'NOT SET'}`);
console.log(`API Secret (first 4): ${apiSecret ? apiSecret.substring(0, 4) : 'NOT SET'}`);

if (!apiKey || !apiSecret) {
    console.error('❌ Error: Missing API Key or Secret');
    process.exit(1);
}

const client = axios.create({
    baseURL: baseURL,
    headers: {
        Authorization: `sso-key ${apiKey}:${apiSecret}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
    timeout: 10000,
});

async function checkAvailability() {
    const domain = 'saasify-test-domain.com';
    console.log(`\nTesting checkAvailability for ${domain}...`);

    try {
        const response = await client.get(`/v1/domains/available`, {
            params: {
                domain,
                checkType: 'FULL',
                forTransfer: false,
            },
        });
        console.log('✅ Success:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
            console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
        }
    }
}

checkAvailability();
