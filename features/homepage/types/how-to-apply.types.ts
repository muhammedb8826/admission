export type HowToApplyStep = {
  id: string;
  title: string;
  description?: string;
};

export type HowToApplyLink = {
  id: string;
  title: string;
  url: string;
  isExternal?: boolean | null;
};

export type HowToApplySection = {
  heading: string;
  stepsHeading?: string;
  steps: HowToApplyStep[];
  linksHeading?: string;
  links: HowToApplyLink[];
};

