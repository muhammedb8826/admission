import {
  HowToApply,
  getHowToApplySection,
} from "@/features/homepage";

export default async function HowToApplyPage() {
  const section = await getHowToApplySection();

  return (
    <main className="w-full">
      <HowToApply section={section} />
    </main>
  );
}

