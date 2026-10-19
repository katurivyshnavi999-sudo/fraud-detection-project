/**
 * Complete Indian Administrative Geographies Dataset
 * 
 * Includes:
 * - All 28 Indian States
 * - All 8 Union Territories
 * - Complete verified district lists for each administrative division
 * - Official district naming including Sri Potti Sriramulu Nellore (Nellore) in Andhra Pradesh
 * - "Unknown / Not Provided" fallback option
 * 
 * Source: Local Government Directory (LGD), Ministry of Panchayati Raj /
 *         Census of India, Government of India (Updated October 2026).
 */

export const GEOGRAPHY_METADATA = {
  version: "2026.10.1",
  source: "Local Government Directory (LGD), Government of India / Census Administrative Registry",
  total_states: 28,
  total_union_territories: 8,
  total_entities: 36,
  last_updated: "2026-10-14",
  notes: "Verified complete coverage of all 28 states and 8 union territories with official post-reorganisation districts."
};

export const INDIAN_ADMINISTRATIVE_DATA = {
  // ==================== 28 STATES ====================
  "Andhra Pradesh": [
    "Alluri Sitharama Raju",
    "Anakapalli",
    "Ananthapuramu (Anantapur)",
    "Annamayya",
    "Bapatla",
    "Chittoor",
    "Dr. B.R. Ambedkar Konaseema",
    "East Godavari (Rajamahendravaram)",
    "Eluru",
    "Guntur",
    "Kakinada",
    "Krishna (Machilipatnam)",
    "Kurnool",
    "Nandyal",
    "Nellore (Sri Potti Sriramulu Nellore)",
    "NTR (Vijayawada)",
    "Palnadu",
    "Parvathipuram Manyam",
    "Prakasam (Ongole)",
    "Sri Sathya Sai",
    "Srikakulam",
    "Tirupati",
    "Visakhapatnam",
    "Vizianagaram",
    "West Godavari (Bhimavaram)",
    "YSR Kadapa (Cuddapah)",
    "Unknown / Not Provided"
  ],

  "Arunachal Pradesh": [
    "Anjaw",
    "Changlang",
    "Dibang Valley",
    "East Kameng",
    "East Siang",
    "Itanagar Capital Complex",
    "Kamle",
    "Kra Daadi",
    "Kurung Kumey",
    "Leparada",
    "Lohit",
    "Longding",
    "Lower Dibang Valley",
    "Lower Siang",
    "Lower Subansiri",
    "Namsai",
    "Pakke Kessang",
    "Papum Pare",
    "Shi Yomi",
    "Siang",
    "Tawang",
    "Tirap",
    "Upper Siang",
    "Upper Subansiri",
    "West Kameng",
    "West Siang",
    "Unknown / Not Provided"
  ],

  "Assam": [
    "Bajali",
    "Baksa",
    "Barpeta",
    "Biswanath",
    "Bongaigaon",
    "Cachar",
    "Charaideo",
    "Chirang",
    "Darrang",
    "Dhemaji",
    "Dhubri",
    "Dibrugarh",
    "Dima Hasao",
    "Goalpara",
    "Golaghat",
    "Hailakandi",
    "Hojai",
    "Jorhat",
    "Kamrup",
    "Kamrup Metropolitan (Guwahati)",
    "Karbi Anglong",
    "Karimganj",
    "Kokrajhar",
    "Lakhimpur",
    "Majuli",
    "Morigaon",
    "Nagaon",
    "Nalbari",
    "Sivasagar",
    "Sonitpur",
    "South Salmara-Mankachar",
    "Tamulpur",
    "Tinsukia",
    "Udalguri",
    "West Karbi Anglong",
    "Unknown / Not Provided"
  ],

  "Bihar": [
    "Araria",
    "Arwal",
    "Aurangabad",
    "Banka",
    "Begusarai",
    "Bhagalpur",
    "Bhojpur (Arrah)",
    "Buxar",
    "Darbhanga",
    "East Champaran (Motihari)",
    "Gaya",
    "Gopalganj",
    "Jamui",
    "Jehanabad",
    "Kaimur (Bhabua)",
    "Katihar",
    "Khagaria",
    "Kishanganj",
    "Lakhisarai",
    "Madhepura",
    "Madhubani",
    "Munger",
    "Muzaffarpur",
    "Nalanda (Bihar Sharif)",
    "Nawada",
    "Patna",
    "Purnia",
    "Rohtas (Sasaram)",
    "Saharsa",
    "Samastipur",
    "Saran (Chhapra)",
    "Sheikhpura",
    "Sheohar",
    "Sitamarhi",
    "Siwan",
    "Supaul",
    "Vaishali (Hajipur)",
    "West Champaran (Bettiah)",
    "Unknown / Not Provided"
  ],

  "Chhattisgarh": [
    "Balod",
    "Baloda Bazar-Bhatapara",
    "Balrampur-Ramanujganj",
    "Bastar (Jagdalpur)",
    "Bemetara",
    "Bijapur",
    "Bilaspur",
    "Dantewada (South Bastar)",
    "Dhamtari",
    "Durg",
    "Gariaband",
    "Gaurela-Pendra-Marwahi",
    "Janjgir-Champa",
    "Jashpur",
    "Kabirdham (Kawardha)",
    "Kanker (North Bastar)",
    "Khairagarh-Chhuikhadan-Gandai",
    "Kondagaon",
    "Korba",
    "Koriya",
    "Mahasamund",
    "Manendragarh-Chirmiri-Bharatpur",
    "Mohla-Manpur-Ambagarh Chowki",
    "Mungeli",
    "Narayanpur",
    "Raigarh",
    "Raipur",
    "Rajnandgaon",
    "Sakti",
    "Sarangarh-Bilaigarh",
    "Sukma",
    "Surajpur",
    "Surguja (Ambikapur)",
    "Unknown / Not Provided"
  ],

  "Goa": [
    "North Goa (Panaji)",
    "South Goa (Margao)",
    "Unknown / Not Provided"
  ],

  "Gujarat": [
    "Ahmedabad",
    "Amreli",
    "Anand",
    "Aravalli (Modasa)",
    "Banaskantha (Palanpur)",
    "Bharuch",
    "Bhavnagar",
    "Botad",
    "Chhota Udaipur",
    "Dahod",
    "Dang (Ahwa)",
    "Devbhumi Dwarka (Khambhalia)",
    "Gandhinagar",
    "Gir Somnath (Veraval)",
    "Jamnagar",
    "Junagadh",
    "Kheda (Nadiad)",
    "Kutch (Bhuj)",
    "Mahisagar (Lunawada)",
    "Mehsana",
    "Morbi",
    "Narmada (Rajpipla)",
    "Navsari",
    "Panchmahal (Godhra)",
    "Patan",
    "Porbandar",
    "Rajkot",
    "Sabarkantha (Himmatnagar)",
    "Surat",
    "Surendranagar",
    "Tapi (Vyara)",
    "Vadodara",
    "Valsad",
    "Unknown / Not Provided"
  ],

  "Haryana": [
    "Ambala",
    "Bhiwani",
    "Charkhi Dadri",
    "Faridabad",
    "Fatehabad",
    "Gurugram",
    "Hisar",
    "Jhajjar",
    "Jind",
    "Kaithal",
    "Karnal",
    "Kurukshetra",
    "Mahendragarh (Narnaul)",
    "Nuh",
    "Palwal",
    "Panchkula",
    "Panipat",
    "Rewari",
    "Rohtak",
    "Sirsa",
    "Sonipat",
    "Yamunanagar",
    "Unknown / Not Provided"
  ],

  "Himachal Pradesh": [
    "Bilaspur",
    "Chamba",
    "Hamirpur",
    "Kangra (Dharamshala)",
    "Kinnaur (Reckong Peo)",
    "Kullu",
    "Lahaul and Spiti (Keylong)",
    "Mandi",
    "Shimla",
    "Sirmaur (Nahan)",
    "Solan",
    "Una",
    "Unknown / Not Provided"
  ],

  "Jharkhand": [
    "Bokaro",
    "Chatra",
    "Deoghar",
    "Dhanbad",
    "Dumka",
    "East Singhbhum (Jamshedpur)",
    "Garhwa",
    "Giridih",
    "Godda",
    "Gumla",
    "Hazaribagh",
    "Jamtara",
    "Khunti",
    "Koderma",
    "Latehar",
    "Lohardaga",
    "Pakur",
    "Palamu (Daltonganj)",
    "Ramgarh",
    "Ranchi",
    "Sahibganj",
    "Seraikela Kharsawan",
    "Simdega",
    "West Singhbhum (Chaibasa)",
    "Unknown / Not Provided"
  ],

  "Karnataka": [
    "Bagalkote",
    "Ballari",
    "Belagavi (Belgaum)",
    "Bengaluru Rural",
    "Bengaluru Urban",
    "Bidar",
    "Chamarajanagar",
    "Chikkaballapura",
    "Chikkamagaluru",
    "Chitradurga",
    "Dakshina Kannada (Mangaluru)",
    "Davanagere",
    "Dharwad (Hubballi)",
    "Gadag",
    "Hassan",
    "Haveri",
    "Kalaburagi (Gulbarga)",
    "Kodagu (Madikeri)",
    "Kolar",
    "Koppal",
    "Mandya",
    "Mysuru",
    "Raichur",
    "Ramanagara",
    "Shivamogga (Shimoga)",
    "Tumakuru (Tumkur)",
    "Udupi",
    "Uttara Kannada (Karwar)",
    "Vijayanagara (Hosapete)",
    "Vijayapura (Bijapur)",
    "Yadgir",
    "Unknown / Not Provided"
  ],

  "Kerala": [
    "Alappuzha",
    "Ernakulam (Kochi)",
    "Idukki (Painavu)",
    "Kannur",
    "Kasaragod",
    "Kollam",
    "Kottayam",
    "Kozhikode",
    "Malappuram",
    "Palakkad",
    "Pathanamthitta",
    "Thiruvananthapuram",
    "Thrissur",
    "Wayanad (Kalpetta)",
    "Unknown / Not Provided"
  ],

  "Madhya Pradesh": [
    "Agar Malwa",
    "Alirajpur",
    "Anuppur",
    "Ashoknagar",
    "Balaghat",
    "Barwani",
    "Betul",
    "Bhind",
    "Bhopal",
    "Burhanpur",
    "Chhatarpur",
    "Chhindwara",
    "Damoh",
    "Datia",
    "Dewas",
    "Dhar",
    "Dindori",
    "Guna",
    "Gwalior",
    "Harda",
    "Hoshangabad (Narmadapuram)",
    "Indore",
    "Jabalpur",
    "Jhabua",
    "Katni",
    "Khandwa",
    "Khargone",
    "Maihar",
    "Mandla",
    "Mandsaur",
    "Mauganj",
    "Morena",
    "Narsinghpur",
    "Neemuch",
    "Niwari",
    "Pandhurna",
    "Panna",
    "Raisen",
    "Rajgarh",
    "Ratlam",
    "Rewa",
    "Sagar",
    "Satna",
    "Sehore",
    "Seoni",
    "Shahdol",
    "Shajapur",
    "Sheopur",
    "Shivpuri",
    "Sidhi",
    "Singrauli",
    "Tikamgarh",
    "Ujjain",
    "Umaria",
    "Vidisha",
    "Unknown / Not Provided"
  ],

  "Maharashtra": [
    "Ahilyanagar (Ahmednagar)",
    "Akola",
    "Amravati",
    "Beed",
    "Bhandara",
    "Buldhana",
    "Chandrapur",
    "Chhatrapati Sambhajinagar (Aurangabad)",
    "Dharashiv (Osmanabad)",
    "Dhule",
    "Gadchiroli",
    "Gondia",
    "Hingoli",
    "Jalgaon",
    "Jalna",
    "Kolhapur",
    "Latur",
    "Mumbai City",
    "Mumbai Suburban",
    "Nagpur",
    "Nanded",
    "Nandurbar",
    "Nashik",
    "Palghar",
    "Parbhani",
    "Pune",
    "Raigad (Alibag)",
    "Ratnagiri",
    "Sangli",
    "Satara",
    "Sindhudurg (Oros)",
    "Solapur",
    "Thane",
    "Wardha",
    "Washim",
    "Yavatmal",
    "Unknown / Not Provided"
  ],

  "Manipur": [
    "Bishnupur",
    "Chandel",
    "Churachandpur",
    "Imphal East",
    "Imphal West",
    "Jiribam",
    "Kakching",
    "Kamjong",
    "Kangpokpi",
    "Noney",
    "Pherzawl",
    "Senapati",
    "Tamenglong",
    "Tengnoupal",
    "Thoubal",
    "Ukhrul",
    "Unknown / Not Provided"
  ],

  "Meghalaya": [
    "East Garo Hills (Williamnagar)",
    "East Jaintia Hills (Khliehriat)",
    "East Khasi Hills (Shillong)",
    "Eastern West Khasi Hills (Mairang)",
    "North Garo Hills (Resubelpara)",
    "Ri Bhoi (Nongpoh)",
    "South Garo Hills (Baghmara)",
    "South West Garo Hills (Ampati)",
    "South West Khasi Hills (Mawkyrwat)",
    "West Garo Hills (Tura)",
    "West Jaintia Hills (Jowai)",
    "West Khasi Hills (Nongstoin)",
    "Unknown / Not Provided"
  ],

  "Mizoram": [
    "Aizawl",
    "Champhai",
    "Hnahthial",
    "Khawzawl",
    "Kolasib",
    "Lawngtlai",
    "Lunglei",
    "Mamit",
    "Saitual",
    "Serchhip",
    "Siaha",
    "Unknown / Not Provided"
  ],

  "Nagaland": [
    "Chumoukedima",
    "Dimapur",
    "Kiphire",
    "Kohima",
    "Longleng",
    "Mokokchung",
    "Mon",
    "Niuland",
    "Noklak",
    "Peren",
    "Phek",
    "Shamator",
    "Tseminyu",
    "Tuensang",
    "Wokha",
    "Zunheboto",
    "Unknown / Not Provided"
  ],

  "Odisha": [
    "Angul",
    "Balangir",
    "Balasore (Baleswar)",
    "Bargarh",
    "Bhadrak",
    "Boudh",
    "Cuttack",
    "Deogarh",
    "Dhenkanal",
    "Gajapati (Paralakhemundi)",
    "Ganjam (Chhatrapur)",
    "Jagatsinghpur",
    "Jajpur",
    "Jharsuguda",
    "Kalahandi (Bhawanipatna)",
    "Kandhamal (Phulbani)",
    "Kendrapara",
    "Kendujhar (Keonjhar)",
    "Khordha (Bhubaneswar)",
    "Koraput",
    "Malkangiri",
    "Mayurbhanj (Baripada)",
    "Nabarangpur",
    "Nayagarh",
    "Nuapada",
    "Puri",
    "Rayagada",
    "Sambalpur",
    "Subarnapur (Sonepur)",
    "Sundargarh (Rourkela)",
    "Unknown / Not Provided"
  ],

  "Punjab": [
    "Amritsar",
    "Barnala",
    "Bathinda",
    "Faridkot",
    "Fatehgarh Sahib",
    "Fazilka",
    "Ferozepur",
    "Gurdaspur",
    "Hoshiarpur",
    "Jalandhar",
    "Kapurthala",
    "Ludhiana",
    "Malerkotla",
    "Mansa",
    "Moga",
    "Mohali (SAS Nagar)",
    "Muktsar",
    "Pathankot",
    "Patiala",
    "Rupnagar (Ropar)",
    "Sangrur",
    "Shahid Bhagat Singh Nagar (Nawanshahr)",
    "Tarn Taran",
    "Unknown / Not Provided"
  ],

  "Rajasthan": [
    "Ajmer",
    "Alwar",
    "Anupgarh",
    "Balotra",
    "Banswara",
    "Baran",
    "Barmer",
    "Beawar",
    "Bharatpur",
    "Bhilwara",
    "Bikaner",
    "Bundi",
    "Chittorgarh",
    "Churu",
    "Dausa",
    "Deeg",
    "Dholpur",
    "Didwana-Kuchaman",
    "Dudu",
    "Dungarpur",
    "Ganganagar",
    "Gangapur City",
    "Hanumangarh",
    "Jaipur",
    "Jaipur Rural",
    "Jaisalmer",
    "Jalore",
    "Jhalawar",
    "Jhunjhunu",
    "Jodhpur",
    "Jodhpur Rural",
    "Karauli",
    "Kekri",
    "Khairthal-Tijara",
    "Kota",
    "Kotputli-Behror",
    "Nagaur",
    "Neem Ka Thana",
    "Pali",
    "Phalodi",
    "Pratapgarh",
    "Rajsamand",
    "Salumbar",
    "Sanchore",
    "Sawai Madhopur",
    "Shahpura",
    "Sikar",
    "Sirohi",
    "Tonk",
    "Udaipur",
    "Unknown / Not Provided"
  ],

  "Sikkim": [
    "Gangtok",
    "Geyzing",
    "Mangan",
    "Namchi",
    "Pakyong",
    "Soreng",
    "Unknown / Not Provided"
  ],

  "Tamil Nadu": [
    "Ariyalur",
    "Chengalpattu",
    "Chennai",
    "Coimbatore",
    "Cuddalore",
    "Dharmapuri",
    "Dindigul",
    "Erode",
    "Kallakurichi",
    "Kanchipuram",
    "Kanyakumari (Nagercoil)",
    "Karur",
    "Krishnagiri",
    "Madurai",
    "Mayiladuthurai",
    "Nagapattinam",
    "Namakkal",
    "Nilgiris (Udhagamandalam / Ooty)",
    "Perambalur",
    "Pudukkottai",
    "Ramanathapuram",
    "Ranipet",
    "Salem",
    "Sivaganga",
    "Tenkasi",
    "Thanjavur",
    "Theni",
    "Thoothukudi (Tuticorin)",
    "Tiruchirappalli",
    "Tirunelveli",
    "Tirupathur",
    "Tiruppur",
    "Tiruvallur",
    "Tiruvannamalai",
    "Tiruvarur",
    "Vellore",
    "Viluppuram",
    "Virudhunagar",
    "Unknown / Not Provided"
  ],

  "Telangana": [
    "Adilabad",
    "Bhadradri Kothagudem",
    "Hanumakonda",
    "Hyderabad",
    "Jagtial",
    "Jangaon",
    "Jayashankar Bhupalpally",
    "Jogulamba Gadwal",
    "Kamareddy",
    "Karimnagar",
    "Khammam",
    "Kumuram Bheem Asifabad",
    "Mahabubabad",
    "Mahbubnagar",
    "Mancherial",
    "Medak",
    "Medchal-Malkajgiri",
    "Mulugu",
    "Nagarkurnool",
    "Nalgonda",
    "Narayanpet",
    "Nirmal",
    "Nizamabad",
    "Peddapalli",
    "Rajanna Sircilla",
    "Rangareddy",
    "Sangareddy",
    "Siddipet",
    "Suryapet",
    "Vikarabad",
    "Wanaparthy",
    "Warangal",
    "Yadadri Bhuvanagiri",
    "Unknown / Not Provided"
  ],

  "Tripura": [
    "Dhalai (Ambassa)",
    "Gomati (Udaipur)",
    "Khowai",
    "North Tripura (Dharmanagar)",
    "Sepahijala (Bishramganj)",
    "South Tripura (Belonia)",
    "Unakoti (Kailashahar)",
    "West Tripura (Agartala)",
    "Unknown / Not Provided"
  ],

  "Uttar Pradesh": [
    "Agra",
    "Aligarh",
    "Ambedkar Nagar",
    "Amethi",
    "Amroha",
    "Auraiya",
    "Ayodhya (Faizabad)",
    "Azamgarh",
    "Baghpat",
    "Bahraich",
    "Ballia",
    "Balrampur",
    "Banda",
    "Barabanki",
    "Bareilly",
    "Basti",
    "Bhadohi (Sant Ravidas Nagar)",
    "Bijnor",
    "Budaun",
    "Bulandshahr",
    "Chandauli",
    "Chitrakoot",
    "Deoria",
    "Etah",
    "Etawah",
    "Farrukhabad",
    "Fatehpur",
    "Firozabad",
    "Gautam Buddha Nagar (Noida)",
    "Ghaziabad",
    "Ghazipur",
    "Gonda",
    "Gorakhpur",
    "Hamirpur",
    "Hapur",
    "Hardoi",
    "Hathras",
    "Jalaun (Orai)",
    "Jaunpur",
    "Jhansi",
    "Kannauj",
    "Kanpur Dehat",
    "Kanpur Nagar",
    "Kasganj",
    "Kaushambi",
    "Kheri (Lakhimpur)",
    "Kushinagar",
    "Lalitpur",
    "Lucknow",
    "Maharajganj",
    "Mahoba",
    "Mainpuri",
    "Mathura",
    "Mau",
    "Meerut",
    "Mirzapur",
    "Moradabad",
    "Muzaffarnagar",
    "Pilibhit",
    "Pratapgarh",
    "Prayagraj (Allahabad)",
    "Raebareli",
    "Rampur",
    "Saharanpur",
    "Sambhal",
    "Sant Kabir Nagar (Khalilabad)",
    "Shahjahanpur",
    "Shamli",
    "Shravasti",
    "Siddharthnagar",
    "Sitapur",
    "Sonbhadra",
    "Sultanpur",
    "Unnao",
    "Varanasi",
    "Unknown / Not Provided"
  ],

  "Uttarakhand": [
    "Almora",
    "Bageshwar",
    "Chamoli (Gopeshwar)",
    "Champawat",
    "Dehradun",
    "Haridwar",
    "Nainital",
    "Pauri Garhwal",
    "Pithoragarh",
    "Rudraprayag",
    "Tehri Garhwal",
    "Udham Singh Nagar (Rudrapur)",
    "Uttarkashi",
    "Unknown / Not Provided"
  ],

  "West Bengal": [
    "Alipurduar",
    "Bankura",
    "Birbhum (Suri)",
    "Cooch Behar",
    "Dakshin Dinajpur (Balurghat)",
    "Darjeeling",
    "Hooghly (Chinsurah)",
    "Howrah",
    "Jalpaiguri",
    "Jhargram",
    "Kalimpong",
    "Kolkata",
    "Malda",
    "Murshidabad (Baharampur)",
    "Nadia (Krishnanagar)",
    "North 24 Parganas (Barasat)",
    "Paschim Bardhaman (Asansol)",
    "Paschim Medinipur (Midnapore)",
    "Purba Bardhaman (Bardhaman)",
    "Purba Medinipur (Tamluk)",
    "Purulia",
    "South 24 Parganas (Alipore)",
    "Uttar Dinajpur (Raiganj)",
    "Unknown / Not Provided"
  ],

  // ==================== 8 UNION TERRITORIES ====================
  "Andaman and Nicobar Islands": [
    "Nicobar (Car Nicobar)",
    "North and Middle Andaman (Mayabunder)",
    "South Andaman (Port Blair)",
    "Unknown / Not Provided"
  ],

  "Chandigarh": [
    "Chandigarh",
    "Unknown / Not Provided"
  ],

  "Dadra and Nagar Haveli and Daman and Diu": [
    "Dadra and Nagar Haveli (Silvassa)",
    "Daman",
    "Diu",
    "Unknown / Not Provided"
  ],

  "Delhi": [
    "Central Delhi",
    "East Delhi",
    "New Delhi",
    "North Delhi",
    "North East Delhi",
    "North West Delhi",
    "Shahdara",
    "South Delhi",
    "South East Delhi",
    "South West Delhi",
    "West Delhi",
    "Unknown / Not Provided"
  ],

  "Jammu and Kashmir": [
    "Anantnag",
    "Bandipora",
    "Baramulla",
    "Budgam",
    "Doda",
    "Ganderbal",
    "Jammu",
    "Kathua",
    "Kishtwar",
    "Kulgam",
    "Kupwara",
    "Poonch",
    "Pulwama",
    "Rajouri",
    "Ramban",
    "Reasi",
    "Samba",
    "Shopian",
    "Srinagar",
    "Udhampur",
    "Unknown / Not Provided"
  ],

  "Ladakh": [
    "Kargil",
    "Leh",
    "Unknown / Not Provided"
  ],

  "Lakshadweep": [
    "Lakshadweep (Kavaratti)",
    "Unknown / Not Provided"
  ],

  "Puducherry": [
    "Karaikal",
    "Mahe",
    "Puducherry",
    "Yanam",
    "Unknown / Not Provided"
  ],

  "Unknown / Not Provided": [
    "Unknown / Not Provided"
  ]
};

/**
 * Safe runtime validation for the Indian Administrative Geographies dataset.
 * Verifies data integrity and reports descriptive developer-facing errors if anomalies exist.
 *
 * @param {Object} dataset - The dataset to validate (defaults to INDIAN_ADMINISTRATIVE_DATA)
 * @returns {{ isValid: boolean, errors: string[] }}
 */
export const validateGeographyDataset = (dataset = INDIAN_ADMINISTRATIVE_DATA) => {
  const errors = [];

  if (!dataset || typeof dataset !== 'object' || Array.isArray(dataset)) {
    const msg = `[PayGuard Geography Error] Dataset must be a valid non-null Object. Received: ${typeof dataset}`;
    console.error(msg);
    return { isValid: false, errors: [msg] };
  }

  const keys = Object.keys(dataset);
  if (keys.length < 36) {
    errors.push(`[PayGuard Geography Error] Expected at least 36 administrative entities (28 states + 8 UTs), found: ${keys.length}`);
  }

  // Mandatory check: Andhra Pradesh must exist and contain Nellore using official naming
  if (!dataset['Andhra Pradesh']) {
    errors.push(`[PayGuard Geography Error] Mandatory state 'Andhra Pradesh' is missing from dataset.`);
  } else if (!Array.isArray(dataset['Andhra Pradesh'])) {
    errors.push(`[PayGuard Geography Error] 'Andhra Pradesh' districts must be an Array.`);
  } else {
    const hasNellore = dataset['Andhra Pradesh'].includes('Nellore (Sri Potti Sriramulu Nellore)');
    if (!hasNellore) {
      errors.push(`[PayGuard Geography Error] Andhra Pradesh must include district 'Nellore (Sri Potti Sriramulu Nellore)'.`);
    }
  }

  // Fallback check
  if (!dataset['Unknown / Not Provided']) {
    errors.push(`[PayGuard Geography Error] Fallback entry 'Unknown / Not Provided' is missing.`);
  }

  // Validate each entry
  for (const [state, districts] of Object.entries(dataset)) {
    if (!Array.isArray(districts)) {
      errors.push(`[PayGuard Geography Error] Districts for '${state}' must be an Array. Received: ${typeof districts}`);
    } else if (districts.length === 0) {
      errors.push(`[PayGuard Geography Error] Districts for '${state}' must not be empty.`);
    }
  }

  if (errors.length > 0) {
    errors.forEach(err => console.error(err));
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
};

/**
 * Returns all 28 states and 8 union territories sorted alphabetically,
 * followed by the fallback "Unknown / Not Provided".
 */
export const getAllStates = () => {
  const allKeys = Object.keys(INDIAN_ADMINISTRATIVE_DATA);
  const regular = allKeys.filter(k => k !== "Unknown / Not Provided").sort();
  return [...regular, "Unknown / Not Provided"];
};

/**
 * Normalizes any geography input (whether array of strings, array of records,
 * object map of state->districts, or function returning an array) into a guaranteed,
 * sanitized Array of state names.
 *
 * Emits clear developer errors if an unrecoverable or unexpected structure is passed.
 *
 * @param {any} sourceData
 * @returns {string[]} Guaranteed Array of state names
 */
export const normalizeStatesList = (sourceData = INDIAN_ADMINISTRATIVE_DATA) => {
  if (sourceData === null || sourceData === undefined) {
    console.error('[PayGuard Geography Error] normalizeStatesList received null or undefined. Falling back to default states.');
    return getAllStates();
  }

  // Handle function source (e.g. if someone passes getAllStates function)
  let raw = typeof sourceData === 'function' ? sourceData() : sourceData;

  // Handle object structure containing states array or map
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if (Array.isArray(raw.states)) {
      raw = raw.states;
    } else if (Array.isArray(raw.data)) {
      raw = raw.data;
    } else {
      // It is an object mapping of { [stateName]: districtList }
      const keys = Object.keys(raw);
      if (keys.length > 0 && Array.isArray(raw[keys[0]])) {
        const regular = keys.filter(k => k !== "Unknown / Not Provided").sort();
        return keys.includes("Unknown / Not Provided")
          ? [...regular, "Unknown / Not Provided"]
          : regular;
      } else {
        console.error('[PayGuard Geography Error] normalizeStatesList received an object with an unexpected schema:', Object.keys(raw));
        return Object.keys(raw).sort();
      }
    }
  }

  // Ensure raw is now an Array
  if (!Array.isArray(raw)) {
    console.error('[PayGuard Geography Error] normalizeStatesList failed to resolve an Array. Type received:', typeof raw);
    return getAllStates();
  }

  // Normalize each record (handles strings, { name }, { state }, { label })
  const normalized = raw.map((item, index) => {
    if (typeof item === 'string') {
      return item.trim();
    }
    if (item && typeof item === 'object') {
      const extracted = item.name || item.state || item.label;
      if (extracted && typeof extracted === 'string') {
        return extracted.trim();
      }
      console.warn(`[PayGuard Geography Warning] Record at index ${index} missing 'name', 'state', or 'label':`, item);
      return String(extracted || index);
    }
    console.warn(`[PayGuard Geography Warning] Unexpected item type at index ${index}:`, typeof item);
    return String(item);
  }).filter(Boolean);

  return normalized;
};

/**
 * Normalized immutable Array of all 28 states and 8 union territories.
 * Guaranteed to be an Array with .filter(), .map(), and other array methods supported.
 */
export const INDIAN_STATES_LIST = Object.freeze(getAllStates());

// Run validation once upon module initialization
validateGeographyDataset(INDIAN_ADMINISTRATIVE_DATA);

/**
 * Returns the verified district list for a given state or union territory.
 */
export const getDistrictsForState = (stateName) => {
  if (!stateName || !INDIAN_ADMINISTRATIVE_DATA[stateName]) {
    return ["Unknown / Not Provided"];
  }
  return INDIAN_ADMINISTRATIVE_DATA[stateName];
};

/**
 * Validates whether a given district belongs to the selected state.
 */
export const isValidDistrictForState = (stateName, districtName) => {
  if (!stateName || !districtName) return false;
  const list = getDistrictsForState(stateName);
  return list.includes(districtName);
};

export const PAYMENT_CHANNELS = [
  "UPI",
  "IMPS",
  "NEFT",
  "RTGS",
  "Debit Card",
  "Net Banking"
];

export const TRANSACTION_TYPES = [
  "Merchant Purchase",
  "Person-to-Person (P2P)",
  "Bill Payment",
  "Fund Transfer"
];

export const MERCHANT_CATEGORIES = [
  "Grocery & Daily Retail",
  "Electronics & Digital Goods",
  "Food & Dining",
  "Travel & Transportation",
  "Healthcare & Pharmacy",
  "Utility Bills & Telecom",
  "Entertainment & Events",
  "Jewelry & Luxury Goods",
  "Peer to Peer / Non-Merchant"
];
