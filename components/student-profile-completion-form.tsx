"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

type Country = {
  id: number;
  documentId?: string;
  name: string;
};

type Region = {
  id: number;
  documentId?: string;
  name: string;
};

type Zone = {
  id: number;
  documentId?: string;
  name: string;
};

type Woreda = {
  id: number;
  documentId?: string;
  name: string;
};

type ProfileFormData = {
  // Personal Information
  firstNameEn: string;
  firstNameAm: string;
  fatherNameEn: string;
  fatherNameAm: string;
  grandFatherNameEn: string;
  grandFatherNameAm: string;
  specialNeed: boolean;
  specialNeedDescription: string;
  
  // Residential Address
  residentialKebele: string;
  residentialHouseNumber: string;
  residentialCountry: string | number | null;
  residentialRegion: string | number | null;
  residentialZone: string | number | null;
  residentialWoreda: string | number | null;
  
  // Birth Address
  birthKebele: string;
  birthDateOfBirth: string;
  birthPhoneNumber: string;
  birthEmergencyPhoneNumber: string;
  birthEmailAddress: string;
  birthMaritalStatus: string;
  birthGender: string;
  birthNationalId: number | null;
  birthCountry: string | number | null;
  birthRegion: string | number | null;
  birthZone: string | number | null;
  birthWoreda: string | number | null;
  
  // Person to be Contacted
  ptbcFullName: string;
  ptbcKebele: string;
  ptbcPhoneNumber: string;
  ptbcAltPhoneNumber: string;
  ptbcCountry: string | number | null;
  ptbcRegion: string | number | null;
  ptbcZone: string | number | null;
  ptbcWoreda: string | number | null;
  
  // Primary Education
  primarySchoolName: string;
  primaryYearStarted: string;
  primaryYearCompleted: string;
  primaryCountry: string | number | null;
  primaryRegion: string | number | null;
  primaryZone: string | number | null;
  primaryWoreda: string | number | null;
  
  // Secondary Education
  secondarySchoolName: string;
  secondaryStream: string;
  secondaryYearStarted: string;
  secondaryYearCompleted: string;
  secondaryCountry: string | number | null;
  secondaryRegion: string | number | null;
  secondaryZone: string | number | null;
  secondaryWoreda: string | number | null;
  
  // Tertiary Education (array - we'll handle one for now, can be extended)
  tertiaryInstitution: string;
  tertiaryFieldOfStudy: string;
  tertiaryGpaScore: string;
  tertiaryYearStarted: string;
  tertiaryYearCompleted: string;
  tertiaryCountry: string | number | null;
  tertiaryRegion: string | number | null;
  tertiaryZone: string | number | null;
  tertiaryWoreda: string | number | null;
  
  // Professional Experience (array - we'll handle one for now)
  professionalOrganizationName: string;
  professionalNumberOfYears: string;
  professionalPositionDescription: string;
  professionalAttachment: number | null;
  
  // Research Engagement (array - we'll handle one for now)
  researchDescription: string;
  researchAttachment: number | null;
};

const TOTAL_STEPS = 2;

export function StudentProfileCompletionForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [residentialAddressId, setResidentialAddressId] = useState<number | null>(null);
  const [birthAddressId, setBirthAddressId] = useState<number | null>(null);
  const [personToBeContactedId, setPersonToBeContactedId] = useState<number | null>(null);
  const [primaryEducationId, setPrimaryEducationId] = useState<number | null>(null);
  const [secondaryEducationId, setSecondaryEducationId] = useState<number | null>(null);
  const [nationalIdFileUrl, setNationalIdFileUrl] = useState<string | null>(null);
  const [isUploadingNationalId, setIsUploadingNationalId] = useState(false);
  const [professionalAttachmentUrl, setProfessionalAttachmentUrl] = useState<string | null>(null);
  const [isUploadingProfessionalAttachment, setIsUploadingProfessionalAttachment] = useState(false);
  const [researchAttachmentUrl, setResearchAttachmentUrl] = useState<string | null>(null);
  const [isUploadingResearchAttachment, setIsUploadingResearchAttachment] = useState(false);
  
  // Track last saved form data to avoid unnecessary saves
  const lastSavedFormDataRef = useRef<string | null>(null);

  // Location data state
  const [countries, setCountries] = useState<Country[]>([]);
  const [residentialRegions, setResidentialRegions] = useState<Region[]>([]);
  const [residentialZones, setResidentialZones] = useState<Zone[]>([]);
  const [residentialWoredas, setResidentialWoredas] = useState<Woreda[]>([]);
  const [birthRegions, setBirthRegions] = useState<Region[]>([]);
  const [birthZones, setBirthZones] = useState<Zone[]>([]);
  const [birthWoredas, setBirthWoredas] = useState<Woreda[]>([]);
  const [ptbcRegions, setPtbcRegions] = useState<Region[]>([]);
  const [ptbcZones, setPtbcZones] = useState<Zone[]>([]);
  const [ptbcWoredas, setPtbcWoredas] = useState<Woreda[]>([]);
  
  // Education location dropdowns
  const [primaryRegions, setPrimaryRegions] = useState<Region[]>([]);
  const [primaryZones, setPrimaryZones] = useState<Zone[]>([]);
  const [primaryWoredas, setPrimaryWoredas] = useState<Woreda[]>([]);
  const [secondaryRegions, setSecondaryRegions] = useState<Region[]>([]);
  const [secondaryZones, setSecondaryZones] = useState<Zone[]>([]);
  const [secondaryWoredas, setSecondaryWoredas] = useState<Woreda[]>([]);
  const [tertiaryRegions, setTertiaryRegions] = useState<Region[]>([]);
  const [tertiaryZones, setTertiaryZones] = useState<Zone[]>([]);
  const [tertiaryWoredas, setTertiaryWoredas] = useState<Woreda[]>([]);

  const [formData, setFormData] = useState<ProfileFormData>({
    firstNameEn: "",
    firstNameAm: "",
    fatherNameEn: "",
    fatherNameAm: "",
    grandFatherNameEn: "",
    grandFatherNameAm: "",
    specialNeed: false,
    specialNeedDescription: "",
    residentialKebele: "",
    residentialHouseNumber: "",
    residentialCountry: null,
    residentialRegion: null,
    residentialZone: null,
    residentialWoreda: null,
    birthKebele: "",
    birthDateOfBirth: "",
    birthPhoneNumber: "",
    birthEmergencyPhoneNumber: "",
    birthEmailAddress: "",
    birthMaritalStatus: "",
    birthGender: "",
    birthNationalId: null,
    birthCountry: null,
    birthRegion: null,
    birthZone: null,
    birthWoreda: null,
    ptbcFullName: "",
    ptbcKebele: "",
    ptbcPhoneNumber: "",
    ptbcAltPhoneNumber: "",
    ptbcCountry: null,
    ptbcRegion: null,
    ptbcZone: null,
    ptbcWoreda: null,
    
    // Primary Education
    primarySchoolName: "",
    primaryYearStarted: "",
    primaryYearCompleted: "",
    primaryCountry: null,
    primaryRegion: null,
    primaryZone: null,
    primaryWoreda: null,
    
    // Secondary Education
    secondarySchoolName: "",
    secondaryStream: "",
    secondaryYearStarted: "",
    secondaryYearCompleted: "",
    secondaryCountry: null,
    secondaryRegion: null,
    secondaryZone: null,
    secondaryWoreda: null,
    
    // Tertiary Education
    tertiaryInstitution: "",
    tertiaryFieldOfStudy: "",
    tertiaryGpaScore: "",
    tertiaryYearStarted: "",
    tertiaryYearCompleted: "",
    tertiaryCountry: null,
    tertiaryRegion: null,
    tertiaryZone: null,
    tertiaryWoreda: null,
    
    // Professional Experience
    professionalOrganizationName: "",
    professionalNumberOfYears: "",
    professionalPositionDescription: "",
    professionalAttachment: null,
    
    // Research Engagement
    researchDescription: "",
    researchAttachment: null,
  });

  // Fetch countries on mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch("/api/locations/countries?populate=regions");
        if (response.ok) {
          const result = await response.json();
          if (result?.data) {
            setCountries(result.data);
          }
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };
    fetchCountries();
  }, []);

  // Load existing profile data
  useEffect(() => {
    const loadExistingProfile = async () => {
      try {
        const response = await fetch("/api/student-profiles?populate[residentialAddress][populate]=*&populate[birthAddress][populate]=*&populate[personToBeContacted][populate]=*&populate[primary_education][populate]=*&populate[secondary_education][populate]=*&populate[tertiary_educations][populate]=*&populate[professional_experiences][populate]=*&populate[research_engagements][populate]=*");
        if (response.ok) {
          const result = await response.json();
          
          if (result?.data && result.data !== null) {
            const profile = result.data;
            
            if (profile.id) {
              setProfileId(profile.id);
            }
            
            // Store component IDs for updates
            if (profile.residentialAddress?.id) {
              setResidentialAddressId(profile.residentialAddress.id);
            }
            if (profile.birthAddress?.id) {
              setBirthAddressId(profile.birthAddress.id);
            }
            if (profile.personToBeContacted?.id) {
              setPersonToBeContactedId(profile.personToBeContacted.id);
            }
            if (profile.primary_education?.id) {
              setPrimaryEducationId(profile.primary_education.id);
            }
            if (profile.secondary_education?.id) {
              setSecondaryEducationId(profile.secondary_education.id);
            }
            
            // Populate form with existing data
            setFormData({
              firstNameEn: profile.firstNameEn || "",
              firstNameAm: profile.firstNameAm || "",
              fatherNameEn: profile.fatherNameEn || "",
              fatherNameAm: profile.fatherNameAm || "",
              grandFatherNameEn: profile.grandFatherNameEn || "",
              grandFatherNameAm: profile.grandFatherNameAm || "",
              specialNeed: profile.specialNeed || false,
              specialNeedDescription: profile.specialNeedDescription || "",
              
              // Residential Address
              residentialKebele: profile.residentialAddress?.kebele || "",
              residentialHouseNumber: profile.residentialAddress?.houseNumber || "",
              residentialCountry: profile.residentialAddress?.country?.documentId || profile.residentialAddress?.country?.id || null,
              residentialRegion: profile.residentialAddress?.region?.documentId || profile.residentialAddress?.region?.id || null,
              residentialZone: profile.residentialAddress?.zone?.documentId || profile.residentialAddress?.zone?.id || null,
              residentialWoreda: profile.residentialAddress?.woreda?.documentId || profile.residentialAddress?.woreda?.id || null,
              
              // Birth Address
              birthKebele: profile.birthAddress?.kebele || "",
              birthDateOfBirth: profile.birthAddress?.dateOfBirth || "",
              birthPhoneNumber: profile.birthAddress?.phoneNumber || "",
              birthEmergencyPhoneNumber: profile.birthAddress?.emergencyPhoneNumber || "",
              birthEmailAddress: profile.birthAddress?.emailAddress || "",
              birthMaritalStatus: profile.birthAddress?.maritalStatus || "",
              birthGender: profile.birthAddress?.gender || "",
              birthNationalId: profile.birthAddress?.natioanalId?.id || (typeof profile.birthAddress?.natioanalId === 'number' ? profile.birthAddress.natioanalId : null),
              birthCountry: profile.birthAddress?.country?.documentId || profile.birthAddress?.country?.id || null,
              birthRegion: profile.birthAddress?.region?.documentId || profile.birthAddress?.region?.id || null,
              birthZone: profile.birthAddress?.zone?.documentId || profile.birthAddress?.zone?.id || null,
              birthWoreda: profile.birthAddress?.woreda?.documentId || profile.birthAddress?.woreda?.id || null,
              
              // Person to be Contacted
              ptbcFullName: profile.personToBeContacted?.fullName || "",
              ptbcKebele: profile.personToBeContacted?.kebele || "",
              ptbcPhoneNumber: profile.personToBeContacted?.phoneNumber || "",
              ptbcAltPhoneNumber: profile.personToBeContacted?.altPhoneNumber || "",
              ptbcCountry: profile.personToBeContacted?.country?.documentId || profile.personToBeContacted?.country?.id || null,
              ptbcRegion: profile.personToBeContacted?.region?.documentId || profile.personToBeContacted?.region?.id || null,
              ptbcZone: profile.personToBeContacted?.zone?.documentId || profile.personToBeContacted?.zone?.id || null,
              ptbcWoreda: profile.personToBeContacted?.woreda?.documentId || profile.personToBeContacted?.woreda?.id || null,
              
              // Primary Education
              primarySchoolName: profile.primary_education?.schoolName || "",
              primaryYearStarted: profile.primary_education?.yearStarted?.toString() || "",
              primaryYearCompleted: profile.primary_education?.yearCompleted?.toString() || "",
              primaryCountry: profile.primary_education?.country?.documentId || profile.primary_education?.country?.id || null,
              primaryRegion: profile.primary_education?.region?.documentId || profile.primary_education?.region?.id || null,
              primaryZone: profile.primary_education?.zone?.documentId || profile.primary_education?.zone?.id || null,
              primaryWoreda: profile.primary_education?.woreda?.documentId || profile.primary_education?.woreda?.id || null,
              
              // Secondary Education
              secondarySchoolName: profile.secondary_education?.schoolName || "",
              secondaryStream: profile.secondary_education?.stream || "",
              secondaryYearStarted: profile.secondary_education?.yearStarted?.toString() || "",
              secondaryYearCompleted: profile.secondary_education?.yearCompleted?.toString() || "",
              secondaryCountry: profile.secondary_education?.country?.documentId || profile.secondary_education?.country?.id || null,
              secondaryRegion: profile.secondary_education?.region?.documentId || profile.secondary_education?.region?.id || null,
              secondaryZone: profile.secondary_education?.zone?.documentId || profile.secondary_education?.zone?.id || null,
              secondaryWoreda: profile.secondary_education?.woreda?.documentId || profile.secondary_education?.woreda?.id || null,
              
              // Tertiary Education (take first one if array exists)
              tertiaryInstitution: profile.tertiary_educations?.[0]?.institution || "",
              tertiaryFieldOfStudy: profile.tertiary_educations?.[0]?.fieldOfStudy || "",
              tertiaryGpaScore: profile.tertiary_educations?.[0]?.gpaScore?.toString() || "",
              tertiaryYearStarted: profile.tertiary_educations?.[0]?.yearStarted?.toString() || "",
              tertiaryYearCompleted: profile.tertiary_educations?.[0]?.yearCompleted?.toString() || "",
              tertiaryCountry: profile.tertiary_educations?.[0]?.country?.documentId || profile.tertiary_educations?.[0]?.country?.id || null,
              tertiaryRegion: profile.tertiary_educations?.[0]?.region?.documentId || profile.tertiary_educations?.[0]?.region?.id || null,
              tertiaryZone: profile.tertiary_educations?.[0]?.zone?.documentId || profile.tertiary_educations?.[0]?.zone?.id || null,
              tertiaryWoreda: profile.tertiary_educations?.[0]?.woreda?.documentId || profile.tertiary_educations?.[0]?.woreda?.id || null,
              
              // Professional Experience (take first one if array exists)
              professionalOrganizationName: profile.professional_experiences?.[0]?.organizationName || "",
              professionalNumberOfYears: profile.professional_experiences?.[0]?.numberOfYears?.toString() || "",
              professionalPositionDescription: profile.professional_experiences?.[0]?.positionDescription || "",
              professionalAttachment: profile.professional_experiences?.[0]?.attachments?.id || (typeof profile.professional_experiences?.[0]?.attachments === 'number' ? profile.professional_experiences[0].attachments : null),
              
              // Research Engagement (take first one if array exists)
              researchDescription: profile.research_engagements?.[0]?.description || "",
              researchAttachment: profile.research_engagements?.[0]?.attachments?.id || (typeof profile.research_engagements?.[0]?.attachments === 'number' ? profile.research_engagements[0].attachments : null),
            });

            // Load location dropdowns for existing data
            if (profile.residentialAddress?.country?.id) {
              await fetchRegions(profile.residentialAddress.country.id, 'residential');
              if (profile.residentialAddress?.region?.id) {
                await fetchZones(profile.residentialAddress.region.id, 'residential');
                if (profile.residentialAddress?.zone?.id) {
                  await fetchWoredas(profile.residentialAddress.zone.id, 'residential');
                }
              }
            }
            
            if (profile.birthAddress?.country?.id) {
              await fetchRegions(profile.birthAddress.country.id, 'birth');
              if (profile.birthAddress?.region?.id) {
                await fetchZones(profile.birthAddress.region.id, 'birth');
                if (profile.birthAddress?.zone?.id) {
                  await fetchWoredas(profile.birthAddress.zone.id, 'birth');
                }
              }
            }
            
            // Set national ID file URL if it exists
            if (profile.birthAddress?.natioanalId) {
              const nationalIdFile = typeof profile.birthAddress.natioanalId === 'object' 
                ? profile.birthAddress.natioanalId 
                : null;
              if (nationalIdFile?.url) {
                const strapiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
                setNationalIdFileUrl(`${strapiUrl}${nationalIdFile.url}`);
              }
            }
            
            if (profile.personToBeContacted?.country?.id) {
              await fetchRegions(profile.personToBeContacted.country.id, 'ptbc');
              if (profile.personToBeContacted?.region?.id) {
                await fetchZones(profile.personToBeContacted.region.id, 'ptbc');
                if (profile.personToBeContacted?.zone?.id) {
                  await fetchWoredas(profile.personToBeContacted.zone.id, 'ptbc');
                }
              }
            }
            
            // Load education location dropdowns
            if (profile.primary_education?.country?.id) {
              await fetchRegions(profile.primary_education.country.id, 'primary');
              if (profile.primary_education?.region?.id) {
                await fetchZones(profile.primary_education.region.id, 'primary');
                if (profile.primary_education?.zone?.id) {
                  await fetchWoredas(profile.primary_education.zone.id, 'primary');
                }
              }
            }
            
            if (profile.secondary_education?.country?.id) {
              await fetchRegions(profile.secondary_education.country.id, 'secondary');
              if (profile.secondary_education?.region?.id) {
                await fetchZones(profile.secondary_education.region.id, 'secondary');
                if (profile.secondary_education?.zone?.id) {
                  await fetchWoredas(profile.secondary_education.zone.id, 'secondary');
                }
              }
            }
            
            if (profile.tertiary_educations?.[0]?.country?.id) {
              await fetchRegions(profile.tertiary_educations[0].country.id, 'tertiary');
              if (profile.tertiary_educations[0]?.region?.id) {
                await fetchZones(profile.tertiary_educations[0].region.id, 'tertiary');
                if (profile.tertiary_educations[0]?.zone?.id) {
                  await fetchWoredas(profile.tertiary_educations[0].zone.id, 'tertiary');
                }
              }
            }
          }
          
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingProfile();
  }, []);

  // Initialize last saved form data reference after profile is loaded and formData is set
  useEffect(() => {
    if (!isLoading && formData && Object.keys(formData).length > 0 && !lastSavedFormDataRef.current) {
      lastSavedFormDataRef.current = JSON.stringify(formData);
    }
  }, [isLoading, formData]);

  // Helper function to fetch regions
  const fetchRegions = async (countryId: number, type: 'birth' | 'residential' | 'ptbc' | 'primary' | 'secondary' | 'tertiary') => {
    try {
      const response = await fetch(`/api/locations/regions?countryId=${countryId}&populate=zones`);
      if (response.ok) {
        const result = await response.json();
        if (result?.data) {
          if (type === 'birth') {
            setBirthRegions(result.data);
            setBirthZones([]);
            setBirthWoredas([]);
          } else if (type === 'residential') {
            setResidentialRegions(result.data);
            setResidentialZones([]);
            setResidentialWoredas([]);
          } else if (type === 'ptbc') {
            setPtbcRegions(result.data);
            setPtbcZones([]);
            setPtbcWoredas([]);
          } else if (type === 'primary') {
            setPrimaryRegions(result.data);
            setPrimaryZones([]);
            setPrimaryWoredas([]);
          } else if (type === 'secondary') {
            setSecondaryRegions(result.data);
            setSecondaryZones([]);
            setSecondaryWoredas([]);
          } else {
            setTertiaryRegions(result.data);
            setTertiaryZones([]);
            setTertiaryWoredas([]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
    }
  };

  // Helper function to fetch zones
  const fetchZones = async (regionId: number, type: 'birth' | 'residential' | 'ptbc' | 'primary' | 'secondary' | 'tertiary') => {
    try {
      const response = await fetch(`/api/locations/zones?regionId=${regionId}&populate=woredas`);
      if (response.ok) {
        const result = await response.json();
        if (result?.data) {
          if (type === 'birth') {
            setBirthZones(result.data);
            setBirthWoredas([]);
          } else if (type === 'residential') {
            setResidentialZones(result.data);
            setResidentialWoredas([]);
          } else if (type === 'ptbc') {
            setPtbcZones(result.data);
            setPtbcWoredas([]);
          } else if (type === 'primary') {
            setPrimaryZones(result.data);
            setPrimaryWoredas([]);
          } else if (type === 'secondary') {
            setSecondaryZones(result.data);
            setSecondaryWoredas([]);
          } else {
            setTertiaryZones(result.data);
            setTertiaryWoredas([]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching zones:", error);
    }
  };

  // Helper function to fetch woredas
  const fetchWoredas = async (zoneId: number, type: 'birth' | 'residential' | 'ptbc' | 'primary' | 'secondary' | 'tertiary') => {
    try {
      const response = await fetch(`/api/locations/woredas?zoneId=${zoneId}`);
      if (response.ok) {
        const result = await response.json();
        if (result?.data) {
          if (type === 'birth') {
            setBirthWoredas(result.data);
          } else if (type === 'residential') {
            setResidentialWoredas(result.data);
          } else if (type === 'ptbc') {
            setPtbcWoredas(result.data);
          } else if (type === 'primary') {
            setPrimaryWoredas(result.data);
          } else if (type === 'secondary') {
            setSecondaryWoredas(result.data);
          } else {
            setTertiaryWoredas(result.data);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching woredas:", error);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string | boolean | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNationalIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSubmitError("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("File size must be less than 5MB");
      return;
    }

    setIsUploadingNationalId(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload file");
      }

      // Set the file ID in form data
      handleInputChange("birthNationalId", result.id);
      
      // Set the file URL for preview
      if (result.url) {
        // If URL is already absolute, use it as is; otherwise prepend Strapi base URL
        const strapiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
        const fileUrl = result.url.startsWith('http') 
          ? result.url 
          : `${strapiUrl}${result.url}`;
        setNationalIdFileUrl(fileUrl);
      } else {
        setNationalIdFileUrl(null);
      }

      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error("Error uploading national ID:", error);
      setSubmitError(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setIsUploadingNationalId(false);
    }
  };

  const handleProfessionalAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError("File size must be less than 10MB");
      return;
    }

    setIsUploadingProfessionalAttachment(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload file");
      }

      // Set the file ID in form data
      handleInputChange("professionalAttachment", result.id);
      
      // Set the file URL for preview
      if (result.url) {
        const strapiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
        const fileUrl = result.url.startsWith('http') 
          ? result.url 
          : `${strapiUrl}${result.url}`;
        setProfessionalAttachmentUrl(fileUrl);
      } else {
        setProfessionalAttachmentUrl(null);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setSubmitError("An error occurred while uploading the file");
    } finally {
      setIsUploadingProfessionalAttachment(false);
    }
  };

  const handleResearchAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError("File size must be less than 10MB");
      return;
    }

    setIsUploadingResearchAttachment(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload file");
      }

      // Set the file ID in form data
      handleInputChange("researchAttachment", result.id);
      
      // Set the file URL for preview
      if (result.url) {
        const strapiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
        const fileUrl = result.url.startsWith('http') 
          ? result.url 
          : `${strapiUrl}${result.url}`;
        setResearchAttachmentUrl(fileUrl);
      } else {
        setResearchAttachmentUrl(null);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setSubmitError("An error occurred while uploading the file");
    } finally {
      setIsUploadingResearchAttachment(false);
    }
  };

  const resolveSelection = <T extends { id: number; documentId?: string }>(
    list: T[],
    value: string | null
  ): { id: number | null; documentId: string | null } => {
    if (!value) return { id: null, documentId: null };
    const matched = list.find(
      (item) => item.documentId === value || item.id.toString() === value
    );
    return {
      id: matched?.id ?? (Number.isNaN(Number(value)) ? null : Number(value)),
      documentId: matched?.documentId ?? null,
    };
  };

  const handleCountryChange = async (value: string | null, type: 'birth' | 'residential' | 'ptbc' | 'primary' | 'secondary' | 'tertiary') => {
    const fieldMap: Record<string, string> = {
      'birth': 'birthCountry',
      'residential': 'residentialCountry',
      'ptbc': 'ptbcCountry',
      'primary': 'primaryCountry',
      'secondary': 'secondaryCountry',
      'tertiary': 'tertiaryCountry',
    };

    const { id: countryId, documentId } = resolveSelection(countries, value);
    handleInputChange(fieldMap[type] as keyof ProfileFormData, documentId ?? countryId);

    if (countryId) {
      await fetchRegions(countryId, type);
    }
    
    // Reset dependent fields
    const resetFields: Record<string, string[]> = {
      'birth': ['birthRegion', 'birthZone', 'birthWoreda'],
      'residential': ['residentialRegion', 'residentialZone', 'residentialWoreda'],
      'ptbc': ['ptbcRegion', 'ptbcZone', 'ptbcWoreda'],
      'primary': ['primaryRegion', 'primaryZone', 'primaryWoreda'],
      'secondary': ['secondaryRegion', 'secondaryZone', 'secondaryWoreda'],
      'tertiary': ['tertiaryRegion', 'tertiaryZone', 'tertiaryWoreda'],
    };
    
    resetFields[type]?.forEach(field => {
      handleInputChange(field as keyof ProfileFormData, null);
    });
  };

  const handleRegionChange = async (value: string | null, type: 'birth' | 'residential' | 'ptbc' | 'primary' | 'secondary' | 'tertiary') => {
    const fieldMap: Record<string, string> = {
      'birth': 'birthRegion',
      'residential': 'residentialRegion',
      'ptbc': 'ptbcRegion',
      'primary': 'primaryRegion',
      'secondary': 'secondaryRegion',
      'tertiary': 'tertiaryRegion',
    };

    const regionLists: Record<string, Region[]> = {
      birth: birthRegions,
      residential: residentialRegions,
      ptbc: ptbcRegions,
      primary: primaryRegions,
      secondary: secondaryRegions,
      tertiary: tertiaryRegions,
    };

    const { id: regionId, documentId } = resolveSelection(regionLists[type], value);
    handleInputChange(fieldMap[type] as keyof ProfileFormData, documentId ?? regionId);

    if (regionId) {
      await fetchZones(regionId, type);
    }
    
    // Reset dependent fields
    const resetFields: Record<string, string[]> = {
      'birth': ['birthZone', 'birthWoreda'],
      'residential': ['residentialZone', 'residentialWoreda'],
      'ptbc': ['ptbcZone', 'ptbcWoreda'],
      'primary': ['primaryZone', 'primaryWoreda'],
      'secondary': ['secondaryZone', 'secondaryWoreda'],
      'tertiary': ['tertiaryZone', 'tertiaryWoreda'],
    };
    
    resetFields[type]?.forEach(field => {
      handleInputChange(field as keyof ProfileFormData, null);
    });
  };

  const handleZoneChange = async (value: string | null, type: 'birth' | 'residential' | 'ptbc' | 'primary' | 'secondary' | 'tertiary') => {
    const fieldMap: Record<string, string> = {
      'birth': 'birthZone',
      'residential': 'residentialZone',
      'ptbc': 'ptbcZone',
      'primary': 'primaryZone',
      'secondary': 'secondaryZone',
      'tertiary': 'tertiaryZone',
    };

    const zoneLists: Record<string, Zone[]> = {
      birth: birthZones,
      residential: residentialZones,
      ptbc: ptbcZones,
      primary: primaryZones,
      secondary: secondaryZones,
      tertiary: tertiaryZones,
    };

    const { id: zoneId, documentId } = resolveSelection(zoneLists[type], value);
    handleInputChange(fieldMap[type] as keyof ProfileFormData, documentId ?? zoneId);

    if (zoneId) {
      await fetchWoredas(zoneId, type);
    }
    
    // Reset dependent fields
    const woredaFieldMap: Record<string, string> = {
      'birth': 'birthWoreda',
      'residential': 'residentialWoreda',
      'ptbc': 'ptbcWoreda',
      'primary': 'primaryWoreda',
      'secondary': 'secondaryWoreda',
      'tertiary': 'tertiaryWoreda',
    };
    
    if (woredaFieldMap[type]) {
      handleInputChange(woredaFieldMap[type] as keyof ProfileFormData, null);
    }
  };

  // Check if form data has changed since last save
  const hasFormDataChanged = (): boolean => {
    const currentFormDataString = JSON.stringify(formData);
    return lastSavedFormDataRef.current !== currentFormDataString;
  };

  const nextStep = async () => {
    if (currentStep < TOTAL_STEPS) {
      // Only save if form data has changed
      if (hasFormDataChanged()) {
        console.log("Form data changed, saving before moving to next step...");
        const saveSuccessful = await saveProgress();
        
        // Only move to next step if save was successful
        if (saveSuccessful) {
          setCurrentStep(currentStep + 1);
        }
        // If save failed, error is already displayed by saveProgress
      } else {
        // No changes detected, just move to next step without saving
        console.log("No changes detected, skipping save and moving to next step");
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveProgress = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsSaving(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      console.log("Saving progress to backend...", { profileId, currentStep });
      // Build nested address objects
      type AddressData = {
        id?: number;
        kebele?: string;
        houseNumber?: string;
        dateOfBirth?: string;
        phoneNumber?: string;
        emergencyPhoneNumber?: string;
        emailAddress?: string;
        maritalStatus?: string;
        gender?: string;
        natioanalId?: number;
        country?: string | number;
        region?: string | number;
        zone?: string | number;
        woreda?: string | number;
        fullName?: string;
        altPhoneNumber?: string;
      };

      const residentialAddress: AddressData = {};
      if (formData.residentialKebele) residentialAddress.kebele = formData.residentialKebele;
      if (formData.residentialHouseNumber) residentialAddress.houseNumber = formData.residentialHouseNumber;
      if (formData.residentialCountry) residentialAddress.country = formData.residentialCountry;
      if (formData.residentialRegion) residentialAddress.region = formData.residentialRegion;
      if (formData.residentialZone) residentialAddress.zone = formData.residentialZone;
      if (formData.residentialWoreda) residentialAddress.woreda = formData.residentialWoreda;

      const birthAddress: AddressData = {};
      if (formData.birthKebele) birthAddress.kebele = formData.birthKebele;
      if (formData.birthDateOfBirth) birthAddress.dateOfBirth = formData.birthDateOfBirth;
      if (formData.birthPhoneNumber) birthAddress.phoneNumber = formData.birthPhoneNumber;
      if (formData.birthEmergencyPhoneNumber) birthAddress.emergencyPhoneNumber = formData.birthEmergencyPhoneNumber;
      if (formData.birthEmailAddress) birthAddress.emailAddress = formData.birthEmailAddress;
      if (formData.birthMaritalStatus) birthAddress.maritalStatus = formData.birthMaritalStatus;
      if (formData.birthGender) birthAddress.gender = formData.birthGender;
      if (formData.birthNationalId) birthAddress.natioanalId = formData.birthNationalId;
      if (formData.birthCountry) birthAddress.country = formData.birthCountry;
      if (formData.birthRegion) birthAddress.region = formData.birthRegion;
      if (formData.birthZone) birthAddress.zone = formData.birthZone;
      if (formData.birthWoreda) birthAddress.woreda = formData.birthWoreda;

      const personToBeContacted: AddressData = {};
      if (formData.ptbcFullName) personToBeContacted.fullName = formData.ptbcFullName;
      if (formData.ptbcKebele) personToBeContacted.kebele = formData.ptbcKebele;
      if (formData.ptbcPhoneNumber) personToBeContacted.phoneNumber = formData.ptbcPhoneNumber;
      if (formData.ptbcAltPhoneNumber) personToBeContacted.altPhoneNumber = formData.ptbcAltPhoneNumber;
      if (formData.ptbcCountry) personToBeContacted.country = formData.ptbcCountry;
      if (formData.ptbcRegion) personToBeContacted.region = formData.ptbcRegion;
      if (formData.ptbcZone) personToBeContacted.zone = formData.ptbcZone;
      if (formData.ptbcWoreda) personToBeContacted.woreda = formData.ptbcWoreda;

      // Build education objects
      type EducationData = {
        id?: number;
        schoolName?: string;
        institution?: string;
        fieldOfStudy?: string;
        stream?: string;
        gpaScore?: number;
        yearStarted?: number;
        yearCompleted?: number;
        country?: string | number;
        region?: string | number;
        zone?: string | number;
        woreda?: string | number;
      };

      const primaryEducation: EducationData = {};
      if (formData.primarySchoolName) primaryEducation.schoolName = formData.primarySchoolName;
      if (formData.primaryYearStarted) primaryEducation.yearStarted = Number(formData.primaryYearStarted);
      if (formData.primaryYearCompleted) primaryEducation.yearCompleted = Number(formData.primaryYearCompleted);
      if (formData.primaryCountry) primaryEducation.country = formData.primaryCountry;
      if (formData.primaryRegion) primaryEducation.region = formData.primaryRegion;
      if (formData.primaryZone) primaryEducation.zone = formData.primaryZone;
      if (formData.primaryWoreda) primaryEducation.woreda = formData.primaryWoreda;

      const secondaryEducation: EducationData = {};
      if (formData.secondarySchoolName) secondaryEducation.schoolName = formData.secondarySchoolName;
      if (formData.secondaryStream) secondaryEducation.stream = formData.secondaryStream;
      if (formData.secondaryYearStarted) secondaryEducation.yearStarted = Number(formData.secondaryYearStarted);
      if (formData.secondaryYearCompleted) secondaryEducation.yearCompleted = Number(formData.secondaryYearCompleted);
      if (formData.secondaryCountry) secondaryEducation.country = formData.secondaryCountry;
      if (formData.secondaryRegion) secondaryEducation.region = formData.secondaryRegion;
      if (formData.secondaryZone) secondaryEducation.zone = formData.secondaryZone;
      if (formData.secondaryWoreda) secondaryEducation.woreda = formData.secondaryWoreda;

      const tertiaryEducation: EducationData = {};
      if (formData.tertiaryInstitution) tertiaryEducation.institution = formData.tertiaryInstitution;
      if (formData.tertiaryFieldOfStudy) tertiaryEducation.fieldOfStudy = formData.tertiaryFieldOfStudy;
      if (formData.tertiaryGpaScore) tertiaryEducation.gpaScore = Number(formData.tertiaryGpaScore);
      if (formData.tertiaryYearStarted) tertiaryEducation.yearStarted = Number(formData.tertiaryYearStarted);
      if (formData.tertiaryYearCompleted) tertiaryEducation.yearCompleted = Number(formData.tertiaryYearCompleted);
      if (formData.tertiaryCountry) tertiaryEducation.country = formData.tertiaryCountry;
      if (formData.tertiaryRegion) tertiaryEducation.region = formData.tertiaryRegion;
      if (formData.tertiaryZone) tertiaryEducation.zone = formData.tertiaryZone;
      if (formData.tertiaryWoreda) tertiaryEducation.woreda = formData.tertiaryWoreda;

      // Build the payload - DO NOT set isProfileComplete for progress saves
      type ProfilePayload = {
        firstNameEn?: string | null;
        firstNameAm?: string | null;
        fatherNameEn?: string | null;
        fatherNameAm?: string | null;
        grandFatherNameEn?: string | null;
        grandFatherNameAm?: string | null;
        specialNeed?: boolean;
        specialNeedDescription?: string | null;
        residentialAddress?: AddressData;
        birthAddress?: AddressData;
        personToBeContacted?: AddressData;
        primary_education?: EducationData;
        secondary_education?: EducationData;
        tertiary_educations?: EducationData[];
      };

      const payload: ProfilePayload = {
        firstNameEn: formData.firstNameEn || null,
        firstNameAm: formData.firstNameAm || null,
        fatherNameEn: formData.fatherNameEn || null,
        fatherNameAm: formData.fatherNameAm || null,
        grandFatherNameEn: formData.grandFatherNameEn || null,
        grandFatherNameAm: formData.grandFatherNameAm || null,
        specialNeed: formData.specialNeed,
        specialNeedDescription: formData.specialNeedDescription || null,
      };

      // Only include address objects if they have at least one field
      // Include component ID if it exists (for updates)
      if (Object.keys(residentialAddress).length > 0) {
        if (residentialAddressId) {
          residentialAddress.id = residentialAddressId;
        }
        payload.residentialAddress = residentialAddress;
      }
      if (Object.keys(birthAddress).length > 0) {
        if (birthAddressId) {
          birthAddress.id = birthAddressId;
        }
        payload.birthAddress = birthAddress;
      }
      if (Object.keys(personToBeContacted).length > 0) {
        if (personToBeContactedId) {
          personToBeContacted.id = personToBeContactedId;
        }
        payload.personToBeContacted = personToBeContacted;
      }

      // Include education data if on step 2 or if data exists
      // Include component ID if it exists (for updates)
      if (Object.keys(primaryEducation).length > 0) {
        if (primaryEducationId) {
          primaryEducation.id = primaryEducationId;
        }
        payload.primary_education = primaryEducation;
      }
      if (Object.keys(secondaryEducation).length > 0) {
        if (secondaryEducationId) {
          secondaryEducation.id = secondaryEducationId;
        }
        payload.secondary_education = secondaryEducation;
      }
      if (Object.keys(tertiaryEducation).length > 0) {
        payload.tertiary_educations = [tertiaryEducation];
      }

      // Build professional experience data
      type ProfessionalExperienceData = {
        id?: number;
        organizationName?: string;
        numberOfYears?: number;
        positionDescription?: string;
        attachments?: number | null;
      };

      const professionalExperience: ProfessionalExperienceData = {};
      if (formData.professionalOrganizationName) professionalExperience.organizationName = formData.professionalOrganizationName;
      if (formData.professionalNumberOfYears) professionalExperience.numberOfYears = Number(formData.professionalNumberOfYears);
      if (formData.professionalPositionDescription) professionalExperience.positionDescription = formData.professionalPositionDescription;
      if (formData.professionalAttachment) professionalExperience.attachments = formData.professionalAttachment;

      // Build research engagement data
      type ResearchEngagementData = {
        id?: number;
        description?: string;
        attachments?: number | null;
      };

      const researchEngagement: ResearchEngagementData = {};
      if (formData.researchDescription) researchEngagement.description = formData.researchDescription;
      if (formData.researchAttachment) researchEngagement.attachments = formData.researchAttachment;

      // Add professional experience and research engagement to payload
      type ExtendedProfilePayload = ProfilePayload & {
        professional_experiences?: ProfessionalExperienceData[];
        research_engagements?: ResearchEngagementData[];
      };
      
      const extendedPayload = payload as ExtendedProfilePayload;
      if (Object.keys(professionalExperience).length > 0) {
        extendedPayload.professional_experiences = [professionalExperience];
        console.log("Professional experience payload (saveProgress):", {
          hasAttachment: !!professionalExperience.attachments,
          attachmentId: professionalExperience.attachments,
          formDataAttachment: formData.professionalAttachment,
          allFields: Object.keys(professionalExperience),
        });
      }
      if (Object.keys(researchEngagement).length > 0) {
        extendedPayload.research_engagements = [researchEngagement];
        console.log("Research engagement payload (saveProgress):", {
          hasAttachment: !!researchEngagement.attachments,
          attachmentId: researchEngagement.attachments,
          formDataAttachment: formData.researchAttachment,
        });
      }

      const url = "/api/student-profiles";
      const method = profileId ? "PUT" : "POST";
      const body = { data: extendedPayload };

      console.log("Saving progress to backend:", { method, url, profileId, payloadKeys: Object.keys(extendedPayload) });

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      console.log("Save progress response:", { ok: response.ok, status: response.status, hasData: !!result?.data });

      if (!response.ok) {
        // Handle 403 Forbidden - provide helpful error message
        if (response.status === 403) {
          // API returns { error: string, details: object }
          // Strapi error structure: { error: { status, name, message, details } }
          const errorMessage = 
            result?.error || // Direct error message from API route
            result?.details?.error?.message || // Strapi error message
            result?.error?.message || // Alternative structure
            result?.message || 
            "Access denied. You don't have permission to save this profile. Please check Strapi permissions or contact support.";
          setSubmitError(errorMessage);
          console.error("403 Forbidden error in saveProgress:", {
            status: response.status,
            fullResult: result,
            errorMessage: result?.error,
            details: result?.details,
            profileId,
          });
          return false;
        }
        
        // Handle 400 - profile ID mismatch, update ID and retry
        if (response.status === 400 && (result?.details?.actualProfileId || result?.error?.includes("Profile ID mismatch"))) {
          const actualProfileId = result?.details?.actualProfileId;
          if (actualProfileId && actualProfileId !== profileId) {
            console.log("Profile ID mismatch detected in saveProgress, updating to:", actualProfileId);
            setProfileId(actualProfileId);
            
            // Retry the save with the correct ID
            const retryBody = { data: extendedPayload };
            const retryResponse = await fetch(url, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(retryBody),
            });
            
            const retryResult = await retryResponse.json();
            if (retryResponse.ok) {
              const savedProfile = retryResult?.data?.data || retryResult?.data;
              if (savedProfile?.id) {
                setProfileId(savedProfile.id);
                // Update component IDs if they exist
                if (savedProfile.residentialAddress?.id) {
                  setResidentialAddressId(savedProfile.residentialAddress.id);
                }
                if (savedProfile.birthAddress?.id) {
                  setBirthAddressId(savedProfile.birthAddress.id);
                }
                if (savedProfile.personToBeContacted?.id) {
                  setPersonToBeContactedId(savedProfile.personToBeContacted.id);
                }
                if (savedProfile.primary_education?.id) {
                  setPrimaryEducationId(savedProfile.primary_education.id);
                }
                if (savedProfile.secondary_education?.id) {
                  setSecondaryEducationId(savedProfile.secondary_education.id);
                }
                // Note: tertiary_educations, professional_experiences, and research_engagements
                // are relations (oneToMany), so we don't track individual IDs for them
                // They are handled by the API route when creating/updating
              }
              
              // Update last saved form data reference
              lastSavedFormDataRef.current = JSON.stringify(formData);
              
              setSubmitSuccess(true);
              setSubmitError(null);
              setTimeout(() => {
                setSubmitSuccess(false);
              }, 3000);
              return true; // Success
            } else {
              // Retry also failed, fall through to error handling
              console.error("Retry after ID update failed:", retryResult);
            }
          }
        }
        
        // Handle 400 - profile ID mismatch (old format), update ID and retry
        if (response.status === 400 && result?.details?.actualProfileId && !result?.error?.includes("Profile ID mismatch")) {
          const actualProfileId = result.details.actualProfileId;
          console.log("Profile ID mismatch detected, updating to:", actualProfileId);
          setProfileId(actualProfileId);
          
          // Retry the save with the correct ID
          const retryBody = { data: extendedPayload };
          const retryResponse = await fetch(url, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(retryBody),
          });
          
          const retryResult = await retryResponse.json();
          if (retryResponse.ok) {
            const savedProfile = retryResult?.data?.data || retryResult?.data;
            if (savedProfile?.id) {
              setProfileId(savedProfile.id);
              // Update component IDs if they exist
              if (savedProfile.residentialAddress?.id) {
                setResidentialAddressId(savedProfile.residentialAddress.id);
              }
              if (savedProfile.birthAddress?.id) {
                setBirthAddressId(savedProfile.birthAddress.id);
              }
              if (savedProfile.personToBeContacted?.id) {
                setPersonToBeContactedId(savedProfile.personToBeContacted.id);
              }
              if (savedProfile.primary_education?.id) {
                setPrimaryEducationId(savedProfile.primary_education.id);
              }
              if (savedProfile.secondary_education?.id) {
                setSecondaryEducationId(savedProfile.secondary_education.id);
              }
            }
            console.log("Progress saved successfully after ID update!");
            setSubmitSuccess(true);
            setSubmitError(null);
            
            // Update last saved form data reference
            lastSavedFormDataRef.current = JSON.stringify(formData);
            
            setTimeout(() => {
              setSubmitSuccess(false);
            }, 3000);
            setIsSaving(false);
            return true; // Exit early on success
          } else {
            // Retry also failed, fall through to error handling
            console.error("Retry after ID update failed:", retryResult);
          }
        }
        
        // Handle 404 - profile not found, try to reload profile or create new one
        if (response.status === 404) {
          console.log("Profile not found, attempting to reload profile data...");
          
          // Try to reload the profile to get the correct ID
          try {
            const reloadResponse = await fetch("/api/student-profiles?populate[residentialAddress][populate]=*&populate[birthAddress][populate]=*&populate[personToBeContacted][populate]=*&populate[primary_education][populate]=*&populate[secondary_education][populate]=*&populate[tertiary_educations][populate]=*");
            if (reloadResponse.ok) {
              const reloadResult = await reloadResponse.json();
              if (reloadResult?.data?.id) {
                // Found the profile, update the ID and retry
                const correctProfileId = reloadResult.data.id;
                console.log("Found correct profile ID:", correctProfileId, "retrying save...");
                setProfileId(correctProfileId);
                
                // Retry the save with the correct ID
                const retryBody = { data: payload };
                const retryResponse = await fetch(url, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(retryBody),
                });
                
                const retryResult = await retryResponse.json();
                if (retryResponse.ok) {
                  // Success on retry
                  const savedProfile = retryResult?.data?.data || retryResult?.data;
                  if (savedProfile?.id) {
                    setProfileId(savedProfile.id);
                    // Update component IDs
                    if (savedProfile.residentialAddress?.id && !residentialAddressId) {
                      setResidentialAddressId(savedProfile.residentialAddress.id);
                    }
                    if (savedProfile.birthAddress?.id && !birthAddressId) {
                      setBirthAddressId(savedProfile.birthAddress.id);
                    }
                    if (savedProfile.personToBeContacted?.id && !personToBeContactedId) {
                      setPersonToBeContactedId(savedProfile.personToBeContacted.id);
                    }
                    if (savedProfile.primary_education?.id && !primaryEducationId) {
                      setPrimaryEducationId(savedProfile.primary_education.id);
                    }
                    if (savedProfile.secondary_education?.id && !secondaryEducationId) {
                      setSecondaryEducationId(savedProfile.secondary_education.id);
                    }
                  }
                  console.log("Progress saved successfully after retry!");
                  setSubmitSuccess(true);
                  setSubmitError(null);
                  
                  // Update last saved form data reference
                  lastSavedFormDataRef.current = JSON.stringify(formData);
                  
                  setTimeout(() => {
                    setSubmitSuccess(false);
                  }, 3000);
                  setIsSaving(false);
                  return true; // Exit early on success
                } else {
                  // Retry also failed, fall through to error handling
                  console.error("Retry also failed:", retryResult);
                }
              } else {
                // No profile exists, create a new one
                console.log("No profile exists, creating new one...");
                const createBody = { data: payload };
                const createResponse = await fetch(url, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(createBody),
                });
                
                const createResult = await createResponse.json();
                if (createResponse.ok) {
                  const savedProfile = createResult?.data?.data || createResult?.data;
                  if (savedProfile?.id) {
                    setProfileId(savedProfile.id);
                    // Update component IDs
                    if (savedProfile.residentialAddress?.id && !residentialAddressId) {
                      setResidentialAddressId(savedProfile.residentialAddress.id);
                    }
                    if (savedProfile.birthAddress?.id && !birthAddressId) {
                      setBirthAddressId(savedProfile.birthAddress.id);
                    }
                    if (savedProfile.personToBeContacted?.id && !personToBeContactedId) {
                      setPersonToBeContactedId(savedProfile.personToBeContacted.id);
                    }
                    if (savedProfile.primary_education?.id && !primaryEducationId) {
                      setPrimaryEducationId(savedProfile.primary_education.id);
                    }
                    if (savedProfile.secondary_education?.id && !secondaryEducationId) {
                      setSecondaryEducationId(savedProfile.secondary_education.id);
                    }
                  }
                  console.log("Profile created successfully!");
                  setSubmitSuccess(true);
                  setSubmitError(null);
                  
                  // Update last saved form data reference
                  lastSavedFormDataRef.current = JSON.stringify(formData);
                  
                  setTimeout(() => {
                    setSubmitSuccess(false);
                  }, 3000);
                  setIsSaving(false);
                  return true; // Exit early on success
                } else {
                  // Create also failed, fall through to error handling
                  console.error("Create also failed:", createResult);
                }
              }
            }
          } catch (reloadError) {
            console.error("Error reloading profile:", reloadError);
          }
        }
        
        const errorMessage = 
          result?.error?.message || 
          result?.error || 
          result?.message || 
          "Failed to save progress";
        console.error("Save progress failed:", errorMessage, result);
        setSubmitError(errorMessage);
        throw new Error(errorMessage);
      }

      // Update profileId if it was a new profile
      const savedProfile = result?.data?.data || result?.data;
      if (savedProfile?.id) {
        if (!profileId) {
          setProfileId(savedProfile.id);
          console.log("Profile created with ID:", savedProfile.id);
        } else {
          console.log("Profile updated successfully, ID:", profileId);
        }
        
        // Update component IDs if they were created/updated
        if (savedProfile.residentialAddress?.id && !residentialAddressId) {
          setResidentialAddressId(savedProfile.residentialAddress.id);
        }
        if (savedProfile.birthAddress?.id && !birthAddressId) {
          setBirthAddressId(savedProfile.birthAddress.id);
        }
        if (savedProfile.personToBeContacted?.id && !personToBeContactedId) {
          setPersonToBeContactedId(savedProfile.personToBeContacted.id);
        }
        if (savedProfile.primary_education?.id && !primaryEducationId) {
          setPrimaryEducationId(savedProfile.primary_education.id);
        }
        if (savedProfile.secondary_education?.id && !secondaryEducationId) {
          setSecondaryEducationId(savedProfile.secondary_education.id);
        }
      }

      console.log("Progress saved successfully to backend!");
      setSubmitSuccess(true);
      setSubmitError(null);
      
      // Update last saved form data reference
      lastSavedFormDataRef.current = JSON.stringify(formData);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
      
      return true; // Return success
    } catch (error) {
      console.error("Error saving progress:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save progress. Please try again.";
      setSubmitError(errorMessage);
      return false; // Return failure
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Build nested address objects
      type AddressData = {
        id?: number;
        kebele?: string;
        houseNumber?: string;
        dateOfBirth?: string;
        phoneNumber?: string;
        emergencyPhoneNumber?: string;
        emailAddress?: string;
        maritalStatus?: string;
        gender?: string;
        natioanalId?: number;
        country?: string | number;
        region?: string | number;
        zone?: string | number;
        woreda?: string | number;
        fullName?: string;
        altPhoneNumber?: string;
      };

      const residentialAddress: AddressData = {};
      if (formData.residentialKebele) residentialAddress.kebele = formData.residentialKebele;
      if (formData.residentialHouseNumber) residentialAddress.houseNumber = formData.residentialHouseNumber;
      if (formData.residentialCountry) residentialAddress.country = formData.residentialCountry;
      if (formData.residentialRegion) residentialAddress.region = formData.residentialRegion;
      if (formData.residentialZone) residentialAddress.zone = formData.residentialZone;
      if (formData.residentialWoreda) residentialAddress.woreda = formData.residentialWoreda;

      const birthAddress: AddressData = {};
      if (formData.birthKebele) birthAddress.kebele = formData.birthKebele;
      if (formData.birthDateOfBirth) birthAddress.dateOfBirth = formData.birthDateOfBirth;
      if (formData.birthPhoneNumber) birthAddress.phoneNumber = formData.birthPhoneNumber;
      if (formData.birthEmergencyPhoneNumber) birthAddress.emergencyPhoneNumber = formData.birthEmergencyPhoneNumber;
      if (formData.birthEmailAddress) birthAddress.emailAddress = formData.birthEmailAddress;
      if (formData.birthMaritalStatus) birthAddress.maritalStatus = formData.birthMaritalStatus;
      if (formData.birthGender) birthAddress.gender = formData.birthGender;
      if (formData.birthNationalId) birthAddress.natioanalId = formData.birthNationalId;
      if (formData.birthCountry) birthAddress.country = formData.birthCountry;
      if (formData.birthRegion) birthAddress.region = formData.birthRegion;
      if (formData.birthZone) birthAddress.zone = formData.birthZone;
      if (formData.birthWoreda) birthAddress.woreda = formData.birthWoreda;

      const personToBeContacted: AddressData = {};
      if (formData.ptbcFullName) personToBeContacted.fullName = formData.ptbcFullName;
      if (formData.ptbcKebele) personToBeContacted.kebele = formData.ptbcKebele;
      if (formData.ptbcPhoneNumber) personToBeContacted.phoneNumber = formData.ptbcPhoneNumber;
      if (formData.ptbcAltPhoneNumber) personToBeContacted.altPhoneNumber = formData.ptbcAltPhoneNumber;
      if (formData.ptbcCountry) personToBeContacted.country = formData.ptbcCountry;
      if (formData.ptbcRegion) personToBeContacted.region = formData.ptbcRegion;
      if (formData.ptbcZone) personToBeContacted.zone = formData.ptbcZone;
      if (formData.ptbcWoreda) personToBeContacted.woreda = formData.ptbcWoreda;

      // Build education objects
      type EducationData = {
        id?: number;
        schoolName?: string;
        institution?: string;
        fieldOfStudy?: string;
        stream?: string;
        gpaScore?: number;
        yearStarted?: number;
        yearCompleted?: number;
        country?: string | number;
        region?: string | number;
        zone?: string | number;
        woreda?: string | number;
      };

      const primaryEducation: EducationData = {};
      if (formData.primarySchoolName) primaryEducation.schoolName = formData.primarySchoolName;
      if (formData.primaryYearStarted) primaryEducation.yearStarted = Number(formData.primaryYearStarted);
      if (formData.primaryYearCompleted) primaryEducation.yearCompleted = Number(formData.primaryYearCompleted);
      if (formData.primaryCountry) primaryEducation.country = formData.primaryCountry;
      if (formData.primaryRegion) primaryEducation.region = formData.primaryRegion;
      if (formData.primaryZone) primaryEducation.zone = formData.primaryZone;
      if (formData.primaryWoreda) primaryEducation.woreda = formData.primaryWoreda;

      const secondaryEducation: EducationData = {};
      if (formData.secondarySchoolName) secondaryEducation.schoolName = formData.secondarySchoolName;
      if (formData.secondaryStream) secondaryEducation.stream = formData.secondaryStream;
      if (formData.secondaryYearStarted) secondaryEducation.yearStarted = Number(formData.secondaryYearStarted);
      if (formData.secondaryYearCompleted) secondaryEducation.yearCompleted = Number(formData.secondaryYearCompleted);
      if (formData.secondaryCountry) secondaryEducation.country = formData.secondaryCountry;
      if (formData.secondaryRegion) secondaryEducation.region = formData.secondaryRegion;
      if (formData.secondaryZone) secondaryEducation.zone = formData.secondaryZone;
      if (formData.secondaryWoreda) secondaryEducation.woreda = formData.secondaryWoreda;

      const tertiaryEducation: EducationData = {};
      if (formData.tertiaryInstitution) tertiaryEducation.institution = formData.tertiaryInstitution;
      if (formData.tertiaryFieldOfStudy) tertiaryEducation.fieldOfStudy = formData.tertiaryFieldOfStudy;
      if (formData.tertiaryGpaScore) tertiaryEducation.gpaScore = Number(formData.tertiaryGpaScore);
      if (formData.tertiaryYearStarted) tertiaryEducation.yearStarted = Number(formData.tertiaryYearStarted);
      if (formData.tertiaryYearCompleted) tertiaryEducation.yearCompleted = Number(formData.tertiaryYearCompleted);
      if (formData.tertiaryCountry) tertiaryEducation.country = formData.tertiaryCountry;
      if (formData.tertiaryRegion) tertiaryEducation.region = formData.tertiaryRegion;
      if (formData.tertiaryZone) tertiaryEducation.zone = formData.tertiaryZone;
      if (formData.tertiaryWoreda) tertiaryEducation.woreda = formData.tertiaryWoreda;

      // Build the payload
      type ProfilePayload = {
        firstNameEn?: string | null;
        firstNameAm?: string | null;
        fatherNameEn?: string | null;
        fatherNameAm?: string | null;
        grandFatherNameEn?: string | null;
        grandFatherNameAm?: string | null;
        specialNeed?: boolean;
        specialNeedDescription?: string | null;
        residentialAddress?: AddressData;
        birthAddress?: AddressData;
        personToBeContacted?: AddressData;
        primary_education?: EducationData;
        secondary_education?: EducationData;
        tertiary_educations?: EducationData[];
        isProfileComplete?: boolean;
      };

      const payload: ProfilePayload = {
        firstNameEn: formData.firstNameEn || null,
        firstNameAm: formData.firstNameAm || null,
        fatherNameEn: formData.fatherNameEn || null,
        fatherNameAm: formData.fatherNameAm || null,
        grandFatherNameEn: formData.grandFatherNameEn || null,
        grandFatherNameAm: formData.grandFatherNameAm || null,
        specialNeed: formData.specialNeed,
        specialNeedDescription: formData.specialNeedDescription || null,
      };

      // Only include address objects if they have at least one field
      // Include component ID if it exists (for updates)
      if (Object.keys(residentialAddress).length > 0) {
        if (residentialAddressId) {
          residentialAddress.id = residentialAddressId;
        }
        payload.residentialAddress = residentialAddress;
      }
      if (Object.keys(birthAddress).length > 0) {
        if (birthAddressId) {
          birthAddress.id = birthAddressId;
        }
        payload.birthAddress = birthAddress;
      }
      if (Object.keys(personToBeContacted).length > 0) {
        if (personToBeContactedId) {
          personToBeContacted.id = personToBeContactedId;
        }
        payload.personToBeContacted = personToBeContacted;
      }

      // Only include education objects if they have at least one field
      // Include component ID if it exists (for updates)
      if (Object.keys(primaryEducation).length > 0) {
        if (primaryEducationId) {
          primaryEducation.id = primaryEducationId;
        }
        payload.primary_education = primaryEducation;
      }
      if (Object.keys(secondaryEducation).length > 0) {
        if (secondaryEducationId) {
          secondaryEducation.id = secondaryEducationId;
        }
        payload.secondary_education = secondaryEducation;
      }
      if (Object.keys(tertiaryEducation).length > 0) {
        payload.tertiary_educations = [tertiaryEducation];
      }

      // Build professional experience data
      type ProfessionalExperienceData = {
        id?: number;
        organizationName?: string;
        numberOfYears?: number;
        positionDescription?: string;
        attachments?: number | null;
      };

      const professionalExperience: ProfessionalExperienceData = {};
      if (formData.professionalOrganizationName) professionalExperience.organizationName = formData.professionalOrganizationName;
      if (formData.professionalNumberOfYears) professionalExperience.numberOfYears = Number(formData.professionalNumberOfYears);
      if (formData.professionalPositionDescription) professionalExperience.positionDescription = formData.professionalPositionDescription;
      if (formData.professionalAttachment) professionalExperience.attachments = formData.professionalAttachment;

      // Build research engagement data
      type ResearchEngagementData = {
        id?: number;
        description?: string;
        attachments?: number | null;
      };

      const researchEngagement: ResearchEngagementData = {};
      if (formData.researchDescription) researchEngagement.description = formData.researchDescription;
      if (formData.researchAttachment) researchEngagement.attachments = formData.researchAttachment;

      // Add professional experience and research engagement to payload
      type ExtendedProfilePayload = ProfilePayload & {
        professional_experiences?: ProfessionalExperienceData[];
        research_engagements?: ResearchEngagementData[];
      };
      
      const extendedPayload = payload as ExtendedProfilePayload;
      if (Object.keys(professionalExperience).length > 0) {
        extendedPayload.professional_experiences = [professionalExperience];
      }
      if (Object.keys(researchEngagement).length > 0) {
        extendedPayload.research_engagements = [researchEngagement];
      }

      // Mark profile as complete
      extendedPayload.isProfileComplete = true;

      const url = "/api/student-profiles";
      const method = profileId ? "PUT" : "POST";
      const body = { data: payload };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      // Get response text first to handle empty or malformed JSON
      const responseText = await response.text();
      let result: {
        error?: string | { message?: string };
        details?: { actualProfileId?: number; error?: { message?: string } };
        data?: { data?: { id?: number }; id?: number };
        message?: string;
        profileIdChanged?: boolean;
        newProfileId?: number;
      } = {};
      
      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error("Failed to parse response JSON in handleSubmit:", {
          parseError,
          responseText,
          status: response.status,
          statusText: response.statusText,
        });
        result = { error: responseText || "Failed to parse server response" };
      }
      
      console.log("handleSubmit response:", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        responseTextLength: responseText?.length,
        hasResult: !!result,
        resultKeys: Object.keys(result),
        resultError: result?.error,
        resultDetails: result?.details,
        fullResult: result,
      });

      if (!response.ok) {
        // Handle 400 - profile ID mismatch, update ID and retry
        if (response.status === 400 && result?.details?.actualProfileId) {
          const actualProfileId = result.details.actualProfileId;
          console.log("Profile ID mismatch detected in handleSubmit, updating to:", actualProfileId);
          setProfileId(actualProfileId);
          
          // Retry the save with the correct ID
          const retryBody = { data: { ...extendedPayload, isProfileComplete: true } };
          const retryResponse = await fetch(url, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(retryBody),
          });
          
          const retryResult = await retryResponse.json();
          if (retryResponse.ok) {
            const savedProfile = retryResult?.data?.data || retryResult?.data;
            if (savedProfile?.id) {
              setProfileId(savedProfile.id);
            }
            setSubmitSuccess(true);
            setTimeout(() => {
              router.push("/dashboard/profile");
            }, 2000);
            setIsSaving(false);
            return; // Exit early on success
          } else {
            // Retry also failed, fall through to error handling
            console.error("Retry after ID update failed:", retryResult);
          }
        }
        
        // Handle 403 Forbidden - provide helpful error message
        if (response.status === 403) {
          // API returns { error: string, details: object }
          // Strapi error structure: { error: { status, name, message, details } }
          const errorMessage = 
            (typeof result?.error === 'string' ? result.error : undefined) || // Direct error message from API route
            result?.details?.error?.message || // Strapi error message
            (typeof result?.error === 'object' && result.error?.message) || // Alternative structure
            result?.message || 
            "Access denied. You don't have permission to update this profile. Please check Strapi permissions or contact support.";
          setSubmitError(errorMessage);
          console.error("403 Forbidden error:", {
            status: response.status,
            statusText: response.statusText,
            fullResult: result,
            resultStringified: JSON.stringify(result, null, 2),
            errorMessage: result?.error,
            details: result?.details,
            detailsError: result?.details?.error,
            profileId,
            payloadKeys: Object.keys(extendedPayload),
            url,
            method,
          });
          throw new Error(errorMessage);
        }
        
        const errorMessage = 
          (typeof result?.error === 'object' && result.error?.message) ||
          (typeof result?.error === 'string' ? result.error : undefined) ||
          result?.message || 
          `Failed to save profile (Status: ${response.status})`;
        setSubmitError(errorMessage);
        console.error("Save profile error:", {
          status: response.status,
          error: result,
          profileId,
        });
        throw new Error(errorMessage);
      }

      // Success - update profile ID if it changed
      const savedProfile = result?.data?.data || result?.data;
      
      // Check if profile ID changed (indicates a new profile was created)
      if (result?.profileIdChanged && result?.newProfileId) {
        console.warn("Profile ID changed during final save:", {
          oldId: profileId,
          newId: result.newProfileId,
        });
        setProfileId(result.newProfileId);
        setSubmitError("Profile was saved but a new profile was created. Please refresh the page.");
      } else if (savedProfile?.id && savedProfile.id !== profileId) {
        console.log("Profile ID changed from", profileId, "to", savedProfile.id);
        setProfileId(savedProfile.id);
      }

      setSubmitSuccess(true);
      
      // Redirect to profile page after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/profile");
      }, 2000);
    } catch (error) {
      console.error("Error saving profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save profile. Please try again.";
      setSubmitError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {submitSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {currentStep === 2 
              ? "Profile saved successfully! Redirecting..."
              : "Progress saved successfully! You can continue later."}
          </AlertDescription>
        </Alert>
      )}

      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
            {currentStep > 1 ? <CheckCircle2 className="h-5 w-5" /> : '1'}
          </div>
          <span className="ml-2 font-medium">Personal Information</span>
        </div>
        <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted-foreground'}`} />
        <div className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep >= 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
            2
          </div>
          <span className="ml-2 font-medium">School Information</span>
        </div>
      </div>

      {/* Step 1: Personal Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Enter your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstNameEn">First Name (English) *</Label>
              <Input
                id="firstNameEn"
                value={formData.firstNameEn}
                onChange={(e) => handleInputChange("firstNameEn", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstNameAm">First Name (Amharic)</Label>
              <Input
                id="firstNameAm"
                value={formData.firstNameAm}
                onChange={(e) => handleInputChange("firstNameAm", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatherNameEn">Father Name (English) *</Label>
              <Input
                id="fatherNameEn"
                value={formData.fatherNameEn}
                onChange={(e) => handleInputChange("fatherNameEn", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatherNameAm">Father Name (Amharic)</Label>
              <Input
                id="fatherNameAm"
                value={formData.fatherNameAm}
                onChange={(e) => handleInputChange("fatherNameAm", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grandFatherNameEn">Grandfather Name (English) *</Label>
              <Input
                id="grandFatherNameEn"
                value={formData.grandFatherNameEn}
                onChange={(e) => handleInputChange("grandFatherNameEn", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grandFatherNameAm">Grandfather Name (Amharic)</Label>
              <Input
                id="grandFatherNameAm"
                value={formData.grandFatherNameAm}
                onChange={(e) => handleInputChange("grandFatherNameAm", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="specialNeed"
              checked={formData.specialNeed}
              onCheckedChange={(checked) => handleInputChange("specialNeed", checked === true)}
            />
            <Label htmlFor="specialNeed" className="cursor-pointer">
              I have special needs
            </Label>
          </div>

          {formData.specialNeed && (
            <div className="space-y-2">
              <Label htmlFor="specialNeedDescription">Special Need Description</Label>
              <Input
                id="specialNeedDescription"
                value={formData.specialNeedDescription}
                onChange={(e) => handleInputChange("specialNeedDescription", e.target.value)}
                placeholder="Please describe your special needs"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Residential Address */}
      <Card>
        <CardHeader>
          <CardTitle>Residential Address</CardTitle>
          <CardDescription>Your current residential address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="residentialCountry">Country</Label>
              <Select
                value={formData.residentialCountry?.toString() || ""}
                onValueChange={(value) => handleCountryChange(value || null, 'residential')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.documentId || country.id.toString()}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="residentialRegion">Region</Label>
              <Select
                value={formData.residentialRegion?.toString() || ""}
                onValueChange={(value) => handleRegionChange(value || null, 'residential')}
                disabled={!formData.residentialCountry}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {residentialRegions.map((region) => (
                    <SelectItem key={region.id} value={region.documentId || region.id.toString()}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="residentialZone">Zone</Label>
              <Select
                value={formData.residentialZone?.toString() || ""}
                onValueChange={(value) => handleZoneChange(value || null, 'residential')}
                disabled={!formData.residentialRegion}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {residentialZones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.documentId || zone.id.toString()}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="residentialWoreda">Woreda</Label>
              <Select
                value={formData.residentialWoreda?.toString() || ""}
                onValueChange={(value) => {
                  const resolved = resolveSelection(residentialWoredas, value || null);
                  handleInputChange("residentialWoreda", resolved.documentId ?? resolved.id);
                }}
                disabled={!formData.residentialZone}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select woreda" />
                </SelectTrigger>
                <SelectContent>
                  {residentialWoredas.map((woreda) => (
                    <SelectItem key={woreda.id} value={woreda.documentId || woreda.id.toString()}>
                      {woreda.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="residentialKebele">Kebele</Label>
              <Input
                id="residentialKebele"
                value={formData.residentialKebele}
                onChange={(e) => handleInputChange("residentialKebele", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="residentialHouseNumber">House Number</Label>
              <Input
                id="residentialHouseNumber"
                value={formData.residentialHouseNumber}
                onChange={(e) => handleInputChange("residentialHouseNumber", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Birth Address */}
      <Card>
        <CardHeader>
          <CardTitle>Birth Address & Personal Details</CardTitle>
          <CardDescription>Your birth address and personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="birthCountry">Country</Label>
              <Select
                value={formData.birthCountry?.toString() || ""}
                onValueChange={(value) => handleCountryChange(value || null, 'birth')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.documentId || country.id.toString()}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthRegion">Region</Label>
              <Select
                value={formData.birthRegion?.toString() || ""}
                onValueChange={(value) => handleRegionChange(value || null, 'birth')}
                disabled={!formData.birthCountry}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {birthRegions.map((region) => (
                    <SelectItem key={region.id} value={region.documentId || region.id.toString()}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthZone">Zone</Label>
              <Select
                value={formData.birthZone?.toString() || ""}
                onValueChange={(value) => handleZoneChange(value || null, 'birth')}
                disabled={!formData.birthRegion}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {birthZones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.documentId || zone.id.toString()}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthWoreda">Woreda</Label>
              <Select
                value={formData.birthWoreda?.toString() || ""}
                onValueChange={(value) => {
                  const resolved = resolveSelection(birthWoredas, value || null);
                  handleInputChange("birthWoreda", resolved.documentId ?? resolved.id);
                }}
                disabled={!formData.birthZone}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select woreda" />
                </SelectTrigger>
                <SelectContent>
                  {birthWoredas.map((woreda) => (
                    <SelectItem key={woreda.id} value={woreda.documentId || woreda.id.toString()}>
                      {woreda.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthKebele">Kebele</Label>
              <Input
                id="birthKebele"
                value={formData.birthKebele}
                onChange={(e) => handleInputChange("birthKebele", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDateOfBirth">Date of Birth</Label>
              <Input
                id="birthDateOfBirth"
                type="date"
                value={formData.birthDateOfBirth}
                onChange={(e) => handleInputChange("birthDateOfBirth", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthPhoneNumber">Phone Number</Label>
              <Input
                id="birthPhoneNumber"
                value={formData.birthPhoneNumber}
                onChange={(e) => handleInputChange("birthPhoneNumber", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthEmergencyPhoneNumber">Emergency Phone Number</Label>
              <Input
                id="birthEmergencyPhoneNumber"
                value={formData.birthEmergencyPhoneNumber}
                onChange={(e) => handleInputChange("birthEmergencyPhoneNumber", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthEmailAddress">Email Address</Label>
              <Input
                id="birthEmailAddress"
                type="email"
                value={formData.birthEmailAddress}
                onChange={(e) => handleInputChange("birthEmailAddress", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthMaritalStatus">Marital Status</Label>
              <Select
                value={formData.birthMaritalStatus}
                onValueChange={(value) => handleInputChange("birthMaritalStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthGender">Gender</Label>
              <Select
                value={formData.birthGender}
                onValueChange={(value) => handleInputChange("birthGender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthNationalId">National ID (Image)</Label>
              <Input
                id="birthNationalId"
                type="file"
                accept="image/*"
                onChange={handleNationalIdUpload}
                disabled={isUploadingNationalId}
              />
              {isUploadingNationalId && (
                <p className="text-sm text-muted-foreground">Uploading...</p>
              )}
              {nationalIdFileUrl && (
                <div className="mt-2">
                  <div className="relative w-full max-w-xs h-48 border rounded overflow-hidden">
                    <Image 
                      src={nationalIdFileUrl} 
                      alt="National ID" 
                      fill
                      className="object-contain"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">File uploaded successfully</p>
                </div>
              )}
              {formData.birthNationalId && !nationalIdFileUrl && (
                <p className="text-sm text-muted-foreground">National ID file is attached</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Person to be Contacted */}
      <Card>
        <CardHeader>
          <CardTitle>Person to be Contacted</CardTitle>
          <CardDescription>Emergency contact person information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ptbcFullName">Full Name</Label>
              <Input
                id="ptbcFullName"
                value={formData.ptbcFullName}
                onChange={(e) => handleInputChange("ptbcFullName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcPhoneNumber">Phone Number</Label>
              <Input
                id="ptbcPhoneNumber"
                value={formData.ptbcPhoneNumber}
                onChange={(e) => handleInputChange("ptbcPhoneNumber", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcAltPhoneNumber">Alternate Phone Number</Label>
              <Input
                id="ptbcAltPhoneNumber"
                value={formData.ptbcAltPhoneNumber}
                onChange={(e) => handleInputChange("ptbcAltPhoneNumber", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcKebele">Kebele</Label>
              <Input
                id="ptbcKebele"
                value={formData.ptbcKebele}
                onChange={(e) => handleInputChange("ptbcKebele", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcCountry">Country</Label>
              <Select
                value={formData.ptbcCountry?.toString() || ""}
                onValueChange={(value) => handleCountryChange(value || null, 'ptbc')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.documentId || country.id.toString()}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcRegion">Region</Label>
              <Select
                value={formData.ptbcRegion?.toString() || ""}
                onValueChange={(value) => handleRegionChange(value || null, 'ptbc')}
                disabled={!formData.ptbcCountry}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {ptbcRegions.map((region) => (
                    <SelectItem key={region.id} value={region.documentId || region.id.toString()}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcZone">Zone</Label>
              <Select
                value={formData.ptbcZone?.toString() || ""}
                onValueChange={(value) => handleZoneChange(value || null, 'ptbc')}
                disabled={!formData.ptbcRegion}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {ptbcZones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.documentId || zone.id.toString()}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcWoreda">Woreda</Label>
              <Select
                value={formData.ptbcWoreda?.toString() || ""}
                onValueChange={(value) => {
                  const resolved = resolveSelection(ptbcWoredas, value || null);
                  handleInputChange("ptbcWoreda", resolved.documentId ?? resolved.id);
                }}
                disabled={!formData.ptbcZone}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select woreda" />
                </SelectTrigger>
                <SelectContent>
                  {ptbcWoredas.map((woreda) => (
                    <SelectItem key={woreda.id} value={woreda.documentId || woreda.id.toString()}>
                      {woreda.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Step 1 Navigation */}
          <div className="flex justify-between gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/profile")}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  saveProgress(e);
                }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Progress"
                )}
              </Button>
              <Button
                type="button"
                onClick={nextStep}
                disabled={isSaving}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: School Information */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Primary Education */}
          <Card>
            <CardHeader>
              <CardTitle>Primary Education</CardTitle>
              <CardDescription>Your primary school information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primarySchoolName">School Name</Label>
                  <Input
                    id="primarySchoolName"
                    value={formData.primarySchoolName}
                    onChange={(e) => handleInputChange("primarySchoolName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryYearStarted">Year Started</Label>
                  <Input
                    id="primaryYearStarted"
                    type="number"
                    value={formData.primaryYearStarted}
                    onChange={(e) => handleInputChange("primaryYearStarted", e.target.value)}
                    placeholder="e.g., 1990"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryYearCompleted">Year Completed</Label>
                  <Input
                    id="primaryYearCompleted"
                    type="number"
                    value={formData.primaryYearCompleted}
                    onChange={(e) => handleInputChange("primaryYearCompleted", e.target.value)}
                    placeholder="e.g., 1996"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryCountry">Country</Label>
                  <Select
                    value={formData.primaryCountry?.toString() || ""}
                    onValueChange={(value) => handleCountryChange(value || null, 'primary')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.documentId || country.id.toString()}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryRegion">Region</Label>
                  <Select
                    value={formData.primaryRegion?.toString() || ""}
                    onValueChange={(value) => handleRegionChange(value || null, 'primary')}
                    disabled={!formData.primaryCountry}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {primaryRegions.map((region) => (
                        <SelectItem key={region.id} value={region.documentId || region.id.toString()}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryZone">Zone</Label>
                  <Select
                    value={formData.primaryZone?.toString() || ""}
                    onValueChange={(value) => handleZoneChange(value || null, 'primary')}
                    disabled={!formData.primaryRegion}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {primaryZones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.documentId || zone.id.toString()}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryWoreda">Woreda</Label>
                  <Select
                    value={formData.primaryWoreda?.toString() || ""}
                    onValueChange={(value) => {
                      const resolved = resolveSelection(primaryWoredas, value || null);
                      handleInputChange("primaryWoreda", resolved.documentId ?? resolved.id);
                    }}
                    disabled={!formData.primaryZone}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select woreda" />
                    </SelectTrigger>
                    <SelectContent>
                      {primaryWoredas.map((woreda) => (
                        <SelectItem key={woreda.id} value={woreda.documentId || woreda.id.toString()}>
                          {woreda.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Education */}
          <Card>
            <CardHeader>
              <CardTitle>Secondary Education</CardTitle>
              <CardDescription>Your secondary school information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="secondarySchoolName">School Name</Label>
                  <Input
                    id="secondarySchoolName"
                    value={formData.secondarySchoolName}
                    onChange={(e) => handleInputChange("secondarySchoolName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryStream">Stream</Label>
                  <Select
                    value={formData.secondaryStream}
                    onValueChange={(value) => handleInputChange("secondaryStream", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stream" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Natural">Natural</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryYearStarted">Year Started</Label>
                  <Input
                    id="secondaryYearStarted"
                    type="number"
                    value={formData.secondaryYearStarted}
                    onChange={(e) => handleInputChange("secondaryYearStarted", e.target.value)}
                    placeholder="e.g., 1997"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryYearCompleted">Year Completed</Label>
                  <Input
                    id="secondaryYearCompleted"
                    type="number"
                    value={formData.secondaryYearCompleted}
                    onChange={(e) => handleInputChange("secondaryYearCompleted", e.target.value)}
                    placeholder="e.g., 2001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryCountry">Country</Label>
                  <Select
                    value={formData.secondaryCountry?.toString() || ""}
                    onValueChange={(value) => handleCountryChange(value || null, 'secondary')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.documentId || country.id.toString()}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryRegion">Region</Label>
                  <Select
                    value={formData.secondaryRegion?.toString() || ""}
                    onValueChange={(value) => handleRegionChange(value || null, 'secondary')}
                    disabled={!formData.secondaryCountry}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {secondaryRegions.map((region) => (
                        <SelectItem key={region.id} value={region.documentId || region.id.toString()}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryZone">Zone</Label>
                  <Select
                    value={formData.secondaryZone?.toString() || ""}
                    onValueChange={(value) => handleZoneChange(value || null, 'secondary')}
                    disabled={!formData.secondaryRegion}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {secondaryZones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.documentId || zone.id.toString()}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryWoreda">Woreda</Label>
                  <Select
                    value={formData.secondaryWoreda?.toString() || ""}
                    onValueChange={(value) => {
                      const resolved = resolveSelection(secondaryWoredas, value || null);
                      handleInputChange("secondaryWoreda", resolved.documentId ?? resolved.id);
                    }}
                    disabled={!formData.secondaryZone}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select woreda" />
                    </SelectTrigger>
                    <SelectContent>
                      {secondaryWoredas.map((woreda) => (
                        <SelectItem key={woreda.id} value={woreda.documentId || woreda.id.toString()}>
                          {woreda.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tertiary Education */}
          <Card>
            <CardHeader>
              <CardTitle>Tertiary Education</CardTitle>
              <CardDescription>Your tertiary/higher education information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tertiaryInstitution">Institution</Label>
                  <Input
                    id="tertiaryInstitution"
                    value={formData.tertiaryInstitution}
                    onChange={(e) => handleInputChange("tertiaryInstitution", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tertiaryFieldOfStudy">Field of Study</Label>
                  <Input
                    id="tertiaryFieldOfStudy"
                    value={formData.tertiaryFieldOfStudy}
                    onChange={(e) => handleInputChange("tertiaryFieldOfStudy", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tertiaryGpaScore">GPA Score</Label>
                  <Input
                    id="tertiaryGpaScore"
                    type="number"
                    step="0.01"
                    value={formData.tertiaryGpaScore}
                    onChange={(e) => handleInputChange("tertiaryGpaScore", e.target.value)}
                    placeholder="e.g., 3.08"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tertiaryYearStarted">Year Started</Label>
                  <Input
                    id="tertiaryYearStarted"
                    type="number"
                    value={formData.tertiaryYearStarted}
                    onChange={(e) => handleInputChange("tertiaryYearStarted", e.target.value)}
                    placeholder="e.g., 2002"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tertiaryYearCompleted">Year Completed</Label>
                  <Input
                    id="tertiaryYearCompleted"
                    type="number"
                    value={formData.tertiaryYearCompleted}
                    onChange={(e) => handleInputChange("tertiaryYearCompleted", e.target.value)}
                    placeholder="e.g., 2006"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tertiaryCountry">Country</Label>
                  <Select
                    value={formData.tertiaryCountry?.toString() || ""}
                    onValueChange={(value) => handleCountryChange(value || null, 'tertiary')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.id} value={country.documentId || country.id.toString()}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tertiaryRegion">Region</Label>
                  <Select
                    value={formData.tertiaryRegion?.toString() || ""}
                    onValueChange={(value) => handleRegionChange(value || null, 'tertiary')}
                    disabled={!formData.tertiaryCountry}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {tertiaryRegions.map((region) => (
                        <SelectItem key={region.id} value={region.documentId || region.id.toString()}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tertiaryZone">Zone</Label>
                  <Select
                    value={formData.tertiaryZone?.toString() || ""}
                    onValueChange={(value) => handleZoneChange(value || null, 'tertiary')}
                    disabled={!formData.tertiaryRegion}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {tertiaryZones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.documentId || zone.id.toString()}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tertiaryWoreda">Woreda</Label>
                  <Select
                    value={formData.tertiaryWoreda?.toString() || ""}
                    onValueChange={(value) => {
                      const resolved = resolveSelection(tertiaryWoredas, value || null);
                      handleInputChange("tertiaryWoreda", resolved.documentId ?? resolved.id);
                    }}
                    disabled={!formData.tertiaryZone}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select woreda" />
                    </SelectTrigger>
                    <SelectContent>
                      {tertiaryWoredas.map((woreda) => (
                        <SelectItem key={woreda.id} value={woreda.documentId || woreda.id.toString()}>
                          {woreda.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Experience */}
          <Card>
            <CardHeader>
              <CardTitle>Professional Experience</CardTitle>
              <CardDescription>Your professional work experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="professionalOrganizationName">Organization Name</Label>
                  <Input
                    id="professionalOrganizationName"
                    value={formData.professionalOrganizationName}
                    onChange={(e) => handleInputChange("professionalOrganizationName", e.target.value)}
                    placeholder="e.g., Rift Valley"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="professionalNumberOfYears">Number of Years</Label>
                  <Input
                    id="professionalNumberOfYears"
                    type="number"
                    value={formData.professionalNumberOfYears}
                    onChange={(e) => handleInputChange("professionalNumberOfYears", e.target.value)}
                    placeholder="e.g., 2"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="professionalPositionDescription">Position Description</Label>
                  <Input
                    id="professionalPositionDescription"
                    value={formData.professionalPositionDescription}
                    onChange={(e) => handleInputChange("professionalPositionDescription", e.target.value)}
                    placeholder="e.g., Nursery"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="professionalAttachment">Attachment</Label>
                  <Input
                    id="professionalAttachment"
                    type="file"
                    onChange={handleProfessionalAttachmentUpload}
                    disabled={isUploadingProfessionalAttachment}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {isUploadingProfessionalAttachment && (
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  )}
                  {professionalAttachmentUrl && (
                    <div className="mt-2">
                      <a 
                        href={professionalAttachmentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View uploaded file
                      </a>
                    </div>
                  )}
                  {formData.professionalAttachment && !professionalAttachmentUrl && (
                    <p className="text-sm text-muted-foreground">File is attached</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Research Engagement */}
          <Card>
            <CardHeader>
              <CardTitle>Research Engagement</CardTitle>
              <CardDescription>Your research activities and engagements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="researchDescription">Description</Label>
                  <Input
                    id="researchDescription"
                    value={formData.researchDescription}
                    onChange={(e) => handleInputChange("researchDescription", e.target.value)}
                    placeholder="e.g., Research"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="researchAttachment">Attachment</Label>
                  <Input
                    id="researchAttachment"
                    type="file"
                    onChange={handleResearchAttachmentUpload}
                    disabled={isUploadingResearchAttachment}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  {isUploadingResearchAttachment && (
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  )}
                  {researchAttachmentUrl && (
                    <div className="mt-2">
                      <a 
                        href={researchAttachmentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View uploaded file
                      </a>
                    </div>
                  )}
                  {formData.researchAttachment && !researchAttachmentUrl && (
                    <p className="text-sm text-muted-foreground">File is attached</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 2 Navigation */}
          <div className="flex justify-between gap-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={isSaving}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/profile")}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
