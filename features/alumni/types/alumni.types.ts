export type AlumniListItem = {
  id: string;
  documentId?: string;
  slug: string;
  fullName: string;
  jobTitle?: string;
  companyName?: string;
  location?: string;
  profileImageUrl?: string | null;
};

export type AlumniDetail = {
  id: string;
  firstName: string;
  fatherName: string;
  grandFatherName: string;
  fullName: string;
  phoneNumber?: string;
  email?: string;
  birthDate?: string;
  jobTitle?: string;
  companyName?: string;
  location?: string;
  profileImageUrl?: string | null;
};


