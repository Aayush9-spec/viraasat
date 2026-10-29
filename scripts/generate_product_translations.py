"""Generate complete product translations for all 35 products across 13 Indian languages.
"""
import json
import os

PRODUCT_TRANSLATIONS = {
    "Agra Marble Inlay Plate": {
        "en": "Agra Marble Inlay Plate",
        "hi": "आगरा संगमरमर जड़ाई थाली",
        "bn": "আগ্রা মার্বেল ইনলে প্লেট",
        "te": "ఆగ్రా పాలరాయి ఇన్‌లే ప్లేట్",
        "ta": "ஆக்ரா பளிங்கு பதிக்கப்பட்ட தட்டு",
        "mr": "आग्रा संगमरवरी जडाव ताट",
        "gu": "આગ્રા આરસપહાણ જડતર થાળી",
        "kn": "ಆಗ್ರಾ ಅಮೃತಶಿಲೆ ಜಡಿತ ತಟ್ಟೆ",
        "ml": "ആഗ്ര മാർബിൾ ഇൻലേ പ്ലേറ്റ്",
        "or": "ଆଗ୍ରା ମାର୍ବଲ ଇନଲେ ଥାଳି",
        "pa": "ਆਗਰਾ ਸੰਗਮਰਮਰ ਜੜਾਊ ਥਾਲ਼ੀ",
        "as": "আগ্ৰা মাৰ্বল ইনলে কাঁহী",
        "ur": "آگرہ سنگ مرمر جڑاؤ پلیٹ"
    },
    "Aligarh Antique Padlock": {
        "en": "Aligarh Antique Padlock",
        "hi": "अलीगढ़ प्राचीन ताला",
        "bn": "আলীগড় প্রাচীন তালা",
        "te": "అలీఘర్ పురాతన తాళం",
        "ta": "அலிகார் பழங்கால பூட்டு",
        "mr": "अलीगढ पुरातन कुलूप",
        "gu": "અલીગઢ પ્રાચીન તાળું",
        "kn": "ಅಲಿಗಢ್ ಪ್ರಾಚೀನ ಬೀಗ",
        "ml": "അലിഗഡ് പുരാതന പൂട്ടും താക്കോലും",
        "or": "ଆଲିଗଡ଼ ପୁରାତନ ତାଲା",
        "pa": "ਅਲੀਗੜ੍ਹ ਪੁਰਾਤਨ ਜਿੰਦਾ",
        "as": "আলিগড় প্ৰাচীন তলা",
        "ur": "علی گڑھ قدیم قفل"
    },
    "Azure Ceramic Vase": {
        "en": "Azure Ceramic Vase",
        "hi": "आसमानी चीनी मिट्टी का फूलदान",
        "bn": "আকাশি সিরামিক ফুলদানি",
        "te": "నీలి సిరామిక్ పువ్వుల కుండీ",
        "ta": "நீல செராமிக் பூந்தொட்டி",
        "mr": "आकाशी सिरॅमिक फुलदाणी",
        "gu": "આકાશી સિરામિક ફૂલદાની",
        "kn": "ನೀಲಿ ಸೆರಾಮಿಕ್ ಹೂದಾನಿ",
        "ml": "നീല സെറാമിക് പൂപ്പാത്രം",
        "or": "ନୀଳ ସିରାମିକ ଫୁଲଦାନୀ",
        "pa": "ਨੀਲਾ ਸਿਰੇਮਿਕ ਗੁਲਦਾਨ",
        "as": "নীলা চিৰামিক ফুলদানী",
        "ur": "لاجوردی سرامک گلدان"
    },
    "Banarasi Silk Saree": {
        "en": "Banarasi Silk Saree",
        "hi": "बनारसी रेशमी साड़ी",
        "bn": "বেনারসি সিল্ক শাড়ি",
        "te": "బనారసి పట్టు చీర",
        "ta": "பனாரசி பட்டுப் புடவை",
        "mr": "बनारसी रेशमी साडी",
        "gu": "બનારસી રેશમી સાડી",
        "kn": "ಬನಾರಸಿ ರೇಷ್ಮೆ ಸೀರೆ",
        "ml": "ബനാറസി പട്ടുസാരി",
        "or": "ବନାରସୀ ରେଶମ ଶାଢ଼ୀ",
        "pa": "ਬਨਾਰਸੀ ਰੇਸ਼ਮੀ ਸਾੜ੍ਹੀ",
        "as": "বাৰাণসী ছিল্ক শাড়ী",
        "ur": "بنارسی ریشم ساڑھی"
    },
    "Bareilly Zardozi Wall Art": {
        "en": "Bareilly Zardozi Wall Art",
        "hi": "बरेली जरदोजी दीवार कला",
        "bn": "বেরেলি জরদোজি ওয়াল আর্ট",
        "te": "బరేలీ జర్దోజీ గోడ అలంకరణ",
        "ta": "பரேலி ஜர்தோசி சுவர் அலங்காரம்",
        "mr": "बरेली जरदोजी वॉल आर्ट",
        "gu": "બરેલી ઝરદોઝી દિવાલ કલા",
        "kn": "ಬರೇಲಿ ಜರ್ದೋಜಿ ಗೋಡೆ ಕಲೆ",
        "ml": "ബറേലി സർദോസി വാൾ ആർട്ട്",
        "or": "ବରେଲୀ ଜରଦୋଜି କାନ୍ଥ କଳା",
        "pa": "ਬਰੇਲੀ ਜ਼ਰਦੋਜ਼ੀ ਕੰਧ ਕਲਾ",
        "as": "বাৰেলী জৰ্দোজি ৱাল আৰ্ট",
        "ur": "بریلی زردوزی دیوار آرٹ"
    },
    "Bhadohi Hand-Knotted Carpet": {
        "en": "Bhadohi Hand-Knotted Carpet",
        "hi": "भदोही हस्तनिर्मित कालीन",
        "bn": "ভাদোহি হস্তনির্মিত কার্পেট",
        "te": "భదోహీ చేతితో అల్లిన తివాచీ",
        "ta": "பதோஹி கைவினை கம்பளம்",
        "mr": "भदोही हाताने विणलेला गालीचा",
        "gu": "ભદોહી હાથવણાટ ગાલીચો",
        "kn": "ಭದೋಹಿ ಕೈಯಿಂದ ನೇಯ್ದ ಕಾರ್ಪೆಟ್",
        "ml": "ഭദോഹി കൈകൊണ്ട് നെയ്ത പരവതാനി",
        "or": "ଭଦୋହୀ ହସ୍ତବୁଣା ଗାଲିଚା",
        "pa": "ਭਦੋਹੀ ਹੱਥੀਂ ਬੁਣਿਆ ਕਾਲੀਨ",
        "as": "ভাদোহী হস্তনির্মিত কাৰ্পেট",
        "ur": "بھدوہی دستی قالین"
    },
    "Block-Printed Quilt": {
        "en": "Block-Printed Quilt",
        "hi": "ब्लॉक-प्रिंटेड रजाई",
        "bn": "ব্লক-প্রিন্ট রেশমি লেপ",
        "te": "బ్లాక్-ప్రింట్ బొంత",
        "ta": "பிளாக்-பிரிண்ட் போர்வைக் குயில்ட்",
        "mr": "ब्लॉक-प्रिंटेड रजई",
        "gu": "બ્લોક-પ્રિન્ટેડ રજાઇ",
        "kn": "ಬ್ಲಾಕ್-ಪ್ರಿಂಟೆಡ್ ರಜಾಯಿ",
        "ml": "ബ്ലോക്ക് പ്രിന്റഡ് പുതപ്പ്",
        "or": "ବ୍ଲକ-ପ୍ରିଣ୍ଟେଡ଼ ରଜାଇ",
        "pa": "ਬਲਾਕ-ਪ੍ਰਿੰਟ ਰਜ਼ਾਈ",
        "as": "ব্লক-প্ৰিন্টেড লেপ",
        "ur": "بلاگ پرنٹ لحاف"
    },
    "Ceramic Tea Set": {
        "en": "Ceramic Tea Set",
        "hi": "चीनी मिट्टी चाय सेट",
        "bn": "সিরামিক চা সেট",
        "te": "సిరామిక్ టీ సెట్",
        "ta": "செராமிக் தேநீர் தொகுப்பு",
        "mr": "सिरॅमिक चहा सेट",
        "gu": "સિરામિક ચા સેટ",
        "kn": "ಸೆರಾಮಿಕ್ ಚಹಾ ಸೆಟ್",
        "ml": "സെറാമിക് ചായ സെറ്റ്",
        "or": "ସିରାମିକ ଚା ସେଟ୍",
        "pa": "ਸਿਰੇਮਿਕ ਚਾਹ ਸੈੱਟ",
        "as": "চিৰামিক চাহ ছেট",
        "ur": "سرامک چائے سیٹ"
    },
    "Channapatna Wooden Toy Train": {
        "en": "Channapatna Wooden Toy Train",
        "hi": "चन्नापटना लकड़ी की खिलौना रेलगाड़ी",
        "bn": "চন্নাপটন কাঠের খেলনা ট্রেন",
        "te": "చన్నపట్న చెక్క బొమ్మల రైలు",
        "ta": "சென்னபட்டணா மர பொம்மை ரயில்",
        "mr": "चन्नापट्टण लाकडी खेळणी आगगाडी",
        "gu": "ચન્નાપટણા લાકડાની રમકડા ગાડી",
        "kn": "ಚನ್ನಪಟ್ಟಣ ಮರದ ಆಟಿಕೆ ರೈಲು",
        "ml": "ചന്നപട്ടണ തടി കളിപ്പാട്ട ട്രെയിൻ",
        "or": "ଚନ୍ନପାଟଣା କାଠ ଖେଳନା ଟ୍ରେନ୍",
        "pa": "ਚੰਨਾਪਟਨਾ ਲੱਕੜ ਦੀ ਖਿਡੌਣਾ ਰੇਲਗੱਡੀ",
        "as": "চন্নাপাটনা কাঠৰ পুতলা ৰে'ল",
        "ur": "چناپٹنہ لکڑی کا کھلونا ٹرین"
    },
    "Diya": {
        "en": "Diya",
        "hi": "हस्तनिर्मित मिट्टी का दीया",
        "bn": "মাটির প্রদীপ",
        "te": "చేతితో చేసిన మట్టి ప్రమిద",
        "ta": "கைவினை மண் அகல் விளக்கு",
        "mr": "हस्तनिर्मित मातीचा दिवा",
        "gu": "હાથબનાવટ માટીનો દીવો",
        "kn": "ಕೈಯಿಂದ ಮಾಡಿದ ಮಣ್ಣಿನ ಹಣತೆ",
        "ml": "കൈകൊണ്ട് തീർത്ത മൺചിരാത്",
        "or": "ହସ୍ତନିର୍ମିତ ମାଟି ଦୀପ",
        "pa": "ਹੱਥੀਂ ਬਣਿਆ ਮਿੱਟੀ ਦਾ ਦੀਵਾ",
        "as": "হস্তনির্মিত মাটিৰ চাকি",
        "ur": "روایتی مٹی کا دیا"
    },
    "Earthenware Mug Set": {
        "en": "Earthenware Mug Set",
        "hi": "मिट्टी के मग का सेट",
        "bn": "মাটির মগ সেট",
        "te": "మట్టి మగ్గుల సెట్",
        "ta": "மண்பாண்ட குவளை தொகுப்பு",
        "mr": "मातीच्या मगांचा संच",
        "gu": "માટીના મગનો સેટ",
        "kn": "ಮಣ್ಣಿನ ಮಗ್ ಸೆಟ್",
        "ml": "മൺകപ്പുകളുടെ സെറ്റ്",
        "or": "ମାଟି ମଗ୍ ସେଟ୍",
        "pa": "ਮਿੱਟੀ ਦੇ ਮੱਗਾਂ ਦਾ ਸੈੱਟ",
        "as": "মাটিৰ মগ ছেট",
        "ur": "مٹی کے مگوں کا سیٹ"
    },
    "Embroidered Cushion Cover": {
        "en": "Embroidered Cushion Cover",
        "hi": "कशीदाकारी कुशन कवर",
        "bn": "সূচিকর্ম কুশন কভার",
        "te": "ఎంబ్రాయిడరీ కుషన్ కవర్",
        "ta": "எம்ப்ராய்டரி குஷன் உறை",
        "mr": "भरतकाम केलेले कुशन कव्हर",
        "gu": "ભરતકામ કરેલું કુશન કવર",
        "kn": "ಕಸೂತಿ ಕುಶನ್ ಕವರ್",
        "ml": "എംബ്രോയിഡറി കുഷ്യൻ കവർ",
        "or": "କସିଦାକାରୀ କୁଶନ୍ କଭର",
        "pa": "ਕਢਾਈ ਵਾਲਾ ਕੁਸ਼ਨ ਕਵਰ",
        "as": "সূচিশিল্পৰ কুশ্বন কভাৰ",
        "ur": "کشیدہ کاری کشن کور"
    },
    "Firozabad Glass Bangle Set": {
        "en": "Firozabad Glass Bangle Set",
        "hi": "फिरोजाबाद कांच की चूड़ियाँ",
        "bn": "ফিরোজাবাদ কাঁচের চুড়ি সেট",
        "te": "ఫిరోజాబాద్ గాజు గాజుల సెట్",
        "ta": "பிரோசாபாத் கண்ணாடி வளையல் தொகுப்பு",
        "mr": "फिरोजाबाद काचेच्या बांगड्यांचा संच",
        "gu": "ફિરોઝાબાદ કાચની બંગડીઓનો સેટ",
        "kn": "ಫಿರೋಜಾಬಾದ್ ಗಾಜಿನ ಬಳೆಗಳ ಸೆಟ್",
        "ml": "ഫിറോസാബാദ് വളകളുടെ സെറ്റ്",
        "or": "ଫିରୋଜାବାଦ କାଚ ଚୁଡ଼ି ସେଟ୍",
        "pa": "ਫ਼ਿਰੋਜ਼ਾਬਾਦ ਕੱਚ ਦੀਆਂ ਚੂੜੀਆਂ ਦਾ ਸੈੱਟ",
        "as": "ফিৰোজাবাদ কাঁচৰ খাৰু ছেট",
        "ur": "فیروزآباد شیشے کی چوڑیاں"
    },
    "Geometric Print Scarf": {
        "en": "Geometric Print Scarf",
        "hi": "ज्यामितीय प्रिंट स्कार्फ",
        "bn": "জ্যামিতিক প্রিন্ট স্কার্ফ",
        "te": "జ్యామితీయ ప్రింట్ స్కార్ఫ్",
        "ta": "வடிவியல் அச்சு தாவணி",
        "mr": "भौमितिक प्रिंट स्कार्फ",
        "gu": "ભૌમિતિક પ્રિન્ટ સ્કાર્ફ",
        "kn": "ಜ್ಯಾಮಿತೀಯ ಪ್ರಿಂಟ್ ಸ್ಕಾರ್ಫ್",
        "ml": "ജ്യാമിതീയ പ്രിന്റ് സ്കാർഫ്",
        "or": "ଜ୍ୟାମିତିକ ପ୍ରିଣ୍ଟ ସ୍କାର୍ଫ",
        "pa": "ਜਿਓਮੈਟ੍ਰਿਕ ਪ੍ਰਿੰਟ ਸਕਾਰਫ਼",
        "as": "জ্যামিতিক প্ৰিন্ট স্কাৰ্ফ",
        "ur": "جیومیٹرک پرنٹ اسکارف"
    },
    "Glazed Soup Bowls": {
        "en": "Glazed Soup Bowls",
        "hi": "चमकदार चीनी मिट्टी सूप कटोरे",
        "bn": "গ্লেজড স্যুপ বাটি",
        "te": "గ్లేజ్డ్ సూప్ గిన్నెలు",
        "ta": "மெருகூட்டப்பட்ட சூப் கிண்ணங்கள்",
        "mr": "चकचकीत सूप बाऊल्स",
        "gu": "ચમકદાર સૂપ બાઉલ્સ",
        "kn": "ಹೊಳಪು ಸೂಪ್ ಬಟ್ಟಲುಗಳು",
        "ml": "മിനുസപ്പെടുത്തിയ സൂപ്പ് ബൗളുകൾ",
        "or": "ଗ୍ଲେଜ୍ଡ ସୁପ୍ ବାଉଲ୍ସ",
        "pa": "ਚਮਕਦਾਰ ਸੂਪ ਬਾਉਲਜ਼",
        "as": "চকচকীয়া চুপ বাটি",
        "ur": "گلیزڈ سوپ پیالے"
    },
    "Gorakhpur Terracotta Horse": {
        "en": "Gorakhpur Terracotta Horse",
        "hi": "गोरखपुर टेराकोटा घोड़ा",
        "bn": "গোরক্ষপুর টেরাকোটা ঘোড়া",
        "te": "గోరఖ్‌పూర్ టెర్రకోట గుర్రం",
        "ta": "கோரக்பூர் டெரகோட்டா குதிரை",
        "mr": "गोरखपूर टेराकोटा घोडा",
        "gu": "ગોરખપુર ટેરાકોટા ઘોડો",
        "kn": "ಗೋರಖ್‌ಪುರ ಟೆರಾಕೋಟಾ ಕುದುರೆ",
        "ml": "ഗോരഖ്പൂർ ടെറാക്കോട്ട കുതിര",
        "or": "ଗୋରଖପୁର ଟେରାକୋଟା ଘୋଡ଼ା",
        "pa": "ਗੋਰਖਪੁਰ ਟੈਰਾਕੋਟਾ ਘੋੜਾ",
        "as": "গোৰখপুৰ টেৰাকোটা ঘোঁৰা",
        "ur": "گورکھپور ٹیراکوٹا گھوڑا"
    },
    "Hand-painted Wooden Box": {
        "en": "Hand-painted Wooden Box",
        "hi": "हस्तनिर्मित चित्रित लकड़ी का डिब्बा",
        "bn": "হাতে আঁকা কাঠের বাক্স",
        "te": "చేతితో చిత్రించిన చెక్క పెట్టె",
        "ta": "கைவண்ண மரப் பெட்டி",
        "mr": "हाताने रंगवलेला लाकडी डबा",
        "gu": "હાથથી રંગેલો લાકડાનો ડબ્બો",
        "kn": "ಕೈಯಿಂದ ಚಿತ್ರಿಸಿದ ಮರದ ಪೆಟ್ಟಿಗೆ",
        "ml": "കൈകൊണ്ട് വരച്ച തടിപ്പെട്ടി",
        "or": "ହସ୍ତଚିତ୍ରିତ କାଠ ବାକ୍ସ",
        "pa": "ਹੱਥੀਂ ਰੰਗਿਆ ਲੱਕੜ ਦਾ ਡੱਬਾ",
        "as": "হাতেৰে আঁকা কাঠৰ বাকচ",
        "ur": "دست رنگی لکڑی کا ڈبہ"
    },
    "Jaipur Cobalt Blue Pottery Urn": {
        "en": "Jaipur Cobalt Blue Pottery Urn",
        "hi": "जयपुर कोबाल्ट ब्लू पॉटरी कलश",
        "bn": "জয়পুর কোবাল্ট ব্লু পটারি কলস",
        "te": "జైపూర్ కోబాల్ట్ బ్లూ కుండల కలశం",
        "ta": "ஜெய்ப்பூர் நீல மட்பாண்ட கலசம்",
        "mr": "जयपूर कोबाल्ट ब्लू पॉटरी कलश",
        "gu": "જયપુર કોબાલ્ટ બ્લૂ પોટરી કળશ",
        "kn": "ಜೈಪುರ ಕೋಬಾಲ್ಟ್ ನೀಲಿ ಪಾಟರಿ ಕಲಶ",
        "ml": "ജയ്പൂർ കൊബാൾട്ട് ബ്ലൂ പോട്ടറി കലശം",
        "or": "ଜୟପୁର କୋବାଲ୍ଟ ବ୍ଲୁ ପଟେରୀ କଳସ",
        "pa": "ਜੈਪੁਰ ਕੋਬਾਲਟ ਬਲੂ ਪੋਟਰੀ ਕਲਸ਼",
        "as": "জয়পুৰ কোবাল্ট ব্লু পাত্ৰ",
        "ur": "جے پور کوبالٹ نیلا برتن"
    },
    "Kanpur Leather Messenger Bag": {
        "en": "Kanpur Leather Messenger Bag",
        "hi": "कानपुर चमड़े का मैसेंजर बैग",
        "bn": "কানপুর চামড়ার মেসেঞ্জার ব্যাগ",
        "te": "కాన్పూర్ లెదర్ మెసెంజర్ బ్యాగ్",
        "ta": "கான்பூர் தோல் தோள்பை",
        "mr": "कानपूर लेदर मेसेंजर बॅग",
        "gu": "કાનપુર ચામડાની મેસેન્જર બેગ",
        "kn": "ಕಾನ್ಪುರ ಚರ್ಮದ ಮೆಸೆಂಜರ್ ಬ್ಯಾಗ್",
        "ml": "കാൻപൂർ തുകൽ മെസഞ്ചർ ബാഗ്",
        "or": "କାନପୁର ଚମଡ଼ା ମେସେଞ୍ଜର ବ୍ୟାଗ",
        "pa": "ਕਾਨਪੁਰ ਚਮੜੇ ਦਾ ਮੈਸੇਂਜਰ ਬੈਗ",
        "as": "কানপুৰ চামৰাৰ মেছেঞ্জাৰ বেগ",
        "ur": "کانپور چمڑے کا میسنجر بیگ"
    },
    "Khairabad Blue Pottery Vase": {
        "en": "Khairabad Blue Pottery Vase",
        "hi": "खैराबाद ब्लू पॉटरी फूलदान",
        "bn": "খয়রাবাদ ব্লু পটারি ফুলদানি",
        "te": "ఖైరాబాద్ బ్లూ కుండల పువ్వుల కుండీ",
        "ta": "கைராபாத் நீல மட்பாண்ட பூந்தொட்டி",
        "mr": "खैराबाद ब्लू पॉटरी फुलदाणी",
        "gu": "ખૈરાબાદ બ્લૂ પોટરી ફૂલદાની",
        "kn": "ಖೈರಾಬಾದ್ ನೀಲಿ ಪಾಟರಿ ಹೂದಾನಿ",
        "ml": "ഖൈറാബാദ് ബ്ലൂ പോട്ടറി പൂപ്പാത്രം",
        "or": "ଖୈରାବାଦ ବ୍ଲୁ ପଟେରୀ ଫୁଲଦାନୀ",
        "pa": "ਖ਼ੈਰਾਬਾਦ ਬਲੂ ਪੋਟਰੀ ਗੁਲਦਾਨ",
        "as": "খৈৰাবাদ ব্লু পটাৰী ফুলদানী",
        "ur": "خیرآباد نیلے برتن کا گلدان"
    },
    "Khurja Ceramic Dinner Set": {
        "en": "Khurja Ceramic Dinner Set",
        "hi": "खुर्जा चीनी मिट्टी डिनर सेट",
        "bn": "খুরজা সিরামিক ডিনার সেট",
        "te": "ఖుర్జా సిరామిక్ డిన్నర్ సెట్",
        "ta": "குர்ஜா செராமிக் உணவு தட்டு தொகுப்பு",
        "mr": "खुरजा सिरॅमिक डिनर सेट",
        "gu": "ખુર્જા સિરામિક ડિનર સેટ",
        "kn": "ಖುರ್ಜಾ ಸೆರಾಮಿಕ್ ಡಿನ್ನರ್ ಸೆಟ್",
        "ml": "ഖുർജ സെറാമിക് ഡിന്നർ സെറ്റ്",
        "or": "ଖୁର୍ଜା ସିରାମିକ ଡିନର ସେଟ୍",
        "pa": "ਖ਼ੁਰਜਾ ਸਿਰੇਮਿਕ ਡਿਨਰ ਸੈੱਟ",
        "as": "খুৰ্জা চিৰামিক ডিনাৰ ছেট",
        "ur": "کھرجہ سرامک ڈنر سیٹ"
    },
    "Lucknowi Chikankari Fabric": {
        "en": "Lucknowi Chikankari Fabric",
        "hi": "लखनवी चिकनकारी वस्त्र",
        "bn": "লখনউই চিকনকারি কাপড়",
        "te": "లక్నో చికంకారీ వస్త్రం",
        "ta": "லக்னோ சிக்கன்காரி துணி",
        "mr": "लखनवी चिकनकारी कापड",
        "gu": "લખનૌવી ચિકનકારી કાપડ",
        "kn": "ಲಕ್ನೋವಿ ಚಿಕಂಕಾರಿ ಬಟ್ಟೆ",
        "ml": "ലഖ്നൗവി ചിക്കൻകാരി വസ്ത്രം",
        "or": "ଲକ୍ଷ୍ନୌ ଚିକନକାରୀ ବସ୍ତ୍ର",
        "pa": "ਲਖਨਊਵੀ ਚਿਕਨਕਾਰੀ ਕੱਪੜਾ",
        "as": "লখনৌ চিকনকাৰী কাপোৰ",
        "ur": "لکھنوی چکن کاری پارچہ"
    },
    "Madhubani Tree of Life Folio": {
        "en": "Madhubani Tree of Life Folio",
        "hi": "मधुबनी जीवन वृक्ष चित्र",
        "bn": "মধুবনী জীবন বৃক্ষ চিত্র",
        "te": "మధుబని కల్పవృక్ష చిత్రం",
        "ta": "மதுபானி வாழ்வின் மரம் ஓவியம்",
        "mr": "मधुबनी जीवन वृक्ष कलाकृती",
        "gu": "મધુબની જીવન વૃક્ષ ચિત્ર",
        "kn": "ಮಧುಬನಿ ಜೀವ ವೃಕ್ಷ ಚಿತ್ರ",
        "ml": "മധുബനി ജീവവൃക്ഷ ചിത്രം",
        "or": "ମଧୁବନୀ ଜୀବନ ବୃକ୍ଷ ଚିତ୍ର",
        "pa": "ਮਧੂਬਨੀ ਜੀਵਨ ਰੁੱਖ ਚਿੱਤਰ",
        "as": "মধুৱনী জীৱন বৃক্ষ চিত্ৰ",
        "ur": "مدھوبنی شجرِ حیات پینٹنگ"
    },
    "Mathura Brass Chariot": {
        "en": "Mathura Brass Chariot",
        "hi": "मथुरा पीतल का रथ",
        "bn": "মথুরা পিতলের রথ",
        "te": "మధుర ఇత్తడి రథం",
        "ta": "மதுரா பித்தளை தேர்",
        "mr": "मथुरा पितळेचा रथ",
        "gu": "મથુરા પિત્તળનો રથ",
        "kn": "ಮಥುರಾ ಹಿತ್ತಾಳೆ ರಥ",
        "ml": "മഥുര പിച്ചള രഥം",
        "or": "ମଥୁରା ପିତ୍ତଳ ରଥ",
        "pa": "ਮਥੁਰਾ ਪਿੱਤਲ ਦਾ ਰੱਥ",
        "as": "মথুৰা পিতলৰ ৰথ",
        "ur": "متھرا پیتل کا رتھ"
    },
    "Mathura Sanjhi Art Stencil": {
        "en": "Mathura Sanjhi Art Stencil",
        "hi": "मथुरा सांझी कला साँचा",
        "bn": "মথুরা সাঝি শিল্প স্টেনসিল",
        "te": "మధుర సాంఝీ కళ స్టెన్సిల్",
        "ta": "மதுரா சாஞ்சி கலை அச்சு",
        "mr": "मथुरा सांझी कला स्टेन्सिल",
        "gu": "મથુરા સાંઝી કલા સ્ટેન્સિલ",
        "kn": "ಮಥುರಾ ಸಾಂಝಿ ಕಲೆ ಸ್ಟೆನ್ಸಿಲ್",
        "ml": "മഥുര സാഞ്ചി ആർട്ട് സ്റ്റെൻസിൽ",
        "or": "ମଥୁରା ସାଞ୍ଝୀ କଳା ଷ୍ଟେନସିଲ୍",
        "pa": "ਮਥੁਰਾ ਸਾਂਝੀ ਕਲਾ ਸਟੈਂਸਿਲ",
        "as": "মথুৰা সানঝি কলা ষ্টেনচিল",
        "ur": "متھرا سانجھی آرٹ اسٹینسل"
    },
    "Mirzapur Handloom Dhurrie": {
        "en": "Mirzapur Handloom Dhurrie",
        "hi": "मिर्जापुर हथकरघा दरी",
        "bn": "মির্জাপুর হ্যান্ডলুম দরি",
        "te": "మిర్జాపూర్ చేనేత దువ్వెన దరి",
        "ta": "மிர்சாபூர் கைத்தறி விரிப்பு",
        "mr": "मिर्झापूर हातमाग दरी",
        "gu": "મિર્ઝાપુર હાથશાળ દરી",
        "kn": "ಮಿರ್ಜಾಪುರ ಕೈಮಗ್ಗದ ದರಿ",
        "ml": "മിർസാപൂർ കൈത്തറി വിരിപ്പ്",
        "or": "ମିର୍ଜାପୁର ହସ୍ତତନ୍ତ ଦରୀ",
        "pa": "ਮਿਰਜ਼ਾਪੁਰ ਖੱਡੀ ਦੀ ਦਰੀ",
        "as": "মিৰ্জাপুৰ তাঁতৰ দলিচা",
        "ur": "مرزا پور دستی دری"
    },
    "Moradabad Brass Ganesh Idol": {
        "en": "Moradabad Brass Ganesh Idol",
        "hi": "मुरादाबाद पीतल गणेश प्रतिमा",
        "bn": "মুরাদাবাদ পিতল গণেশ মূর্তি",
        "te": "మొరాదాబాద్ ఇత్తడి వినాయక విగ్రహం",
        "ta": "மொராதாபாத் பித்தளை கணபதி சிலை",
        "mr": "मुरादाबाद पितळेची गणेश मूर्ती",
        "gu": "મોરાદાબાદ પિત્તળ ગણેશ મૂર્તિ",
        "kn": "ಮೊರಾದಾಬಾದ್ ಹಿತ್ತಾಳೆ ಗಣೇಶ ವಿಗ್ರಹ",
        "ml": "മൊറാദാബാദ് പിച്ചള ഗണപതി വിഗ്രഹം",
        "or": "ମୋରାଦାବାଦ ପିତ୍ତଳ ଗଣେଶ ପ୍ରତିମା",
        "pa": "ਮੁਰਾਦਾਬਾਦ ਪਿੱਤਲ ਗਣੇਸ਼ ਮੂਰਤੀ",
        "as": "মোৰাদাবাদ পিতলৰ গণেশ মূৰ্তি",
        "ur": "مرادآباد پیتل کا مجسمہ"
    },
    "Natural Dye Table Runner": {
        "en": "Natural Dye Table Runner",
        "hi": "प्राकृतिक रंग टेबल रनर",
        "bn": "প্রাকৃতিক রঙের টেবিল রানার",
        "te": "సహజ రంగుల టేబుల్ రన్నర్",
        "ta": "இயற்கை சாய மேஜை விரிப்பு",
        "mr": "नैसर्गिक रंगाचे टेबल रनर",
        "gu": "કુદરતી રંગ ટેબલ રનર",
        "kn": "ನೈಸರ್ಗಿಕ ಬಣ್ಣದ ಟೇಬಲ್ ರನ್ನರ್",
        "ml": "പ്രകൃതിദത്ത ചായം പൂശിയ ടേബിൾ റണ്ണർ",
        "or": "ପ୍ରାକୃତିକ ରଙ୍ଗ ଟେବୁଲ ରନର୍",
        "pa": "ਕੁਦਰਤੀ ਰੰਗ ਟੇਬਲ ਰਨਰ",
        "as": "প্ৰাকৃতিক ৰঙৰ টেবুল ৰাণাৰ",
        "ur": "قدرتی رنگ کی میز پوش"
    },
    "Royal Kashmiri Sozni Pashmina Shawl": {
        "en": "Royal Kashmiri Sozni Pashmina Shawl",
        "hi": "शाही कश्मीरी सोजनी पश्मीना शॉल",
        "bn": "রাজকীয় কাশ্মীরি সোজনি পশমিনা শাল",
        "te": "రాయల్ కాశ్మీరీ సోజ్నీ పష్మినా శాలువా",
        "ta": "ராஜரீக காஷ்மீரி சோஸ்னி பஷ்மினா சால்வை",
        "mr": "शाही काश्मिरी सोजनी पश्मिना शाल",
        "gu": "શાહી કાશ્મીરી સોઝની પશ્મિના શાલ",
        "kn": "ರಾಯಲ್ ಕಾಶ್ಮೀರಿ ಸೋಜನಿ ಪಶ್ಮಿನಾ ಶಾಲು",
        "ml": "റോയൽ കശ്മീരി സോസ്നി പഷ്മിന ഷാൾ",
        "or": "ଶାହୀ କାଶ୍ମୀରୀ ସୋଜନୀ ପଶ୍ମିନା ଶାଲ",
        "pa": "ਸ਼ਾਹੀ ਕਸ਼ਮੀਰੀ ਸੋਜ਼ਨੀ ਪਸ਼ਮੀਨਾ ਸ਼ਾਲ",
        "as": "ৰাজকীয় কাশ্মিৰী চোজনী পশ্বমিনা চাদৰ",
        "ur": "شاہی کشمیری سوزنی پشمینہ شال"
    },
    "Saharanpur Hand-Carved Box": {
        "en": "Saharanpur Hand-Carved Box",
        "hi": "सहारनपुर नक्काशीदार लकड़ी का डिब्बा",
        "bn": "সাহারানপুর খোদাই করা কাঠের বাক্স",
        "te": "సహారన్‌పూర్ చేతి చెక్కడపు చెక్క పెట్టె",
        "ta": "சஹாரன்பூர் கை வேலைப்பாடு மரப் பெட்டி",
        "mr": "सहारनपूर नक्षीदार लाकडी डबा",
        "gu": "સહારનપુર કોતરણી કરેલો લાકડાનો ડબ્બો",
        "kn": "ಸಹಾರನ್‌ಪುರ ಕೈಯಿಂದ ಕೆತ್ತಿದ ಮರದ ಪೆಟ್ಟಿಗೆ",
        "ml": "സഹാറൻപൂർ കൊത്തുപണി ചെയ്ത തടിപ്പെട്ടി",
        "or": "ସହାରନପୁର ଖୋଦେଇ କାଠ ବାକ୍ସ",
        "pa": "ਸਹਾਰਨਪੁਰ ਨੱਕਾਸ਼ੀਦਾਰ ਲੱਕੜ ਦਾ ਡੱਬਾ",
        "as": "চাহাৰনপুৰ খোদিত কাঠৰ বাকচ",
        "ur": "سہارنپور منقش لکڑی کا ڈبہ"
    },
    "Silver Jhumka Earrings": {
        "en": "Silver Jhumka Earrings",
        "hi": "चांदी के झुमके",
        "bn": "রুপোর ঝুমকো দুল",
        "te": "వెండి జుంకా దుద్దులు",
        "ta": "வெள்ளி ஜிமிக்கி கம்மல்",
        "mr": "चांदीचे झुमके",
        "gu": "ચાંદીના ઝુમખા કાનની બુટ્ટી",
        "kn": "ಬೆಳ್ಳಿ ಜುಮ್ಕಾ ಓಲೆಗಳು",
        "ml": "വെള്ളി ജിമിക്കി കമ്മലുകൾ",
        "or": "ରୂପା ଝୁମକା କାନଫୁଲ",
        "pa": "ਚਾਂਦੀ ਦੇ ਝੁਮਕੇ",
        "as": "ৰূপৰ ঝুমকা কাণফুলি",
        "ur": "چاندی کے جھمکے"
    },
    "Sunset Tapestry": {
        "en": "Sunset Tapestry",
        "hi": "सूर्यास्त हथकरघा टेपेस्ट्री",
        "bn": "সূর্যাস্ত হস্তনির্মিত ট্যাপেস্ট্রি",
        "te": "సూర్యాస్తమయం చేనేత వాల్ హ్యాంగింగ్",
        "ta": "சூரிய அஸ்தமன கைவினை திரைச்சீலை",
        "mr": "सूर्यास्त हातमाग टेपेस्ट्री",
        "gu": "સૂર્યાસ્ત હાથવણાટ ટેપેસ્ટ્રી",
        "kn": "ಸೂರ್ಯಾಸ್ತ ಕೈಮಗ್ಗದ ಟೇಪೆಸ್ಟ್ರಿ",
        "ml": "സൂര്യാസ്തമയ കൈത്തറി അലങ്കാര തുണി",
        "or": "ସୂର୍ଯ୍ୟାସ୍ତ ହସ୍ତତନ୍ତ ଟେପେଷ୍ଟ୍ରି",
        "pa": "ਸੂਰਜ ਡੁੱਬਣ ਦੀ ਕੰਧ ਕਲਾ",
        "as": "সূৰ্যাস্ত হস্তনির্মিত টেপেষ্ট্ৰী",
        "ur": "غروبِ آفتاب ہاتھ کا پردہ"
    },
    "Terracotta Planter": {
        "en": "Terracotta Planter",
        "hi": "टेराकोटा मिट्टी का गमला",
        "bn": "টেরাকোটা মাটির টব",
        "te": "టెర్రకోట మట్టి కుండీ",
        "ta": "டெரகோட்டா செடி தொட்டி",
        "mr": "टेराकोटा मातीची कुंडी",
        "gu": "ટેરાકોટા માટીનું કૂંડું",
        "kn": "ಟೆರಾಕೋಟಾ ಮಣ್ಣಿನ ಕುಂಡ",
        "ml": "ടെറാക്കോട്ട ചെടിച്ചട്ടി",
        "or": "ଟେରାକୋଟା ମାଟି କୁଣ୍ଡ",
        "pa": "ਟੈਰਾਕੋਟਾ ਮਿੱਟੀ ਦਾ ਗਮਲਾ",
        "as": "টেৰাকোটা মাটিৰ টাব",
        "ur": "ٹیراکوٹا مٹی کا گملہ"
    },
    "The Lost-Wax Dancing Bull": {
        "en": "The Lost-Wax Dancing Bull",
        "hi": "ढोकरा नृत्य करता नंदी बैल",
        "bn": "ঢোকরা নৃত্যরত নন্দী ষাঁড়",
        "te": "డోక్రా నాట్య నంది ఎద్దు",
        "ta": "டோக்ரா நடனமாடும் நந்தி காளை",
        "mr": "ढोकरा नृत्य करणारा नंदी बैल",
        "gu": "ધોકરા નૃત્ય કરતો નંદી બળદ",
        "kn": "ಢೋಕ್ರಾ ನೃತ್ಯ ನಂದಿ ಗೂಳಿ",
        "ml": "ഡോക്ര നൃത്തം ചെയ്യുന്ന നന്ദി കാള",
        "or": "ଢୋକରା ନୃତ୍ୟରତ ନନ୍ଦୀ ବୃଷଭ",
        "pa": "ਢੋਕਰਾ ਨੱਚਦਾ ਨੰਦੀ ਬਲਦ",
        "as": "ঢোক্ৰা নৃত্যৰত নন্দী ষাঁড়",
        "ur": "ڈھوکرا رقص کرتا نندی بیل"
    },
    "Varanasi Silver Filigree Box": {
        "en": "Varanasi Silver Filigree Box",
        "hi": "वाराणसी चांदी तारकशी डिब्बा",
        "bn": "বারাণসী রূপোর তারকশি বাক্স",
        "te": "వారణాసి వెండి తారకశీ పెట్టె",
        "ta": "வாரணாசி வெள்ளி பிலிகிரி பெட்டி",
        "mr": "वाराणसी चांदीची तारकशी पेटी",
        "gu": "વારાણસી ચાંદી તારકશી ડબ્બો",
        "kn": "ವಾರಣಾಸಿ ಬೆಳ್ಳಿ ತಾರಕಶಿ ಪೆಟ್ಟಿಗೆ",
        "ml": "വാരാണസി വെള്ളി ഫിലിഗ്രി പെട്ടി",
        "or": "ବାରାଣସୀ ରୂପା ତାରକସି ବାକ୍ସ",
        "pa": "ਵਾਰਾਣਸੀ ਚਾਂਦੀ ਤਾਰਕਸ਼ੀ ਡੱਬਾ",
        "as": "বাৰাণসী ৰূপৰ তাৰকাছি বাকচ",
        "ur": "وارانسی چاندی تارکشی ڈبہ"
    }
}

# 1. Output TypeScript translation module
ts_code = f"""// Auto-generated Viraasat Product Translation Registry
// Maps all 35 catalog products across all 13 supported Indian languages

export const PRODUCT_NAME_TRANSLATIONS: Record<string, Record<string, string>> = {json.dumps(PRODUCT_TRANSLATIONS, indent=2, ensure_ascii=False)};

/**
 * Universal product name translator
 * Accepts a product name string or Product object, and returns the authentic
 * translated name in the specified language (falls back to English name).
 */
export function getTranslatedProductName(
  productOrName: string | {{ name: string; names?: Record<string, string> }} | null | undefined,
  lang: string = 'en'
): string {{
  if (!productOrName) return '';

  const rawName = typeof productOrName === 'string' ? productOrName : productOrName.name || '';
  if (!rawName) return '';

  // 1. Direct object-level names dictionary if present
  if (typeof productOrName === 'object' && productOrName.names && productOrName.names[lang]) {{
    return productOrName.names[lang];
  }}

  // 2. Exact match in master translations registry
  const translationMap = PRODUCT_NAME_TRANSLATIONS[rawName];
  if (translationMap && translationMap[lang]) {{
    return translationMap[lang];
  }}

  // 3. Case-insensitive lookup fallback
  const lower = rawName.toLowerCase().trim();
  for (const [key, map] of Object.entries(PRODUCT_NAME_TRANSLATIONS)) {{
    if (key.toLowerCase().trim() === lower) {{
      if (map[lang]) return map[lang];
      break;
    }}
  }}

  // 4. Default return English/raw name
  return rawName;
}}
"""

ts_path = "frontend/src/core/utils/product-translations.ts"
with open(ts_path, "w", encoding="utf-8") as f:
    f.write(ts_code)
print(f"Written {ts_path}")

# 2. Inject into language-context.tsx PHRASE_DICTIONARY
ctx_path = "frontend/src/context/language-context.tsx"
with open(ctx_path, "r", encoding="utf-8") as f:
    ctx_code = f.read()

import_line = "import { PRODUCT_NAME_TRANSLATIONS, getTranslatedProductName } from '@/core/utils/product-translations';\n"
if "getTranslatedProductName" not in ctx_code:
    ctx_code = import_line + ctx_code

# Also update t() function in language-context.tsx so t(product.name) resolves automatically
old_phrase_lookup = """    // 1. Direct dictionary phrase match for active language
    if (language !== 'en' && PHRASE_DICTIONARY[language]?.[key]) {
      text = PHRASE_DICTIONARY[language][key];
    }"""

new_phrase_lookup = """    // 1. Direct product name translation match for active language
    if (language !== 'en' && PRODUCT_NAME_TRANSLATIONS[key]?.[language]) {
      text = PRODUCT_NAME_TRANSLATIONS[key][language];
    } else if (language !== 'en' && PHRASE_DICTIONARY[language]?.[key]) {
      text = PHRASE_DICTIONARY[language][key];
    }"""

if old_phrase_lookup in ctx_code:
    ctx_code = ctx_code.replace(old_phrase_lookup, new_phrase_lookup)
    print("Updated t() resolution in language-context.tsx")

# Also add translateProduct to context interface and value
if "translateProduct: (nameOrProduct: any) => string;" not in ctx_code:
    ctx_code = ctx_code.replace(
        "t: (key: string, params?: Record<string, string | number>) => string;\n  dir: 'ltr' | 'rtl';",
        "t: (key: string, params?: Record<string, string | number>) => string;\n  translateProduct: (nameOrProduct: any) => string;\n  dir: 'ltr' | 'rtl';"
    )
    ctx_code = ctx_code.replace(
        "const contextValue = useMemo(() => ({\n    language,\n    setLanguage,\n    t,",
        "const translateProduct = useCallback((nameOrProduct: any) => {\n    return getTranslatedProductName(nameOrProduct, language);\n  }, [language]);\n\n  const contextValue = useMemo(() => ({\n    language,\n    setLanguage,\n    t,\n    translateProduct,"
    )
    ctx_code = ctx_code.replace(
        "language: 'en',\n  setLanguage: () => {},\n  t: (key: string",
        "language: 'en',\n  setLanguage: () => {},\n  translateProduct: (p: any) => typeof p === 'string' ? p : p?.name || '',\n  t: (key: string"
    )
    print("Added translateProduct to LanguageContext")

with open(ctx_path, "w", encoding="utf-8") as f:
    f.write(ctx_code)
print("Updated language-context.tsx")

# 3. Update use-translation.ts
hook_path = "frontend/src/core/hooks/use-translation.ts"
with open(hook_path, "w", encoding="utf-8") as f:
    f.write("""'use client';

import { useLanguage } from '@/context/language-context';

export function useTranslation() {
  const { t, translateProduct, language, setLanguage, dir, isRTL } = useLanguage();
  return { t, translateProduct, language, setLanguage, dir, isRTL };
}
""")
print("Updated use-translation.ts")
