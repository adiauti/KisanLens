import type { Region } from './types';

// 28 Indian states + 8 UTs, with English and Hindi names.
// IDs are stable slugs; do not rename once shipped.
export const regions: Region[] = [
  { id: 'IN-AN', nameEn: 'Andaman & Nicobar Islands', nameHi: 'अंडमान और निकोबार द्वीपसमूह' },
  { id: 'IN-AP', nameEn: 'Andhra Pradesh', nameHi: 'आंध्र प्रदेश' },
  { id: 'IN-AR', nameEn: 'Arunachal Pradesh', nameHi: 'अरुणाचल प्रदेश' },
  { id: 'IN-AS', nameEn: 'Assam', nameHi: 'असम' },
  { id: 'IN-BR', nameEn: 'Bihar', nameHi: 'बिहार' },
  { id: 'IN-CH', nameEn: 'Chandigarh', nameHi: 'चंडीगढ़' },
  { id: 'IN-CG', nameEn: 'Chhattisgarh', nameHi: 'छत्तीसगढ़' },
  { id: 'IN-DN', nameEn: 'Dadra & Nagar Haveli and Daman & Diu', nameHi: 'दादरा और नगर हवेली और दमन और दीव' },
  { id: 'IN-DL', nameEn: 'Delhi', nameHi: 'दिल्ली' },
  { id: 'IN-GA', nameEn: 'Goa', nameHi: 'गोवा' },
  { id: 'IN-GJ', nameEn: 'Gujarat', nameHi: 'गुजरात' },
  { id: 'IN-HR', nameEn: 'Haryana', nameHi: 'हरियाणा' },
  { id: 'IN-HP', nameEn: 'Himachal Pradesh', nameHi: 'हिमाचल प्रदेश' },
  { id: 'IN-JK', nameEn: 'Jammu & Kashmir', nameHi: 'जम्मू और कश्मीर' },
  { id: 'IN-JH', nameEn: 'Jharkhand', nameHi: 'झारखंड' },
  { id: 'IN-KA', nameEn: 'Karnataka', nameHi: 'कर्नाटक' },
  { id: 'IN-KL', nameEn: 'Kerala', nameHi: 'केरल' },
  { id: 'IN-LA', nameEn: 'Ladakh', nameHi: 'लद्दाख' },
  { id: 'IN-LD', nameEn: 'Lakshadweep', nameHi: 'लक्षद्वीप' },
  { id: 'IN-MP', nameEn: 'Madhya Pradesh', nameHi: 'मध्य प्रदेश' },
  { id: 'IN-MH', nameEn: 'Maharashtra', nameHi: 'महाराष्ट्र' },
  { id: 'IN-MN', nameEn: 'Manipur', nameHi: 'मणिपुर' },
  { id: 'IN-ML', nameEn: 'Meghalaya', nameHi: 'मेघालय' },
  { id: 'IN-MZ', nameEn: 'Mizoram', nameHi: 'मिज़ोरम' },
  { id: 'IN-NL', nameEn: 'Nagaland', nameHi: 'नागालैंड' },
  { id: 'IN-OD', nameEn: 'Odisha', nameHi: 'ओडिशा' },
  { id: 'IN-PY', nameEn: 'Puducherry', nameHi: 'पुडुचेरी' },
  { id: 'IN-PB', nameEn: 'Punjab', nameHi: 'पंजाब' },
  { id: 'IN-RJ', nameEn: 'Rajasthan', nameHi: 'राजस्थान' },
  { id: 'IN-SK', nameEn: 'Sikkim', nameHi: 'सिक्किम' },
  { id: 'IN-TN', nameEn: 'Tamil Nadu', nameHi: 'तमिलनाडु' },
  { id: 'IN-TS', nameEn: 'Telangana', nameHi: 'तेलंगाना' },
  { id: 'IN-TR', nameEn: 'Tripura', nameHi: 'त्रिपुरा' },
  { id: 'IN-UP', nameEn: 'Uttar Pradesh', nameHi: 'उत्तर प्रदेश' },
  { id: 'IN-UT', nameEn: 'Uttarakhand', nameHi: 'उत्तराखंड' },
  { id: 'IN-WB', nameEn: 'West Bengal', nameHi: 'पश्चिम बंगाल' },
];

export const regionMap: Record<string, Region> = regions.reduce(
  (acc, r) => ({ ...acc, [r.id]: r }),
  {} as Record<string, Region>
);
