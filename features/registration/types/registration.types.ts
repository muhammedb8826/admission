export type RegistrationFormData = {
  // Personal Information
  firstName: string;
  fatherName: string;
  grandFatherName: string;
  phoneNumber: string;
  email: string;
  birthDate: string;
  gender: string;
  nationality: string;
  
  // Alumni Category
  alumniCategory: string;
  
  // Employment Information
  jobTitle: string;
  companyName: string;
  address: string;
  
  // Account Details
  password: string;
  confirmPassword: string;
  
  // Support
  supportDescription: string;
  supportFile?: File | null;
};

export type DropdownOption = {
  id: string;
  label: string;
  value: string;
};

export type RegistrationFormState = {
  // Personal Information
  firstName: string;
  fatherName: string;
  grandFatherName: string;
  phoneNumber: string;
  email: string;
  birthDate: string;
  gender: string; // Will store the ID
  nationality: string; // Will store the ID
  // Alumni Category
  alumniCategory: string; // Will store the ID
  // Employment Information
  jobTitle: string;
  companyName: string;
  address: string;
  // Account Details
  password: string;
  confirmPassword: string;
  // Support
  supportDescription: string;
  supportFile?: File | null;
};

