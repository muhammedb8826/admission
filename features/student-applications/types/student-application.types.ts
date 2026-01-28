// Student Application Form Data Types
export type StudentApplicationFormData = {
  // Page 1: Choose Term
  semester: string;
  programLevel: string;
  programType: string;
  
  // Page 2: Personal Info
  firstNameEn: string;
  firstNameAm: string;
  fatherNameEn: string;
  fatherNameAm: string;
  grandFatherNameEn: string;
  grandFatherNameAm: string;
  dateOfBirth: string;
  natioanalId: string;
  phoneNumber: string;
  emergencyPhoneNumber: string;
  maritalStatus: string;
  gender: string;
  residentialKebele: string;
  birthKebele: string;
  ptbcFullName: string;
  ptbcKebele: string;
  ptbcPhone: string;
  ptbcAltPhone: string;
  specialNeed: boolean;
  specialNeedDescription: string;
  birthCountry: number | null;
  birthRegion: number | null;
  birthZone: number | null;
  birthWoreda: number | null;
  residentialCountry: number | null;
  residentialRegion: number | null;
  residentialZone: number | null;
  residentialWoreda: number | null;
  ptbcCountry: number | null;
  ptbcRegion: number | null;
  ptbcZone: number | null;
  
  // Page 3: School Info
  previousSchool: string;
  graduationYear: string;
  gpa: string;
  
  // Page 4: Field of Study
  fieldOfStudy: string;
  preferredProgram: string;
  preferredProgramOfferingId: number | null;
  
  // Page 5: Payment
  paymentMethod: string;
  paymentReference: string;
  
  // Page 6: Required Docs
  documentsSubmitted: boolean;
};

export type ProgramOffering = {
  id: number;
  documentId?: string;
  isOpenForApply?: boolean;
  capacity?: number | null;
  capacityRemaining?: number | null;
  academic_calendar?: {
    id?: number;
    name?: string;
    academicYearRange?: string;
    isActive?: boolean;
  } | null;
  program?: {
    id?: number;
    name?: string;
    fullName?: string;
    level?: string;
    mode?: string;
  } | null;
  batch?: {
    id?: number;
    name?: string;
    code?: string | null;
  } | null;
};

// Location types for dropdowns
export type Country = {
  id: number;
  name: string;
  regions?: Region[];
};

export type Region = {
  id: number;
  name: string;
  zones?: Zone[];
};

export type Zone = {
  id: number;
  name: string;
  woredas?: Woreda[];
};

export type Woreda = {
  id: number;
  name: string;
};
