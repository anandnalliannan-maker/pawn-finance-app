import type { LucideIcon } from "lucide-react";

type AuthFeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function AuthFeatureCard({
  title,
  description,
  icon: Icon,
}: AuthFeatureCardProps) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white/12 p-3 text-amber-200">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-200">{description}</p>
    </article>
  );
}
