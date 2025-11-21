🌟 Viraasat – The AI-Driven Marketplace for Local Artisans

Preserve the heritage. Empower the artisans. Inspire the world.

Viraasat is an innovative, AI-powered digital marketplace that bridges the gap between India’s traditional artisans and a global audience. The word Viraasat means heritage, perfectly aligning with our mission:

To digitally empower craftsmanship and ensure every artisan’s legacy reaches the world 🌍

With the combined power of Firebase and Google AI services, Viraasat transforms handcrafted products into professionally showcased treasures — complete with enhanced visuals, compelling storytelling, and intelligent product insights.

🚨 The Problem

Despite extraordinary skill, artisans face:

Challenge	Impact
Poor digital content (bad photos, weak descriptions)	Products fail to attract buyers
Limited local market reach	Low income potential
Lack of e-commerce knowledge	Difficult onboarding
Stories behind crafts remain untold	Lost heritage value
Low buyer trust & product discovery issues	Hesitation in purchasing

🧩 Result: Their priceless craftsmanship remains undervalued and unseen.

✅ Our Solution: AI-First Empowerment
🎨 For Artisans – Effortless Selling

📍 /artisan-dashboard — First-of-its-kind AI-assisted selling workspace:

Feature	Powered By	Benefit
AI Image Enhancement	Google Cloud Vision API	Studio-quality visuals from mobile photos
Voice-to-Text Product Input	Speech-to-Text API	Easy listing for non-technical users
AI-Refined Descriptions	Vertex AI NLP Model	SEO-ready, rich, emotional storytelling
Storytelling Portal	Firestore + UI	Captures heritage + personal journey
Order & Inventory Management	Firebase	Complete business control

🪄 Turns raw artisan content → polished, professional digital storefronts!

🛍️ For Buyers – Experience Authenticity

📍 /marketplace — Browse globally, discover personally

✨ Smart discovery with:

✅ AI Product Analyzer:

Key feature extraction

Style & aesthetic tagging

Suggested use cases

Authenticity cues

✅ Visual storytelling → Meet the creator behind the craft
✅ Secure cart, checkout & order history
✅ Trust + transparency in every purchase

Not just ecommerce — a cultural experience 💫

🌟 Unique Selling Proposition (USP)

✔ Empowers artisans with accessible AI (not just tools, real transformation)
✔ Helps buyers discover authentic handcrafts with intelligent insights
✔ Preserves heritage through digital storytelling 📜
✔ Dual-focused benefits → sellers + buyers both win 🎯

🌍 Viraasat is where culture meets technology.

🛠️ Tech Stack
Layer	Technology
Frontend	React.js (or Vue/Angular — customizable)
Backend & DB	Firebase Authentication, Firestore, Storage
AI / ML Integrations	Google Cloud Vision API, Speech-to-Text API, Vertex AI
Serverless Logic	Firebase Cloud Functions
Language	JavaScript / TypeScript


🗂️ Project Structure
viraasat_/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── App.tsx / js
│   └── index.tsx / js
├── firebase/
│   ├── functions/
│   │   ├── index.ts / js
│   │   └── package.json
│   ├── firestore.rules
│   └── storage.rules
├── .env
├── package.json
└── README.md


⚙️ Getting Started (Developer Guide)
🔹 1️⃣ Clone the Repo
git clone https://github.com/Aayush9-spec/viraasat_.git
cd viraasat_

🔹 2️⃣ Setup Firebase Project

Enable ✅:

Authentication (Email/Password)

Firestore + Credit-based Blaze Plan

Firebase Storage

Cloud Functions

Enable APIs:

Vision API

Speech-to-Text API

Vertex AI API

🔹 3️⃣ Create Environment Variables

.env:

REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
# Add all required firebase config fields

🔹 4️⃣ Install Dependencies
npm install
cd firebase/functions
npm install
cd ../..

🔹 5️⃣ Deploy Functions
firebase login
firebase use --add <PROJECT_ID>
firebase deploy --only functions

🔹 6️⃣ Run Frontend
npm start


👉 Opens at: http://localhost:3000

🤝 Contributing Guide

We ❤️ contributions!

1️⃣ Fork → 2️⃣ Branch → 3️⃣ Code → 4️⃣ Commit → 5️⃣ PR

Commit format:

feat: add voice input support
fix: image enhancement timeout
docs: improved project setup instructions

📄 License

Licensed under the MIT License
See: LICENSE

🙏 Acknowledgements

Special thanks to:

Google Firebase

Google Cloud AI / Vertex AI

Open-source libraries that support Viraasat’s vision


🧵 Closing Note

Handcrafted stories deserve a global audience.
With Viraasat, we’re not building just a marketplace —
we’re preserving a legacy. 🌍✨
