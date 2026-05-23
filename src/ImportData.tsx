import React, { useState, useRef } from 'react';
import { useAppContext } from './context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSpreadsheet, Link as LinkIcon, Loader2, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Client, MatchStatus } from './types';
import { Input } from '@/components/ui/input';

const validateGucId = (gucId: string): boolean => {
  const regex = /^\d{2}-\d{4,6}$/;
  return regex.test(gucId.trim());
};

const sanitizeGucId = (gucId: string): string => {
  return gucId.trim().replace(/[_/]/g, '-');
};

interface ImportDataProps {
  type?: 'Lead' | 'Active' | 'Match';
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function ImportData({ type = 'Lead', isOpen: controlledIsOpen, onOpenChange: controlledOnOpenChange }: ImportDataProps) {
  const { bulkAddClients, currentUser, addImportBatch, rawClients, matches, addMatch } = useAppContext();
  const [localIsOpen, setLocalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : localIsOpen;
  const setIsOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setLocalIsOpen;
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'map' | 'importing' | 'confirm'>('upload');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, errors: [] as {row: number, reason: string}[] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fields = type === 'Match' ? [
    { key: 'gentlemanCode', label: 'Gentleman Code (Required)', required: true },
    { key: 'ladyCode', label: 'Lady Code (Required)', required: true },
    { key: 'notes', label: 'Notes' }
  ] : [
    { key: 'code', label: 'Candidate Code (Optional - e.g. L101, G101)' },
    { key: 'fullName', label: 'Full Name (Required)', required: true },
    { key: 'phoneNumber', label: 'Phone Number (Required)', required: true },
    { key: 'gender', label: 'Gender (Required)', required: true },
    { key: 'email', label: 'Email' },
    { key: 'age', label: 'Age' },
    { key: 'locationOfResidence', label: 'Location of Residence' },
    { key: 'universityFieldOfStudy', label: 'University / Field of Study' },
    { key: 'currentJob', label: 'Current Job' },
    { key: 'maritalStatus', label: 'Marital Status' },
    { key: 'haveChildren', label: 'Have Children' },
    { key: 'childrenDetails', label: 'Children Details' },
    { key: 'religion', label: 'Religion' },
    { key: 'prayRegularly', label: 'Pray Regularly' },
    { key: 'hijabPreference', label: 'Hijab Preference (for female)' },
    { key: 'smokeOrDrink', label: 'Smoke or Drink' },
    { key: 'facebookLink', label: 'Facebook Link' },
    // Completeness Dating fields
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'areYouGucian', label: 'Are you Gucian?' },
    { key: 'gucId', label: 'GUC ID' },
    { key: 'recentPhoto', label: 'Recent Photo URL' },
    { key: 'height', label: 'Height' },
    { key: 'believeDutyToProvide', label: 'Believe Duty to Provide?' },
    { key: 'areOkayWithWifeWorking', label: 'Okay with Wife Working?' },
    { key: 'currentFinancialStatus', label: 'Current Financial Status' },
    { key: 'religiousDenomination', label: 'Religious Denomination' },
    { key: 'preferredReligiousDenomination', label: 'Preferred Religious Denomination' },
    { key: 'religiousCommitmentLevel', label: 'Religious Commitment Level' },
    { key: 'preferredAgeRange', label: 'Preferred Age Range' },
    { key: 'openToLongDistance', label: 'Open to Long Distance?' },
    { key: 'willingToRelocate', label: 'Willing to Relocate?' },
    { key: 'partnerPreferences', label: 'Partner Preferences' },
    { key: 'selfIntroduction', label: 'Self Introduction' },
    { key: 'preferOlderOrYounger', label: 'Prefer Older or Younger?' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processParsedData(results);
        }
      });
    }
  };

  const handleFetchUrl = async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    try {
      let fetchUrl = url;
      if (url.includes('docs.google.com/spreadsheets')) {
        const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (idMatch) {
          fetchUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv`;
        }
      }

      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch. If using Google Sheets, ensure it is "Published to the web" as CSV (File > Share > Publish to web).');
      }
      
      const csvText = await response.text();
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length === 0) {
            throw new Error('No data found in the fetched file.');
          }
          processParsedData(results);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const processParsedData = (results: Papa.ParseResult<any>) => {
    const parsedHeaders = results.meta.fields || [];
    setHeaders(parsedHeaders);
    setData(results.data);
    
    const newMapping: Record<string, string> = {};
    const fieldAliases: Record<string, string[]> = type === 'Match' ? {
      gentlemanCode: ['gentleman code', 'gentlemancode', 'male code', 'malecode', 'gentleman', 'male', 'g code', 'gcode', 'كود الرجل'],
      ladyCode: ['lady code', 'ladycode', 'female code', 'femalecode', 'lady', 'female', 'l code', 'lcode', 'كود المرأة'],
      notes: ['notes', 'note', 'comment', 'comments', 'feedback', 'ملاحظات']
    } : {
      code: ['code', 'id', 'member id', 'memberid', 'candidate code', 'كود'],
      fullName: ['full name', 'name', 'fullname', 'client', 'customer', 'candidate', 'profile', 'member', 'lead', 'اسم', 'الاسم'],
      phoneNumber: ['phone number', 'phone', 'mobile', 'number', 'tel', 'contact', 'whatsapp', 'رقم', 'تليفون'],
      gender: ['gender', 'sex', 'النوع', 'الجنس'],
      email: ['email', 'e-mail', 'البريد', 'الايميل'],
      age: ['age', 'السن', 'العمر'],
      locationOfResidence: ['location', 'residence', 'address', 'location of residence', 'السكن', 'العنوان'],
      universityFieldOfStudy: ['university', 'study', 'field of study', 'education', 'التعليم', 'دراسة'],
      currentJob: ['job', 'work', 'current job', 'profession', 'occupation', 'العمل', 'الوظيفة'],
      maritalStatus: ['marital status', 'marital', 'status', 'الحالة الاجتماعية'],
      haveChildren: ['have children', 'children', 'الاطفال', 'هل لديك اطفال'],
      childrenDetails: ['children details', 'kids', 'تفاصيل الاطفال'],
      religion: ['religion', 'sect', 'الديانة'],
      prayRegularly: ['pray', 'pray regularly', 'الصلاة'],
      hijabPreference: ['hijab', 'hijab preference', 'الحجاب'],
      smokeOrDrink: ['smoke', 'drink', 'smoke or drink', 'التدخين'],
      facebookLink: ['facebook', 'facebook link', 'fb', 'فيسبوك'],
      timestamp: ['timestamp', 'date', 'time'],
      areYouGucian: ['gucian', 'guc', 'are you gucian'],
      gucId: ['guc id', 'gucid'],
      recentPhoto: ['photo', 'picture', 'image'],
      height: ['height', 'الطول'],
      believeDutyToProvide: ['duty to provide', 'provide'],
      areOkayWithWifeWorking: ['wife working', 'wife work'],
      currentFinancialStatus: ['financial', 'financial status'],
      religiousDenomination: ['denomination', 'religious denomination'],
      preferredReligiousDenomination: ['preferred denomination'],
      religiousCommitmentLevel: ['commitment', 'religious commitment'],
      preferredAgeRange: ['preferred age', 'age range'],
      openToLongDistance: ['long distance', 'ldr'],
      willingToRelocate: ['relocate', 'willing to relocate'],
      partnerPreferences: ['partner preferences', 'preferences'],
      selfIntroduction: ['self introduction', 'about me', 'intro'],
      preferOlderOrYounger: ['prefer older', 'prefer younger'],
    };

    fields.forEach(field => {
      const aliases = fieldAliases[field.key] || [field.key];
      let match = parsedHeaders.find(h => aliases.some(alias => h.toLowerCase() === alias));
      if (!match) {
        match = parsedHeaders.find(h => aliases.some(alias => h.toLowerCase().includes(alias)));
      }
      
      if (match) {
        newMapping[field.key] = match;
      }
    });

    setMapping(newMapping);
    setStep('map');
  };

  const handleSmartImport = async () => {
    if (!url && !file) return;
    setIsLoading(true);
    setError(null);
    try {
      let csvText = '';
      if (file) {
        csvText = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(file);
        });
      } else {
        let fetchUrl = url;
        if (url.includes('docs.google.com/spreadsheets')) {
          const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
          if (idMatch) fetchUrl = `https://docs.google.com/spreadsheets/d/${idMatch[1]}/export?format=csv`;
        }
        const response = await fetch(fetchUrl);
        if (!response.ok) throw new Error('Failed to fetch sheet');
        csvText = await response.text();
      }

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.data.length === 0) {
            setError('No data found');
            setIsLoading(false);
            return;
          }

          const parsedHeaders = results.meta.fields || [];
          const newMapping: Record<string, string> = {};
          const fieldAliases: Record<string, string[]> = type === 'Match' ? {
            gentlemanCode: ['gentleman code', 'gentlemancode', 'male code', 'malecode', 'gentleman', 'male', 'g code', 'gcode', 'كود الرجل'],
            ladyCode: ['lady code', 'ladycode', 'female code', 'femalecode', 'lady', 'female', 'l code', 'lcode', 'كود المرأة'],
            notes: ['notes', 'note', 'comment', 'comments', 'feedback', 'ملاحظات']
          } : {
            code: ['code', 'id', 'member id', 'memberid', 'candidate code', 'كود'],
            fullName: ['full name', 'name', 'fullname', 'client', 'customer', 'candidate', 'profile', 'member', 'lead', 'اسم', 'الاسم'],
            phoneNumber: ['phone number', 'phone', 'mobile', 'number', 'tel', 'contact', 'whatsapp', 'رقم', 'تليفون'],
            gender: ['gender', 'sex', 'النوع', 'الجنس'],
            email: ['email', 'e-mail', 'البريد', 'الايميل'],
            age: ['age', 'السن', 'العمر'],
            locationOfResidence: ['location', 'residence', 'address', 'location of residence', 'السكن', 'العنوان'],
            universityFieldOfStudy: ['university', 'study', 'field of study', 'education', 'التعليم', 'دراسة'],
            currentJob: ['job', 'work', 'current job', 'profession', 'occupation', 'العمل', 'الوظيفة'],
            maritalStatus: ['marital status', 'marital', 'status', 'الحالة الاجتماعية'],
            haveChildren: ['have children', 'children', 'الاطفال', 'هل لديك اطفال'],
            childrenDetails: ['children details', 'kids', 'تفاصيل الاطفال'],
            religion: ['religion', 'sect', 'الديانة'],
            prayRegularly: ['pray', 'pray regularly', 'الصلاة'],
            hijabPreference: ['hijab', 'hijab preference', 'الحجاب'],
            smokeOrDrink: ['smoke', 'drink', 'smoke or drink', 'التدخين'],
            facebookLink: ['facebook', 'facebook link', 'fb', 'فيسبوك'],
            timestamp: ['timestamp', 'date', 'time'],
            areYouGucian: ['gucian', 'guc', 'are you gucian'],
            gucId: ['guc id', 'gucid'],
            recentPhoto: ['photo', 'picture', 'image'],
            height: ['height', 'الطول'],
            believeDutyToProvide: ['duty to provide', 'provide'],
            areOkayWithWifeWorking: ['wife working', 'wife work'],
            currentFinancialStatus: ['financial', 'financial status'],
            religiousDenomination: ['denomination', 'religious denomination'],
            preferredReligiousDenomination: ['preferred denomination'],
            religiousCommitmentLevel: ['commitment', 'religious commitment'],
            preferredAgeRange: ['preferred age', 'age range'],
            openToLongDistance: ['long distance', 'ldr'],
            willingToRelocate: ['relocate', 'willing to relocate'],
            partnerPreferences: ['partner preferences', 'preferences'],
            selfIntroduction: ['self introduction', 'about me', 'intro'],
            preferOlderOrYounger: ['prefer older', 'prefer younger'],
          };

          fields.forEach(field => {
            const aliases = fieldAliases[field.key] || [field.key];
            let match = parsedHeaders.find(h => aliases.some(alias => h.toLowerCase() === alias));
            if (!match) match = parsedHeaders.find(h => aliases.some(alias => h.toLowerCase().includes(alias)));
            if (match) newMapping[field.key] = match;
          });
          const hasGentleman = newMapping['gentlemanCode'];
          const hasLady = newMapping['ladyCode'];

          if (type === 'Match') {
            if (!hasGentleman || !hasLady) {
              setHeaders(parsedHeaders);
              setData(results.data);
              setMapping(newMapping);
              setStep('map');
              setIsLoading(false);
              return;
            }
          } else {
            const hasName = newMapping['fullName'] || newMapping['name'];
            const hasPhone = newMapping['phoneNumber'] || newMapping['phone'];
            const hasGender = newMapping['gender'];

            if (!hasName || !hasPhone || !hasGender) {
              setHeaders(parsedHeaders);
              setData(results.data);
              setMapping(newMapping);
              setStep('map');
              setIsLoading(false);
              return;
            }
          }

          setData(results.data);
          setMapping(newMapping);
          await performImport(results.data, newMapping);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Smart import failed');
      setIsLoading(false);
    }
  };

  const performImport = async (importData: any[], importMapping: Record<string, string>) => {
    setStep('importing');
    setProgress(0);
    setImportStats({ success: 0, failed: 0, errors: [] });

    if (type === 'Match') {
      const errors: { row: number; reason: string }[] = [];
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < importData.length; i++) {
        const row = importData[i];
        try {
          const gentlemanCol = importMapping['gentlemanCode'];
          const ladyCol = importMapping['ladyCode'];

          if (!gentlemanCol || !ladyCol) {
            failedCount++;
            errors.push({ row: i + 1, reason: 'Gentleman Code and Lady Code columns must be mapped.' });
            continue;
          }

          const gentlemanCode = (row[gentlemanCol] || '').toString().trim();
          const ladyCode = (row[ladyCol] || '').toString().trim();

          if (!gentlemanCode || !ladyCode) {
            failedCount++;
            errors.push({ row: i + 1, reason: 'Missing Gentleman Code or Lady Code in row.' });
            continue;
          }

          // Search gentleman in rawClients
          const gentleman = rawClients.find(c => 
            (c.gender?.toLowerCase() === 'male' || c.gender?.toLowerCase() === 'gentleman') && 
            ((c.code || '').toString().trim().toUpperCase() === gentlemanCode.toUpperCase() || 
             (c.memberId || '').toString().trim().toUpperCase() === gentlemanCode.toUpperCase())
          );

          // Search lady in rawClients
          const lady = rawClients.find(c => 
            (c.gender?.toLowerCase() === 'female' || c.gender?.toLowerCase() === 'lady') && 
            ((c.code || '').toString().trim().toUpperCase() === ladyCode.toUpperCase() || 
             (c.memberId || '').toString().trim().toUpperCase() === ladyCode.toUpperCase())
          );

          if (!gentleman) {
            failedCount++;
            errors.push({ row: i + 1, reason: `Gentleman with code "${gentlemanCode}" not found.` });
            continue;
          }

          if (!lady) {
            failedCount++;
            errors.push({ row: i + 1, reason: `Lady with code "${ladyCode}" not found.` });
            continue;
          }

          // Check if match already exists and is not pending feedback
          const matchExists = matches.some(m => 
            m.maleId === gentleman.id && 
            m.femaleId === lady.id && 
            m.status !== MatchStatus.PENDING_FEEDBACK
          );

          if (matchExists) {
            failedCount++;
            errors.push({ row: i + 1, reason: `An active match already exists between Gentleman "${gentlemanCode}" and Lady "${ladyCode}".` });
            continue;
          }

          // Notes
          const notesCol = importMapping['notes'];
          const notes = notesCol ? (row[notesCol] || '').toString().trim() : '';

          // Add match
          await addMatch({
            maleId: gentleman.id,
            maleName: gentleman.name,
            gentlemanCode: gentleman.code || gentleman.memberId,
            femaleId: lady.id,
            femaleName: lady.name,
            ladyCode: lady.code || lady.memberId,
            status: MatchStatus.MATCH_ACTIVE,
            maleProfileApproved: true,
            malePhotoApproved: true,
            maleContactApproved: true,
            femaleProfileApproved: true,
            femalePhotoApproved: true,
            femaleContactApproved: true,
            notes: notes
          });

          successCount++;
        } catch (err) {
          failedCount++;
          errors.push({ row: i + 1, reason: err instanceof Error ? err.message : 'Unknown error occurred.' });
        }
      }

      setProgress(100);
      setImportStats({ 
        success: successCount, 
        failed: failedCount, 
        errors: errors 
      });
      setStep('confirm');
      return;
    }
    
    const now = new Date();
    const batchId = await addImportBatch({
      date: now.toISOString(),
      fileName: file ? file.name : 'URL Import',
      importedCount: 0,
      failedCount: 0,
      errors: [],
      status: 'Completed'
    });

    let nextFemaleSuffix = 101;
    let nextMaleSuffix = 101;

    if (rawClients && Array.isArray(rawClients)) {
      rawClients.forEach(c => {
        const codeVal = (c.memberId || c.code || '').toString().trim();
        if (!codeVal) return;

        // Matches L101, L-101, L_101, L 101 case-insensitively
        const femaleMatch = codeVal.match(/^[lL]\s*[-_]?\s*(\d+)/);
        if (femaleMatch) {
          const num = parseInt(femaleMatch[1], 10);
          if (num >= nextFemaleSuffix) {
            nextFemaleSuffix = num + 1;
          }
        }

        const maleMatch = codeVal.match(/^[gG]\s*[-_]?\s*(\d+)/);
        if (maleMatch) {
          const num = parseInt(maleMatch[1], 10);
          if (num >= nextMaleSuffix) {
            nextMaleSuffix = num + 1;
          }
        }
      });
    }

    const clientsToImport: Client[] = [];
    const errors: {row: number, reason: string}[] = [];
    let failedCount = 0;

    for (let i = 0; i < importData.length; i++) {
      const row = importData[i];
      try {
        const nameCol = importMapping['fullName'] || importMapping['name'];
        const phoneCol = importMapping['phoneNumber'] || importMapping['phone'];
        const genderCol = importMapping['gender'];
        const codeCol = importMapping['code'];

        const name = (nameCol ? row[nameCol] : '').toString().trim();
        const phone = (phoneCol ? row[phoneCol] : '').toString().replace(/[^\d+]/g, '');

        if (!name || !phone) {
          failedCount++;
          errors.push({ row: i + 1, reason: 'Missing required fields (Full Name or Phone Number)' });
          continue;
        }

        // Validate phone number format (between 7 and 15 digits)
        const digitsOnly = phone.replace(/\+/g, '');
        if (digitsOnly.length < 7 || digitsOnly.length > 15) {
          failedCount++;
          errors.push({ row: i + 1, reason: `Invalid phone number length: "${phone}" (must be between 7 and 15 digits)` });
          continue;
        }

        // Prevent duplicate phone number in current import batch or existing candidates
        const isDuplicatePhone = rawClients.some(c => c.phone?.replace(/[^\d+]/g, '') === phone || c.phoneNumber?.replace(/[^\d+]/g, '') === phone) ||
                                 clientsToImport.some(c => c.phone?.replace(/[^\d+]/g, '') === phone);
        if (isDuplicatePhone) {
          failedCount++;
          errors.push({ row: i + 1, reason: `Duplicate candidate record: phone number "${phone}" already exists in the system.` });
          continue;
        }

        const rawGender = (genderCol ? row[genderCol] : '').toString().trim();
        let gender = '';

        const genderLower = rawGender.toLowerCase();
        if (
          genderLower === 'female' || 
          genderLower === 'lady' || 
          genderLower === 'f' || 
          genderLower === 'أنثى' || 
          genderLower === 'انثى' || 
          genderLower === 'سيدة'
        ) {
          gender = 'Female';
        } else if (
          genderLower === 'male' || 
          genderLower === 'gentleman' || 
          genderLower === 'm' || 
          genderLower === 'g' || 
          genderLower === 'ذكر' || 
          genderLower === 'رجل'
        ) {
          gender = 'Male';
        } else {
          failedCount++;
          errors.push({ row: i + 1, reason: `Invalid or missing Gender value: "${rawGender}" (must be Female/Lady or Male/Gentleman)` });
          continue;
        }

        // Determine Code / Member ID
        let code = '';
        let memberId = '';
        if (codeCol && row[codeCol]) {
          const customCode = row[codeCol].toString().trim().toUpperCase();
          if (!/^[LG]\s*[-_]?\s*\d+$/i.test(customCode)) {
            failedCount++;
            errors.push({ row: i + 1, reason: `Invalid custom candidate code format: "${customCode}" (must start with L or G followed by numbers)` });
            continue;
          }

          // Check if custom code already exists in rawClients or in current batch
          const normalizedCustom = customCode.replace(/\s*[-_]?\s*/g, '');
          const isDuplicateCode = rawClients.some(c => (c.code || c.memberId || '').toString().trim().toUpperCase().replace(/\s*[-_]?\s*/g, '') === normalizedCustom) ||
                                  clientsToImport.some(c => (c.code || '').toUpperCase().replace(/\s*[-_]?\s*/g, '') === normalizedCustom);
          if (isDuplicateCode) {
            failedCount++;
            errors.push({ row: i + 1, reason: `Duplicate candidate code: "${customCode}" already exists in the database` });
            continue;
          }

          code = customCode;
          memberId = customCode;
        } else {
          // Auto-generate sequential codes safely
          if (gender === 'Female') {
            code = `L${nextFemaleSuffix}`;
            memberId = code;
            nextFemaleSuffix++;
          } else {
            code = `G${nextMaleSuffix}`;
            memberId = code;
            nextMaleSuffix++;
          }
        }

        const clientId = Math.random().toString(36).substr(2, 9);
        const profileData: Client = {
          id: clientId,
          name: name,
          phone: phone,
          fullName: name,
          phoneNumber: phone,
          gender: gender,
          memberId: memberId,
          code: code,
          status: type as any,
          importBatchId: batchId,
          comments: [],
          lastContactDate: now.toISOString(),
          createdAt: now.toISOString(),
          assignedTo: currentUser?.role === 'rep' ? currentUser.id : undefined,
        };

        // GUC ID robust validations & sanitization
        const areYouGucianCol = importMapping['areYouGucian'];
        const gucIdCol = importMapping['gucId'];
        
        const rawAreYouGucian = areYouGucianCol ? (row[areYouGucianCol] || '').toString().trim().toLowerCase() : '';
        const rawGucId = gucIdCol ? (row[gucIdCol] || '').toString().trim() : '';

        const isGucian = ['yes', 'y', 'true', '1', 'نعم', 'اه'].includes(rawAreYouGucian);
        
        if (isGucian) {
          if (!rawGucId) {
            failedCount++;
            errors.push({ row: i + 1, reason: 'Candidate marked as Gucian but GUC ID is missing.' });
            continue;
          }
          const sanitizedId = sanitizeGucId(rawGucId);
          if (!validateGucId(sanitizedId)) {
            failedCount++;
            errors.push({ row: i + 1, reason: `Invalid GUC ID format: "${rawGucId}" (expected cohort format like 46-12345).` });
            continue;
          }
          profileData.areYouGucian = 'Yes';
          profileData.gucId = sanitizedId;
        } else {
          profileData.areYouGucian = 'No';
          profileData.gucId = '';
        }

        const ageCol = importMapping['age'];
        if (ageCol && row[ageCol] !== undefined && row[ageCol] !== null && row[ageCol] !== '') {
          const parsedAge = parseInt(row[ageCol].toString().trim(), 10);
          if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 99) {
            failedCount++;
            errors.push({ row: i + 1, reason: `Invalid age: "${row[ageCol]}" (must be a number between 18 and 99).` });
            continue;
          }
          profileData.age = parsedAge;
          profileData.finalAge = parsedAge;
        }

        // Email format validation
        const emailCol = importMapping['email'];
        if (emailCol && row[emailCol] !== undefined && row[emailCol] !== null && row[emailCol].toString().trim() !== '') {
          const emailTrimmed = row[emailCol].toString().trim();
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(emailTrimmed)) {
            failedCount++;
            errors.push({ row: i + 1, reason: `Invalid email format: "${emailTrimmed}"` });
            continue;
          }
          profileData.email = emailTrimmed;
        }

        // Height sanitization
        const heightCol = importMapping['height'];
        if (heightCol && row[heightCol] !== undefined && row[heightCol] !== null && row[heightCol].toString().trim() !== '') {
          const rawHeight = row[heightCol].toString().trim();
          const numbersOnly = rawHeight.match(/\d+(?:\.\d+)?/);
          if (!numbersOnly) {
            failedCount++;
            errors.push({ row: i + 1, reason: `Invalid height format: "${rawHeight}"` });
            continue;
          }
          profileData.height = numbersOnly[0];
        }

        const stringFields = [
          'locationOfResidence',
          'universityFieldOfStudy',
          'currentJob',
          'maritalStatus',
          'haveChildren',
          'childrenDetails',
          'religion',
          'prayRegularly',
          'hijabPreference',
          'smokeOrDrink',
          'facebookLink',
          'timestamp',
          'recentPhoto',
          'believeDutyToProvide',
          'areOkayWithWifeWorking',
          'currentFinancialStatus',
          'religiousDenomination',
          'preferredReligiousDenomination',
          'religiousCommitmentLevel',
          'preferredAgeRange',
          'openToLongDistance',
          'willingToRelocate',
          'partnerPreferences',
          'selfIntroduction',
          'preferOlderOrYounger',
        ];

        stringFields.forEach(fieldKey => {
          const csvColName = importMapping[fieldKey];
          if (csvColName && row[csvColName] !== undefined && row[csvColName] !== null) {
            (profileData as any)[fieldKey] = row[csvColName].toString().trim();
          }
        });

        clientsToImport.push(profileData);
      } catch (err) {
        failedCount++;
        errors.push({ row: i + 1, reason: err instanceof Error ? err.message : 'Unknown error' });
      }
    }
    
    setProgress(50);

    const result = await bulkAddClients(clientsToImport);
    
    setProgress(100);
    setImportStats({ 
      success: result.success, 
      failed: failedCount + result.failed, 
      errors: [...errors, ...result.errors] 
    });
    setStep('confirm');
  };

  const handleImport = () => performImport(data, mapping);

  const reset = () => {
    setFile(null);
    setHeaders([]);
    setData([]);
    setMapping({});
    setStep('upload');
    setIsOpen(false);
  };

  const isManualMapDisabled = type === 'Match'
    ? (!mapping['gentlemanCode'] || !mapping['ladyCode'])
    : ((!mapping['fullName'] && !mapping['name']) || 
       (!mapping['phoneNumber'] && !mapping['phone']) || 
       !mapping['gender']);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {controlledIsOpen === undefined && (
        <DialogTrigger
          render={
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Import {type === 'Match' ? 'Old Matches' : type === 'Active' ? 'Active Candidates' : 'Lead Candidates'}
            </Button>
          }
        />
      )}
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import {type === 'Match' ? 'Old Matches' : type === 'Active' ? 'Active Candidates' : 'Lead Candidates'} from CSV / Google Sheets</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 space-y-4">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">Upload your Matchmaking CSV file</p>
                <p className="text-sm text-muted-foreground">Select a local .csv file containing candidate profiles</p>
              </div>
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div className="flex gap-2">
                <Button onClick={() => fileInputRef.current?.click()} variant="outline">Select File</Button>
                <Button 
                  onClick={handleSmartImport} 
                  disabled={!file || isLoading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span className="ml-2">Smart Import</span>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or import from URL</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Google Sheets URL (Published as CSV)</Label>
                <div className="flex gap-2">
                  <Input 
                    id="url"
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <Button onClick={handleFetchUrl} disabled={!url || isLoading} variant="outline">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
                    <span className="ml-2">Fetch & Map</span>
                  </Button>
                  <Button 
                    onClick={handleSmartImport} 
                    disabled={!url || isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    <span className="ml-2">Smart Import</span>
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  To use Google Sheets: File &gt; Share &gt; Publish to web &gt; Select "Comma-separated values (.csv)" &gt; Copy link.
                </p>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'map' && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Map CSV columns to matchmaking fields:</p>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20">
              <div className="grid gap-4">
                {fields.map(field => (
                  <div key={field.key} className="grid grid-cols-2 items-center gap-4">
                    <Label className="text-xs font-semibold">{field.label}</Label>
                    <Select 
                      value={mapping[field.key] || 'none'} 
                      onValueChange={(val) => setMapping(prev => ({ ...prev, [field.key]: val === 'none' ? '' : val }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Don't import</SelectItem>
                        {headers.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="pt-4">
              <p className="text-xs text-muted-foreground italic">
                Found {data.length} rows in the file.
              </p>
            </div>
            <Button 
              className="w-full" 
              onClick={handleImport}
              disabled={isManualMapDisabled}
            >
              Start Import
            </Button>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="text-center w-full space-y-2">
              <p className="font-medium text-xl">Importing Matchmaking Profiles...</p>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">{progress}% Complete</p>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="py-4 flex flex-col items-center justify-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <div className="text-center">
              <p className="font-medium text-xl">Import Complete!</p>
              <p className="text-sm text-muted-foreground">
                Successfully imported {importStats.success} {type === 'Match' ? 'match records' : 'matchmaking profiles'}.
                {importStats.failed > 0 && ` Failed to import ${importStats.failed} records.`}
              </p>
            </div>
            
            {importStats.errors.length > 0 && (
              <div className="w-full mt-4">
                <p className="font-medium text-sm mb-2 text-destructive">Error Log:</p>
                <ScrollArea className="h-[150px] w-full rounded-md border p-4 bg-muted/50">
                  {importStats.errors.map((err, i) => (
                    <div key={i} className="text-xs mb-1">
                      <span className="font-semibold">Row {err.row}:</span> {err.reason}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
            <Button onClick={reset} className="mt-4">Close</Button>
          </div>
        )}

        <DialogFooter>
          {step === 'map' && (
            <Button variant="ghost" onClick={() => setStep('upload')}>Back</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
