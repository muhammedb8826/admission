"use client";

import { useState, useEffect } from "react";
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
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";

type StudentProfileFormData = {
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
  
  // Page 3: School Info (placeholder fields)
  previousSchool: string;
  graduationYear: string;
  gpa: string;
  
  // Page 4: Field of Study
  fieldOfStudy: string;
  preferredProgram: string;
  
  // Page 5: Payment
  paymentMethod: string;
  paymentReference: string;
  
  // Page 6: Required Docs
  documentsSubmitted: boolean;
};

const TOTAL_PAGES = 7;

type Country = {
  id: number;
  name: string;
  regions?: Region[];
};

type Region = {
  id: number;
  name: string;
  zones?: Zone[];
};

type Zone = {
  id: number;
  name: string;
  woredas?: Woreda[];
};

type Woreda = {
  id: number;
  name: string;
};

export function StudentApplicationForm() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Location data state
  const [countries, setCountries] = useState<Country[]>([]);
  
  // Separate state for each location type
  const [birthRegions, setBirthRegions] = useState<Region[]>([]);
  const [birthZones, setBirthZones] = useState<Zone[]>([]);
  const [birthWoredas, setBirthWoredas] = useState<Woreda[]>([]);
  
  const [residentialRegions, setResidentialRegions] = useState<Region[]>([]);
  const [residentialZones, setResidentialZones] = useState<Zone[]>([]);
  const [residentialWoredas, setResidentialWoredas] = useState<Woreda[]>([]);
  
  const [ptbcRegions, setPtbcRegions] = useState<Region[]>([]);
  const [ptbcZones, setPtbcZones] = useState<Zone[]>([]);
  const [ptbcWoredas, setPtbcWoredas] = useState<Woreda[]>([]);

  const [formData, setFormData] = useState<StudentProfileFormData>({
    semester: "",
    programLevel: "",
    programType: "",
    firstNameEn: "",
    firstNameAm: "",
    fatherNameEn: "",
    fatherNameAm: "",
    grandFatherNameEn: "",
    grandFatherNameAm: "",
    dateOfBirth: "",
    natioanalId: "",
    phoneNumber: "",
    emergencyPhoneNumber: "",
    maritalStatus: "",
    gender: "",
    residentialKebele: "",
    birthKebele: "",
    ptbcFullName: "",
    ptbcKebele: "",
    ptbcPhone: "",
    ptbcAltPhone: "",
    specialNeed: false,
    specialNeedDescription: "",
    birthCountry: null,
    birthRegion: null,
    birthZone: null,
    birthWoreda: null,
    residentialCountry: null,
    residentialRegion: null,
    residentialZone: null,
    residentialWoreda: null,
    ptbcCountry: null,
    ptbcRegion: null,
    ptbcZone: null,
    previousSchool: "",
    graduationYear: "",
    gpa: "",
    fieldOfStudy: "",
    preferredProgram: "",
    paymentMethod: "",
    paymentReference: "",
    documentsSubmitted: false,
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
        } else {
          console.error("Failed to fetch countries:", response.status);
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
      }
    };
    fetchCountries();
  }, []);

  // Load existing profile data on mount
  useEffect(() => {
    const loadExistingProfile = async () => {
      try {
        const response = await fetch("/api/student-profiles?populate=*");
        if (response.ok) {
          const result = await response.json();
          console.log("Profile load response:", result);
          
          // Handle both null and object responses
          // The API returns { data: profile } or { data: null }
          if (result?.data && result.data !== null && typeof result.data === 'object') {
            const profile = result.data;
            console.log("Loading existing profile with ID:", profile.id);
            
            if (profile.id) {
              setProfileId(profile.id);
            }
            
            // Populate form with existing data
            setFormData({
              semester: profile.semester || "",
              programLevel: profile.programLevel || "",
              programType: profile.programType || "",
              firstNameEn: profile.firstNameEn || "",
              firstNameAm: profile.firstNameAm || "",
              fatherNameEn: profile.fatherNameEn || "",
              fatherNameAm: profile.fatherNameAm || "",
              grandFatherNameEn: profile.grandFatherNameEn || "",
              grandFatherNameAm: profile.grandFatherNameAm || "",
              dateOfBirth: profile.dateOfBirth || "",
              natioanalId: profile.natioanalId || "",
              phoneNumber: profile.phoneNumber || "",
              emergencyPhoneNumber: profile.emergencyPhoneNumber || "",
              maritalStatus: profile.maritalStatus || "",
              gender: profile.gender || "",
              residentialKebele: profile.residentialKebele || "",
              birthKebele: profile.birthKebele || "",
              ptbcFullName: profile.ptbcFullName || "",
              ptbcKebele: profile.ptbcKebele || "",
              ptbcPhone: profile.ptbcPhone || "",
              ptbcAltPhone: profile.ptbcAltPhone || "",
              specialNeed: profile.specialNeed || false,
              specialNeedDescription: profile.specialNeedDescription || "",
              // Extract IDs from relation objects
              birthCountry: typeof profile.birthCountry === 'object' ? profile.birthCountry?.id : profile.birthCountry || null,
              birthRegion: typeof profile.birthRegion === 'object' ? profile.birthRegion?.id : profile.birthRegion || null,
              birthZone: typeof profile.birthZone === 'object' ? profile.birthZone?.id : profile.birthZone || null,
              birthWoreda: typeof profile.birthWoreda === 'object' ? profile.birthWoreda?.id : profile.birthWoreda || null,
              residentialCountry: typeof profile.residentialCountry === 'object' ? profile.residentialCountry?.id : profile.residentialCountry || null,
              residentialRegion: typeof profile.residentialRegion === 'object' ? profile.residentialRegion?.id : profile.residentialRegion || null,
              residentialZone: typeof profile.residentialZone === 'object' ? profile.residentialZone?.id : profile.residentialZone || null,
              residentialWoreda: typeof profile.residentialWoreda === 'object' ? profile.residentialWoreda?.id : profile.residentialWoreda || null,
              ptbcCountry: typeof profile.ptbcCountry === 'object' ? profile.ptbcCountry?.id : profile.ptbcCountry || null,
              ptbcRegion: typeof profile.ptbcRegion === 'object' ? profile.ptbcRegion?.id : profile.ptbcRegion || null,
              ptbcZone: typeof profile.ptbcZone === 'object' ? profile.ptbcZone?.id : profile.ptbcZone || null,
              previousSchool: profile.previousSchool || "",
              graduationYear: profile.graduationYear || "",
              gpa: profile.gpa || "",
              fieldOfStudy: profile.fieldOfStudy || "",
              preferredProgram: profile.preferredProgram || "",
              paymentMethod: profile.paymentMethod || "",
              paymentReference: profile.paymentReference || "",
              documentsSubmitted: profile.documentsSubmitted || false,
            });
          } else {
            console.log("No existing profile found - user will create a new one");
          }
        } else {
          console.log("Profile API response not OK:", response.status, response.statusText);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExistingProfile();
  }, []);
  
  // Load location dropdowns when profile data is loaded
  useEffect(() => {
    if (!profileId || isLoading) return;
    
    const loadLocationData = async () => {
      // Load birth location
      if (formData.birthCountry) {
        await fetchRegions(formData.birthCountry, 'birth');
        if (formData.birthRegion) {
          await fetchZones(formData.birthRegion, 'birth');
          if (formData.birthZone) {
            await fetchWoredas(formData.birthZone, 'birth');
          }
        }
      }
      
      // Load residential location
      if (formData.residentialCountry) {
        await fetchRegions(formData.residentialCountry, 'residential');
        if (formData.residentialRegion) {
          await fetchZones(formData.residentialRegion, 'residential');
          if (formData.residentialZone) {
            await fetchWoredas(formData.residentialZone, 'residential');
          }
        }
      }
      
      // Load PTBC location
      if (formData.ptbcCountry) {
        await fetchRegions(formData.ptbcCountry, 'ptbc');
        if (formData.ptbcRegion) {
          await fetchZones(formData.ptbcRegion, 'ptbc');
        }
      }
    };
    
    loadLocationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, isLoading]);

  // Helper function to fetch regions when country is selected
  const fetchRegions = async (countryId: number, type: 'birth' | 'residential' | 'ptbc') => {
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
          } else {
            setPtbcRegions(result.data);
            setPtbcZones([]);
            setPtbcWoredas([]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
    }
  };

  // Helper function to fetch zones when region is selected
  const fetchZones = async (regionId: number, type: 'birth' | 'residential' | 'ptbc') => {
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
          } else {
            setPtbcZones(result.data);
            setPtbcWoredas([]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching zones:", error);
    }
  };

  // Helper function to fetch woredas when zone is selected
  const fetchWoredas = async (zoneId: number, type: 'birth' | 'residential' | 'ptbc') => {
    try {
      const response = await fetch(`/api/locations/woredas?zoneId=${zoneId}`);
      if (response.ok) {
        const result = await response.json();
        if (result?.data) {
          if (type === 'birth') {
            setBirthWoredas(result.data);
          } else if (type === 'residential') {
            setResidentialWoredas(result.data);
          } else {
            setPtbcWoredas(result.data);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching woredas:", error);
    }
  };

  const handleInputChange = (field: keyof StudentProfileFormData, value: string | boolean | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Save current page data
  const saveCurrentPage = async () => {
    setIsSaving(true);
    setSubmitError(null);

    try {
      // Clean form data - handle relations and remove empty values
      const relationFields = [
        'birthCountry', 'birthRegion', 'birthZone', 'birthWoreda',
        'residentialCountry', 'residentialRegion', 'residentialZone', 'residentialWoreda',
        'ptbcCountry', 'ptbcRegion', 'ptbcZone'
      ];
      
      // Fields that should not be sent to Strapi (not in schema)
      const excludedFields = ['documentsSubmitted'];
      
      const cleanFormData = Object.entries(formData).reduce((acc, [key, value]) => {
        // Skip excluded fields
        if (excludedFields.includes(key)) {
          return acc;
        }
        
        // Handle relation fields - only include if they have a valid number ID
        if (relationFields.includes(key)) {
          if (value !== null && value !== undefined) {
            const numValue = typeof value === 'number' ? value : Number(value);
            if (!isNaN(numValue) && numValue > 0) {
              acc[key] = numValue;
            }
          }
          return acc;
        }
        
        // Keep boolean values (including false)
        if (typeof value === 'boolean') {
          acc[key] = value;
          return acc;
        }
        
        // Skip null, undefined, and empty strings for other fields
        if (value === null || value === undefined || value === "") {
          return acc;
        }
        
        // Keep other non-empty values
        acc[key] = value;
        return acc;
      }, {} as Record<string, string | number | boolean>);

      // Determine studentType based on programLevel enum values
      const getStudentType = (programLevel: string): "undergraduate" | "graduate" => {
        if (programLevel === "Undergraduate(UG)") {
          return "undergraduate";
        }
        // Postgraduate(PG) and PGDT are both graduate
        return "graduate";
      };

      const payload = {
        ...cleanFormData,
        studentType: getStudentType(formData.programLevel || ""),
        applicationStatus: "pending", // Use "pending" for saves (enum: pending, submitted, reviewing, accepted, rejected)
      };

      const url = "/api/student-profiles";
      const method = profileId ? "PUT" : "POST";
      const body = profileId 
        ? { data: { id: profileId, ...payload } }
        : { data: payload };

      console.log("Saving profile:", { method, profileId, hasProfileId: !!profileId, payloadKeys: Object.keys(payload) });

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = 
          result?.error?.message || 
          result?.error || 
          result?.message || 
          "Failed to save";
        console.error("Save error:", errorMessage, result);
        setSubmitError(errorMessage);
        throw new Error(errorMessage);
      }

      // Handle Strapi response format - data might be nested
      const profileData = result?.data?.data || result?.data;
      
      if (profileData?.id) {
        if (!profileId) {
          // New profile created
          setProfileId(profileData.id);
          console.log("✅ Profile created with ID:", profileData.id);
        } else {
          // Existing profile updated
          console.log("✅ Profile updated successfully, ID:", profileId);
        }
      } else {
        console.warn("⚠️ No profile ID in response:", result);
      }
    } catch (error) {
      console.error("Error saving:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save. Please try again.";
      setSubmitError(errorMessage);
      // Don't prevent navigation, but show error
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    // Save current page before moving to next
    await saveCurrentPage();
    
    if (currentPage < TOTAL_PAGES) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Determine studentType based on programLevel enum values
      const getStudentType = (programLevel: string): "undergraduate" | "graduate" => {
        if (programLevel === "Undergraduate(UG)") {
          return "undergraduate";
        }
        // Postgraduate(PG) and PGDT are both graduate
        return "graduate";
      };

      // Exclude fields that are not in Strapi schema
      const excludedFields = ['documentsSubmitted'];
      const cleanedFormData = Object.entries(formData).reduce((acc, [key, value]) => {
        if (excludedFields.includes(key)) {
          return acc;
        }
        // Skip null values
        if (value !== null && value !== undefined) {
          acc[key] = value as string | number | boolean;
        }
        return acc;
      }, {} as Record<string, string | number | boolean>);

      // Final submission with submitted status
      const payload = {
        ...cleanedFormData,
        studentType: getStudentType(formData.programLevel || ""),
        applicationStatus: "submitted", // Final submission uses "submitted" status
      };

      const url = "/api/student-profiles";
      const method = profileId ? "PUT" : "POST";
      const body = profileId 
        ? { data: { id: profileId, ...payload } }
        : { data: payload };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to submit application" }));
        throw new Error(error.error || "Failed to submit application");
      }

      const result = await response.json();
      if (result?.data?.id && !profileId) {
        setProfileId(result.data.id);
      }

      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPage1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Term</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please select your preferred semester, program level, and program type.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="semester">Semester <span className="text-destructive">*</span></Label>
          <Select
            value={formData.semester}
            onValueChange={(value) => handleInputChange("semester", value)}
          >
            <SelectTrigger id="semester" className="w-full">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Semester 1</SelectItem>
              <SelectItem value="2">Semester 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="programLevel">Program Level <span className="text-destructive">*</span></Label>
          <Select
            value={formData.programLevel}
            onValueChange={(value) => handleInputChange("programLevel", value)}
          >
            <SelectTrigger id="programLevel" className="w-full">
              <SelectValue placeholder="Select program level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Undergraduate(UG)">Undergraduate (UG)</SelectItem>
              <SelectItem value="Postgraduate(PG)">Postgraduate (PG)</SelectItem>
              <SelectItem value="PGDT">PGDT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="programType">Program Type <span className="text-destructive">*</span></Label>
          <Select
            value={formData.programType}
            onValueChange={(value) => handleInputChange("programType", value)}
          >
            <SelectTrigger id="programType" className="w-full">
              <SelectValue placeholder="Select program type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Regular">Regular</SelectItem>
              <SelectItem value="Extension">Extension</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderPage2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please provide your personal details.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstNameEn">First Name (English) <span className="text-destructive">*</span></Label>
            <Input
              id="firstNameEn"
              value={formData.firstNameEn}
              onChange={(e) => handleInputChange("firstNameEn", e.target.value)}
              placeholder="Enter first name in English"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstNameAm">First Name (Amharic)</Label>
            <Input
              id="firstNameAm"
              value={formData.firstNameAm}
              onChange={(e) => handleInputChange("firstNameAm", e.target.value)}
              placeholder="Enter first name in Amharic"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fatherNameEn">Father&apos;s Name (English) <span className="text-destructive">*</span></Label>
            <Input
              id="fatherNameEn"
              value={formData.fatherNameEn}
              onChange={(e) => handleInputChange("fatherNameEn", e.target.value)}
              placeholder="Enter father's name in English"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fatherNameAm">Father&apos;s Name (Amharic)</Label>
            <Input
              id="fatherNameAm"
              value={formData.fatherNameAm}
              onChange={(e) => handleInputChange("fatherNameAm", e.target.value)}
              placeholder="Enter father's name in Amharic"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="grandFatherNameEn">Grandfather&apos;s Name (English)</Label>
            <Input
              id="grandFatherNameEn"
              value={formData.grandFatherNameEn}
              onChange={(e) => handleInputChange("grandFatherNameEn", e.target.value)}
              placeholder="Enter grandfather's name in English"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grandFatherNameAm">Grandfather&apos;s Name (Amharic)</Label>
            <Input
              id="grandFatherNameAm"
              value={formData.grandFatherNameAm}
              onChange={(e) => handleInputChange("grandFatherNameAm", e.target.value)}
              placeholder="Enter grandfather's name in Amharic"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="natioanalId">National ID</Label>
            <Input
              id="natioanalId"
              value={formData.natioanalId}
              onChange={(e) => handleInputChange("natioanalId", e.target.value)}
              placeholder="Enter national ID"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number <span className="text-destructive">*</span></Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyPhoneNumber">Emergency Phone Number</Label>
            <Input
              id="emergencyPhoneNumber"
              value={formData.emergencyPhoneNumber}
              onChange={(e) => handleInputChange("emergencyPhoneNumber", e.target.value)}
              placeholder="Enter emergency phone number"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="maritalStatus">Marital Status</Label>
            <Select
              value={formData.maritalStatus}
              onValueChange={(value) => handleInputChange("maritalStatus", value)}
            >
              <SelectTrigger id="maritalStatus" className="w-full">
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
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleInputChange("gender", value)}
            >
              <SelectTrigger id="gender" className="w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Birth Location</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="birthCountry">Country</Label>
              <Select
                value={formData.birthCountry ? String(formData.birthCountry) : ""}
                onValueChange={async (value) => {
                  const countryId = Number(value);
                  handleInputChange("birthCountry", countryId);
                  handleInputChange("birthRegion", null);
                  handleInputChange("birthZone", null);
                  handleInputChange("birthWoreda", null);
                  if (countryId) {
                    await fetchRegions(countryId, 'birth');
                  }
                }}
              >
                <SelectTrigger id="birthCountry" className="w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={String(country.id)}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthRegion">Region</Label>
              <Select
                value={formData.birthRegion ? String(formData.birthRegion) : ""}
                onValueChange={async (value) => {
                  const regionId = Number(value);
                  handleInputChange("birthRegion", regionId);
                  handleInputChange("birthZone", null);
                  handleInputChange("birthWoreda", null);
                  if (regionId) {
                    await fetchZones(regionId, 'birth');
                  }
                }}
                disabled={!formData.birthCountry}
              >
                <SelectTrigger id="birthRegion" className="w-full">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {birthRegions.map((region) => (
                    <SelectItem key={region.id} value={String(region.id)}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthZone">Zone</Label>
              <Select
                value={formData.birthZone ? String(formData.birthZone) : ""}
                onValueChange={async (value) => {
                  const zoneId = Number(value);
                  handleInputChange("birthZone", zoneId);
                  handleInputChange("birthWoreda", null);
                  if (zoneId) {
                    await fetchWoredas(zoneId, 'birth');
                  }
                }}
                disabled={!formData.birthRegion}
              >
                <SelectTrigger id="birthZone" className="w-full">
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {birthZones.map((zone) => (
                    <SelectItem key={zone.id} value={String(zone.id)}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthWoreda">Woreda</Label>
              <Select
                value={formData.birthWoreda ? String(formData.birthWoreda) : ""}
                onValueChange={(value) => {
                  handleInputChange("birthWoreda", Number(value));
                }}
                disabled={!formData.birthZone}
              >
                <SelectTrigger id="birthWoreda" className="w-full">
                  <SelectValue placeholder="Select woreda" />
                </SelectTrigger>
                <SelectContent>
                  {birthWoredas.map((woreda) => (
                    <SelectItem key={woreda.id} value={String(woreda.id)}>
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
                placeholder="Enter kebele"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Residential Address</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="residentialCountry">Country</Label>
              <Select
                value={formData.residentialCountry ? String(formData.residentialCountry) : ""}
                onValueChange={async (value) => {
                  const countryId = Number(value);
                  handleInputChange("residentialCountry", countryId);
                  handleInputChange("residentialRegion", null);
                  handleInputChange("residentialZone", null);
                  handleInputChange("residentialWoreda", null);
                  if (countryId) {
                    await fetchRegions(countryId, 'residential');
                  }
                }}
              >
                <SelectTrigger id="residentialCountry" className="w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={String(country.id)}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="residentialRegion">Region</Label>
              <Select
                value={formData.residentialRegion ? String(formData.residentialRegion) : ""}
                onValueChange={async (value) => {
                  const regionId = Number(value);
                  handleInputChange("residentialRegion", regionId);
                  handleInputChange("residentialZone", null);
                  handleInputChange("residentialWoreda", null);
                  if (regionId) {
                    await fetchZones(regionId, 'residential');
                  }
                }}
                disabled={!formData.residentialCountry}
              >
                <SelectTrigger id="residentialRegion" className="w-full">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {residentialRegions.map((region) => (
                    <SelectItem key={region.id} value={String(region.id)}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="residentialZone">Zone</Label>
              <Select
                value={formData.residentialZone ? String(formData.residentialZone) : ""}
                onValueChange={async (value) => {
                  const zoneId = Number(value);
                  handleInputChange("residentialZone", zoneId);
                  handleInputChange("residentialWoreda", null);
                  if (zoneId) {
                    await fetchWoredas(zoneId, 'residential');
                  }
                }}
                disabled={!formData.residentialRegion}
              >
                <SelectTrigger id="residentialZone" className="w-full">
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {residentialZones.map((zone) => (
                    <SelectItem key={zone.id} value={String(zone.id)}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="residentialWoreda">Woreda</Label>
              <Select
                value={formData.residentialWoreda ? String(formData.residentialWoreda) : ""}
                onValueChange={(value) => {
                  handleInputChange("residentialWoreda", Number(value));
                }}
                disabled={!formData.residentialZone}
              >
                <SelectTrigger id="residentialWoreda" className="w-full">
                  <SelectValue placeholder="Select woreda" />
                </SelectTrigger>
                <SelectContent>
                  {birthWoredas.map((woreda) => (
                    <SelectItem key={woreda.id} value={String(woreda.id)}>
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
                placeholder="Enter kebele"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Parent/Guardian Information</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ptbcFullName">Full Name</Label>
              <Input
                id="ptbcFullName"
                value={formData.ptbcFullName}
                onChange={(e) => handleInputChange("ptbcFullName", e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcPhone">Phone Number</Label>
              <Input
                id="ptbcPhone"
                value={formData.ptbcPhone}
                onChange={(e) => handleInputChange("ptbcPhone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcAltPhone">Alternate Phone</Label>
              <Input
                id="ptbcAltPhone"
                value={formData.ptbcAltPhone}
                onChange={(e) => handleInputChange("ptbcAltPhone", e.target.value)}
                placeholder="Enter alternate phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcKebele">Kebele</Label>
              <Input
                id="ptbcKebele"
                value={formData.ptbcKebele}
                onChange={(e) => handleInputChange("ptbcKebele", e.target.value)}
                placeholder="Enter kebele"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcCountry">Country</Label>
              <Select
                value={formData.ptbcCountry ? String(formData.ptbcCountry) : ""}
                onValueChange={async (value) => {
                  const countryId = Number(value);
                  handleInputChange("ptbcCountry", countryId);
                  handleInputChange("ptbcRegion", null);
                  handleInputChange("ptbcZone", null);
                  if (countryId) {
                    await fetchRegions(countryId, 'ptbc');
                  }
                }}
              >
                <SelectTrigger id="ptbcCountry" className="w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={String(country.id)}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcRegion">Region</Label>
              <Select
                value={formData.ptbcRegion ? String(formData.ptbcRegion) : ""}
                onValueChange={async (value) => {
                  const regionId = Number(value);
                  handleInputChange("ptbcRegion", regionId);
                  handleInputChange("ptbcZone", null);
                  if (regionId) {
                    await fetchZones(regionId, 'ptbc');
                  }
                }}
                disabled={!formData.ptbcCountry}
              >
                <SelectTrigger id="ptbcRegion" className="w-full">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {ptbcRegions.map((region) => (
                    <SelectItem key={region.id} value={String(region.id)}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ptbcZone">Zone</Label>
              <Select
                value={formData.ptbcZone ? String(formData.ptbcZone) : ""}
                onValueChange={(value) => {
                  handleInputChange("ptbcZone", Number(value));
                }}
                disabled={!formData.ptbcRegion}
              >
                <SelectTrigger id="ptbcZone" className="w-full">
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {ptbcZones.map((zone) => (
                    <SelectItem key={zone.id} value={String(zone.id)}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Special Needs</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="specialNeed"
                checked={formData.specialNeed}
                onCheckedChange={(checked) => handleInputChange("specialNeed", checked === true)}
              />
              <Label htmlFor="specialNeed" className="font-normal cursor-pointer">
                Do you have any special needs?
              </Label>
            </div>
          </div>
          {formData.specialNeed && (
            <div className="space-y-2">
              <Label htmlFor="specialNeedDescription">Description</Label>
              <Input
                id="specialNeedDescription"
                value={formData.specialNeedDescription}
                onChange={(e) => handleInputChange("specialNeedDescription", e.target.value)}
                placeholder="Please describe your special needs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPage3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">School Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please provide your previous educational background.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="previousSchool">Previous School/Institution</Label>
          <Input
            id="previousSchool"
            value={formData.previousSchool}
            onChange={(e) => handleInputChange("previousSchool", e.target.value)}
            placeholder="Enter school/institution name"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="graduationYear">Graduation Year</Label>
            <Input
              id="graduationYear"
              type="number"
              value={formData.graduationYear}
              onChange={(e) => handleInputChange("graduationYear", e.target.value)}
              placeholder="Enter graduation year"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gpa">GPA / CGPA</Label>
            <Input
              id="gpa"
              type="number"
              step="0.01"
              value={formData.gpa}
              onChange={(e) => handleInputChange("gpa", e.target.value)}
              placeholder="Enter GPA"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPage4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Field of Study</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please select your preferred field of study and program.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fieldOfStudy">Field of Study <span className="text-destructive">*</span></Label>
          <Select
            value={formData.fieldOfStudy}
            onValueChange={(value) => handleInputChange("fieldOfStudy", value)}
          >
            <SelectTrigger id="fieldOfStudy" className="w-full">
              <SelectValue placeholder="Select field of study" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
              <SelectItem value="Medicine">Medicine</SelectItem>
              <SelectItem value="Law">Law</SelectItem>
              <SelectItem value="Arts">Arts</SelectItem>
              <SelectItem value="Science">Science</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredProgram">Preferred Program <span className="text-destructive">*</span></Label>
          <Input
            id="preferredProgram"
            value={formData.preferredProgram}
            onChange={(e) => handleInputChange("preferredProgram", e.target.value)}
            placeholder="Enter preferred program"
          />
        </div>
      </div>
    </div>
  );

  const renderPage5 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Payment Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please provide your payment details.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method <span className="text-destructive">*</span></Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) => handleInputChange("paymentMethod", value)}
          >
            <SelectTrigger id="paymentMethod" className="w-full">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="Mobile Money">Mobile Money</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentReference">Payment Reference Number</Label>
          <Input
            id="paymentReference"
            value={formData.paymentReference}
            onChange={(e) => handleInputChange("paymentReference", e.target.value)}
            placeholder="Enter payment reference number"
          />
        </div>
      </div>
    </div>
  );

  const renderPage6 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Required Documents</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please confirm that you have submitted all required documents.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="documentsSubmitted"
            checked={formData.documentsSubmitted}
            onCheckedChange={(checked) => handleInputChange("documentsSubmitted", checked === true)}
          />
          <Label htmlFor="documentsSubmitted" className="font-normal cursor-pointer">
            I confirm that I have submitted all required documents
          </Label>
        </div>

        <div className="rounded-md border bg-muted/50 p-4">
          <p className="text-sm font-medium mb-2">Required Documents:</p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Academic transcripts</li>
            <li>Certificate of completion</li>
            <li>National ID copy</li>
            <li>Passport size photo</li>
            <li>Medical certificate</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderPage7 = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Review Your Application</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please review all the information you have provided. Click submit to finalize your application.
        </p>
      </div>

      {submitError && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <p className="font-medium">Error</p>
          <p className="mt-1">{submitError}</p>
        </div>
      )}

      {submitSuccess && (
        <div className="rounded-md border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <p className="font-medium">Success!</p>
          <p className="mt-1">Your application has been submitted successfully.</p>
        </div>
      )}

      <div className="rounded-md border bg-muted/50 p-4 space-y-2">
        <p className="text-sm font-medium">Summary:</p>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Semester:</strong> {formData.semester || "Not specified"}</p>
          <p><strong>Program Level:</strong> {formData.programLevel || "Not specified"}</p>
          <p><strong>Program Type:</strong> {formData.programType || "Not specified"}</p>
          <p><strong>Name:</strong> {formData.firstNameEn || "Not specified"}</p>
          <p><strong>Phone:</strong> {formData.phoneNumber || "Not specified"}</p>
        </div>
      </div>
    </div>
  );

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 1:
        return renderPage1();
      case 2:
        return renderPage2();
      case 3:
        return renderPage3();
      case 4:
        return renderPage4();
      case 5:
        return renderPage5();
      case 6:
        return renderPage6();
      case 7:
        return renderPage7();
      default:
        return null;
    }
  };

  const pageTitles = [
    "Choose Term",
    "Personal Information",
    "School Information",
    "Field of Study",
    "Payment",
    "Required Documents",
    "Confirmation",
  ];

  return (
    <div className="space-y-6 rounded-md border bg-background p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Student Application Form
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Step {currentPage} of {TOTAL_PAGES}: {pageTitles[currentPage - 1]}
        </p>
      </div>
      <div>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {pageTitles.map((title, index) => (
              <div key={index} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    index + 1 < currentPage
                      ? "bg-primary text-primary-foreground"
                      : index + 1 === currentPage
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1 < currentPage ? "✓" : index + 1}
                </div>
                {index < pageTitles.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index + 1 < currentPage ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-[400px]">
          {submitError && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <p className="font-medium">Error</p>
              <p className="mt-1">{submitError}</p>
            </div>
          )}
          {renderCurrentPage()}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading your application...</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentPage === 1 || isSaving}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentPage < TOTAL_PAGES ? (
                <Button 
                  type="button" 
                  onClick={handleNext}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save & Continue
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || submitSuccess}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>
              )}
            </div>
            {isSaving && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Your progress is being saved...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

