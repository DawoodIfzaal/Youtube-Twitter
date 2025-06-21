# YouTube Clone Backend

A robust backend for a YouTube-like platform, built with Node.js, Express, and MongoDB. This project supports full user functionality, video uploads, likes/dislikes, comments, playlists, subscriptions, and tweet-style posts.

## Features
🔐 User authentication with JWT

📦 Video upload & streaming with Cloudinary

❤️ Like/Dislike support for videos, comments, and tweets

💬 Comments system for videos

📂 Playlist creation & management

🐦 Tweet-like user posts

🔔 Subscribe/Unsubscribe to users (channels)

🔍 Search, sort, pagination support for videos

📊 Channel statistics (views, subscribers, likes)

## 🛠️ Tech Stack

1. Node.js, Express.js

2. MongoDB, Mongoose

3. Cloudinary, Multer

4. JWT, bcrypt.js

5. dotenv, cookie-parser, cors

## Project Structure

src/

├── controllers     
├── models    
├── routes             
├── middlewares      
├── utils   
├── config

## Installation

### 1. Clone the repository
git clone https://github.com/DawoodIfzaal/Youtube-Clone.git   
cd Youtube-Clone

### 2. Install dependencies
npm install

### 3. Set environment variables
cp .env.example .env

### 4. Start development server
npm run dev

## 🔐 Environment Variables

### Create a .env file in the root folder and add:

PORT=3000   
MONGODB_URL=your_mongo_uri  
CORS_ORIGIN=*   
ACCESS_TOKEN_SECRET = your_access_token_secret
ACCESS_TOKEN_EXPIRY = 1d   
REFRESH_TOKEN_SECRET = your_refresh_token_secret
REFRESH_TOKEN_EXPIRY = 2d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

## License

This project is open-source and available under the MIT License.