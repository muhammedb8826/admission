export type NotableAlumniItem = {
  id: string;
  documentId?: string; // Strapi documentId for fetching by documentId if numeric id fails
  slug: string;
  fullName: string;
  jobTitle?: string;
  companyName?: string;
  location?: string;
  profileImageUrl?: string | null;
};

export type HomepageNotableAlumniSection = {
  heading: string;
  subHeading?: string;
  alumni: NotableAlumniItem[];
};

