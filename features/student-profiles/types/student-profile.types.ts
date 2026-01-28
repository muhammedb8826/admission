// Location relation types
export type LocationRelation = {
  id: number;
  documentId: string;
  name: string;
  [key: string]: unknown;
} | null;

// Address component type
export type AddressComponent = {
  id?: number;
  kebele?: string | null;
  houseNumber?: string | null;
  country?: LocationRelation;
  region?: LocationRelation;
  zone?: LocationRelation;
  woreda?: LocationRelation;
  [key: string]: unknown;
} | null;

// Person to be contacted component (extends Address with contact fields)
export type PersonToBeContactedComponent = AddressComponent & {
  fullName?: string | null;
  phoneNumber?: string | null;
  altPhoneNumber?: string | null;
};

// Birth address extends Address with additional fields
export type BirthAddressComponent = AddressComponent & {
  dateOfBirth?: string | null;
  phoneNumber?: string | null;
  emergencyPhoneNumber?: string | null;
  emailAddress?: string | null;
  maritalStatus?: string | null;
  gender?: string | null;
  natioanalId?: { url?: string; [key: string]: unknown } | null;
};

// Education types
export type EducationRelation = {
  id: number;
  documentId: string;
  schoolName?: string | null;
  yearStarted?: number | null;
  yearCompleted?: number | null;
  stream?: string | null;
  institution?: string | null;
  fieldOfStudy?: string | null;
  gpaScore?: number | null;
  country?: LocationRelation;
  region?: LocationRelation;
  zone?: LocationRelation;
  woreda?: LocationRelation;
  [key: string]: unknown;
} | null;

// Professional experience type
export type ProfessionalExperience = {
  id: number;
  documentId: string;
  organizationName?: string | null;
  numberOfYears?: number | null;
  positionDescription?: string | null;
  [key: string]: unknown;
};

// Research engagement type
export type ResearchEngagement = {
  id: number;
  documentId: string;
  description?: string | null;
  [key: string]: unknown;
};

// User relation type
export type UserRelation = {
  id: number;
  documentId: string;
  username?: string | null;
  email?: string | null;
  [key: string]: unknown;
} | null;

// Student Profile type
export type StudentProfile = {
  id: number;
  documentId: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  
  // Personal information
  firstNameEn?: string | null;
  firstNameAm?: string | null;
  fatherNameEn?: string | null;
  fatherNameAm?: string | null;
  grandFatherNameEn?: string | null;
  grandFatherNameAm?: string | null;
  specialNeed?: boolean | null;
  specialNeedDescription?: string | null;
  
  // Application fields
  programLevel?: string | null;
  programType?: string | null;
  semester?: string | null;
  studentType?: string | null;
  applicationStatus?: string | null;
  isProfileComplete?: boolean | null;
  
  // Relations
  user?: UserRelation;
  residentialAddress?: AddressComponent;
  birthAddress?: BirthAddressComponent;
  personToBeContacted?: PersonToBeContactedComponent;
  primary_education?: EducationRelation;
  secondary_education?: EducationRelation;
  tertiary_educations?: EducationRelation[];
  professional_experiences?: ProfessionalExperience[];
  research_engagements?: ResearchEngagement[];
  
  [key: string]: unknown;
};
