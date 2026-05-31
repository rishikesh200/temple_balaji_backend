import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PoojaItem from './src/models/PoojaItem.js';
import DarshanType from './src/models/DarshanType.js';
import DonationCause from './src/models/DonationCause.js';
import TempleEvent from './src/models/TempleEvent.js';
import SiteConfig from './src/models/SiteConfig.js';

dotenv.config();

const POOJAS = [
  // ── Daily Poojas ─────────────────────────────────────────────
  {
    id: 'suprabatha', category: 'daily', name: 'Suprabatha Seva',
    description: 'Awaken the Lord with morning hymns. This seva is the first ritual performed daily at dawn.',
    price: 250, time: '05:00 AM Daily', icon: 'Sun',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDy8sz-TiNcKoYo5Pht81ynM9Z_MO-vQ6r7wXlLkqCs54zcn4w-F5O5lIpvo2CbXW1dkCEWxBtk-XlGeoy5YIOvi3axaTSPsF2dEhpIaiq2cgpBTKb9Z0G51CU-Wf57D55jK68YPp-MlZyZTp7CNNOA-dUS3CsBOXwU2zzpNARiQPVSg2l5m3st6ZZCGNCwzFqls7GVVkwHIV_bri6OU7Gfrmey6p9OvEWlM8T_oz_pZBP98jLtiNVS7yJFJYrRERuX1locTacD3a4',
    about: 'Suprabatha Seva is the pre-dawn ritual performed to awaken the deity from His celestial sleep. The chanting of sacred hymns, accompanied by the gentle sound of bells, fills the atmosphere with positive vibrations and divine energy.',
    benefits: [
      'Pratah Kala Energy: Invokes powerful positive early morning energy and absolute mental clarity.',
      'Vedic Protection: Helps in overcoming immediate life obstacles with direct divine guidance.',
      'Soul Purification: Purifies the sub-conscious mind and soul, promoting deep inner peace.',
    ],
    other: 'Please report by 04:30 AM at the main gate. Laddu prasadam is provided after the seva.',
    active: true, showInHome: true, bookingType: 'payment',
  },
  {
    id: 'thomala', category: 'daily', name: 'Thomala Seva',
    description: 'Adorn the deity with beautifully woven flower garlands. A visually stunning and spiritually uplifting ritual.',
    price: 500, time: '06:30 AM Daily', icon: 'Flower',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6W0QkI52bJSIV8H8Q1YVST0TWft1fj_U6838CNSpkGt63KS2_MKzWqYyUVBOgpI4BEBvxfvLtf3lW6_HdbUVAc-50VN8JzF3qBB5luzafGf7duUQbOSWNYynjCs36o_n_do05cZy6KvWVCA4We2DQ1c8tplAwSMylUdorparjd17YPcuqpqwTp_T7251Rhh7Ep0PzfgLWMU57B88aUX1tSuT1QFMv8i8h-33EKEk1E-z2OO8t5uoHFZBU5OsUmR1F6EYawiP9dM8',
    about: 'Thomala Seva is a beautiful floral decoration ritual where the main deity is adorned with exquisite, fragrant flower garlands using fresh marigolds, roses, and jasmine.',
    benefits: [
      'Family Harmony: Brings a sweet atmosphere of harmony, joy, and lasting peace to the household.',
      'Material Abundance: Adorning the Lord with fresh blossoms attracts prosperity, wealth, and natural abundance.',
      'Negative Aura Cleansing: Helps eliminate deep-seated negative vibes and activates strong spiritual devotion.',
    ],
    other: 'Reporting time is 06:00 AM. Includes one large garland offering on behalf of the donor.',
    active: true, showInHome: true, bookingType: 'payment',
  },
  {
    id: 'archana', category: 'daily', name: 'Archana',
    description: 'Chanting of the 1000 names of Lord Vishnu while offering flowers. Seek personal blessings for your family.',
    price: 150, time: 'Multiple Slots', icon: 'Sparkles',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZMCbN_eqL3rzLFE8uaZRbn2cW5Luc_0N5jZK4yD6xMPArr2R1ojnA3F5lVxOnWD3_IJDw7yI68XKhIM1mus6LhyQ60oJ3JCBazOI4xF9yZ82loH1vkXB2mAeUxt4IRnrEDGRwBLLyZXmCWSHryMbIlhQdry9R2y1C26YYk5TG8vS14YzkrDHbAncaU28CV-eR9NcpTUcg_Y-Qml9wCJugdrrIyB0HC1qO8BpNqGkeMkrjeyarIEHaJp9ERH105jj6j07xvyoI4PA',
    about: 'Archana is a personalized prayer ritual where the priest recites the 1000 names of the deity on behalf of the devotee while offering flowers.',
    benefits: [
      'Direct Personal Grace: Invokes direct individual blessings called by your specific name, Nakshatra, and Gotra.',
      'Astrological Remedy: Helps in resolving minor planetary afflictions and clearing personal obstacles.',
      'General Prosperity: Promotes physical well-being, good health, and success in professional endeavors.',
    ],
    other: 'Performed throughout the day. Please provide name, Gotra, and Nakshatra before starting.',
    active: true, showInHome: true, bookingType: 'payment',
  },
  {
    id: 'abhishekam', category: 'daily', name: 'Abhishekam',
    description: 'Sacred bath of the deity using milk, curd, honey, and tender coconut water, followed by alankaram.',
    price: 1000, time: '08:00 AM Friday', icon: 'Droplet',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDy8sz-TiNcKoYo5Pht81ynM9Z_MO-vQ6r7wXlLkqCs54zcn4w-F5O5lIpvo2CbXW1dkCEWxBtk-XlGeoy5YIOvi3axaTSPsF2dEhpIaiq2cgpBTKb9Z0G51CU-Wf57D55jK68YPp-MlZyZTp7CNNOA-dUS3CsBOXwU2zzpNARiQPVSg2l5m3st6ZZCGNCwzFqls7GVVkwHIV_bri6OU7Gfrmey6p9OvEWlM8T_oz_pZBP98jLtiNVS7yJFJYrRERuX1locTacD3a4',
    about: 'Abhishekam is a powerful ritual of bathing the deity with sacred substances like pure milk, curd, honey, ghee, sugar, coconut water, and sandalwood paste.',
    benefits: [
      'Divine Nectar Blessings: Bathing with milk yields long life, curd brings sound health, honey brings sweet success.',
      'Karma Cleansing: Cleanses past negative karmic influences and guards against unforeseen difficulties.',
      'Desire Fulfillment: Fast-tracks the spiritual and material desires of the performing family.',
    ],
    other: 'Performed every Friday at 08:00 AM. High demand seva; booking in advance is strongly recommended.',
    active: true, showInHome: true, bookingType: 'payment',
  },
  {
    id: 'ekantha-seva', category: 'daily', name: 'Ekantha Seva',
    description: 'The final ritual of the day where the Lord is put to rest in a golden cot with soft melodies.',
    price: 200, time: '09:30 PM Daily', icon: 'Moon',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6W0QkI52bJSIV8H8Q1YVST0TWft1fj_U6838CNSpkGt63KS2_MKzWqYyUVBOgpI4BEBvxfvLtf3lW6_HdbUVAc-50VN8JzF3qBB5luzafGf7duUQbOSWNYynjCs36o_n_do05cZy6KvWVCA4We2DQ1c8tplAwSMylUdorparjd17YPcuqpqwTp_T7251Rhh7Ep0PzfgLWMU57B88aUX1tSuT1QFMv8i8h-33EKEk1E-z2OO8t5uoHFZBU5OsUmR1F6EYawiP9dM8',
    about: 'Ekantha Seva is the final, serene ritual performed at night before the deity is put to rest. Gentle lamps, milk, fruits, and almonds are offered while melodious lullabies are sung.',
    benefits: [
      'Anxiety Relief: Promotes deep, peaceful sleep, cures insomnia, and relieves long-term anxiety or stress.',
      'Intimate Divine Connection: Establishes a personal, quiet, and meditative connection with the Supreme Lord.',
      'Gratitude & Rest: Concludes your day with a powerful aura of gratitude, calmness, and peaceful vibrations.',
    ],
    other: 'Reporting time: 09:15 PM. Includes warm milk offering prasadam.',
    active: true, showInHome: false, bookingType: 'payment',
  },
  {
    id: 'sahasranama', category: 'daily', name: 'Sahasranamarchana',
    description: 'Detailed archana performed while chanting the 1008 names of the Supreme Lord.',
    price: 300, time: '11:00 AM Daily', icon: 'BookOpen',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZMCbN_eqL3rzLFE8uaZRbn2cW5Luc_0N5jZK4yD6xMPArr2R1ojnA3F5lVxOnWD3_IJDw7yI68XKhIM1mus6LhyQ60oJ3JCBazOI4xF9yZ82loH1vkXB2mAeUxt4IRnrEDGRwBLLyZXmCWSHryMbIlhQdry9R2y1C26YYk5TG8vS14YzkrDHbAncaU28CV-eR9NcpTUcg_Y-Qml9wCJugdrrIyB0HC1qO8BpNqGkeMkrjeyarIEHaJp9ERH105jj6j07xvyoI4PA',
    about: 'Sahasranamarchana is the majestic chanting of the thousand sacred names of Lord Vishnu by the temple priests, amplifying spiritual vibrations and creating an aura of supreme protection.',
    benefits: [
      'Fear Removal: Chanting the Sahasranama removes deep fears and instills supreme confidence.',
      'Spiritual Expansion: Grants rapid spiritual growth and connects consciousness to cosmic frequencies.',
      'Household Protection: Harmonizes relationship conflicts and draws protective positive energy into your residence.',
    ],
    other: 'Performed daily at 11:00 AM. Text sheets for chanting are provided by the temple.',
    active: true, showInHome: false, bookingType: 'payment',
  },
  // ── Special Sevas ─────────────────────────────────────────────
  {
    id: 'kalyanotsavam', category: 'special', name: 'Kalyanotsavam',
    description: 'Celestial wedding of the Lord and His consorts. Brings marital bliss and family harmony.',
    price: 2100, time: '10:00 AM', participation: 'Couple Participation', icon: 'Heart',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB66J1mQ6og1J1zQOaP5yC72Nm3388D4Bp6tCiwtU77gtGrn5LQ4CuYCW2vAwBcXHCXtnFKQnKj4SnS-ajTMX4qFWMWtc8Xgb-PLkk-s4q1jBQxds8e8lEvFPUq7iB-Ipc1wy6qI7k2djIP96jhgA_SC9jAtL9lkH2RTRwTKyJ63QEibIGECJWozg0EnDCIfW18VaQvsLMZEyQdSvFf2LQb0A7z5eViNES_vOyeKMl4g7upEWzCp7DiqeV154wyU8_9kxjoBLoWd6g',
    about: 'Kalyanotsavam is the divine celestial wedding of the main deity with His consorts, performed in a highly elaborate and festive manner with Vedic wedding rituals.',
    benefits: [
      'Marital Bliss: Blesses couples with marital happiness, removes delay in marriages, and establishes family bonds.',
      'Conflict Resolution: Resolves misunderstandings between life partners and creates a peaceful marriage.',
      'Prosperity Union: Invokes the combined divine grace of Lord Balaji and Goddess Lakshmi for endless wealth.',
    ],
    other: 'Couple participation allowed. Reporting time is 09:30 AM. Includes special Vastram and prasadam.',
    active: true, showInHome: false, bookingType: 'payment',
  },
  {
    id: 'unjal-seva', category: 'special', name: 'Unjal Seva',
    description: 'The Lord is placed on a golden swing and rocked to the accompaniment of traditional music and veda parayana.',
    price: 1500, time: '06:00 PM', participation: 'Live Music', icon: 'Music',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBeY42kZrEU50Ovv4ZplL-C1cbtbwoORE-Ka5euZ0LJJ3BTNq8NBcRIEN08X9Tj2iSRU-bzWu93ahKhoizyNJD2j98POmelMWHsUgGraVaBMGvvdGMXq2oHB24-Ed_cY7zqjjEQJgjeZ3l8QwyP9ByzZgX5gH8QFnKjQdE0j6PmkM2x0njCuL3L9IqQhvTcs-vWdikMeggRcuBPeO0triar7k6zJtzN9GCSOSBaZaZXoGN3bqva4D9cnoKO8kUsSilFNMSIfU8GRM',
    about: 'Unjal Seva (Swing Festival) is a delightful evening ritual where the processional deities are placed on a grand, decorated swing with melodious devotional songs.',
    benefits: [
      'Stress Dissipation: The rhythmic swaying of the Lord in classical music soothes your nerves and relieves pressure.',
      'Joy & Positivity: Brings pure spiritual happiness and positive energy to children and elderly members.',
      'Obstacle Defense: Invokes the protective shields of the deity to guard your family against unexpected blocks.',
    ],
    other: 'Includes live classical music and distribution of special sweet prasadam.',
    active: true, showInHome: false, bookingType: 'payment',
  },
  {
    id: 'vahana-seva', category: 'special', name: 'Vahana Seva',
    description: 'Procession of the Lord on beautifully decorated traditional vahanas like Garuda or Hanuman.',
    price: 3000, time: '07:30 PM', participation: 'Procession', icon: 'Activity',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB66J1mQ6og1J1zQOaP5yC72Nm3388D4Bp6tCiwtU77gtGrn5LQ4CuYCW2vAwBcXHCXtnFKQnKj4SnS-ajTMX4qFWMWtc8Xgb-PLkk-s4q1jBQxds8e8lEvFPUq7iB-Ipc1wy6qI7k2djIP96jhgA_SC9jAtL9lkH2RTRwTKyJ63QEibIGECJWozg0EnDCIfW18VaQvsLMZEyQdSvFf2LQb0A7z5eViNES_vOyeKMl4g7upEWzCp7DiqeV154wyU8_9kxjoBLoWd6g',
    about: 'Vahana Seva is the majestic procession where the deity is carried on sacred vehicles like the Garuda, Hanuman, or the Golden Chariot to bless all devotees.',
    benefits: [
      'Fearless Living: Frees the devotee from the constant fear of physical ailments and mental blocks.',
      'Career Acceleration: Promotes rapid progress in career, education, and entrepreneurial goals.',
      'Ultimate Victory: Assures absolute victory over competitive adversaries and negative intentions.',
    ],
    other: 'Performed in the outer temple corridors. Devotees can offer flowers along the path.',
    active: true, showInHome: false, bookingType: 'payment',
  },
  {
    id: 'sahastra-deepalankara', category: 'special', name: 'Sahastra Deepalankara',
    description: 'The deity is seated amidst a thousand glowing ghee lamps, creating a divine atmosphere.',
    price: 2500, time: '05:30 PM', participation: 'Evening Ritual', icon: 'Flame',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBeY42kZrEU50Ovv4ZplL-C1cbtbwoORE-Ka5euZ0LJJ3BTNq8NBcRIEN08X9Tj2iSRU-bzWu93ahKhoizyNJD2j98POmelMWHsUgGraVaBMGvvdGMXq2oHB24-Ed_cY7zqjjEQJgjeZ3l8QwyP9ByzZgX5gH8QFnKjQdE0j6PmkM2x0njCuL3L9IqQhvTcs-vWdikMeggRcuBPeO0triar7k6zJtzN9GCSOSBaZaZXoGN3bqva4D9cnoKO8kUsSilFNMSIfU8GRM',
    about: 'Sahastra Deepalankara is a breathtaking visual spectacle where the deity is surrounded by exactly one thousand glowing ghee lamps creating an ethereal atmosphere.',
    benefits: [
      'Wisdom Lighting: The warm golden ghee lamps dissipate inner ignorance and light up knowledge and wisdom.',
      'Auspicious Abundance: Attracts rapid wealth, material auspiciousness, and family enlightenment.',
      'Generational Punya: A highly merit-earning seva that transfers protective spiritual merits across future generations.',
    ],
    other: 'Begins at sunset (05:30 PM). Devotees are invited to help light the lamps under supervision.',
    active: true, showInHome: false, bookingType: 'payment',
  },
  // ── Nerthikadans ──────────────────────────────────────────────
  {
    id: 'thulabaram', category: 'nerthikadan', name: 'Thulabaram',
    description: "Offering commodities equivalent to one's weight, such as rice, jaggery, or sugar, as an act of devotion.",
    price: 500, icon: 'Scale',
    about: "Thulabaram is an ancient vow-fulfilling offering where a devotee sits on one side of a large balancing scale, and materials are piled on the other side until they equal the devotee's weight.",
    benefits: [
      "Ego Surrender: A complete visual surrender of one's physical weight and ego to the Supreme Consciousness.",
      'Vow Fulfillment: Satisfies ancient family vows, demonstrating gratitude for major prayers answered.',
      'Physical Rejuvenation: Restores depleted physical energy, cures bodily ailments, and resets body health.',
    ],
    other: 'The cost of the materials is extra, or devotees can bring their own verified commodities.',
    active: true, showInHome: false, bookingType: 'payment',
  },
  {
    id: 'mottai', category: 'nerthikadan', name: 'Mottai (Tonsuring)',
    description: "Offering one's hair to the deity, symbolizing the surrender of ego and worldly attachments.",
    price: 100, icon: 'Scissors',
    about: "Mottai or tonsuring is the practice of completely shaving one's head as an offering to the Lord, representing shedding pride and ego.",
    benefits: [
      "Pride Shedding: Shaving the head symbolizes releasing worldly vanities, pride, and ego-clinging.",
      'Mental Detachment: Initiates a clean mental state of humility, detachment, and absolute internal freedom.',
      'Auspicious New Beginnings: Acts as a powerful purifier for children, stimulating healthy growth and bright minds.',
    ],
    other: 'Performed by certified temple barbers in a hygienic, dedicated hall.',
    active: true, showInHome: false, bookingType: 'payment',
  },
  {
    id: 'kadhukuthu', category: 'nerthikadan', name: 'Kadhukuthu (Ear Piercing)',
    description: "Traditional ear piercing ceremony for children, seeking the Lord's protection and blessings.",
    price: 250, icon: 'Smile',
    about: 'Kadhukuthu is a sacred ear-piercing ceremony, usually performed for children as one of the traditional shodasha samskaras (16 life sacraments).',
    benefits: [
      'Acupressure Health: Stimulates specific earlobe meridian points that aid child intellect, hearing, and concentration.',
      'Sanctum Protection: Places a protective energetic seal around the young child under the direct sight of the deity.',
      'Sacramental Growth: Aligns the child\'s life journey with high-vibrating Vedic sacraments from early youth.',
    ],
    other: 'Please report to the temple administration office with the child 15 mins before slot.',
    active: true, showInHome: false, bookingType: 'payment',
  },
  {
    id: 'mavilakku', category: 'nerthikadan', name: 'Mavilakku',
    description: 'Lighting lamps made of rice flour and jaggery, typically offered for the well-being of the family.',
    price: 150, icon: 'Flame',
    about: 'Mavilakku is the special offering of flour-lamps. Rice flour is mixed with pure jaggery, cardamom, and ghee to form a firm dough shaped into a lamp.',
    benefits: [
      'Heart Devotion: The burning flour-lamp represents the sweet melting devotion in the core of your heart.',
      'Wish Manifestation: Fulfills urgent heart desires related to childbirth, job security, and marriage progress.',
      'Aroma Cleansing: The burning sweet ghee and organic rice dough purifies the surrounding home atmosphere.',
    ],
    other: 'Mavilakku dough is prepared by temple cooks using organic ingredients to maintain purity.',
    active: true, showInHome: false, bookingType: 'payment',
  },
];

const DARSHAN_TYPES = [
  {
    id: 'sarva', title: 'Sarva Darshan',
    summary: 'General darshan for all devotees. Entry based on availability.',
    description: 'Free general darshan for all devotees. Access is based on availability and queue sequence. Suitable for those seeking a traditional, patient spiritual experience.',
    priceLabel: 'FREE', badge: 'FREE', tagline: 'No Charge',
    price: 0, featured: false, ctaLabel: 'Select Slot', primaryCta: false,
    active: true, showInHome: true, bookingType: 'free',
  },
  {
    id: 'special', title: 'Special Darshan',
    summary: 'Faster access with special queue for a blessed experience.',
    description: 'Faster access with a dedicated special queue. Ideal for families and elderly devotees who prefer a shorter waiting time while maintaining the sanctity of the ritual.',
    priceLabel: '₹250', badge: '₹250', tagline: 'Fast-Track',
    price: 250, featured: true, ctaLabel: 'Book Now', primaryCta: true,
    active: true, showInHome: true, bookingType: 'payment',
  },
  {
    id: 'vip', title: 'VIP Darshan',
    summary: 'Personalized darshan with minimal waiting time.',
    description: 'Priority access with minimal waiting time. Includes specialized seating and guidance. Perfect for those on a tight schedule or seeking a highly focused spiritual session.',
    priceLabel: '₹750', badge: '₹750', tagline: 'Priority Entry',
    price: 750, featured: false, ctaLabel: 'Book Now', primaryCta: false,
    active: true, showInHome: true, bookingType: 'payment',
  },
];

const DONATION_CAUSES = [
  { id: 'annadanam',     title: 'Annadanam',          description: 'Provide nutritious meals to devotees and the underprivileged in the sacred temple premises.',                                   inputMode: 'presets', presetAmounts: [501, 1001, 5001],   ctaIcon: 'heart',         active: true },
  { id: 'renovation',    title: 'Renovation',          description: 'Contribute to structural maintenance and restoration of Gopurams, Vimanas, and sacred mandapams.',                              inputMode: 'custom',  presetAmounts: [],                  ctaIcon: 'building',      active: true },
  { id: 'general-fund',  title: 'General Fund',        description: 'Supporting daily temple operations, ritual materials, and utilities for uninterrupted worship.',                                 inputMode: 'custom',  presetAmounts: [],                  ctaIcon: 'landmark',      active: true },
  { id: 'goshala',       title: 'Goshala',             description: 'Preserve Gomatha care with fodder, veterinary support, and shelter for temple cows.',                                           inputMode: 'presets', presetAmounts: [251, 501, 1001],    ctaIcon: 'heartHandshake',active: true },
  { id: 'vedic-education',title: 'Vedic Pathashala',   description: 'Support young archakas learning Vedas, Agamas, and temple traditions under qualified acharyas.',                                inputMode: 'custom',  presetAmounts: [],                  ctaIcon: 'book',          active: true },
  { id: 'festivals',     title: 'Festivals & Utsavam', description: 'Help sponsor Brahmotsavam, Kalyanotsavam, and seasonal utsavams with flowers, alankaram, and annadanam.',                       inputMode: 'presets', presetAmounts: [1001, 5001, 11000], ctaIcon: 'sparkles',      active: true },
  { id: 'daily-archana', title: 'Daily Archana',       description: 'Sponsor daily archana, naivedyam, and oil for lamps to sustain unbroken seva to the Lord.',                                    inputMode: 'presets', presetAmounts: [101, 501, 1001],    ctaIcon: 'flame',         active: true },
  { id: 'community',     title: 'Community Outreach',  description: 'Extend seva beyond the temple—medical camps, education aid, and relief during festivals and crises.',                           inputMode: 'custom',  presetAmounts: [],                  ctaIcon: 'users',         active: true },
];

const EVENTS = [
  {
    id: 'ev-1', title: 'Vaikunta Ekadashi', category: 'upcoming',
    date: 'May 22, 2026', time: '05:00 AM - 09:00 PM',
    location: 'Main Sanctum Sanctorum & Temple Hall', participants: 'Open for all devotees',
    details: 'Grand annual anniversary with Sahasra Kalashabhishekam performed by chief Vedic priests, followed by cultural recitals, bhajans, and full-day Prasadam distribution.',
    imageKey: 'festival', imageUrl: '', ctaText: 'Sponsor Annadanam', ctaLink: '/donate',
    active: true, showInHome: true,
  },
  {
    id: 'ev-2', title: 'Panguni Uthiram', category: 'upcoming',
    date: 'Jun 10, 2026', time: '07:30 AM - 10:00 AM',
    location: 'Temple Outer Praharam & Corridors', participants: 'Free Participation',
    details: 'Sacred festival celebrating the divine union. Guided walk explores stone inscriptions, Gopuram carvings, and the historical records of the deity.',
    imageKey: 'gopuram', imageUrl: '', ctaText: 'Register Interest', ctaLink: '/contact',
    active: true, showInHome: true,
  },
  {
    id: 'ev-3', title: 'Rath Yatra', category: 'upcoming',
    date: 'Jun 27, 2026', time: '04:00 PM - 08:00 PM',
    location: 'Avadi Chariot Road Path & Environs', participants: 'Volunteer registrations active (Age 18+)',
    details: 'Spectacular procession of Lord Balaji riding His golden chariot through the streets. Thousands of devotees gather to pull the holy ropes chanting Vedic mantras.',
    imageKey: 'gallery1', imageUrl: '', ctaText: 'Register as Volunteer', ctaLink: '/contact',
    active: true, showInHome: true,
  },
  {
    id: 'ev-4', title: 'Aadi Pooram', category: 'community',
    date: 'Jul 12, 2026', time: '11:30 AM - 03:00 PM',
    location: 'Temple Annadanam Seva Hall', participants: 'Sponsors & Seva volunteers needed',
    details: 'Sacred act of feeding others through our monthly community food drive. Fresh traditional meals served to local residents, pilgrims, and the needy.',
    imageKey: 'darshan', imageUrl: '', ctaText: 'Sponsor Groceries', ctaLink: '/donate',
    active: true, showInHome: true,
  },
];

const TEMPLE_SETTINGS = {
  name:      'Paruthipattu Balaji Temple',
  tagline:   'A place of divine peace and spiritual renewal',
  address:   'Paruthipattu, Avadi, Chennai, Tamil Nadu – 602105',
  phone:     '+91 123456789',
  email:     'info@paruthipattubalajitemple.org',
  timings:   'Mon–Sun: 5:00 AM – 9:00 PM',
  aboutText: 'Paruthipattu Balaji Temple is a revered Hindu temple dedicated to Lord Venkateswara, welcoming all devotees.',
  // Header bar
  officialTagline:     'Official Website of Paruthipattu Balaji Temple',
  officialTagline:     'Official Website of Paruthipattu Balaji Temple',
  showOfficialTagline: true,
  trustRegNo:          '125/2020',
  showTrustReg:        true,
  show80G:             true,
  gstin:               '3AAAPPB1234K1Z5',
  showGstin:           true,
};

async function seedCollection(Model, data, label) {
  const existing = await Model.countDocuments();
  if (existing > 0 && !process.argv.includes('--force')) {
    console.log(`  ${label}: ${existing} docs already exist, skipping.`);
    return;
  }
  await Model.deleteMany({});
  await Model.insertMany(data);
  console.log(`  ${label}: seeded ${data.length} docs.`);
}

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected\n');

    await seedCollection(PoojaItem,    POOJAS,           'PoojaItems');
    await seedCollection(DarshanType,  DARSHAN_TYPES,    'DarshanTypes');
    await seedCollection(DonationCause,DONATION_CAUSES,  'DonationCauses');
    await seedCollection(TempleEvent,  EVENTS,           'TempleEvents');

    // Temple settings (SiteConfig)
    const cfgCount = await SiteConfig.countDocuments({ key: 'main' });
    if (cfgCount === 0 || process.argv.includes('--force')) {
      await SiteConfig.findOneAndUpdate(
        { key: 'main' },
        { $set: { templeSettings: TEMPLE_SETTINGS } },
        { upsert: true, runValidators: false }
      );
      console.log('  SiteConfig: temple settings seeded.');
    } else {
      console.log('  SiteConfig: already exists, skipping.');
    }

    console.log('\nDone. Run with --force to overwrite existing data.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

seedData();
