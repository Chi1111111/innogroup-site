// EmailJS Configuration
// To set up EmailJS for your form:
// 1. Go to https://www.emailjs.com/ and create a free account
// 2. Add an email service (Gmail, Outlook, etc.)
// 3. Create an email template with the following variables:
//    - {{inquiryType}}
//    - {{sourceType}}
//    - {{brand}}
//    - {{model}}
//    - {{year}}
//    - {{budget}}
//    - {{name}}
//    - {{phone}}
//    - {{email}}
//    - {{message}}
// 4. Replace the placeholder values below with your actual EmailJS credentials

export const EMAILJS_CONFIG = {
  // Your EmailJS Service ID (from EmailJS dashboard)
  serviceId: 'Shawn20020617',
  
  // Your EmailJS Template ID (from EmailJS dashboard)
  templateId: 'template_djmgw21',
  
  // Your EmailJS Public Key (from EmailJS dashboard - formerly called User ID)
  publicKey: 'q6H4sDaqh82KFbtT9'
};

// Note: For image attachments, you may need to use emailjs.send() with base64 encoded images
// instead of sendForm(). Current implementation uses sendForm() for text data only.