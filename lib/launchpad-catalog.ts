import type { Locale } from "./types";

export type Copy = Record<Locale, string>;
const copy = (en: string, zh: string): Copy => ({ en, zh });
export const launchStages = [
  { id: "idea", title: copy("Shape your business", "明确商业方向"), description: copy("Your idea, customers and a simple plan.", "理清业务、目标客户与商业计划。"), icon: "Lightbulb" },
  { id: "brand", title: copy("Name & brand", "名称与品牌"), description: copy("Give your business a name and an identity.", "准备企业名称、域名和品牌形象。"), icon: "Sparkles" },
  { id: "register", title: copy("Structure & registration", "企业结构与注册"), description: copy("Find the official starting points for your business.", "找到注册、许可与保险的正确入口。"), icon: "Building2" },
  { id: "digital", title: copy("Set up your digital workspace", "搭建基础办公工具"), description: copy("Email, a website and tools to work together.", "准备企业邮箱、网站和协作工具。"), icon: "Monitor" },
  { id: "finance", title: copy("Organize your finances", "整理企业财务"), description: copy("Banking, payments, bookkeeping and tax accounts.", "了解银行、收款、记账和税务账户。"), icon: "Wallet" },
  { id: "operations", title: copy("Get ready for clients", "准备服务客户"), description: copy("Agreements, client information and invoicing.", "建立合同、客户资料和开票方式。"), icon: "BriefcaseBusiness" },
  { id: "growth", title: copy("Reach your first customers", "寻找第一批客户"), description: copy("Marketing, customer relationships and booking.", "选择营销、客户管理与预约工具。"), icon: "Megaphone" },
  { id: "maintain", title: copy("Keep things running", "持续维护与复核"), description: copy("Review ongoing tasks as your business grows.", "随业务发展复核申报、用工与工具维护。"), icon: "CalendarCheck" },
];
export type LaunchStep = { id: string; stage: string; title: Copy; purpose: Copy; applicability: Copy; services: string[] };
const step = (id: string, stage: string, en: string, zh: string, purposeEn: string, purposeZh: string, services: string[], whenEn = "Use this step if it is relevant to your business. You can skip it or come back later.", whenZh = "按实际业务选择；已处理可记录完成，暂不需要可跳过。") : LaunchStep => ({ id, stage, title: copy(en, zh), purpose: copy(purposeEn, purposeZh), applicability: copy(whenEn, whenZh), services });
export const launchSteps: LaunchStep[] = [
  step("business-idea", "idea", "Clarify your business idea", "明确业务与目标客户", "Write down what you offer and who it is for.", "梳理提供什么服务，以及为谁解决问题。", ["sbec", "bdc"]),
  step("market-research", "idea", "Explore your market", "了解市场与客户", "Find local business support and test your assumptions.", "寻找本地创业支持，验证对客户和市场的判断。", ["sbec", "bdc"]),
  step("business-plan", "idea", "Put together a simple plan", "准备简明商业计划", "Choose a planning resource rather than starting from a blank page.", "借助现成的规划工具整理业务计划。", ["bdc", "miro"]),
  step("business-name", "brand", "Explore a business name", "考虑企业名称", "Review business naming and registration information before committing to a name.", "确定名称前，查看官方命名与注册信息。", ["ontario-start", "registry"]),
  step("domain", "brand", "Choose a domain", "选择企业域名", "Explore a domain for your business website and email.", "为企业网站和邮箱选择域名。域名与企业名称注册是不同事项。", ["hover", "squarespace"]),
  step("visual-brand", "brand", "Create a simple visual identity", "准备基础品牌形象", "Find a tool for your logo, colours and business materials.", "选择工具制作标志、配色和基础业务素材。", ["canva"]),
  step("legal-structure", "register", "Review your business structure", "了解企业结构", "Explore the official guidance and get professional advice for your circumstances.", "查看官方信息；个案结构选择交由合适的专业人士确认。", ["ontario-start", "sbec"]),
  step("registration", "register", "Find your registration route", "找到企业注册入口", "Use official information to locate the registration service that applies to you.", "根据企业实际情况找到适用的官方注册渠道。", ["registry", "cra"]),
  step("permits-insurance", "register", "Check permits and insurance needs", "核对许可与保险需求", "Check location and activity requirements, then consider business insurance.", "核对所在地和经营活动的要求，并了解企业保险需求。", ["bizpal", "ontario-start", "sbec"]),
  step("business-email", "digital", "Set up a business email", "选择企业邮箱", "Use your business domain for professional email. Configuration happens with your chosen provider.", "选择支持企业域名的邮箱服务；具体设置在服务商网站完成。", ["zoho", "google", "microsoft"]),
  step("website", "digital", "Build your business website", "建立企业网站", "Choose a website tool to introduce your services and help customers find you.", "选择建站工具，介绍业务并让客户找到你。", ["wix", "squarespace"]),
  step("collaboration", "digital", "Choose everyday work tools", "选择日常协作工具", "Keep shared files, documents and team communication organized.", "选择文件、文档与团队沟通工具。", ["google", "microsoft", "miro"]),
  step("banking", "finance", "Explore banking and payments", "了解企业银行与收款", "Review business banking considerations and payment options with the relevant providers.", "了解企业银行事项与收款工具；账户申请在对应机构完成。", ["rbc", "stripe"]),
  step("bookkeeping", "finance", "Choose bookkeeping software", "选择记账工具", "Find a tool for your records and discuss your setup with an accountant if needed.", "选择财务记录工具，必要时与会计师确认适合的方案。", ["wave", "quickbooks"]),
  step("tax-accounts", "finance", "Review business tax accounts", "核对企业税务账户", "Check CRA guidance on business numbers and program accounts. Registration depends on your situation.", "查看 CRA 商业号码及项目账户信息，是否注册取决于实际情况。", ["cra", "cra-hst"]),
  step("agreements", "operations", "Prepare client agreements", "准备客户合作约定", "Organize your scope, terms and professional review before using an agreement.", "整理服务范围与合作条款，使用合同前按需要寻求专业审核。", ["sbec", "microsoft"]),
  step("client-intake", "operations", "Organize client information", "整理客户接待与资料", "Choose a way to manage clients and review how you collect and protect personal information.", "选择客户管理工具，并核对个人信息收集与保护要求。", ["hubspot", "privacy"]),
  step("invoicing", "operations", "Choose how to invoice clients", "选择开票方式", "Find an invoicing tool and confirm the details your business needs to include.", "选择开票工具，并确认业务所需的发票信息。", ["wave", "quickbooks", "stripe"]),
  step("marketing", "growth", "Prepare your first marketing materials", "准备第一批营销素材", "Create a clear introduction to your business and review rules for commercial messages.", "制作业务介绍，并核对商业电子消息的相关要求。", ["canva", "casl"]),
  step("crm", "growth", "Keep track of customer conversations", "跟进潜在客户", "Choose a simple way to keep contact history and follow-up actions together.", "集中记录客户沟通和后续跟进事项。", ["hubspot"]),
  step("booking", "growth", "Make it easier to book with you", "建立客户预约入口", "Add scheduling if customers need to book a meeting or service.", "如果业务需要预约，选择日程或预约工具。", ["calendly", "wix"]),
  step("filings", "maintain", "Review ongoing filings", "复核持续申报事项", "Company annual returns, income tax and GST/HST are different matters. Review the relevant official information.", "公司年报、所得税与 GST/HST 是不同事项，分别查看适用的官方信息。", ["registry", "cra-business", "cra-hst"]),
  step("hiring", "maintain", "Check what changes when you hire", "招聘前核对用工事项", "If you plan to hire employees, review payroll and Ontario employment information.", "如准备雇用员工，查看 Payroll 和安省雇佣标准信息。", ["payroll", "employment"], "For businesses hiring employees. Team size alone does not determine whether someone is an employee.", "适用于准备雇用员工的企业；团队人数不等同于雇员人数。"),
  step("renewals", "maintain", "Review renewals and backups", "检查续费与资料备份", "Review domain renewals, software subscriptions and how you back up business files.", "定期检查域名、软件订阅及业务文件备份。", ["hover", "google", "microsoft"]),
];
export type LaunchService = { id: string; name: string; initials: string; description: Copy; url: string; official: boolean; category: string; checked: string };
const service = (id: string, name: string, initials: string, en: string, zh: string, url: string, category: string, official = false): LaunchService => ({ id, name, initials, description: copy(en, zh), url, category, official, checked: "2026-09-10" });
export const launchServices: LaunchService[] = [
  service("rbc", "RBC Business Accounts", "RB", "Business banking options. One example provider, not an exclusive recommendation.", "企业银行账户选项，作为服务示例收录，不是独家推荐。", "https://www.rbcroyalbank.com/business/accounts/index.html", "finance"),
  service("cra-business", "Canada Business Taxes", "CA", "Official business income tax and filing information.", "企业所得税与申报的官方信息。", "https://www.canada.ca/en/services/business/taxes.html", "maintain", true),
  service("sbec", "Small Business Enterprise Centres", "SB", "Local business advice and support in Ontario.", "安省本地创业咨询与支持入口。", "https://www.ontario.ca/page/small-business-enterprise-centre-locations", "idea", true),
  service("bdc", "BDC", "BD", "Business planning resources.", "商业计划与创业规划资源。", "https://www.bdc.ca/en/articles-tools/entrepreneur-toolkit/templates-business-guides/business-plan-template", "idea"),
  service("miro", "Miro", "Mi", "Visual planning and shared workspaces.", "可视化规划与团队协作工具。", "https://miro.com/templates/business-model-canvas/", "idea"),
  service("ontario-start", "Start a business in Ontario", "ON", "Ontario's official business starting guide.", "安省官方创业指南。", "https://www.ontario.ca/page/business/start", "register", true),
  service("registry", "Ontario Business Registry", "ON", "Official business registration and filing information.", "官方企业注册与申报信息入口。", "https://www.ontario.ca/page/ontario-business-registry", "register", true),
  service("cra", "CRA Business Registration", "CA", "Business numbers and program account information.", "商业号码与项目账户信息。", "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/business-registration/business-number-program-account/how-register.html", "finance", true),
  service("cra-hst", "CRA GST/HST", "CA", "Official GST/HST information for businesses.", "面向企业的官方 GST/HST 信息。", "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses.html", "finance", true),
  service("bizpal", "BizPaL", "BP", "Find permits and licences by location and activity.", "按地区和经营活动查找许可。", "https://bizpal.ca/", "register", true),
  service("hover", "Hover", "Ho", "Domain registration and management.", "域名注册与管理服务。", "https://www.hover.com/", "brand"),
  service("squarespace", "Squarespace", "Sq", "Domains and website building.", "域名与网站搭建工具。", "https://www.squarespace.com/", "digital"),
  service("canva", "Canva", "Ca", "Brand materials and marketing design.", "品牌素材与营销设计工具。", "https://www.canva.com/", "brand"),
  service("zoho", "Zoho Mail", "Zo", "Email for your business domain.", "支持企业域名的邮箱服务。", "https://www.zoho.com/mail/", "digital"),
  service("google", "Google Workspace", "G", "Business email, documents and shared files.", "企业邮箱、文档与文件协作。", "https://workspace.google.com/", "digital"),
  service("microsoft", "Microsoft 365", "M", "Business email, Office apps and collaboration.", "企业邮箱、Office 应用与团队协作。", "https://www.microsoft.com/en-ca/microsoft-365/business", "digital"),
  service("wix", "Wix", "Wi", "Website creation and online business tools.", "网站搭建与线上业务工具。", "https://www.wix.com/", "digital"),
  service("wave", "Wave", "Wa", "Bookkeeping and invoicing software.", "记账与开票软件。", "https://www.waveapps.com/", "finance"),
  service("quickbooks", "QuickBooks Canada", "QB", "Accounting and invoicing tools for businesses.", "企业会计与开票工具。", "https://quickbooks.intuit.com/ca/", "finance"),
  service("stripe", "Stripe Canada", "St", "Online payment and invoicing tools.", "线上支付与开票工具。", "https://stripe.com/en-ca", "finance"),
  service("hubspot", "HubSpot CRM", "Hs", "Customer relationships and contact management.", "客户关系与联系人管理工具。", "https://www.hubspot.com/products/crm", "growth"),
  service("calendly", "Calendly", "Cl", "Meeting scheduling and booking links.", "会议日程与预约链接工具。", "https://calendly.com/", "growth"),
  service("privacy", "Office of the Privacy Commissioner", "CA", "Privacy information for businesses.", "企业个人信息保护参考。", "https://www.priv.gc.ca/en/privacy-topics/privacy-for-businesses/", "operations", true),
  service("casl", "Canada's Anti-Spam Legislation", "CA", "Official information on commercial electronic messages.", "商业电子消息相关官方信息。", "https://crtc.gc.ca/eng/internet/anti/reg.htm", "growth", true),
  service("payroll", "CRA Payroll", "CA", "Official payroll account and deduction information.", "工资账户与扣缴的官方信息。", "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll.html", "maintain", true),
  service("employment", "Ontario Employment Standards", "ON", "Ontario employment standards information.", "安省雇佣标准信息。", "https://www.ontario.ca/document/your-guide-employment-standards-act-0", "maintain", true),
];
export const getLaunchStep = (id: string) => launchSteps.find(item => item.id === id);
