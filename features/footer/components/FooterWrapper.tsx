import { fetchGlobalData, EMPTY_GLOBAL_DATA } from "@/features/header/services/global.service";
import { Footer } from "./Footer";

export async function FooterWrapper() {
  let globalData = EMPTY_GLOBAL_DATA;

  try {
    globalData = await fetchGlobalData();
  } catch (error) {
    console.warn("Failed to fetch global data for footer:", error);
  }

  return (
    <Footer
      data={globalData.footer}
      siteName={globalData.siteName}
      siteDescription={globalData.siteDescription}
    />
  );
}

