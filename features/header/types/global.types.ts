type StrapiMedia = {
  id?: number;
  url: string;
  alternativeText?: string;
  formats?: Record<string, { url: string }>;
};

type StrapiIcon = {
  width: number;
  height: number;
  iconData?: string;
  iconName?: string;
  isSvgEditable?: boolean;
  isIconNameEditable?: boolean;
};

export interface StrapiGlobalResponse {
  data: {
    id: number;
    documentId: string;
    siteName: string;
    siteDescription: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    favicon: StrapiMedia | null;
    defaultSeo: {
      id: number;
      metaTitle: string;
      metaDescription: string;
    };
    topHeader: {
      id: number;
      cta?: Array<{
        id: number;
        Label?: string;
        url: string;
        icon?: StrapiIcon;
      }>;
      socialIcon?: Array<{
        id: number;
        url: string;
        icon?: StrapiIcon;
      }>;
      button?: Array<{
        id: number;
        title: string;
        url: string;
        isExternal?: boolean;
      }>;
    };
    header: {
      id: number;
      logo?: StrapiMedia;
      menu?: Array<{
        id: number;
        title: string;
        url: string;
        isExternal?: boolean;
      }>;
      subMenu?: Array<{
        id: number;
        title: string;
        subMenu?: Array<{
          id: number;
          title: string;
          url?: string;
          isExternal?: boolean;
        }>;
      }>;
      button?: {
        id: number;
        title: string;
        url: string;
        isExternal?: boolean;
      };
    };
    footer?: {
      id: number;
      copyRight?: string;
      about?: {
        id: number;
        title?: string;
        description?: string;
      };
      quickLinks?: {
        id: number;
        title?: string;
        link?: Array<{
          id: number;
          title: string;
          url: string;
          isExternal?: boolean;
        }>;
      };
      contactInformation?: {
        id: number;
        title?: string;
        address?: string;
        link?: Array<{
          id: number;
          Label?: string;
          url?: string;
          icon?: StrapiIcon;
        }>;
      };
      followUs?: {
        id: number;
        title?: string;
        socialLinks?: Array<{
          id: number;
          url?: string;
          icon?: StrapiIcon;
        }>;
      };
    };
  };
  meta: Record<string, unknown>;
}

export interface GlobalData {
  siteName: string;
  siteDescription: string;
  topHeader: {
    email?: string;
    phone?: string;
    socialLinks: Array<{
      platform: string;
      url: string;
      iconName?: string;
      iconData?: string;
    }>;
    buttons: Array<{
      label: string;
      url: string;
      isPrimary?: boolean;
    }>;
  };
  header: {
    logo?: {
      url: string;
      alternativeText?: string;
    };
    navigationLinks: Array<{
      label: string;
      url: string;
      isExternal?: boolean;
    }>;
    navigationGroups: Array<{
      label: string;
      links: Array<{
        label: string;
        url: string;
        isExternal?: boolean;
      }>;
    }>;
    ctaButton?: {
      label: string;
      url: string;
      isExternal?: boolean;
    };
  };
  footer: {
    copyRight?: string;
    about?: {
      title?: string;
      description?: string;
    };
    quickLinks: {
      title?: string;
      links: Array<{
        label: string;
        url: string;
        isExternal?: boolean;
      }>;
    };
    contactInformation: {
      title?: string;
      address?: string;
      contacts: Array<{
        label?: string;
        url?: string;
        iconName?: string;
        iconData?: string;
      }>;
    };
    followUs: {
      title?: string;
      socialLinks: Array<{
        url?: string;
        iconName?: string;
        iconData?: string;
      }>;
    };
  };
}

