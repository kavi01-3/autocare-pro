# AutoCare Pro – Vehicle Service Booking System

## 🚀 Overview
Welcome to the **AutoCare Pro** project. This is a full-stack web application designed for vehicle owners and service center administrators to manage bookings, track service history, and update vehicle records digitally.

---

## 🏗️ Technology Stack
- **Frontend**: HTML5, Vanilla CSS, Javascript
- **Backend**: Python (FastAPI)
- **Database**: SQLite (SQLModel ORM)
- **Security**: Password hashing with `bcrypt`

---
# Structire of the project folder
1. Project folder
2. add the index.html inside the project folder
3. create a new folders within the project folder for backend,css,js.
4. copy the js files in the js folder
5. copy the css file in the css folder
6. copy the python files ,database.db and requirements.txt in the backend folder
7. create a new folder within the backend folder and rename it as __pycache__.
8. copy the rest of the file in the  __pycache__ folder.

## 🛠️ How to Run locally

### 1. Prerequisites
- **Python 3.10+**
- **VS Code**

### 2. Setup the Backend
1. Open the project folder in VS Code.
2. Open a new terminal (`Ctrl + ~`).
3. Navigate to the backend directory:
   ```bash
   cd backend
   ```
4. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
5. Start the FastAPI server:
   ```bash
   python main.py
   ```
   *The backend will be running at `http://localhost:8000`.*

### 3. Run the Frontend
1. Keep the backend terminal running.
2. Open `index.html` in your browser.
   - **Pro Tip**: Use the **"Live Server"** extension in VS Code for a better experience!

---

## 🔑 Demo Credentials

### 🚗 Vehicle Owner
- **Email**: `owner@demo.com`
- **Password**: `demo123`
*(Can also use the 'Vehicle Owner' demo button on the login screen).*

### 🛠️ Service Admin
- **Email**: `admin@demo.com`
- **Password**: `demo123`
*(Can also use the 'Admin' demo button on the login screen).*

---

## 📁 Project Structure
- `backend/`: FastAPI source code, database models, and seeding logic.
- `css/`: Modern, responsive styling for the dashboard and components.
- `js/`: Application logic (`app.js`), API client (`api.js`), and helpers (`data.js`).
- `index.html`: The main entry point for the application.

---

**Happy Coding!** 🔧🚗💨
