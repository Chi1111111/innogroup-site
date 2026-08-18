import { Link } from 'react-router';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../components/SiteTranslator';

export function Privacy() {
  const { text } = useLanguage();
  const sections = [
    {
      title: { en: 'What we collect', zh: '我们收集哪些信息' },
      body: { en: 'When you contact us, we may collect your name, phone number, email address, vehicle preferences, budget, message and any vehicle photos you choose to upload. We also keep basic technical information needed to prevent form abuse.', zh: '当你联系我们时，我们可能会收集姓名、电话号码、邮箱、车辆偏好、预算、留言以及你自愿上传的车辆照片。我们也会保留用于防止表单滥用的基本技术信息。' },
    },
    {
      title: { en: 'Why we collect it', zh: '收集信息的用途' },
      body: { en: 'We use this information to answer your enquiry, prepare vehicle or import options, provide a valuation, arrange follow-up and keep an internal service record. We do not sell your personal information.', zh: '我们使用这些信息回复咨询、准备车辆或进口方案、提供估价、安排后续联系，并保留内部服务记录。我们不会出售你的个人信息。' },
    },
    {
      title: { en: 'Service providers', zh: '服务提供商' },
      body: { en: 'Our website uses EmailJS to deliver enquiry emails, Cloudinary for optional vehicle photo uploads, and Google Analytics for aggregated website usage information. These providers may process data outside New Zealand under their own safeguards.', zh: '本网站使用 EmailJS 发送咨询邮件、使用 Cloudinary 保存可选的车辆照片，并使用 Google Analytics 了解网站整体使用情况。这些服务商可能依据各自的保护措施在新西兰境外处理数据。' },
    },
    {
      title: { en: 'Retention and security', zh: '保存与安全' },
      body: { en: 'We keep enquiry information only while it is reasonably needed for customer service, business records and legal obligations. Access is limited to authorised Inno Group staff and service systems. No online system can be guaranteed completely secure.', zh: '我们仅在客户服务、业务记录及法律义务合理需要的期限内保存咨询信息。只有获授权的 Inno Group 员工和服务系统可以访问。任何在线系统都无法保证绝对安全。' },
    },
    {
      title: { en: 'Access, correction and questions', zh: '查询、更正与问题' },
      body: { en: 'You may ask to access or correct the personal information we hold about you. Email innogroup.shawn@gmail.com or call +64 27 285 8065. We may need to verify your identity before releasing information.', zh: '你可以要求查询或更正我们保存的个人信息。请发送邮件至 innogroup.shawn@gmail.com，或致电 +64 27 285 8065。在提供信息前，我们可能需要核实你的身份。' },
    },
  ];

  return (
    <main className="pt-20">
      <section className="bg-[#111214] px-4 py-16 text-white sm:py-24">
        <div className="section-shell max-w-4xl">
          <div className="section-kicker border-white/12 bg-white/8 text-primary"><ShieldCheck className="h-4 w-4" />{text({ en: 'Privacy', zh: '隐私' })}</div>
          <h1 className="mt-6 text-white">{text({ en: 'Privacy statement', zh: '隐私声明' })}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">{text({ en: 'A plain-language summary of how Inno Group Ltd handles information submitted through this website.', zh: '本声明用清晰语言说明 Inno Group Ltd 如何处理通过本网站提交的信息。' })}</p>
          <p className="mt-5 text-sm text-white/45">{text({ en: 'Last updated: 18 August 2026', zh: '最后更新：2026 年 8 月 18 日' })}</p>
        </div>
      </section>
      <section className="px-4 py-16 sm:py-20">
        <div className="section-shell max-w-4xl space-y-5">
          {sections.map((section) => (
            <article key={section.title.en} className="section-card p-6 sm:p-8">
              <h2 className="text-2xl">{text(section.title)}</h2>
              <p className="mt-4 leading-8 text-foreground/70">{text(section.body)}</p>
            </article>
          ))}
          <div className="pt-4">
            <Link to="/contact#quote" className="button-primary">{text({ en: 'Contact Inno Group', zh: '联系 Inno Group' })}<ArrowRight className="h-5 w-5" /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
