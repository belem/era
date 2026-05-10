import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

const SUPPORTED = ["zh-CN", "en"] as const;
type Locale = (typeof SUPPORTED)[number];

function resolveLocale(cookieVal?: string, acceptLang?: string): Locale {
  if (cookieVal && SUPPORTED.includes(cookieVal as Locale)) return cookieVal as Locale;
  if (acceptLang) {
    const tag = acceptLang.split(",")[0].trim().split(";")[0].trim();
    if (tag.startsWith("zh")) return "zh-CN";
    if (tag.startsWith("en")) return "en";
  }
  return "zh-CN";
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = resolveLocale(
    cookieStore.get("NEXT_LOCALE")?.value,
    headerStore.get("accept-language") ?? undefined
  );
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
