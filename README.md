🪔 Viraasat – The AI-Driven Marketplace for Local Artisans 
  
> **Preserve the heritage. Empower the artisans. Inspire the world.**  
  
**Viraasat** (Heritage) is an innovative, AI-powered digital marketplace bridging the gap between India’s traditional artisans and a global audience. By leveraging **Firebase** and **Google AI services**, we transform raw handcrafted products into professionally showcased treasures—complete with enhanced visuals, voice-first interactions, and intelligent storytelling.

---        
     
## 📑 Table of Contents      
    
* [The Problem](https://www.google.com/search?q=%23-the-problem)  
* [Our Solution](https://www.google.com/search?q=%23-our-solution)  
* [Key Features](https://www.google.com/search?q=%23-key-features) 
* [Tech Stack](https://www.google.com/search?q=%23-tech-stack)  
* [System Architecture](https://www.google.com/search?q=%23-system-architecture) 
* [Getting Started](https://www.google.com/search?q=%23-getting-started)   
* [Project Structure](https://www.google.com/search?q=%23-project-structure)
* [Contributing](https://www.google.com/search?q=%23-contributing) 
* [License](https://www.google.com/search?q=%23-license) 
 
--- 

## 🛑 The Problem  
 
Despite extraordinary skill, rural artisans face significant barriers in the digital age:

| Challenge 📉 | Impact ⚠️ | 
| --- | --- | 
| **Poor Digital Content** | Bad lighting and low-quality photos fail to attract premium buyers. |
| **Language Barriers** | Inability to write compelling English descriptions limits reach. |
| **Tech Intimidation** | Complex e-commerce onboarding scares away non-technical creators. |
| **Lost Stories** | The cultural significance and effort behind the craft remain untold. |

**Result:** Priceless craftsmanship remains undervalued, and heritage fades away.

---

## 💡 Our Solution: AI-First Empowerment

Viraasat is not just a store; it is a **cultural experience**. We use AI to remove technical barriers, allowing artisans to focus on creation while we handle the presentation.

### 🌟 Unique Selling Proposition (USP)

* **Empowerment:** Accessible AI tools that turn a mobile phone into a professional studio.
* **Discovery:** Intelligent insights help buyers find authentic crafts.
* **Preservation:** Digital storytelling that documents the legacy of Indian art.

---

## 🚀 Key Features

### 🎨 For Artisans (The Dashboard)

* **AI Image Enhancement:** Powered by **Google Cloud Vision API**. Automatically fixes lighting, crops, and enhances artisan uploads to studio quality.
* **Voice-to-Text Listing:** Powered by **Speech-to-Text API**. Artisans can describe their products verbally in their local language; we convert it to structured listings.
* **AI-Refined Descriptions:** Powered by **Vertex AI**. Generates SEO-ready, emotional, and rich narratives based on raw inputs.
* **Inventory Management:** Real-time business control via Firestore.

### 🛍️ For Buyers (The Marketplace)

* **Visual Storytelling:** "Meet the Creator" profiles that build trust and emotional connection.
* **AI Product Analyzer:**
* Extracts key features and aesthetics.
* Suggests use cases and styling tips.
* Provides authenticity cues.


* **Secure Transactions:** Full cart, checkout, and order history management.

---

## 🛠 Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React.js, Tailwind CSS (Recommended) |
| **Backend & DB** | Firebase Authentication, Cloud Firestore, Firebase Storage |
| **AI / ML** | Google Cloud Vision API, Speech-to-Text API, Vertex AI |
| **Serverless** | Firebase Cloud Functions |
| **Language** | TypeScript / JavaScript |

---

## 🏗 System Architecture

The application follows a serverless architecture where the frontend interacts directly with Firebase services, while heavy AI processing is offloaded to Cloud Functions.

---

## ⚙️ Getting Started

Follow these steps to set up the project locally.

### Prerequisites

* Node.js (v16+)
* Git
* Firebase CLI (`npm install -g firebase-tools`)
* Google Cloud Platform Account (Blaze Plan required for AI extensions)

### Installation

1. **Clone the Repository**
```bash 
git clone https://github.com/Aayush9-spec/viraasat_.git
cd viraasat_

```


2. **Install Dependencies**
```bash
# Root dependencies (React)
npm install

# Backend dependencies (Functions)
cd firebase/functions
npm install
cd ../..

```


3. **Environment Configuration**
Create a `.env` file in the root directory:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

```


4. **Firebase Setup**
* Create a project on the [Firebase Console](https://console.firebase.google.com/).
* Enable **Authentication** (Email/Password).
* Enable **Firestore** and **Storage**.
* **Important:** Enable Google Cloud APIs (Vision, Speech-to-Text, Vertex AI) in your GCP console linked to the Firebase project.


5. **Deploy Functions**
```bash
firebase login
firebase use --add <PROJECT_ID>
firebase deploy --only functions

```


6. **Run the Application**
```bash
npm start

```


👉 Visit `http://localhost:3000`

---

## 🗂 Project Structure

```bash
viraasat_/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images and icons
│   ├── components/         # Reusable UI components
│   ├── pages/              # Application views (Dashboard, Marketplace)
│   ├── context/            # React Context (Auth, Cart)
│   ├── App.tsx             # Main entry point
│   └── index.tsx
├── firebase/
│   ├── functions/          # Serverless backend logic
│   │   ├── index.ts        # Cloud Functions entry
│   │   └── package.json
│   ├── firestore.rules     # Database security rules
│   └── storage.rules       # Storage security rules
├── .env                    # Environment variables
└── package.json

```

---

## 🤝 Contributing

We ❤️ contributions! Help us preserve heritage through code.

1. **Fork** the repository.
2. **Branch** out (`git checkout -b feat/amazing-feature`).
3. **Commit** your changes using conventional commits:
* `feat: add voice input support`
* `fix: image enhancement timeout`
* `docs: improved setup instructions`


4. **Push** to the branch.
5. **Open a Pull Request**.
 
---

## 🙏 Acknowledgements

* **Google Firebase** for the robust backend infrastructure.
* **Google Cloud AI / Vertex AI** for powering the intelligence layer.
* **The Artisans** who inspire us every day.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

---

<p align="center">
<b>Handcrafted stories deserve a global audience. 🌍✨</b>




Built with ❤️ by Aayush Kumar Singh and Team
</p>
