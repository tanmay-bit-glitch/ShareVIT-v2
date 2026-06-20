# ShareVIT 🎓

ShareVIT is a comprehensive community and marketplace application designed specifically for VIT students. It provides a centralized platform for students to connect, trade items, access academic resources, and seek assistance through an integrated AI assistant.

## ✨ Features

### 🛒 Marketplace
- **Buy, Sell, Rent, or Donate**: Trade textbooks, electronics, lab equipment, and more.
- **Categorized Listings**: Easily find items sorted by categories and sub-categories.
- **Direct Messaging (DMs)**: Integrated chat system for buyers and sellers to negotiate securely.
- **Status Updates**: Mark listings as active, sold, rented, or completed to keep the marketplace up-to-date.

### 💬 Community Hub
- **Server Channels**: Public discussion channels based on branches (CSE, ENTC, Civil, etc.) and topics (Placements, General).
- **Real-time Chat**: Powered by Firebase Firestore for fast, seamless message delivery.
- **Rich Media**: Support for sharing images within chats and direct messages.

### 🤖 AI Assistant
- **Integrated Generative AI**: Powered by Google's Gemini Pro.
- **Academic Support**: Ask questions, get help with assignments, or seek general guidance directly on the platform.

### 🛡️ Security & Authentication
- **Secure Login**: Authentication handled robustly to ensure only authorized students can access the platform.
- **Protected Routes**: Ensuring data privacy and secure transactions.

### 🎮 Gamification
- **XP System**: Earn experience points (XP) for activities like selling items, donating, or completing transactions.

## 🛠️ Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (React framework for production)
- **Database & Backend**: [Firebase](https://firebase.google.com/) (Firestore, Storage, Authentication)
- **AI Integration**: `@google/generative-ai`
- **UI & Styling**: Custom CSS, [Lucide React](https://lucide.dev/) for icons, [Framer Motion](https://www.framer.com/motion/) for animations
- **Email Service**: `nodemailer` for communications

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js and npm installed on your machine.

### Installation

1. **Clone the repository** (if not already cloned)
   ```bash
   git clone <repository-url>
   cd sharevit-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env.local` file in the root directory and add the necessary Firebase and Google Gemini API credentials.
   ```env
   # Example environment variables
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application in action.

## 📁 Project Structure

- `src/app/`: Next.js App Router pages and API routes.
- `src/components/`: Reusable React components (UI elements, layout, etc.).
- `src/context/`: React Context providers (Auth, Toast, Gamification).
- `src/lib/`: Helper functions, Firebase initialization, and utility scripts.
- `public/`: Static assets like images and fonts.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
