# 🎥 QR Code Video Streaming Backend

This project is a **Node.js + Express + Sequelize** backend for managing **QR codes linked to videos**, tracking views, and streaming media content efficiently.

It supports:

- QR code generation for videos
- Video streaming with HTTP range support
- View counting per QR code
- User-based QR limits
- Secure authentication using JWT

---

## 🚀 Tech Stack

- **Node.js**
- **Express.js**
- **Sequelize ORM**
- **MySQL**
- **JWT Authentication**
- **File streaming (fs + range requests)**

---

## 📦 Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

🔐 Environment Variables (.env)

This project requires a .env file to run properly.

📄 Create .env file

Create a file named .env in the root directory of the project.

Add the following environment variables:

DB_USER=root

# 🎥 QR Code Video Streaming Backend

This project is a **Node.js + Express + Sequelize** backend for managing **QR codes linked to videos**, tracking views, and streaming media content efficiently.

It supports:

- QR code generation for videos
- Video streaming with HTTP range support
- View counting per QR code
- User-based QR limits
- Secure authentication using JWT

---

## 🚀 Tech Stack

- **Node.js**
- **Express.js**
- **Sequelize ORM**
- **MySQL**
- **JWT Authentication**
- **File streaming (fs + range requests)**

---

## 📦 Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 🔐 Environment Variables (.env)

Create a file named .env in the root directory of the project with:

```env
DB_USER=root
DB_PASSWORD=Password
DB_NAME=qr_code_db
DB_HOST=localhost
DB_DIALECT=mysql

JWT_SECRET=asdadsds1231332131sadsa
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Database setup & migrations

```bash
npx sequelize db:create
npx sequelize db:migrate
npx sequelize db:seed:all
```

### 4️⃣ Start the server

```bash
npm start
```
