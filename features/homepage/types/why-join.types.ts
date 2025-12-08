export type WhyJoinCard = {
  id: string;
  title: string;
  description: string;
  iconName?: string;
  iconData?: string;
};

export type WhyJoinSection = {
  heading: string;
  subHeading?: string;
  cards: WhyJoinCard[];
};


