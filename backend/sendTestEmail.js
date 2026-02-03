import sgMail from '@sendgrid/mail';

console.log("Sending test email using SendGrid...");
console.log("Using SendGrid API Key:", process.env.SENDGRID_API_KEY ? "Loaded ✅" : "Missing ❌");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'contact.aryan001@gmail.com',
  from: 'contact.aryan0101@gmail.com', // MUST be verified in SendGrid
  subject: '🚀 SendGrid Test Email',
  text: 'Hello! This is a plain text test email.',
  html: '<h2>Hello 👋</h2><p>This is a <strong>test email</strong>.</p>',
};

sgMail
  .send(msg)
  .then(() => console.log('✅ Email sent successfully!'))
  .catch(err => console.error('❌ SendGrid Error:', err.response?.body || err));
