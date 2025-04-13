# JasperAI_legalAI_assistant_-A-
An AI-powered chatbot to assist users in legal queries and document processing, with user-tiered access and secure verification.
# DOJ India AI Legal Assistant (Jasper)
## Project Overview

Jasper is an AI-powered legal assistant designed to provide legal information and guidance to three distinct user categories:
- **Public users**: Basic legal information and guidance
- **Legal professionals**: Advanced legal resources and case management
- **Judiciary members**: Comprehensive legal data and case information

The system operates entirely locally (no external hosting) and features secure, role-based authentication with multi-step verification.

## Features

- AI chatbot for legal information and case guidance
- Document upload and analysis
- Secure, role-based authentication
- Chat history tracking and storage
- Data fallback with external API queries when local data is insufficient

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (vanilla)
- Responsive design for all device sizes

### Backend
- Node.js with Express.js
- MongoDB for database (locally hosted)
- JWT for authentication

### AI/ML
- Transformer model with Retrieval-Augmented Generation (RAG)
- NLP for query intent and entity extraction
- Embedding-based vector search

### External APIs (for fallback data retrieval)
- BlackBox API
- CrimeCheck API
- Google Custom Search API

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local installation)
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/your-repo/jasper-legal-assistant.git
   cd jasper-legal-assistant
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file with the following content:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/jasper-legal-assistant
   JWT_SECRET=your_secret_key
   NODE_ENV=development
   ```

4. Start the development server
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5000`

## Authentication Flow

### Public Users
1. Standard signup with email/phone
2. Email verification via OTP
3. Aadhaar verification

### Legal Professionals
1. Special passkey entry (in confirm password field only)
2. BCI ID and Legal ID verification
3. Hidden ID verification

### Judiciary Members
1. Secret code entry (in password field only)
2. Government ID and Secret Judiciary ID verification
3. Classified ID verification

## Project Structure

The project follows a modular structure with clear separation of concerns:

- `frontend/`: Client-side HTML, CSS, and JavaScript
- `backend/`: Server-side Node.js code
  - `routes/`: API routes
  - `controllers/`: Business logic
  - `models/`: MongoDB schemas
  - `utils/`: Utility functions
- `data/`: Pre-loaded verification data

## Security Considerations

- JWT for secure session management
- Encrypted password storage with bcrypt
- Role-based route guards
- Two-attempt maximum verification logic
- Chat visibility scoped to logged-in user only

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Department of Justice, India
- All contributors to the open-source libraries used in this project
