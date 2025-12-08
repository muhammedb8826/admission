import { fetchGlobalData } from "../services/global.service";
import { TopHeader } from "./TopHeader";
import { Header } from "./Header";

export async function HeaderWrapper() {
  const globalData = await fetchGlobalData();

  return (
    <>
      <TopHeader data={globalData.topHeader} />
      <Header
        data={globalData.header}
        topHeaderData={globalData.topHeader}
        siteName={globalData.siteName}
      />
    </>
  );
}

