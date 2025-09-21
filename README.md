🌟 Introduction

**Viraasat** is an innovative, AI-powered digital marketplace meticulously crafted to bridge the gap between talented local artisans and a global audience. The name "Viraasat," meaning 'heritage' or 'legacy,' perfectly encapsulates our mission: to preserve traditional crafts by empowering artisans in the digital age and making their unique stories and products accessible worldwide.

This web application leverages the robust capabilities of **Firebase** and cutting-edge **Google AI services** to provide a seamless, intelligent, and deeply personal e-commerce experience for both creators and consumers.

## ✨ The Problem Viraasat Solves

Local artisans, despite their exceptional skill and unique handcrafted products, often face significant hurdles in the digital landscape:
*   **Poor Digital Presentation:** Lack of professional photography skills or equipment results in subpar product images and generic descriptions.
*   **Limited Reach:** Traditional physical markets restrict their customer base to local geographies.
*   **Technical Barriers:** Navigating complex e-commerce platforms can be overwhelming.
*   **Lost Stories:** The rich narratives behind their craft, which add immense value, often go untold online.
*   **Buyer Trust & Discovery:** Consumers struggle to find authentic handcrafted goods and desire more transparency about product origins and creation.

## 💡 Our Solution: An AI-Driven Marketplace

Viraasat tackles these challenges head-on by offering a dual-sided platform:

### 1. For Artisans: Empowering Creation with AI 🎨
Our intuitive Artisan Dashboard (`/artisan-dashboard`) transforms the daunting task of online selling into an effortless, empowering experience. Artisans can manage their products, share their stories, and process orders with ease, supported by bespoke AI tools:

*   **📸 AI-Powered Image Enhancement:**
    *   Upload smartphone photos, and our AI (powered by **Google Cloud Vision API**) intelligently enhances quality, corrects colors, brightens dim shots, and can even remove/optimize backgrounds for a professional, studio-shot look.
    *   *Imagine transforming a blurry, poorly lit photo into a vibrant, sharp image with a clean backdrop – all automatically!*
*   **🎤 Voice-to-Text & AI Description Refinement:**
    *   Artisans simply **speak** about their product's inspiration, materials, or process.
    *   **Google Cloud Speech-to-Text API** transcribes their words.
    *   A custom **Google AI Platform / Vertex AI NLP model** then refines this raw text, correcting grammar, enhancing vocabulary, and transforming it into an eloquent, engaging, and SEO-friendly product description, perfect for attracting buyers.
*   **📜 Dedicated Storytelling:** A rich space for artisans to share their personal journey, techniques, and cultural heritage, fostering a deeper connection with buyers.
*   **🛒 Streamlined Product & Order Management:** Easy-to-use forms for adding/editing products, setting prices, managing stock, and tracking incoming orders.

### 2. For Buyers: Discovering Authenticity with Intelligence 🛍️
The Buyer Marketplace (`/marketplace`) offers a visually rich and intelligent e-commerce experience designed for discovering unique, handcrafted treasures:

*   **🔍 Intuitive Product Discovery:** Powerful search, category filters, and the ability to browse individual artisan shops make finding the perfect item a delight. All products are displayed with their AI-enhanced images and refined descriptions.
*   **🧠 AI Product Analyzer:** A unique feature on every product detail page. Our AI (leveraging **Google AI Platform / Vertex AI**) analyzes the product's data to provide instant, clear insights:
    *   **Key Features Highlight:** Automatically extracts and lists essential characteristics (e.g., "Hand-painted," "Sustainable Materials," "Unique Design").
    *   **Style & Aesthetic Tags:** Suggests stylistic attributes (e.g., "Boho Chic," "Minimalist," "Traditional Indian").
    *   **Potential Use Cases:** Offers creative suggestions on how the product can be used or styled.
    *   *This empowers buyers to make highly informed decisions and truly appreciate the artistry.*
*   **🤝 Connect with Artisans:** Buyers can easily access and read the full, captivating stories behind each product and its creator.
*   **💳 Seamless Shopping Experience:** Standard e-commerce features including a shopping cart, secure checkout, and order history management.

## 🚀 Unique Selling Proposition (USP)

Viraasat's core USP lies in its **dual-focused, AI-driven empowerment for local artisans combined with an intelligent, trust-building buying experience for consumers.**

Unlike generic marketplaces, Viraasat doesn't just list products; it actively **equips artisans with the digital capabilities they need to thrive** through accessible AI tools that transform raw content into professional-grade assets. For buyers, we go beyond simple transactions, offering **AI-driven insights and fostering deep connections to the artisans' stories**, creating an unparalleled shopping journey that celebrates authenticity and heritage.

## 🛠️ Technology Stack

Viraasat is built on a robust, scalable, and secure foundation utilizing Google's powerful ecosystem:

*   **Frontend:** `[Your Chosen Framework, e.g., React.js]` (or Vue.js/Angular) for a dynamic and responsive user interface.
*   **Backend & Database:** **Firebase**
    *   `Firebase Authentication`: Secure user management.
    *   `Firestore`: Flexible NoSQL database for all application data.
    *   `Firebase Storage`: Scalable storage for product images and audio recordings.
*   **AI / Machine Learning:** **Google Cloud AI Services**
    *   `Google Cloud Vision API`: For intelligent image analysis, enhancement, and background optimization.
    *   `Google Cloud Speech-to-Text API`: For accurate transcription of artisan voice descriptions.
    *   `Google AI Platform / Vertex AI`: For deploying custom Natural Language Processing (NLP) models used in description refinement and product analysis.
    *   `Cloud Functions for Firebase`: Serverless functions to orchestrate AI workflows and backend logic (e.g., triggering image/audio processing on upload).
*   **Language:** `JavaScript / TypeScript` (for both Frontend & Cloud Functions) - ensuring a unified and efficient development experience.

## 🗺️ Project Structure
viraasat_/
├── public/ # Static assets
├── src/ # Frontend source code (React/Vue/Angular)
│ ├── assets/
│ ├── components/
│ ├── pages/
│ ├── App.js/ts
│ └── index.js/ts
├── firebase/ # Firebase Cloud Functions & other backend logic
│ ├── functions/
│ │ ├── index.js/ts # Cloud Functions definitions
│ │ └── package.json
│ ├── firestore.rules # Firestore security rules
│ └── storage.rules # Firebase Storage security rules
├── .env # Environment variables
├── package.json # Frontend dependencies
└── README.md
## 🚀 Getting Started (Local Development)

To run Viraasat locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Aayush9-spec/viraasat_.git
    cd viraasat_
    ```
2.  **Set up Firebase Project:**
    *   Create a new Firebase project in the Google Cloud Console.
    *   Enable Firebase Authentication (Email/Password), Firestore, and Firebase Storage.
    *   Upgrade to the Blaze plan (pay-as-you-go) to enable Cloud Functions and Google Cloud AI APIs.
    *   Enable `Cloud Vision API`, `Cloud Speech-to-Text API`, and `Vertex AI API` in your Google Cloud Project.
3.  **Configure Environment Variables:**
    *   Create a `.env` file in the root directory.
    *   Add your Firebase project configuration details (API Key, Auth Domain, Project ID, etc.).
    ```
    REACT_APP_FIREBASE_API_KEY=your_api_key
    REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
    REACT_APP_FIREBASE_PROJECT_ID=your_project_id
    # ...other Firebase config details
    ```
4.  **Install Dependencies:**
    ```bash
    # For the frontend
    npm install
    # For Cloud Functions
    cd firebase/functions
    npm install
    cd ../..
    ```
5.  **Deploy Firebase Cloud Functions:**
    *   Make sure you are logged into Firebase CLI: `firebase login`
    *   Set your Firebase project: `firebase use --add YOUR_PROJECT_ID`
    *   Deploy functions: `firebase deploy --only functions`
6.  **Run the Frontend:**
    ```bash
    npm start
    ```
    The application should now be running locally, typically at `http://localhost:3000`.

## 🤝 Contributing

We welcome contributions to Viraasat! Whether you want to improve code, suggest features, or report bugs, please feel free to:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'feat: Add new feature X'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

Please ensure your code adheres to our coding standards and includes appropriate tests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

*   Google Firebase
*   Google Cloud AI Platform / Vertex AI
*   `[Mention any specific libraries/tools you found particularly helpful]`
*   The GenAI Hackathon organizers!
