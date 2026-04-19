import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私条款 — 跬步",
};

export default function PrivacyPage() {
  return (
    <main className="px-6 py-16 md:px-12 lg:px-[20%] xl:px-[28%]">
      <Link href="/" className="text-[13px] text-text-tertiary hover:text-primary transition-colors mb-8 inline-block">
        &larr; 返回首页
      </Link>

      <h1 className="font-heading text-[24px] font-semibold mb-8">隐私条款</h1>

      <div className="space-y-6 text-[15px] leading-[1.8] text-text-secondary">
        <p className="text-text font-medium">最后更新：2026年4月19日</p>

        <section>
          <h2 className="font-heading text-[17px] font-semibold text-text mb-2">我们收集什么</h2>
          <p>
            跬步仅收集提供服务所必需的最少数据：您的登录凭据（邮箱地址）、学生档案信息（姓名、年级）以及学习进度数据（复习记录、连续天数）。我们不收集设备指纹、位置信息或任何与学习无关的个人数据。
          </p>
        </section>

        <section>
          <h2 className="font-heading text-[17px] font-semibold text-text mb-2">数据存储</h2>
          <p>
            所有数据存储于 Supabase 托管的 PostgreSQL 数据库中，采用行级安全策略（RLS）确保用户仅能访问自己的数据。数据库位于受保护的云基础设施中，传输过程全程使用 TLS 加密。
          </p>
        </section>

        <section>
          <h2 className="font-heading text-[17px] font-semibold text-text mb-2">AI 与隐私</h2>
          <p>
            跬步不使用任何云端 AI 服务。语音朗读功能完全在您的设备本地运行（WebGPU 或浏览器内置语音合成），您的诗词内容不会发送到任何第三方服务器。
          </p>
        </section>

        <section>
          <h2 className="font-heading text-[17px] font-semibold text-text mb-2">第三方服务</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Supabase — 身份验证与数据存储</li>
            <li>Upstash Redis — 速率限制（仅存储匿名计数器）</li>
            <li>Vercel — 应用托管</li>
          </ul>
          <p className="mt-2">
            我们不使用任何广告追踪、数据分析平台或社交媒体追踪工具。
          </p>
        </section>

        <section>
          <h2 className="font-heading text-[17px] font-semibold text-text mb-2">儿童隐私</h2>
          <p>
            跬步面向家长监护人使用。学生档案由监护人创建和管理，学生本人无需提供任何个人联系信息。我们不会主动联系学生用户，也不会向未成年人展示任何广告或营销内容。
          </p>
        </section>

        <section>
          <h2 className="font-heading text-[17px] font-semibold text-text mb-2">数据删除</h2>
          <p>
            您可以随时删除学生档案，相关的所有学习数据将被永久删除。如需删除账户，请联系我们，我们将在 7 个工作日内完成处理。
          </p>
        </section>

        <section>
          <h2 className="font-heading text-[17px] font-semibold text-text mb-2">联系方式</h2>
          <p>
            如有隐私相关问题，请通过应用内反馈功能或发送邮件至 privacy@kuibu.app 联系我们。
          </p>
        </section>
      </div>
    </main>
  );
}
