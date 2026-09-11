export const FACILITIES = [
  // ── Pipeline ──
  { name: "West-East Gas Pipeline (China)", country: "China", city: "Shaanxi", type: "pipeline", latitude: 34.3, longitude: 108.9, operator: "PetroChina", threatLevel: "high", description: "China's main gas transmission pipeline from west to east" },
  { name: "East Mediterranean Gas Pipeline", country: "Egypt", city: "Mediterranean", type: "pipeline", latitude: 31.2, longitude: 32.5, operator: "TotalEnergies", threatLevel: "high", description: "Natural gas pipeline from East Mediterranean to Egypt" },
  { name: "Red Sea Oil Pipeline", country: "Egypt", city: "Suez", type: "pipeline", latitude: 29.97, longitude: 32.52, operator: "Suez Canal Authority", threatLevel: "critical", description: "Oil pipeline bypassing the Suez Canal" },
  { name: "Tabreed Pipeline (KSA)", country: "Saudi Arabia", city: "Riyadh", type: "pipeline", latitude: 24.71, longitude: 46.68, operator: "SEC/Arwa", threatLevel: "high", description: "Major Saudi central cooling and utility pipeline" },
  { name: "NEEAB Pipeline (Kuwait)", country: "Kuwait", city: "Kuwait City", type: "pipeline", latitude: 29.38, longitude: 47.99, operator: "KCWC", threatLevel: "high", description: "National water distribution pipeline network" },
  { name: "Gas Pipeline (Iran-Ukraine)", country: "Iran", city: "Tehran", type: "pipeline", latitude: 35.69, longitude: 51.39, operator: "NIOC", threatLevel: "high", description: "Iran domestic gas transmission pipeline" },

  // ── Dam ──
  { name: "Assuan High Dam", country: "Egypt", city: "Aswan", type: "dam", latitude: 24.06, longitude: 32.89, operator: "Egyptian Ministry of Water", threatLevel: "critical", description: "Strategic dam on Nile River, critical water supply" },
  { name: "Lake Nasser Dam", country: "Egypt", city: "Aswan", type: "dam", latitude: 23.07, longitude: 31.95, operator: "Egyptian Ministry of Water", threatLevel: "critical", description: "Major reservoir on Nile, impacts Sudan water supply" },
  { name: "Grand Ethiopian Renaissance Dam (GERD)", country: "Ethiopia", city: "Benishangul", type: "dam", latitude: 13.5, longitude: 36.05, operator: "Ethiopian Electric Power", threatLevel: "critical", description: "Largest hydroelectric dam in Africa, source of Nile water disputes" },
  { name: "Tabqa Dam (Euphrates)", country: "Syria", city: "Essala", type: "dam", latitude: 35.57, longitude: 40.03, operator: "Syria Ministry of Water", threatLevel: "critical", description: "Main dam on Euphrates River in Syria" },
  { name: "Liman Dam (Euphrates)", country: "Turkey", city: "Birecik", type: "dam", latitude: 36.83, longitude: 37.73, operator: "DSI Turkey", threatLevel: "critical", description: "Major dam on Euphrates River in SE Turkey" },
  { name: "Ataturk Dam (Euphrates)", country: "Turkey", city: "Sanliurfa", type: "dam", latitude: 37.32, longitude: 38.03, operator: "DSI Turkey", threatLevel: "critical", description: "Turkey's largest dam, key water resource on Euphrates" },
  { name: "Qareh-Zia-Abad Dam", country: "Iran", city: "Ardebil", type: "dam", latitude: 38.57, longitude: 47.75, operator: "Iran MWRR", threatLevel: "high", description: "Major dam on Shoor River in northern Iran" },
  // ── Oil & Gas - MENA ──
  { name: "Ghawar Oil Field", country: "Saudi Arabia", city: "Al-Ahsa", type: "oil_gas", latitude: 25.1, longitude: 49.4, operator: "Saudi Aramco", threatLevel: "critical", description: "World's largest conventional oil field, producing ~5 million bpd", region: "MENA" },
  { name: "Abqaiq Processing Facility", country: "Saudi Arabia", city: "Abqaiq", type: "oil_gas", latitude: 25.93, longitude: 49.67, operator: "Saudi Aramco", threatLevel: "critical", description: "World's largest oil processing facility, attacked by drones in 2019" },
  { name: "Ras Tanura Refinery", country: "Saudi Arabia", city: "Ras Tanura", type: "oil_gas", latitude: 26.68, longitude: 50.16, operator: "Saudi Aramco", threatLevel: "critical", description: "Largest oil export terminal in the world" },
  { name: "Khurais Oil Field", country: "Saudi Arabia", city: "Khurais", type: "oil_gas", latitude: 25.07, longitude: 48.18, operator: "Saudi Aramco", threatLevel: "high", description: "Major Saudi oil field" },
  { name: "Shaybah Oil Field", country: "Saudi Arabia", city: "Rub al Khali", type: "oil_gas", latitude: 22.5, longitude: 53.5, operator: "Saudi Aramco", threatLevel: "high", description: "Remote Saudi oil field in Empty Quarter" },
  { name: "Rumaila Oil Field", country: "Iraq", city: "Basra", type: "oil_gas", latitude: 30.1, longitude: 47.4, operator: "BP/CNPC", threatLevel: "critical", description: "Iraq's largest oil field" },
  { name: "West Qurna Oil Field", country: "Iraq", city: "Basra", type: "oil_gas", latitude: 30.5, longitude: 47.5, operator: "ExxonMobil", threatLevel: "high", description: "Major Iraqi oil field" },
  { name: "Kirkuk Oil Field", country: "Iraq", city: "Kirkuk", type: "oil_gas", latitude: 35.47, longitude: 44.39, operator: "North Oil Company", threatLevel: "critical", description: "Strategic Kurdish-Arab disputed oil field" },
  { name: "South Pars Gas Field", country: "Iran", city: "Assaluyeh", type: "oil_gas", latitude: 27.46, longitude: 52.61, operator: "NIOC", threatLevel: "critical", description: "World's largest natural gas field (shared with Qatar)" },
  { name: "Kharg Island Terminal", country: "Iran", city: "Kharg Island", type: "oil_gas", latitude: 29.26, longitude: 50.33, operator: "NIOC", threatLevel: "critical", description: "Iran's main oil export terminal, handles 90% of exports" },
  { name: "North Dome Gas Field", country: "Qatar", city: "Doha", type: "oil_gas", latitude: 25.5, longitude: 51.8, operator: "QatarEnergy", threatLevel: "critical", description: "World's largest natural gas field (shared with Iran)" },
  { name: "Ras Laffan Industrial City", country: "Qatar", city: "Ras Laffan", type: "oil_gas", latitude: 25.89, longitude: 51.55, operator: "QatarEnergy", threatLevel: "critical", description: "World's largest LNG production complex" },
  { name: "Ruwais Refinery", country: "UAE", city: "Ruwais", type: "oil_gas", latitude: 24.11, longitude: 52.73, operator: "ADNOC", threatLevel: "high", description: "One of the world's largest refineries" },
  { name: "Zakum Oil Field", country: "UAE", city: "Abu Dhabi", type: "oil_gas", latitude: 24.5, longitude: 53.0, operator: "ADNOC", threatLevel: "high", description: "Major UAE offshore oil field" },
  { name: "Wafra Oil Field", country: "Kuwait", city: "Wafra", type: "oil_gas", latitude: 28.62, longitude: 47.93, operator: "KOC", threatLevel: "high", description: "Kuwait-Saudi Arabia Neutral Zone oil field" },
  { name: "Burgan Oil Field", country: "Kuwait", city: "Kuwait City", type: "oil_gas", latitude: 28.95, longitude: 48.0, operator: "Kuwait Oil Company", threatLevel: "critical", description: "World's second largest oil field" },
  { name: "Bab El-Mandeb Strait", country: "Yemen", city: "Aden", type: "oil_gas", latitude: 12.58, longitude: 43.45, operator: "International", threatLevel: "critical", description: "Critical shipping chokepoint for oil tankers" },
  { name: "Marib Gas Field", country: "Yemen", city: "Marib", type: "oil_gas", latitude: 15.47, longitude: 45.32, operator: "Yemen LNG", threatLevel: "critical", description: "Yemen's main gas production area, contested in civil war" },
  { name: "Mellitah Oil & Gas Complex", country: "Libya", city: "Mellitah", type: "oil_gas", latitude: 32.87, longitude: 12.35, operator: "NOC/ENI", threatLevel: "high", description: "Major Libyan oil and gas complex" },
  { name: "Sharara Oil Field", country: "Libya", city: "Ubari", type: "oil_gas", latitude: 27.9, longitude: 13.5, operator: "NOC", threatLevel: "critical", description: "Libya's largest oil field" },
  { name: "Suez Canal", country: "Egypt", city: "Ismailia", type: "oil_gas", latitude: 30.58, longitude: 32.27, operator: "Suez Canal Authority", threatLevel: "critical", description: "Critical global shipping chokepoint" },
  { name: "Strait of Hormuz", country: "Iran", city: "Bandar Abbas", type: "oil_gas", latitude: 26.57, longitude: 56.26, operator: "International", threatLevel: "critical", description: "World's most critical oil shipping chokepoint" },

  // ── Nuclear Facilities ──
  { name: "Natanz Nuclear Facility", country: "Iran", city: "Natanz", type: "nuclear", latitude: 33.72, longitude: 51.73, operator: "AEOI", threatLevel: "critical", description: "Iran's main uranium enrichment facility" },
  { name: "Fordow Fuel Enrichment Plant", country: "Iran", city: "Fordow", type: "nuclear", latitude: 34.88, longitude: 50.98, operator: "AEOI", threatLevel: "critical", description: "Underground uranium enrichment facility" },
  { name: "Arak Heavy Water Reactor", country: "Iran", city: "Arak", type: "nuclear", latitude: 34.07, longitude: 49.22, operator: "AEOI", threatLevel: "critical", description: "Iranian heavy water nuclear reactor" },
  { name: "Bushehr Nuclear Power Plant", country: "Iran", city: "Bushehr", type: "nuclear", latitude: 28.83, longitude: 50.89, operator: "AEOI/Rosatom", threatLevel: "high", description: "Iran's only operational nuclear power plant" },
  { name: "Dimona Nuclear Research Center", country: "Israel", city: "Dimona", type: "nuclear", latitude: 30.97, longitude: 35.14, operator: "IAEC", threatLevel: "critical", description: "Israel's undeclared nuclear weapons facility" },
  { name: "Barakah Nuclear Power Plant", country: "UAE", city: "Abu Dhabi", type: "nuclear", latitude: 23.97, longitude: 52.22, operator: "ENEC", threatLevel: "high", description: "UAE's first nuclear power plant" },
  { name: "El-Dabaa Nuclear Power Plant", country: "Egypt", city: "El-Dabaa", type: "nuclear", latitude: 31.02, longitude: 28.43, operator: "NPPA/Rosatom", threatLevel: "high", description: "Egypt's first nuclear power plant under construction" },
  { name: "Pakistan Atomic Energy Commission HQ", country: "Pakistan", city: "Islamabad", type: "nuclear", latitude: 33.73, longitude: 73.04, operator: "PAEC", threatLevel: "critical", description: "Pakistan's nuclear energy authority headquarters" },
  { name: "Kahuta Research Laboratories", country: "Pakistan", city: "Kahuta", type: "nuclear", latitude: 33.59, longitude: 73.39, operator: "KRL", threatLevel: "critical", description: "Pakistan's main uranium enrichment facility" },

  // ── Military Facilities ──
  { name: "Al-Udeid Air Base", country: "Qatar", city: "Doha", type: "military", latitude: 25.12, longitude: 51.31, operator: "US Air Force/Qatar", threatLevel: "critical", description: "Largest US military base in the Middle East" },
  { name: "Ali Al Salem Air Base", country: "Kuwait", city: "Kuwait City", type: "military", latitude: 29.35, longitude: 47.52, operator: "US Air Force/Kuwait", threatLevel: "high", description: "Major US air base in Kuwait" },
  { name: "Camp Arifjan", country: "Kuwait", city: "Kuwait City", type: "military", latitude: 29.18, longitude: 48.04, operator: "US Army", threatLevel: "high", description: "US Army base in Kuwait" },
  { name: "Naval Support Activity Bahrain", country: "Bahrain", city: "Manama", type: "military", latitude: 26.22, longitude: 50.61, operator: "US Navy (5th Fleet)", threatLevel: "critical", description: "Home of US Navy 5th Fleet" },
  { name: "Prince Sultan Air Base", country: "Saudi Arabia", city: "Al Kharj", type: "military", latitude: 24.06, longitude: 47.58, operator: "US Air Force/Saudi Arabia", threatLevel: "high", description: "Major Saudi and US air base" },
  { name: "Eskan Village Air Base", country: "Saudi Arabia", city: "Riyadh", type: "military", latitude: 24.48, longitude: 46.72, operator: "US Air Force", threatLevel: "high", description: "US Air Force base near Riyadh" },
  { name: "Incirlik Air Base", country: "Turkey", city: "Adana", type: "military", latitude: 37.0, longitude: 35.43, operator: "NATO/Turkey", threatLevel: "critical", description: "NATO air base hosting US nuclear weapons" },
  { name: "Muwaffaq Salti Air Base", country: "Jordan", city: "Azraq", type: "military", latitude: 31.83, longitude: 36.79, operator: "US Air Force/Jordan", threatLevel: "high", description: "US and Jordanian air base" },
  { name: "Ain Assad Air Base", country: "Iraq", city: "Al Anbar", type: "military", latitude: 33.38, longitude: 42.44, operator: "Iraq/US", threatLevel: "critical", description: "Iraqi air base, attacked by Iran in 2020" },
  { name: "Camp Lemonnier", country: "Somalia", city: "Djibouti", type: "military", latitude: 11.55, longitude: 43.16, operator: "US Military", threatLevel: "high", description: "US military base in Djibouti" },
  { name: "Hmeimim Air Base", country: "Syria", city: "Latakia", type: "military", latitude: 35.4, longitude: 35.95, operator: "Russia", threatLevel: "critical", description: "Russian military air base in Syria" },
  { name: "Tartus Naval Base", country: "Syria", city: "Tartus", type: "military", latitude: 34.89, longitude: 35.87, operator: "Russia", threatLevel: "critical", description: "Russia's only naval base in the Mediterranean" },
  { name: "Tiyas Military Airbase (T4)", country: "Syria", city: "Homs", type: "military", latitude: 34.52, longitude: 37.62, operator: "Syria/Iran", threatLevel: "critical", description: "Syrian air base used by Iranian forces, repeatedly attacked by Israel" },
  { name: "Haifa Naval Base", country: "Israel", city: "Haifa", type: "military", latitude: 32.82, longitude: 35.0, operator: "Israel Navy", threatLevel: "high", description: "Main Israeli naval base" },
  { name: "Nevatim Air Base", country: "Israel", city: "Negev", type: "military", latitude: 31.21, longitude: 35.01, operator: "Israeli Air Force", threatLevel: "high", description: "Major Israeli Air Force base" },
  { name: "Kandahar Airfield", country: "Afghanistan", city: "Kandahar", type: "military", latitude: 31.51, longitude: 65.85, operator: "Afghanistan", threatLevel: "high", description: "Former NATO/US military base" },
  { name: "Bagram Airfield", country: "Afghanistan", city: "Bagram", type: "military", latitude: 34.95, longitude: 69.27, operator: "Afghanistan", threatLevel: "high", description: "Former largest US military base in Afghanistan" },

  // ── Airports ──
  { name: "Dubai International Airport", country: "UAE", city: "Dubai", type: "airport", latitude: 25.25, longitude: 55.36, operator: "Dubai Airports", threatLevel: "low", description: "World's busiest international airport by passenger traffic" },
  { name: "King Abdulaziz International Airport", country: "Saudi Arabia", city: "Jeddah", type: "airport", latitude: 21.67, longitude: 39.16, operator: "GACA", threatLevel: "low", description: "Major Saudi international airport" },
  { name: "King Khalid International Airport", country: "Saudi Arabia", city: "Riyadh", type: "airport", latitude: 24.96, longitude: 46.7, operator: "GACA", threatLevel: "low", description: "Main Riyadh international airport" },
  { name: "Istanbul Airport", country: "Turkey", city: "Istanbul", type: "airport", latitude: 41.27, longitude: 28.74, operator: "iGA", threatLevel: "low", description: "Turkey's main international hub" },
  { name: "Cairo International Airport", country: "Egypt", city: "Cairo", type: "airport", latitude: 30.12, longitude: 31.41, operator: "ECAA", threatLevel: "low", description: "Egypt's main international airport" },
  { name: "Ben Gurion International Airport", country: "Israel", city: "Tel Aviv", type: "airport", latitude: 32.01, longitude: 34.89, operator: "IAA", threatLevel: "high", description: "Israel's main international airport" },
  { name: "Hamad International Airport", country: "Qatar", city: "Doha", type: "airport", latitude: 25.27, longitude: 51.61, operator: "Qatar Airways", threatLevel: "low", description: "Qatar's main international hub" },
  { name: "Abu Dhabi International Airport", country: "UAE", city: "Abu Dhabi", type: "airport", latitude: 24.43, longitude: 54.65, operator: "Abu Dhabi Airports", threatLevel: "low", description: "UAE's second largest airport" },
  { name: "Beirut Rafic Hariri International Airport", country: "Lebanon", city: "Beirut", type: "airport", latitude: 33.82, longitude: 35.49, operator: "DAC", threatLevel: "high", description: "Lebanon's only international airport" },
  { name: "Aden International Airport", country: "Yemen", city: "Aden", type: "airport", latitude: 12.83, longitude: 45.03, operator: "Yemen", threatLevel: "critical", description: "Yemen's main airport in conflict zone" },
  { name: "Sanaa International Airport", country: "Yemen", city: "Sanaa", type: "airport", latitude: 15.48, longitude: 44.22, operator: "Yemen/Houthis", threatLevel: "critical", description: "Yemen's capital airport under Houthi control" },

  // ── Data Centers ──
  { name: "Microsoft Azure UAE North", country: "UAE", city: "Dubai", type: "data_center", latitude: 25.2, longitude: 55.27, operator: "Microsoft", threatLevel: "low", description: "Microsoft's primary UAE cloud region" },
  { name: "Amazon AWS Middle East (Bahrain)", country: "Bahrain", city: "Manama", type: "data_center", latitude: 26.21, longitude: 50.59, operator: "Amazon Web Services", threatLevel: "low", description: "AWS first Middle East region" },
  { name: "Google Cloud Middle East", country: "Israel", city: "Tel Aviv", type: "data_center", latitude: 32.08, longitude: 34.78, operator: "Google", threatLevel: "low", description: "Google Cloud Israel region" },
  { name: "Oracle Cloud UAE", country: "UAE", city: "Abu Dhabi", type: "data_center", latitude: 24.47, longitude: 54.37, operator: "Oracle", threatLevel: "low", description: "Oracle Cloud Infrastructure UAE region" },
  { name: "Equinix Dubai", country: "UAE", city: "Dubai", type: "data_center", latitude: 25.19, longitude: 55.26, operator: "Equinix", threatLevel: "low", description: "Major colocation data center in Dubai" },
  { name: "STC Cloud Saudi Arabia", country: "Saudi Arabia", city: "Riyadh", type: "data_center", latitude: 24.69, longitude: 46.72, operator: "Saudi Telecom Company", threatLevel: "low", description: "Saudi Arabia's largest cloud provider" },

  // ── Embassies ──
  { name: "US Embassy Riyadh", country: "Saudi Arabia", city: "Riyadh", type: "embassy", latitude: 24.69, longitude: 46.72, operator: "US State Department", threatLevel: "high", description: "United States Embassy in Saudi Arabia" },
  { name: "US Embassy Tel Aviv", country: "Israel", city: "Tel Aviv", type: "embassy", latitude: 32.07, longitude: 34.79, operator: "US State Department", threatLevel: "high", description: "United States Embassy in Israel" },
  { name: "US Embassy Cairo", country: "Egypt", city: "Cairo", type: "embassy", latitude: 30.04, longitude: 31.23, operator: "US State Department", threatLevel: "high", description: "United States Embassy in Egypt" },
  { name: "US Embassy Baghdad", country: "Iraq", city: "Baghdad", type: "embassy", latitude: 33.31, longitude: 44.42, operator: "US State Department", threatLevel: "critical", description: "World's largest US embassy compound" },
  { name: "US Embassy Ankara", country: "Turkey", city: "Ankara", type: "embassy", latitude: 39.93, longitude: 32.86, operator: "US State Department", threatLevel: "high", description: "United States Embassy in Turkey" },
  { name: "Russian Embassy Damascus", country: "Syria", city: "Damascus", type: "embassy", latitude: 33.51, longitude: 36.29, operator: "Russian MFA", threatLevel: "critical", description: "Russian Embassy in Syria" },
  { name: "Iranian Embassy Baghdad", country: "Iraq", city: "Baghdad", type: "embassy", latitude: 33.33, longitude: 44.4, operator: "Iranian MFA", threatLevel: "critical", description: "Iranian Embassy in Iraq" },
  { name: "Chinese Embassy Riyadh", country: "Saudi Arabia", city: "Riyadh", type: "embassy", latitude: 24.7, longitude: 46.68, operator: "Chinese MFA", threatLevel: "low", description: "Chinese Embassy in Saudi Arabia" },

  // ── Satellite Facilities ──
  { name: "King Abdulaziz City for Science and Technology", country: "Saudi Arabia", city: "Riyadh", type: "satellite", latitude: 24.76, longitude: 46.63, operator: "KACST", threatLevel: "low", description: "Saudi Arabia's space and satellite research center" },
  { name: "Mohammed Bin Rashid Space Centre", country: "UAE", city: "Dubai", type: "satellite", latitude: 25.12, longitude: 55.37, operator: "MBRSC", threatLevel: "low", description: "UAE space agency, launched Hope Mars Mission" },
  { name: "Israel Space Agency", country: "Israel", city: "Tel Aviv", type: "satellite", latitude: 32.08, longitude: 34.78, operator: "ISA", threatLevel: "high", description: "Israeli space agency headquarters" },
  { name: "Palmachim Air Base (Space Launch)", country: "Israel", city: "Palmachim", type: "satellite", latitude: 31.9, longitude: 34.69, operator: "Israel Aerospace Industries", threatLevel: "high", description: "Israeli satellite launch facility" },
  { name: "Iran Space Agency", country: "Iran", city: "Tehran", type: "satellite", latitude: 35.7, longitude: 51.4, operator: "ISA Iran", threatLevel: "high", description: "Iranian space agency" },
  { name: "Shahroud Space Launch Complex", country: "Iran", city: "Shahroud", type: "satellite", latitude: 36.42, longitude: 55.01, operator: "IRGC Aerospace", threatLevel: "critical", description: "Iranian military satellite launch site" },

  // ── Major Companies ──
  { name: "Saudi Aramco HQ", country: "Saudi Arabia", city: "Dhahran", type: "company", latitude: 26.27, longitude: 50.15, operator: "Saudi Aramco", threatLevel: "critical", description: "World's most valuable company, oil giant" },
  { name: "QatarEnergy HQ", country: "Qatar", city: "Doha", type: "company", latitude: 25.29, longitude: 51.53, operator: "QatarEnergy", threatLevel: "high", description: "Qatar's state energy company" },
  { name: "ADNOC HQ", country: "UAE", city: "Abu Dhabi", type: "company", latitude: 24.46, longitude: 54.37, operator: "ADNOC", threatLevel: "high", description: "Abu Dhabi National Oil Company headquarters" },
  { name: "Emirates Airlines HQ", country: "UAE", city: "Dubai", type: "company", latitude: 25.25, longitude: 55.36, operator: "Emirates Group", threatLevel: "low", description: "World's largest international airline headquarters" },
  { name: "Dubai Financial Market", country: "UAE", city: "Dubai", type: "company", latitude: 25.2, longitude: 55.28, operator: "DFM", threatLevel: "low", description: "Dubai's main stock exchange" },
  { name: "Tadawul (Saudi Stock Exchange)", country: "Saudi Arabia", city: "Riyadh", type: "company", latitude: 24.69, longitude: 46.69, operator: "Tadawul", threatLevel: "low", description: "Saudi Arabia's main stock exchange" },
  { name: "Bank Hapoalim HQ", country: "Israel", city: "Tel Aviv", type: "company", latitude: 32.07, longitude: 34.78, operator: "Bank Hapoalim", threatLevel: "low", description: "Israel's largest bank" },
  { name: "Turkcell HQ", country: "Turkey", city: "Istanbul", type: "company", latitude: 41.01, longitude: 28.98, operator: "Turkcell", threatLevel: "low", description: "Turkey's largest mobile operator" },
];

export const FACILITY_TYPES = [
  {
    id: "military",
    label: "Military Base",
    color: "#ef4444",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="14" fill="#1a2010"/>
      <polygon points="64,8 118,40 100,105 28,105 10,40" fill="none" stroke="#4a5c2a" stroke-width="2.5"/><rect x="38" y="38" width="52" height="52" rx="3" fill="#243018" stroke="#3a4a20" stroke-width="1.5"/>
        <rect x="50" y="50" width="28" height="28" rx="2" fill="#2e3d1a" stroke="#5a7030" stroke-width="1.5"/>
        <rect x="54" y="54" width="20" height="20" rx="1" fill="#364520" stroke="#6a8040" stroke-width="1"/>
          <polygon points="64,56 65.9,62.1 72.4,62.1 67.2,66 69.1,72.1 64,68.2 58.9,72.1 60.8,66 55.6,62.1 62.1,62.1" fill="#c8a820" stroke="#a88010" stroke-width="0.5"/>
          <rect x="18" y="46" width="16" height="10" rx="1" fill="#2a3818" stroke="#4a5c28" stroke-width="1"/>
          <line x1="21" y1="46" x2="21" y2="56" stroke="#3a4c22" stroke-width="0.8"/>
          <line x1="24" y1="46" x2="24" y2="56" stroke="#3a4c22" stroke-width="0.8"/>
          <line x1="27" y1="46" x2="27" y2="56" stroke="#3a4c22" stroke-width="0.8"/>
          <line x1="30" y1="46" x2="30" y2="56" stroke="#3a4c22" stroke-width="0.8"/>
          <rect x="94" y="46" width="16" height="10" rx="1" fill="#2a3818" stroke="#4a5c28" stroke-width="1"/>
          <line x1="97" y1="46" x2="97" y2="56" stroke="#3a4c22" stroke-width="0.8"/>
          <line x1="100" y1="46" x2="100" y2="56" stroke="#3a4c22" stroke-width="0.8"/>
          <line x1="103" y1="46" x2="103" y2="56" stroke="#3a4c22" stroke-width="0.8"/>
          <line x1="106" y1="46" x2="106" y2="56" stroke="#3a4c22" stroke-width="0.8"/>
            <rect x="14" y="72" width="100" height="8" rx="1" fill="#1e2814" stroke="#3a4c22" stroke-width="0.8"/>
            <line x1="20" y1="76" x2="30" y2="76" stroke="#5a7030" stroke-width="1.5" stroke-dasharray="4,3"/>
            <line x1="36" y1="76" x2="46" y2="76" stroke="#5a7030" stroke-width="1.5" stroke-dasharray="4,3"/>
            <line x1="82" y1="76" x2="92" y2="76" stroke="#5a7030" stroke-width="1.5" stroke-dasharray="4,3"/>
            <line x1="98" y1="76" x2="108" y2="76" stroke="#5a7030" stroke-width="1.5" stroke-dasharray="4,3"/>
            <rect x="14" y="14" width="8" height="8" rx="1" fill="#3a4c22" stroke="#5a7030" stroke-width="1"/>
            <rect x="106" y="14" width="8" height="8" rx="1" fill="#3a4c22" stroke="#5a7030" stroke-width="1"/>
            <rect x="14" y="106" width="8" height="8" rx="1" fill="#3a4c22" stroke="#5a7030" stroke-width="1"/>
            <rect x="106" y="106" width="8" height="8" rx="1" fill="#3a4c22" stroke="#5a7030" stroke-width="1"/>
            <circle cx="18" cy="18" r="2" fill="#8ab040"/>
              <circle cx="110" cy="18" r="2" fill="#8ab040"/><circle cx="18" cy="110" r="2" fill="#8ab040"/>
              <circle cx="110" cy="110" r="2" fill="#8ab040"/><!-- Radar dish (top center) -->
              <circle cx="64" cy="20" r="5" fill="none" stroke="#6a8040" stroke-width="1.5"/>
              <line x1="64" y1="15" x2="64" y2="25" stroke="#6a8040" stroke-width="1"/>
              <line x1="59" y1="20" x2="69" y2="20" stroke="#6a8040" stroke-width="1"/><circle cx="64" cy="20" r="1.5" fill="#8ab040"/>
              <line x1="64" y1="20" x2="64" y2="38" stroke="#5a7030" stroke-width="0.8"/>
              </svg>`,
  },
  {
    id: "fighter",
    label: "Fighter Aircraft",
    color: "#06b6d4",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"> <path d="M0,0 L128,0 L128,128 L0,128 Z " fill="#000202" transform="translate(0,0)"/> <path d="M0,0 L2,1 L-5,14 L-14,25 L-22,33 L-18,32 L-16,36 L-23,43 L-23,99 L-28,104 L-32,102 L-55,79 L-53,75 L-54,75 L-58,79 L-59,102 L-62,104 L-66,103 L-73,93 L-72,87 L-71,85 L-75,87 L-77,85 L-76,81 L-78,79 L-82,80 L-82,78 L-84,78 L-82,74 L-83,74 L-90,75 L-100,67 L-98,62 L-97,60 L-75,59 L-71,54 L-73,56 L-76,56 L-76,54 L-80,52 L-87,44 L-98,33 L-100,32 L-98,28 L-95,25 L-41,24 L-34,18 L-30,19 L-30,22 L-25,18 L-15,9 Z " fill="#04EEF1" transform="translate(113,12)"/> </svg>`,
  },
  {
    id: "military_airport",
    label: "Military Airport",
    color: "#22c55e",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="#0a0f1a" rx="8"/><rect x="56" y="10" width="16" height="108" fill="#22c55e" rx="4"/><rect x="10" y="56" width="108" height="16" fill="#22c55e" rx="4"/><rect x="60" y="14" width="8" height="100" fill="#16a34a" rx="2"/><rect x="14" y="60" width="100" height="8" fill="#16a34a" rx="2"/><circle cx="64" cy="64" r="10" fill="#0a0f1a" stroke="#22c55e" stroke-width="2"/><circle cx="64" cy="64" r="4" fill="#22c55e"/></svg>`,
  },
  {
    id: "nuclear",
    label: "Nuclear Facility",
    color: "#eab308",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"> <path d="M0,0 L94,0 L94,94 L0,94 Z " fill="#070702" transform="translate(17,17)"/> <path d="M0,0 L94,0 L94,94 L0,94 Z M39,7 L28,11 L19,18 L13,25 L8,36 L7,39 L7,55 L14,71 L24,81 L34,86 L40,88 L54,88 L67,83 L77,74 L81,69 L85,62 L87,55 L87,41 L84,31 L78,21 L69,13 L58,8 L53,7 Z " fill="#030301" transform="translate(17,17)"/> <path d="M0,0 L14,0 L24,3 L34,9 L42,18 L47,29 L48,34 L48,48 L44,59 L38,67 L31,74 L21,79 L15,81 L1,81 L-10,77 L-18,71 L-25,64 L-32,48 L-32,32 L-27,20 L-21,12 L-14,6 L-6,2 Z M1,3 L-10,7 L-18,13 L-24,20 L-29,32 L-29,48 L-25,58 L-21,64 L-13,72 L-5,76 L1,78 L14,78 L23,75 L31,70 L36,65 L40,60 L44,52 L45,48 L45,32 L40,20 L31,10 L20,4 L15,3 Z " fill="#E0DE07" transform="translate(56,24)"/> <path d="M0,0 L12,0 L21,15 L22,19 L16,22 L11,23 L-1,23 L-10,19 L-8,13 Z " fill="#F6F302" transform="translate(58,74)"/> <path d="M0,0 L5,2 L12,10 L16,19 L16,28 L-5,28 L-7,22 L-10,19 L-8,13 Z " fill="#F8F503" transform="translate(80,36)"/> <path d="M0,0 L3,1 L12,17 L12,19 L8,23 L7,28 L-14,28 L-14,20 L-10,10 L-3,2 Z " fill="#F8F403" transform="translate(46,36)"/> <path d="M0,0 L6,0 L11,5 L12,6 L12,12 L7,17 L6,18 L0,18 L-5,13 L-6,12 L-6,6 L-1,1 Z " fill="#EFEC03" transform="translate(61,55)"/> <path d="M0,0 L94,0 L94,1 L0,1 Z " fill="#000000" transform="translate(17,112)"/> <path d="M0,0 L1,0 L1,94 L0,94 Z " fill="#000000" transform="translate(112,17)"/> <path d="M0,0 L1,0 L1,94 L0,94 Z " fill="#000000" transform="translate(15,17)"/> <path d="M0,0 L94,0 L94,1 L0,1 Z " fill="#000000" transform="translate(17,15)"/> </svg>`,
  },
  {
    id: "naval",
    label: "Naval Vessel",
    color: "#3b82f6",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"> <path d="M0,0 L128,0 L128,128 L0,128 Z " fill="#010202" transform="translate(0,0)"/> <path d="M0,0 L4,1 L-5,14 L-110,15 L-116,12 L-116,11 L-107,11 L-107,13 L-105,11 L-101,11 L-102,4 L-26,3 Z " fill="#3896CF" transform="translate(120,69)"/> <path d="M0,0 L7,0 L8,10 L10,10 L11,6 L26,6 L27,11 L38,11 L38,14 L-14,14 L-14,10 L-11,10 L-11,8 L-13,8 L-13,6 L-6,6 L-6,10 L-3,10 L-1,1 Z " fill="#3281B1" transform="translate(52,58)"/> <path d="M0,0 L97,1 L96,4 L-9,5 L-15,2 L-15,1 L-6,1 L-6,3 L-4,1 Z " fill="#266388" transform="translate(19,79)"/> <path d="M0,0 L2,0 L2,3 L0,3 L0,5 L2,6 L1,10 L3,10 L4,7 L6,7 L6,11 L13,11 L13,19 L9,19 L8,15 L-4,15 L-5,2 L0,1 Z " fill="#2E79A6" transform="translate(71,48)"/> <path d="M0,0 L7,0 L7,9 L-2,9 L-1,1 Z " fill="#368FC5" transform="translate(52,58)"/> </svg>`,
  },
  {
    id: "oil_gas",
    label: "Oil & Gas",
    color: "#f97316",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"> <path d="M0,0 L90,0 L90,104 L0,104 Z " fill="#020101" transform="translate(19,12)"/> <path d="M0,0 L4,2 L10,11 L12,18 L12,30 L7,31 L0,19 L-14,24 L-15,29 L-7,53 L-3,66 L-3,69 L20,69 L20,74 L-57,74 L-57,69 L-52,69 L-52,57 L-48,57 L-48,38 L-50,38 L-51,32 L-26,22 L-22,18 L-13,17 L-3,13 L-3,1 Z " fill="#D25D03" transform="translate(83,27)"/> <path d="M0,0 L1,2 L-6,24 L-12,41 L-16,41 L-16,30 L-20,30 L-20,8 Z " fill="#0B0502" transform="translate(57,55)"/> <path d="M0,0 L6,0 L6,2 L8,2 L10,7 L9,12 L-4,12 L-3,9 L-4,7 L-3,2 L1,3 Z " fill="#4A2205" transform="translate(60,67)"/> <path d="M0,0 L1,0 L1,102 L0,102 Z " fill="#000000" transform="translate(110,13)"/> <path d="M0,0 L1,0 L1,102 L0,102 Z " fill="#000000" transform="translate(17,13)"/> <path d="M0,0 L5,5 L8,8 L7,15 L4,16 L2,10 L0,9 L0,12 L-2,12 L-1,16 L-3,16 L-4,14 L-4,8 L-1,4 Z " fill="#E06404" transform="translate(91,78)"/> <path d="M0,0 L5,1 L13,6 L13,7 L-10,7 L-5,3 Z " fill="#0B0502" transform="translate(61,89)"/> <path d="M0,0 L90,0 L90,1 L0,1 Z " fill="#000000" transform="translate(19,117)"/> <path d="M0,0 L90,0 L90,1 L0,1 Z " fill="#000000" transform="translate(19,10)"/> </svg>`,
  },
  {
    id: "satellite",
    label: "Satellite / SIGINT",
    color: "#a855f7",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"> <path d="M0,0 L128,0 L128,128 L0,128 Z " fill="#0A0915" transform="translate(0,0)"/> <path d="M0,0 L6,1 L16,10 L27,22 L26,24 L22,23 L7,8 L3,6 L6,18 L13,32 L22,42 L29,48 L40,54 L45,56 L52,57 L45,48 L36,38 L34,35 L38,33 L49,45 L57,55 L57,61 L45,67 L42,68 L24,68 L11,63 L2,56 L-5,47 L-10,34 L-10,20 L-6,9 Z " fill="#9101F6" transform="translate(34,24)"/> <path d="M0,0 L14,0 L23,4 L29,8 L34,13 L40,21 L44,34 L44,45 L39,46 L38,31 L31,17 L23,10 L15,6 L1,4 Z " fill="#8D02ED" transform="translate(64,10)"/> <path d="M0,0 L9,0 L19,4 L26,10 L32,22 L32,34 L27,34 L26,21 L21,13 L15,8 L8,5 L-1,4 Z " fill="#8D02EC" transform="translate(65,20)"/> <path d="M0,0 L5,0 L6,1 L6,6 L4,8 L1,8 L-1,13 L-7,22 L-11,20 L-16,15 L-16,13 L-3,5 Z " fill="#9102F4" transform="translate(68,43)"/> <path d="M0,0 L10,1 L16,5 L21,12 L21,22 L17,22 L15,12 L10,7 L0,5 L-1,1 Z " fill="#8E02ED" transform="translate(65,30)"/> </svg>`,
  },
  {
    id: "embassy",
    label: "Embassy / Consulate",
    color: "#f59e0b",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"> <path d="M0,0 L128,0 L128,128 L0,128 Z " fill="#050401" transform="translate(0,0)"/> <path d="M0,0 L2,0 L3,16 L48,35 L52,37 L52,39 L-50,39 L-49,36 L-9,19 L-4,17 L0,17 Z " fill="#F7C806" transform="translate(63,13)"/> <path d="M0,0 L92,0 L92,7 L97,7 L97,13 L-5,13 L-5,7 L0,7 Z " fill="#F2C506" transform="translate(18,102)"/> <path d="M0,0 L13,0 L13,37 L0,37 Z " fill="#F4C706" transform="translate(92,63)"/> <path d="M0,0 L13,0 L13,37 L0,37 Z " fill="#F7C705" transform="translate(69,63)"/> <path d="M0,0 L13,0 L13,37 L0,37 Z " fill="#F8C804" transform="translate(46,63)"/> <path d="M0,0 L13,0 L13,37 L0,37 Z " fill="#F5C705" transform="translate(23,63)"/> <path d="M0,0 L92,0 L92,5 L0,5 Z " fill="#F5C706" transform="translate(18,55)"/> <path d="M0,0 L13,0 L13,9 L0,9 Z " fill="#FACD06" transform="translate(67,15)"/> </svg>`,
  },
  {
    id: "data_center",
    label: "Data Center / Cyber",
    color: "#06b6d4",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"> <path d="M0,0 L70,0 L75,2 L75,96 L71,98 L-1,98 L-5,96 L-5,2 Z M73,3 L73,95 L74,95 L74,3 Z M7,4 Z M10,4 Z M13,4 Z M16,4 Z M20,4 Z M23,4 Z M26,4 Z M30,4 Z M33,4 Z M36,4 Z M43,4 Z M46,4 Z M49,4 Z M53,4 Z M56,4 Z M59,4 Z M10,7 Z M13,7 Z M20,7 Z M23,7 Z M26,7 Z M33,7 Z M36,7 Z M43,7 Z M46,7 Z M49,7 Z M53,7 Z M56,7 Z M59,7 Z M2,11 L2,12 L68,12 L68,11 Z M2,13 L2,84 L4,84 L4,13 Z M66,13 L66,84 L68,84 L68,13 Z M4,28 L4,29 L66,29 L66,28 Z M4,36 L4,37 L66,37 L66,36 Z M34,45 Z M34,52 L34,54 L36,54 L36,52 Z M4,53 Z M65,53 Z M34,60 L4,61 L4,62 L60,62 L60,61 Z M61,61 L61,62 L66,62 L66,61 Z M4,69 L4,70 L36,71 L66,70 L66,69 Z M4,77 Z M34,77 L34,79 L37,78 Z M65,77 Z M2,85 Z M34,85 Z M66,85 Z M8,89 L9,91 Z M11,89 L12,92 Z M14,89 L15,92 Z M17,89 Z M20,89 Z M23,89 L24,92 Z M26,89 L27,91 Z M37,89 L38,92 Z M40,89 Z M43,89 Z M46,89 Z M49,89 Z M52,89 L53,92 Z M55,90 Z M17,91 Z M20,91 Z M40,91 Z M43,91 Z M46,91 Z M49,91 Z M5,93 Z M8,93 Z M11,93 Z M14,93 Z M17,93 Z M20,93 Z M23,93 Z M26,93 Z M29,93 Z M37,93 Z M40,93 Z M43,93 Z M46,93 Z M49,93 Z M52,93 Z M55,93 Z M65,93 Z " fill="#0DB9C3" transform="translate(29,15)"/> <path d="M0,0 L72,0 L72,1 L0,1 Z " fill="#00F7FB" transform="translate(28,114)"/> <path d="M0,0 L70,0 L70,1 L0,1 Z " fill="#00FFFF" transform="translate(29,13)"/> <path d="M0,0 Z " fill="#00FFFF" transform="translate(100,113)"/> <path d="M0,0 Z " fill="#00AAAA" transform="translate(27,113)"/> <path d="M0,0 Z " fill="#000000" transform="translate(101,112)"/> <path d="M0,0 Z " fill="#000000" transform="translate(26,112)"/> <path d="M0,0 Z " fill="#007FFF" transform="translate(25,111)"/> <path d="M0,0 Z " fill="#000000" transform="translate(101,15)"/> <path d="M0,0 Z " fill="#000000" transform="translate(26,15)"/> <path d="M0,0 Z " fill="#00FFFF" transform="translate(100,14)"/> <path d="M0,0 Z " fill="#00FFFF" transform="translate(27,14)"/> </svg>`,
  },
  {
    id: "port",
    label: "Port / Harbor",
    color: "#0ea5e9",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"> <path d="M0,0 L128,0 L128,128 L0,128 Z " fill="#0A0B15" transform="translate(0,0)"/> <path d="M0,0 L8,1 L12,6 L12,11 L9,10 L6,5 L0,5 L-2,8 L-1,13 L5,12 L10,14 L10,17 L6,18 L7,23 L15,24 L13,29 L6,29 L7,45 L6,46 L9,49 L14,50 L17,53 L16,61 L18,61 L17,67 L14,70 L12,70 L12,68 L8,70 L10,75 L11,76 L19,76 L27,71 L31,66 L27,65 L34,59 L36,56 L38,56 L39,62 L39,71 L37,71 L37,69 L34,72 L28,80 L20,85 L6,91 L2,93 L-6,88 L-11,86 L-11,82 L-13,84 L-12,79 L-15,79 L-17,83 L-16,78 L-12,75 L-11,70 L-8,67 L0,68 L-2,67 L-2,50 L-2,48 L-2,45 L-6,43 L-10,41 L-12,38 L-12,35 L-10,35 L-13,31 L-13,28 L-17,30 L-22,29 L-22,24 L-21,23 L-1,23 L-1,19 L-6,20 L-5,16 L-6,14 L-6,5 Z " fill="#094C73" transform="translate(61,17)"/> <path d="M0,0 L2,0 L3,6 L3,15 L1,15 L1,13 L-2,16 L-8,24 L-16,29 L-30,35 L-34,37 L-42,32 L-47,30 L-47,26 L-49,28 L-48,23 L-51,23 L-53,27 L-52,22 L-47,19 L-46,21 L-40,19 L-37,15 L-36,16 L-28,16 L-25,20 L-17,20 L-9,15 L-5,10 L-9,9 L-2,3 Z " fill="#0482C2" transform="translate(97,73)"/> <path d="M0,0 L8,1 L12,6 L12,11 L9,10 L6,5 L0,5 L-2,8 L-1,13 L5,12 L10,14 L10,17 L6,18 L7,23 L15,24 L13,29 L6,29 L7,45 L-1,42 L-1,29 L-16,29 L-21,30 L-22,29 L-22,24 L-21,23 L-1,23 L-1,19 L-6,20 L-5,16 L-6,14 L-6,5 Z " fill="#0487C6" transform="translate(61,17)"/> <path d="M0,0 L7,0 L12,1 L12,14 L17,15 L20,20 L27,22 L30,25 L30,28 L28,28 L27,33 L22,40 L19,40 L19,38 L21,38 L20,33 L20,23 L16,24 L14,23 L14,21 L10,19 L11,17 L7,15 L3,13 L1,10 L1,7 L3,7 L0,3 Z " fill="#093A5A" transform="translate(48,45)"/> <path d="M0,0 L6,0 L9,3 L10,6 L12,7 L12,9 L18,9 L21,14 L21,17 L19,17 L20,20 L27,19 L28,20 L28,25 L23,26 L20,24 L19,29 L16,31 L18,24 L17,24 L17,18 L15,18 L13,12 L10,12 L10,10 L1,9 L-2,9 L-3,4 Z " fill="#083D62" transform="translate(61,21)"/> <path d="M0,0 L3,1 L4,7 L6,7 L7,12 L8,15 L3,20 L1,22 L1,25 L-4,27 L-5,22 L-5,14 L2,14 L3,10 L-4,9 L-5,8 L-5,3 Z " fill="#0A243D" transform="translate(72,32)"/> <path d="M0,0 L3,1 L7,6 L11,10 L7,10 L13,17 L16,19 L14,25 L10,24 L4,16 L1,13 L1,15 L-1,15 L-1,6 Z " fill="#0484C2" transform="translate(29,73)"/> <path d="M0,0 L8,1 L9,16 L0,15 Z " fill="#0389C8" transform="translate(60,67)"/> </svg>`,
  },
  {
    id: "airport",
    label: "Airport",
    color: "#94a3b8",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="#0a0f1a" rx="8"/><g fill="#cbd5e1"><ellipse cx="64" cy="64" rx="8" ry="40" /><ellipse cx="64" cy="64" rx="42" ry="8" /><ellipse cx="64" cy="88" rx="18" ry="5" /><rect x="60" y="100" width="8" height="14" rx="3"/></g></svg>`,
  },
  {
    id: "company",
    label: "Company / HQ",
    color: "#ef4444",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"> <path d="M0,0 L128,0 L128,128 L0,128 Z " fill="#060509" transform="translate(0,0)"/> <path d="M0,0 L4,2 L11,9 L19,16 L35,31 L38,33 L38,50 L36,50 L32,46 L32,43 L28,42 L22,35 L18,29 L8,23 L5,20 L5,16 L-3,16 L-4,21 L-7,24 L-14,28 L-19,33 L-25,41 L-28,44 L-30,44 L-31,47 L-34,50 L-36,50 L-36,34 L-24,22 L-16,15 Z " fill="#F50301" transform="translate(63,17)"/> <path d="M0,0 L4,0 L4,9 L7,9 L7,0 L14,1 L20,5 L25,13 L25,18 L16,18 L16,20 L25,20 L24,27 L20,33 L14,37 L7,38 L7,29 L5,29 L5,38 L-2,37 L-10,31 L-13,24 L-13,20 L-4,20 L-4,18 L-13,18 L-12,11 L-8,5 Z " fill="#0B0101" transform="translate(58,45)"/> <path d="M0,0 L2,0 L2,7 L9,8 L16,12 L22,20 L23,28 L30,28 L30,30 L23,30 L22,37 L18,44 L10,50 L2,51 L2,58 L0,58 L0,51 L-8,50 L-16,44 L-20,38 L-21,30 L-28,30 L-28,28 L-21,28 L-20,20 L-14,12 L-8,8 L0,7 Z M-5,10 L-14,16 L-18,23 L-18,28 L-9,28 L-9,30 L-18,30 L-17,37 L-13,43 L-5,48 L0,48 L0,39 L2,39 L2,48 L9,47 L17,41 L20,34 L20,30 L11,30 L11,28 L20,28 L19,21 L15,15 L9,11 L2,10 L2,19 L-1,19 L-1,10 Z " fill="#E80403" transform="translate(63,35)"/> <path d="M0,0 L2,0 L6,10 L8,14 L-2,24 L-10,31 L-11,31 L-11,10 L-4,3 Z " fill="#F20302" transform="translate(38,68)"/> <path d="M0,0 L5,2 L13,10 L13,31 L6,25 L-4,16 L-6,12 L-2,7 Z " fill="#F20302" transform="translate(88,68)"/> <path d="M0,0 L8,0 L10,5 L19,11 L24,16 L27,20 L27,22 L24,22 L18,14 L10,10 L5,9 L5,2 L3,2 L3,9 L-7,12 L-13,17 L-17,25 L-18,30 L-25,30 L-23,26 L-14,13 L-7,8 L-2,5 Z " fill="#1E0302" transform="translate(60,33)"/> </svg>`,
  },
  {
    id: "pipeline",
    label: "Pipeline",
    color: "#f59e0b",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="#0a0e0a" rx="8"/><path d="M10,64 Q30,30 50,64 Q60,80 70,64 Q80,30 90,64 Q100,80 110,64" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/><path d="M10,64 Q30,30 50,64 Q60,80 70,64 Q80,30 90,64 Q100,80 110,64" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round"/><circle cx="25" cy="48" r="4" fill="#f59e0b"/><circle cx="50" cy="64" r="4" fill="#f59e0b"/><circle cx="75" cy="48" r="4" fill="#f59e0b"/><circle cx="100" cy="64" r="4" fill="#f59e0b"/><rect x="30" y="50" width="2" height="28" rx="1" fill="#d97706"/><rect x="55" y="58" width="2" height="26" rx="1" fill="#d97706"/><rect x="80" y="50" width="2" height="28" rx="1" fill="#d97706"/></svg>`,
  },
  {
    id: "dam",
    label: "Dam",
    color: "#06b6d4",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="#050a0f" rx="8"/><polygon points="20,80 40,40 88,40 108,80 108,100 20,100" fill="#0c2d48" stroke="#06b6d4" stroke-width="2"/><line x1="40" y1="40" x2="40" y2="80" stroke="#06b6d4" stroke-width="1.5"/><line x1="64" y1="40" x2="64" y2="80" stroke="#06b6d4" stroke-width="1.5"/><line x1="88" y1="40" x2="88" y2="80" stroke="#06b6d4" stroke-width="1.5"/><ellipse cx="64" cy="30" rx="30" ry="6" fill="#0e7490" stroke="#06b6d4" stroke-width="1.5" opacity="0.6"/><path d="M15,75 L115,75" stroke="#06b6d4" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"/><rect x="56" y="70" width="16" height="12" rx="2" fill="#0c2d48" stroke="#06b6d4" stroke-width="1.5"/></svg>`,
  },
  {
    id: "other",
    label: "Other",
    color: "#facc15",
    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" fill="#0a0a00" rx="8"/><rect x="22" y="22" width="84" height="84" rx="4" fill="none" stroke="#facc15" stroke-width="4"/><circle cx="64" cy="64" r="26" fill="#facc15"/></svg>`,
  },
];

// 设施类型中文标签：dataId 与 DB facilities.type（enum 全集）及前端 FACILITY_TYPES 对齐
export const FACILITY_TYPE_LABELS_ZH = {
  military: "军事基地",
  fighter: "战斗机",
  military_airport: "军用机场",
  nuclear: "核设施",
  naval: "海军舰艇",
  oil_gas: "油气设施",
  satellite: "卫星/情报",
  embassy: "使馆/领事馆",
  data_center: "数据中心/网络",
  port: "港口/码头",
  airport: "机场",
  company: "企业/总部",
  pipeline: "管线",
  dam: "水坝",
  other: "其他",
  ship: "舰船",
  power_plant: "发电厂",
  refinery: "炼油厂",
  hospital: "医院",
  government: "政府机构",
  financial: "金融机构",
  telecom: "电信设施",
  research: "科研机构",
};

// 设施威胁等级中文标签：key 与 DB facilities.threatLevel（enum）对齐
export const FACILITY_THREAT_LEVELS_ZH = {
  low: "低",
  medium: "中",
  high: "高",
  critical: "严重",
};
