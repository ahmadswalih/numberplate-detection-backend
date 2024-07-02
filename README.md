


# Video Processing and License Plate Recognition API

This Node.js backend application provides functionality for video processing, license plate recognition, and AI-powered chat assistance.

## Features

- Video upload and frame extraction
- License plate recognition using OpenALPR API
- User authentication based on recognized license plates
- AI chat assistant using OpenAI API

## Prerequisites

- Node.js (v12 or higher)
- npm (Node Package Manager)
- ffmpeg installed on your system

## Installation

1. Clone the repository:
   ```
   git clone [<repository-url>](https://github.com/ahmadswalih/numberplate-detection-backend)
   ```

2. Navigate to the project directory:
   ```
   cd numberplate-detection-backend
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Create an `uploads` folder in the root directory:
   ```
   mkdir uploads
   ```

5. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
   PORT=4000
   OPENAI_API_KEY=your_openai_api_key
   RAPIDAPI_KEY=your_rapidapi_key
   ```

## Running the Application

Start the server:
```
npm start
```

The server will run on `http://localhost:4000` by default.

## API Endpoints

### 1. Video Upload and Processing
- **POST** `/upload`
  - Upload a video file for frame extraction and license plate recognition
  - Body: `form-data` with `video` file and `duration` (optional)

### 2. AI Chat Assistant
- **GET** `/openai/thread`
  - Create a new chat thread
- **POST** `/openai/chat`
  - Send a message to the AI assistant
  - Body: JSON with `message` and `threadId`

## Configuration

- Adjust the `userData` object in `index.js` to add or modify user data associated with license plates.
- Modify the OpenAI assistant ID in `openai.js` if needed.

## Dependencies

- express
- multer
- axios
- form-data
- fluent-ffmpeg
- cors
- openai

## Notes

- Ensure that you have the necessary API keys for OpenALPR and OpenAI services.
- The application uses file system operations, so make sure the server has appropriate permissions.





