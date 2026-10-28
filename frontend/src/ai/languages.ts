export interface SupportedLanguageItem {
  code: string;
  value: string;
  label: string;
  speechCode: string;
}

export const SUPPORTED_LANGUAGES: readonly SupportedLanguageItem[] = [
  { code: 'hi', value: 'Hindi', label: 'हिन्दी (Hindi)', speechCode: 'hi-IN' },
  { code: 'en', value: 'English', label: 'English', speechCode: 'en-IN' },
  { code: 'hinglish', value: 'Hinglish', label: 'Hinglish (Hindi-English)', speechCode: 'hi-IN' },
  { code: 'ta', value: 'Tamil', label: 'தமிழ் (Tamil)', speechCode: 'ta-IN' },
  { code: 'bn', value: 'Bengali', label: 'বাংলা (Bengali)', speechCode: 'bn-IN' },
  { code: 'te', value: 'Telugu', label: 'తెలుగు (Telugu)', speechCode: 'te-IN' },
  { code: 'mr', value: 'Marathi', label: 'मराठी (Marathi)', speechCode: 'mr-IN' },
  { code: 'ur', value: 'Urdu', label: 'اردو (Urdu)', speechCode: 'ur-IN' },
  { code: 'gu', value: 'Gujarati', label: 'ગુજરાતી (Gujarati)', speechCode: 'gu-IN' },
  { code: 'kn', value: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', speechCode: 'kn-IN' },
  { code: 'ml', value: 'Malayalam', label: 'മലയാളം (Malayalam)', speechCode: 'ml-IN' },
  { code: 'pa', value: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)', speechCode: 'pa-IN' },
  { code: 'or', value: 'Odia', label: 'ଓଡ଼ିଆ (Odia)', speechCode: 'or-IN' },
  { code: 'as', value: 'Assamese', label: 'অসমীয়া (Assamese)', speechCode: 'as-IN' },
] as const;

export function getLanguageCode(langNameOrCode?: string): string {
  if (!langNameOrCode) return 'en';
  const norm = langNameOrCode.trim().toLowerCase();
  const exact = SUPPORTED_LANGUAGES.find(
    (l) => l.code === norm || l.value.toLowerCase() === norm || l.speechCode.toLowerCase() === norm
  );
  if (exact) return exact.code;

  const match = SUPPORTED_LANGUAGES.find((l) => l.label.toLowerCase().includes(norm));
  return match ? match.code : norm.slice(0, 5);
}

export function getLanguageName(codeOrName?: string): string {
  if (!codeOrName) return 'English';
  const norm = codeOrName.trim().toLowerCase();
  const exact = SUPPORTED_LANGUAGES.find(
    (l) => l.code === norm || l.value.toLowerCase() === norm || l.speechCode.toLowerCase() === norm
  );
  if (exact) return exact.value;

  const match = SUPPORTED_LANGUAGES.find((l) => l.label.toLowerCase().includes(norm));
  return match ? match.value : codeOrName;
}

export function getSpeechLanguageCode(langOrCode?: string): string {
  if (!langOrCode) return 'hi-IN';
  const norm = langOrCode.trim().toLowerCase();
  const exact = SUPPORTED_LANGUAGES.find(
    (l) => l.code === norm || l.value.toLowerCase() === norm || l.speechCode.toLowerCase() === norm
  );
  if (exact) return exact.speechCode;

  const match = SUPPORTED_LANGUAGES.find((l) => l.label.toLowerCase().includes(norm));
  return match?.speechCode || 'hi-IN';
}


// Craft-specific fallback descriptions for common Indian handicrafts
export const CRAFT_DESCRIPTIONS_EN: Record<string, string> = {
  'diya': `Turned by hand from natural river clay on a traditional potter's wheel, this handcrafted Diya embodies the timeless Indian tradition of light, purity, and hope. Fired in an open-flame kiln, its earthy terracotta texture and graceful contours reflect generations of rural kumhar craftsmanship. Lit with oil or ghee and a cotton wick, it casts a warm, serene glow that transforms any festive or meditative space.`,
  'terracotta diya': `Turned by hand from natural river clay on a traditional potter's wheel, this handcrafted Diya embodies the timeless Indian tradition of light, purity, and hope. Fired in an open-flame kiln, its earthy terracotta texture and graceful contours reflect generations of rural kumhar craftsmanship. Lit with oil or ghee and a cotton wick, it casts a warm, serene glow that transforms any festive or meditative space.`,
  'banarasi silk saree': `Woven on the ancient looms of Varanasi, the Banarasi Silk Saree is India's most celebrated textile treasure. Each yard of pure mulberry silk is interlaced with zari threads of real gold and silver, creating floral bootis and intricate jaal patterns that have adorned Indian brides for over five centuries. The fabric carries the weight of Mughal grandeur and the lightness of Indian grace — a masterpiece that is passed down as an heirloom, not merely worn.`,
  'chikankari kurta': `Born in the royal workshops of Nawabi Lucknow, Chikankari is the art of shadow — white thread stitched onto fine muslin in over 36 distinct stitches, each one named and mastered over a lifetime. This kurta is the handiwork of artisan women in the narrow lanes of Aminabad, who transform plain fabric into poetry using nothing but needle and thread. Breathable in summer, timeless in style, it is elegance distilled to its purest form.`,
  'terracotta horse': `In the red clay heartland of Gorakhpur, Uttar Pradesh, the Terracotta Horse stands as a vessel of devotion and folk memory. Shaped by hand from the sacred earth of the Terai, each horse is an offering to Baba Salim Shah — a deity whose legend weaves through the villages of eastern India. Kiln-fired without a glaze, its raw ochre surface records every thumbprint of the artisan's hands, making each piece a singular artifact of living heritage.`,
  'marble inlay plate': `The craft of Pietra Dura arrived in Agra with the Mughal emperor Jahangir and reached its zenith in the walls of the Taj Mahal. This marble plate carries that same legacy: slivers of lapis lazuli, malachite, and carnelian are cut to a fraction of a millimetre and pressed flush into white Makrana marble, forming flowers that seem to bloom from within the stone. It is a craft that demands a steady hand, unwavering patience, and an eye for beauty measured in fractions.`,
  'pashmina shawl': `High on the Changthang plateau of Ladakh, the Changra goats shed a fleece so fine it passes through a wedding ring. This Pashmina Shawl is spun from that fleece by hand in the valley of Srinagar, woven on traditional karkhana looms, and finished with weeks of hand-knotting into the intricate Kani motif. It weighs almost nothing and holds warmth like a second skin — a paradox of delicacy and resilience that mirrors Kashmir itself.`,
  'brass ganesh idol': `Cast in the dhokra technique that is four thousand years old, this Brass Ganesh Idol from Moradabad — India's Pital Nagri (City of Brass) — captures the beloved deity in a moment of serene abundance. Molten brass is poured into a wax mould packed in fine clay; when the wax melts away, the metal pours in and takes its form. No two pieces are ever identical. Polished by hand to a warm golden glow, this Ganesh brings both blessings and beauty to any home.`,
};

export const CRAFT_DESCRIPTIONS_HI: Record<string, string> = {
  'diya': `पारंपरिक कुम्हारों के चाक पर पवित्र मिट्टी से गढ़ा गया यह हस्तनिर्मित दीया प्रकाश, आस्था और सकारात्मकता का पावन प्रतीक है। भट्टी में पकाई गई इसकी सौंधी लाल मिट्टी सदियों की पुश्तैनी कारीगरी की गवाह है। शुद्ध तेल या घी की बाती से प्रज्वलित यह दीया हर पूजा, दीपोत्सव और मांगलिक अवसर पर घर को सात्विक ऊर्जा और शांति से भर देता है।`,
  'terracotta diya': `पारंपरिक कुम्हारों के चाक पर पवित्र मिट्टी से गढ़ा गया यह हस्तनिर्मित दीया प्रकाश, आस्था और सकारात्मकता का पावन प्रतीक है। भट्टी में पकाई गई इसकी सौंधी लाल मिट्टी सदियों की पुश्तैनी कारीगरी की गवाह है। शुद्ध तेल या घी की बाती से प्रज्वलित यह दीया हर पूजा, दीपोत्सव और मांगलिक अवसर पर घर को सात्विक ऊर्जा और शांति से भर देता है।`,
  'banarasi silk saree': `वाराणसी के प्राचीन हथकरघों पर बुनी गई बनारसी रेशमी साड़ी भारतीय वस्त्र परंपरा का अनमोल रत्न है। शुद्ध शहतूत रेशम और सोने-चांदी के तारों (जरी) से सजे बूटे व जाल की बारीक नक्काशी सदियों से भारतीय उत्सवों और विवाहों की शान रही है। यह केवल एक परिधान नहीं, बल्कि पीढ़ियों तक सहेजी जाने वाली एक अद्वितीय धरोहर है।`,
  'chikankari kurta': `नवाबी लखनऊ के कारीगरों की सदियों पुरानी चिकनकारी कला से सुसज्जित यह कुर्ता सादगी और नजाकत का संगम है। महीन मलमल पर हाथ की 36 पारंपरिक सुई-धागे की टांकों से उकेरे गए बेल-बूटे इसे बेहद आरामदायक और शालीन बनाते हैं। यह हस्तशिल्प की ऐसी कविता है जो कभी पुरानी नहीं होती।`,
  'terracotta horse': `उत्तर प्रदेश के गोरखपुर की लाल मिट्टी से गढ़ा यह टेराकोटा अश्व आस्था और लोक संस्कृति का जीवंत प्रतीक है। कुम्हार के चाक और हाथों की उंगलियों की छाप समेटे यह बिना चमक वाली मिट्टी का घोड़ा किसी भी घर के कोने को लोक कला की गरिमा और सात्विक ऊर्जा से भर देता है।`,
  'marble inlay plate': `आगरा के ताज महल की पच्चीकारी (पिएट्रा ड्यूरा) शैली में निर्मित यह मकराना संगमरमर की थाली भारतीय शिल्प कौशल का शिखर है। लाजवर्त, अकीक और फिरोजा जैसे अर्ध-मूल्यवान पत्थरों को बेहद सूक्ष्मता से सफेद संगमरमर में तराशकर जड़ा गया है, जिससे पत्थर पर खिलते फूलों का सजीव आभास होता है।`,
  'pashmina shawl': `लद्दाख के चांगथांग पठार की चांगरा बकरियों की दुर्लभ ऊन से तैयार यह कश्मीरी पश्मीना शॉल श्रीनगर के हुनरमंद कारीगरों द्वारा हथकरघे पर बुनी गई है। उंगलियों से फिसलने जैसी कोमलता और अत्यधिक गर्माहट लिए यह शॉल कश्मीरी शिल्प और विरासत का अनुपम उदाहरण है।`,
  'brass ganesh idol': `पीतल नगरी मुरादाबाद के पारंपरिक धातु शिल्पियों द्वारा ढली यह पीतल की गणेश प्रतिमा सुख, समृद्धि और शुभता का पावन संचार करती है। पारंपरिक सांचे में ढालकर हाथों से पॉलिश की गई यह कलाकृति हर पूजा स्थल व गृह सज्जा को दिव्य सौंदर्य प्रदान करती है।`,
};

export function buildFallbackEnglishDescription(productName: string, productDetails?: string): string {
  const lower = productName.toLowerCase().trim();
  const extra = productDetails && productDetails.trim() ? ' ' + productDetails.trim() : '';

  for (const [key, desc] of Object.entries(CRAFT_DESCRIPTIONS_EN)) {
    if (lower === key || lower.includes(key) || key.includes(lower)) {
      return extra ? `${desc}${extra}` : desc;
    }
  }

  const isDiya = /diya|deepam|lamp|दीया|दीपक|दीप/i.test(productName);
  const isSilk = /silk|saree|sari|dupatta|lehenga|साड़ी|रेशम/i.test(productName);
  const isCeramic = /ceramic|pottery|clay|terracotta|earthenware|stoneware|bowl|mug|vase|urn|घड़ा|मिट्टी/i.test(productName);
  const isWood = /wood|wooden|carved|teak|sheesham|walnut|box|toy|लकड़ी|काष्ठ|खिलौना/i.test(productName);
  const isJewellery = /jhumka|earring|bangle|necklace|ring|silver|gold|filigree|झुमका|गहना|चांदी/i.test(productName);
  const isMetal = /brass|bronze|copper|iron|metal|idol|ganesh|गणेश|पीतल|तांबा|मूर्ती/i.test(productName);
  const isPainting = /painting|miniature|pichwai|madhubani|kalamkari|warli|चित्रकला|पेंटिंग/i.test(productName);
  const isCarpet = /carpet|rug|dhurrie|mat|कालीन|दरी/i.test(productName);

  if (isDiya) {
    return `Turned by hand from natural river clay on a traditional potter's wheel, this "${productName}" is an authentic terracotta oil lamp embodying the sacred Indian tradition of light, purity, and auspicious beginnings. Each piece preserves the fine touch of master rural kumhars.`;
  }
  if (isSilk) {
    return `Drawn from centuries of loom mastery, this "${productName}" is a textile heirloom in the making. Handwoven from natural fibres and dyed with heritage techniques, every thread carries the living culture of Indian artisans.`;
  }
  if (isCeramic) {
    return `Turned on a traditional potter's wheel, this "${productName}" is shaped from earthen clay and fired into permanence. Each subtle curve preserves the touch of the artisan's hands that no machine can replicate.`;
  }
  if (isWood) {
    return `Hand-carved from seasoned natural timber, this "${productName}" reflects the generational woodworking traditions of India. Each contour and motif celebrates the organic beauty of sustainable indigenous craft.`;
  }
  if (isJewellery) {
    return `Handcrafted by master silversmiths using age-old filigree and embossing techniques, this "${productName}" is a wearable celebration of Indian heritage and artisanal elegance.`;
  }
  if (isMetal) {
    return `Cast in traditional metal alloy and finished with intricate hand-engraving, this "${productName}" radiates timeless grace, bringing warmth and cultural heritage into your home.`;
  }
  if (isPainting) {
    return `Created with natural mineral pigments and fine handcrafted brushwork, this "${productName}" preserves ancestral folklore and sacred motifs in a captivating composition of living art.`;
  }
  if (isCarpet) {
    return `Hand-knotted with generational expertise on traditional vertical looms, this "${productName}" weaves timeless motifs and natural dyed fibers into a luxurious floor heirloom.`;
  }

  return `"${productName}" is a genuine handcrafted creation that bridges centuries of traditional Indian craftsmanship with modern living. Hand-finished by skilled artisans, each piece carries subtle nuances that make it truly unique.`;
}

export function buildFallbackNativeDescription(productName: string, langName: string, productDetails?: string): string {
  const lower = productName.toLowerCase().trim();
  const normalizedLang = getLanguageName(langName);
  const extraHi = productDetails && productDetails.trim() ? ' शिल्पकार विनिर्देश: ' + productDetails.trim() + '।' : '';
  const extraGeneric = productDetails && productDetails.trim() ? ' (' + productDetails.trim() + ')' : '';

  // If Hindi requested, check Hindi craft dictionary
  if (normalizedLang === 'Hindi' || normalizedLang === 'हिन्दी') {
    for (const [key, desc] of Object.entries(CRAFT_DESCRIPTIONS_HI)) {
      if (lower === key || lower.includes(key) || key.includes(lower)) {
        return extraHi ? `${desc}${extraHi}` : desc;
      }
    }

    const isDiya = /diya|deepam|lamp|दीया|दीपक|दीप/i.test(productName);
    const isSilk = /silk|saree|sari|dupatta|lehenga|साड़ी|रेशम/i.test(productName);
    const isCeramic = /ceramic|pottery|clay|terracotta|bowl|mug|vase|urn|घड़ा|मिट्टी/i.test(productName);
    const isWood = /wood|wooden|carved|लकड़ी|काष्ठ|खिलौना/i.test(productName);
    const isMetal = /brass|bronze|copper|iron|metal|idol|ganesh|गणेश|पीतल|तांबा|मूर्ती/i.test(productName);
    const isJewellery = /jhumka|earring|bangle|necklace|ring|silver|gold|झुमका|गहना|चांदी/i.test(productName);
    const isPainting = /painting|miniature|pichwai|madhubani|kalamkari|warli|चित्रकला|पेंटिंग/i.test(productName);
    const isCarpet = /carpet|rug|dhurrie|कालीन|दरी/i.test(productName);

    if (isDiya) {
      return `कुम्हार के चाक पर विशुद्ध मिट्टी से तराशा गया यह "${productName}" अंधकार पर प्रकाश की विजय और भारतीय संस्कृति की पावनता का प्रतीक है। शुद्ध तेल व रुई की बाती के साथ प्रज्वलित यह कलाकृति घर में सुख, शांति और सकारात्मक ऊर्जा का संचार करती है।`;
    }
    if (isSilk) {
      return `हथकरघे की प्राचीन परंपरा से बुनी गई यह "${productName}" भारतीय वस्त्र विरासत का अनुपम उदाहरण है। प्राकृतिक रेशों और पारंपरिक कारीगरी से तैयार यह परिधान सदियों की लोक कला को जीवंत करता है।`;
    }
    if (isCeramic) {
      return `मिट्टी और चाक के सदियों पुराने मेल से गढ़ा गया यह "${productName}" प्रकृति और मानवीय स्पर्श का संगम है। हाथ से तराशी गई इसकी बनावट हर घर में सात्विक सौंदर्य और सौम्यता लाती है।`;
    }
    if (isWood) {
      return `कुशल काष्ठ शिल्पियों द्वारा नक्काशीदार यह "${productName}" भारतीय पारंपरिक कला का उत्कृष्ट रूप है। प्राकृतिक लकड़ी की टिकाऊ गुणवत्ता और नक्काशी इसे एक सदाबहार धरोहर बनाती है।`;
    }
    if (isMetal) {
      return `पारंपरिक धातु ढलाई और हाथों की बारीक नक्काशी से निर्मित यह "${productName}" भारतीय शिल्प परंपरा की शान है। इसकी सुनहरी चमक और भव्यता किसी भी परिवेश को गरिमा प्रदान करती है।`;
    }
    if (isJewellery) {
      return `पुश्तैनी आभूषण कारीगरों द्वारा बारीकी से निर्मित यह "${productName}" सुंदरता और सांस्कृतिक पहचान का प्रतीक है, जो हर उत्सव में पारंपरिक गरिमा जोड़ता है।`;
    }
    if (isPainting) {
      return `प्राकृतिक रंगों और बारीक रेखांकन से तैयार यह "${productName}" भारतीय लोक कला और पौराणिक आख्यानों को जीवंत रूप में प्रस्तुत करती है।`;
    }
    if (isCarpet) {
      return `हाथ की बारीक गांठों (हैंड-नॉटेड) से बुना यह "${productName}" भारतीय कालीन शिल्प का बेजोड़ नमूना है, जो फर्श को शाही गरिमा प्रदान करता है।`;
    }

    return `"${productName}" भारतीय हस्तशिल्प और पुश्तैनी ज्ञान की जीवंत अभिव्यक्ति है। कारीगर के हाथों से संवारा गया यह उत्पाद न केवल टिकाऊ है, बल्कि हमारी समृद्ध संस्कृति का सच्चा दूत भी है।`;
  }

  // Hinglish
  if (normalizedLang === 'Hinglish') {
    return `Yeh handcrafted "${productName}" Indian heritage aur traditional craftsmanship ka khoobsurat example hai. Pure handmade quality aur authentic regional art ke saath tayyar kiya gaya hai, jo aapke ghar ko ek elegant aur cultural look deta hai.`;
  }

  // Regional Indian Languages
  if (normalizedLang === 'Tamil') {
    return `பாரம்பரிய கைவினைத் திறனுடன் உருவாக்கப்பட்டது "${productName}". இது தலைமுறை தலைமுறையாகக் கடத்தப்பட்ட இந்திய கைவினைஞர்களின் தனித்துவமான உழைப்பைப் பறைசாற்றுகிறது.`;
  }
  if (normalizedLang === 'Bengali') {
    return `ঐতিহ্যবাহী ভারতীয় হস্তশিল্পের এক অপূর্ব নিদর্শন "${productName}"। এটি কারিगरদের ভালোবাসা ও বংশপরম্পরায় অর্জিত নিপুণ দক্ষতার এক জীবন্ত প্রকাশ।`;
  }
  if (normalizedLang === 'Telugu') {
    return `తరతరాల చేతివృత్తుల ప్రతిభతో రూపుదిద్దుకున్న "${productName}". ఇది భారతదేశ సంస్కృతి మరియు కళా వైభవానికి నిదర్శనం.`;
  }
  if (normalizedLang === 'Marathi') {
    return `पिढ्यानपिढ्या चालत आलेल्या पारंपरिक हस्तकलेचे उत्कृष्ट उदाहरण म्हणजे "${productName}". कारागिरांच्या कौशल्याने साकारलेली ही कलाकृती आपल्या घराला भारतीय परंपरेचा स्पर्श देते.`;
  }
  if (normalizedLang === 'Gujarati') {
    return `પરંપરાગત કારીગરી દ્વારા હાથથી તૈયાર કરાયેલ "${productName}". આ કલાકૃતિ ભારતીય વારસા અને હસ્તકળાનું ગૌરવપૂર્ણ પ્રતીક છે.`;
  }
  if (normalizedLang === 'Kannada') {
    return `ಪಾರಂಪರಿಕ ಕರಕುಶಲ ಕಲೆಯ ಅಪ್ರತಿಮ ಸೃಷ್ಟಿ "${productName}". ಇದು ಭಾರತೀಯ ಸಂಸ್ಕೃತಿ ಮತ್ತು ನೈಜ ಕುಶಲಕರ್ಮಿಗಳ ಪ್ರತಿಭೆಯನ್ನು ಬಿಂಬಿಸುತ್ತದೆ.`;
  }
  if (normalizedLang === 'Malayalam') {
    return `പരമ്പരാഗത ഇന്ത്യൻ കരകൗശല വൈദഗ്ധ്യത്താൽ കൈകൊണ്ട് നിർമ്മിച്ച "${productName}". ഇത് തലമുറകളായി കൈമാറിവന്ന പൈതൃകത്തിന്റെ സാക്ഷ്യമാണ്.`;
  }
  if (normalizedLang === 'Punjabi') {
    return `ਪੀੜ੍ਹੀਆਂ ਤੋਂ ਚੱਲੀ ਆ ਰਹੀ ਪਰੰਪਰਾ ਨਾਲ ਹੱਥੀਂ ਤਿਆਰ ਕੀਤਾ ਗਿਆ "${productName}". ਇਹ ਭਾਰਤੀ ਵਿਰਾਸਤ ਅਤੇ ਕਾਰੀਗਰੀ ਦਾ ਬੇਮਿਸਾਲ ਨਮੂਨਾ ਹੈ।`;
  }
  if (normalizedLang === 'Urdu') {
    return `روایتی کاریگری اور پشتینی ہنر کا خوبصورت شاہکار "${productName}". یہ ہندوستانی ثقافت اور دستکاری کی شاندار مثال ہے۔`;
  }
  if (normalizedLang === 'Odia') {
    return `ପାରମ୍ପରିକ ଭାରତୀୟ ହସ୍ତକଳା ଏବଂ ନିଷ୍ଠାର ଏକ ଅନନ୍ୟ ନିଦର୍ଶନ ହେଉଛି "${productName}"। ଏହା ଘରକୁ ଆଧ୍ୟାତ୍ମିକ ତଥା ସାଂସ୍କୃତିକ ଶୋଭା ପ୍ରଦାନ କରେ।`;
  }
  if (normalizedLang === 'Assamese') {
    return `পৰম্পৰাগত ভাৰতীয় শিল্পকলা আৰু নিপুণ কাৰুকাৰ্যৰে নিৰ্মিত "${productName}"। ই আমাৰ চহকী সাংস্কৃতিক ঐতিহ্যৰ এক অনন্য প্ৰতীক।`;
  }

  // Fallback to English
  return buildFallbackEnglishDescription(productName);
}
