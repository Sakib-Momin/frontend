# AI Resume Fraud Intelligence & ATS Scorer 🚀

An industrial-grade, full-stack application designed to analyze resumes, detect fabricated experience, and score ATS compatibility. Built with React, Python/Flask, and Firebase.

## 🌟 Features
* **24-Module Fraud Detection:** Uses NLP (SpaCy) to detect overlapping dates, skill stuffing, ghost companies, and AI-generated buzzwords.
* **ATS Scoring Engine:** Evaluates resumes across 10 dimensions (impact, formatting, keywords) to generate an enterprise-grade score.
* **Secure Authentication:** User and Admin login systems powered by Google Firebase.
* **Modern UI:** Responsive, accessible, and beautiful interface built with Tailwind CSS and Lucide Icons.

## 🛠️ Tech Stack
* **Frontend:** React.js, Tailwind CSS
* **Backend:** Python, Flask, PyPDF2, SpaCy (NLP)
* **Database & Auth:** Google Firebase (Firestore & Authentication)

## 💻 Running the Project Locally

Follow these steps to get the project running on your own machine.

### Prerequisites
* Node.js (v16 or higher)
* Python (3.8 or higher)
* A Firebase Project (for Auth and Firestore)

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
\`\`\`

### 2. Frontend Setup (React)
Open a terminal and navigate to the frontend directory (if separated) or root:
\`\`\`bash
# Install dependencies
npm install

# Create a .env file and add your Firebase credentials
# REACT_APP_FIREBASE_API_KEY=your_key
# REACT_APP_FIREBASE_PROJECT_ID=your_id

# Start the development server
npm start
\`\`\`

### 3. Backend Setup (Python/Flask)
Open a new, second terminal and navigate to your backend folder (e.g., `ai-engine`):
\`\`\`bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Download the required SpaCy NLP English model
python -m spacy download en_core_web_sm

# Start the Flask server
python app.py
\`\`\`
*The Flask server should now be running on `http://localhost:5000`.*

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).