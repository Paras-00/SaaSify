import dotenv from 'dotenv';
import { sendEmail } from './src/services/email.service.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function testEmail() {
    console.log('Testing email sending...');
    console.log('EMAIL_HOST from env:', process.env.EMAIL_HOST);
    console.log('SMTP_HOST from env (should be undefined):', process.env.SMTP_HOST);

    const result = await sendEmail({
        to: 'test@example.com',
        template: 'welcome', // Make sure this template exists or use a simple one if available
        subject: 'Test Email',
        data: { firstName: 'Tester' }
    });

    if (result.success) {
        console.log('Email sent successfully!');
    } else {
        console.error('Email failed to send:', result.error);
    }
}

testEmail();
