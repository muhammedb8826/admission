import { strapiFetch, getStrapiURL } from "@/lib/strapi/client";
import { resolveImageUrl } from "@/lib/strapi/media";
import { StrapiGlobalResponse, GlobalData } from "../types/global.types";

export const EMPTY_GLOBAL_DATA: GlobalData = {
  siteName: "DADU Admission",
  siteDescription: "",
  topHeader: {
    email: undefined,
    phone: undefined,
    socialLinks: [],
    buttons: [],
  },
  header: {
    logo: undefined,
    navigationLinks: [],
    navigationGroups: [],
    ctaButton: undefined,
  },
  footer: {
    copyRight: "© DADU Admission. All rights reserved.",
    about: undefined,
    quickLinks: {
      title: undefined,
      links: [],
    },
    contactInformation: {
      title: undefined,
      address: undefined,
      contacts: [],
    },
    followUs: {
      title: undefined,
      socialLinks: [],
    },
  },
};

const GLOBAL_POPULATE = {
  topHeader: {
    populate: {
      cta: true,
      socialIcon: true,
      button: true,
    },
  },
  header: {
    populate: {
      logo: true,
      menu: true,
      subMenu: {
        populate: {
          subMenu: true,
        },
      },
      button: true,
    },
  },
  footer: {
    populate: {
      about: true,
      quickLinks: {
        populate: {
          link: true,
        },
      },
      contactInformation: {
        populate: {
          link: true,
        },
      },
      followUs: {
        populate: {
          socialLinks: true,
        },
      },
    },
  },
};

export async function fetchGlobalData(): Promise<GlobalData> {
  const response = await strapiFetch<StrapiGlobalResponse>("global", {
    params: { populate: GLOBAL_POPULATE },
    next: { revalidate: 60 }, // Cache for 1 minute
  });

  // Handle empty response (when Strapi URL is not configured)
  if (!response.data) {
    return EMPTY_GLOBAL_DATA;
  }

  const data = response.data;

  return {
    siteName: data.siteName,
    siteDescription: data.siteDescription,
    topHeader: {
      email: (() => {
        const emailCta = data.topHeader?.cta?.find(
          (item) => item.url?.includes("@") || item.Label?.includes("@")
        );
        return emailCta?.url || emailCta?.Label || undefined;
      })(),
      phone: (() => {
        const phoneCta = data.topHeader?.cta?.find(
          (item) => item.url?.startsWith("+") || item.Label?.startsWith("+")
        );
        return phoneCta?.url || phoneCta?.Label || undefined;
      })(),
      socialLinks:
        data.topHeader?.socialIcon?.map((item) => {
          // Extract platform name from iconName (e.g., "ic:baseline-facebook" -> "facebook")
          const iconName = item.icon?.iconName || "";
          const platformMatch = iconName.match(/(?:ic:baseline-|mdi:)([\w-]+)/);
          const platform = platformMatch ? platformMatch[1] : iconName.split(":")[1] || "";

          return {
            platform: platform.toLowerCase(),
            url: item.url || "",
            iconName: iconName,
            iconData: item.icon?.iconData,
          };
        }) || [],
      buttons:
        data.topHeader?.button?.map((btn) => ({
          label: btn.title || "",
          url: btn.url || "#",
          // Mark primary button (usually the last one or one with specific keywords)
          isPrimary: btn.title?.toLowerCase().includes("register") ||
                     btn.title?.toLowerCase().includes("apply") ||
                     false,
        })) || [],
    },
    header: {
      logo: (() => {
        if (!data.header?.logo?.url) return undefined;
        const resolvedUrl = resolveImageUrl(data.header.logo, getStrapiURL());
        if (!resolvedUrl) return undefined;
        return {
          url: resolvedUrl,
          alternativeText: data.header.logo.alternativeText || undefined,
        };
      })(),
      navigationLinks: [
        ...(data.header?.menu?.map((item) => ({
          label: item.title,
          url: item.url,
          isExternal: item.isExternal,
        })) || []),
      ],
      navigationGroups:
        data.header?.subMenu?.map((group) => ({
          label: group.title,
          links:
            group.subMenu?.map((link) => ({
              label: link.title,
              url: link.url || "#",
              isExternal: link.isExternal,
            })) || [],
        })) || [],
      ctaButton: data.header?.button
        ? {
            label: data.header.button.title,
            url: data.header.button.url,
            isExternal: data.header.button.isExternal,
          }
        : undefined,
    },
    footer: {
      copyRight: data.footer?.copyRight || "© DADU Admission. All rights reserved.",
      about: data.footer?.about
        ? {
            title: data.footer.about.title || undefined,
            description: data.footer.about.description || undefined,
          }
        : undefined,
      quickLinks: {
        title: data.footer?.quickLinks?.title || "Quick Links",
        links:
          data.footer?.quickLinks?.link?.map((link) => ({
            label: link.title,
            url: link.url,
            isExternal: link.isExternal,
          })) || [],
      },
      contactInformation: {
        title: data.footer?.contactInformation?.title || "Contact Us",
        address: data.footer?.contactInformation?.address || undefined,
        contacts:
          data.footer?.contactInformation?.link?.map((link) => ({
            label: link.Label || link.url || undefined,
            url: link.url || undefined,
            iconName: link.icon?.iconName || undefined,
            iconData: link.icon?.iconData || undefined,
          })) || [],
      },
      followUs: {
        title: data.footer?.followUs?.title || "Follow Us",
        socialLinks:
          data.footer?.followUs?.socialLinks?.map((social) => ({
            url: social.url || undefined,
            iconName: social.icon?.iconName || undefined,
            iconData: social.icon?.iconData || undefined,
          })) || [],
      },
    },
  };
}

