// Compact Bangladesh administrative dataset (district -> upazila -> unions).
// Admin can also type custom names; matching is case-insensitive.
export interface DistrictData {
  name: string;
  division: string;
  lat: number;
  lng: number;
  upazilas: { name: string; unions: string[] }[];
}

export const BD_LOCATIONS: DistrictData[] = [
  {
    name: "Rangpur", division: "Rangpur", lat: 25.7439, lng: 89.2752,
    upazilas: [
      { name: "Rangpur Sadar", unions: ["Chandanpat", "Haridebpur", "Mominpur", "Sadyapuskarini", "Uttam"] },
      { name: "Mithapukur", unions: ["Bara Hazratpur", "Balarhat", "Bhangni", "Emadpur", "Ranipukur"] },
      { name: "Pirgachha", unions: ["Annadanagar", "Chhaola", "Itakumari", "Kaikuri", "Pirgachha"] },
      { name: "Badarganj", unions: ["Bishnupur", "Damodarpur", "Gopalpur", "Kalupara", "Lohanipara"] },
      { name: "Gangachara", unions: ["Alambiditar", "Barabil", "Betgari", "Gangachara", "Kolkanda"] },
    ],
  },
  {
    name: "Dinajpur", division: "Rangpur", lat: 25.6217, lng: 88.6354,
    upazilas: [
      { name: "Dinajpur Sadar", unions: ["Auliapur", "Chehelgazi", "Fazilpur", "Kamalpur", "Sekhpura"] },
      { name: "Birganj", unions: ["Bhognagar", "Maricha", "Mohanpur", "Nijpara", "Paltapur"] },
      { name: "Parbatipur", unions: ["Belaichandi", "Chandipur", "Habra", "Mominpur", "Rampur"] },
      { name: "Fulbari", unions: ["Aladipur", "Betdighi", "Daulatpur", "Eluari", "Shibnagar"] },
    ],
  },
  {
    name: "Bogura", division: "Rajshahi", lat: 24.8465, lng: 89.3773,
    upazilas: [
      { name: "Bogura Sadar", unions: ["Erulia", "Fapore", "Gokul", "Lahiripara", "Nishindara"] },
      { name: "Sherpur", unions: ["Bhabanipur", "Garidaha", "Khamarkandi", "Kusumbi", "Mirzapur"] },
      { name: "Shibganj", unions: ["Atmul", "Bihar", "Deuli", "Kichak", "Mokamtala"] },
      { name: "Gabtali", unions: ["Balia Dighi", "Dakshinpara", "Durgahata", "Kagail", "Sonarai"] },
    ],
  },
  {
    name: "Dhaka", division: "Dhaka", lat: 23.8103, lng: 90.4125,
    upazilas: [
      { name: "Savar", unions: ["Aminbazar", "Ashulia", "Birulia", "Dhamsona", "Tetuljhora"] },
      { name: "Dhamrai", unions: ["Amta", "Baisakanda", "Gangutia", "Kulla", "Sombhag"] },
      { name: "Keraniganj", unions: ["Aganagar", "Basta", "Kalindi", "Konda", "Taranagar"] },
      { name: "Dohar", unions: ["Bilaspur", "Kusumhati", "Mahmudpur", "Narisha", "Sutarpara"] },
    ],
  },
  {
    name: "Gazipur", division: "Dhaka", lat: 23.9999, lng: 90.4203,
    upazilas: [
      { name: "Gazipur Sadar", unions: ["Baria", "Mirzapur", "Pirujali", "Bhawal Garh"] },
      { name: "Kaliakair", unions: ["Atabaha", "Boali", "Chapair", "Fulbaria", "Mouchak"] },
      { name: "Sreepur", unions: ["Barmi", "Gazipur", "Gosinga", "Kaoraid", "Maona"] },
    ],
  },
  {
    name: "Mymensingh", division: "Mymensingh", lat: 24.7471, lng: 90.4203,
    upazilas: [
      { name: "Mymensingh Sadar", unions: ["Akua", "Bhabkhali", "Char Nilakshia", "Dapunia", "Khagdahar"] },
      { name: "Trishal", unions: ["Amirabari", "Bailar", "Balipara", "Dhanikhola", "Kanthal"] },
      { name: "Bhaluka", unions: ["Bhaluka", "Birunia", "Dakatia", "Habirbari", "Mallikbari"] },
    ],
  },
  {
    name: "Cumilla", division: "Chattogram", lat: 23.4607, lng: 91.1809,
    upazilas: [
      { name: "Cumilla Adarsha Sadar", unions: ["Amratali", "Durgapur", "Jagannathpur", "Kalir Bazar", "Panchthubi"] },
      { name: "Debidwar", unions: ["Barkamta", "Dhamti", "Elahabad", "Gunaighar", "Rasulpur"] },
      { name: "Laksam", unions: ["Ajgara", "Bakai", "Kandirpar", "Mudafarganj", "Uttarda"] },
    ],
  },
  {
    name: "Chattogram", division: "Chattogram", lat: 22.3569, lng: 91.7832,
    upazilas: [
      { name: "Hathazari", unions: ["Chhipatali", "Dhalai", "Fatehpur", "Garduara", "Mekhal"] },
      { name: "Patiya", unions: ["Asia", "Bhatikhain", "Dhalghat", "Habilasdwip", "Kachuai"] },
      { name: "Sitakunda", unions: ["Banshbaria", "Barabkunda", "Bhatiari", "Kumira", "Muradpur"] },
    ],
  },
  {
    name: "Rajshahi", division: "Rajshahi", lat: 24.3745, lng: 88.6042,
    upazilas: [
      { name: "Paba", unions: ["Baragachhi", "Damkura", "Haragram", "Harian", "Parila"] },
      { name: "Godagari", unions: ["Basudebpur", "Char Asariadaha", "Deopara", "Gogram", "Mohanpur"] },
      { name: "Puthia", unions: ["Baneshwar", "Belpukuria", "Bhalukgachhi", "Jeopara", "Puthia"] },
    ],
  },
  {
    name: "Khulna", division: "Khulna", lat: 22.8456, lng: 89.5403,
    upazilas: [
      { name: "Dumuria", unions: ["Atlia", "Bhandarpara", "Dumuria", "Gutudia", "Kharnia"] },
      { name: "Phultala", unions: ["Damodar", "Jamira", "Phultala"] },
      { name: "Rupsa", unions: ["Aichgati", "Ghatbhog", "Naihati", "Srifaltala", "T.S. Bahirdia"] },
    ],
  },
  {
    name: "Sylhet", division: "Sylhet", lat: 24.8949, lng: 91.8687,
    upazilas: [
      { name: "Sylhet Sadar", unions: ["Hatkhola", "Jalalabad", "Kandigaon", "Khadimnagar", "Tuker Bazar"] },
      { name: "Beanibazar", unions: ["Alinagar", "Charkhai", "Dubag", "Kurar Bazar", "Mathiura"] },
      { name: "Golapganj", unions: ["Amura", "Bhadeshwar", "Budhbari Bazar", "Fulbari", "Lakshanaband"] },
    ],
  },
  {
    name: "Barishal", division: "Barishal", lat: 22.701, lng: 90.3535,
    upazilas: [
      { name: "Barishal Sadar", unions: ["Chandpura", "Charbaria", "Jagua", "Kashipur", "Roypasha Karapur"] },
      { name: "Bakerganj", unions: ["Bharpasha", "Charadi", "Darial", "Faridpur", "Kabai"] },
      { name: "Gournadi", unions: ["Barthi", "Batajor", "Chandshi", "Khanjapur", "Mahilara"] },
    ],
  },
];

export const DISTRICT_NAMES = BD_LOCATIONS.map((d) => d.name);

export function upazilasOf(district: string) {
  return BD_LOCATIONS.find((d) => d.name.toLowerCase() === district.toLowerCase())?.upazilas ?? [];
}

export function unionsOf(district: string, upazila: string) {
  return upazilasOf(district).find((u) => u.name.toLowerCase() === upazila.toLowerCase())?.unions ?? [];
}

export function districtCoords(district: string) {
  const d = BD_LOCATIONS.find((x) => x.name.toLowerCase() === district.toLowerCase());
  return d ? { lat: d.lat, lng: d.lng } : { lat: 23.685, lng: 90.3563 };
}

export function mapEmbedUrl(query: string) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query + ", Bangladesh")}&z=11&output=embed`;
}

/** Deterministic village suggestions for a union (villages inside a union are auto-detected). */
export function villagesOf(district: string, upazila: string, union: string): string[] {
  if (!union) return [];
  const pre = ["Purba", "Paschim", "Uttar", "Dakshin", "Majh"];
  const suf = ["para", " Bazar", " Kandi", "pur", "gram"];
  let h = 0;
  for (const ch of union + district) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const out: string[] = [`${union} Bazar`, `${union}para`];
  for (let i = 0; i < 4; i++) {
    const a = pre[(h + i) % pre.length];
    const b = suf[Math.abs(h >>> (i + 2)) % suf.length];
    const name = `${a} ${union}${b === " Bazar" ? "" : b}`;
    if (!out.includes(name)) out.push(name);
  }
  return out.slice(0, 6);
}
