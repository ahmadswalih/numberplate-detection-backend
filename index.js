const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const cors = require("cors");
const aichatRoute = require("./routes/openai");

const app = express();
const port = 4000 || process.env.PORT;

app.use(express.json());

// Use middleware to parse URL-encoded bodies (if necessary)
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "*",
    methods: ["POST", "GET", "PUT", "DELETE", "PATCH"],
  })
);

app.get("/", (req, res) => {
  res.send("Hello World");
});

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage });

// Dummy user data associated with verified numbers
const userData = {
  "94ABCO": {
    name: "John Doe",
    email: "johndoe@example.com",
    phone: "123-456-7890",
  },
  // Add more user data as needed
};

app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No video file uploaded.");
  }

  const videoPath = req.file.path;
  const duration = parseInt(req.body.duration, 10) || 10; // Default to 10 if duration is not provided

  ffmpeg.ffprobe(videoPath, (err, metadata) => {
    if (err) {
      console.error("Error getting video metadata:", err);
      return res.status(500).send("Error getting video metadata.");
    }

    const videoDuration = metadata.format.duration;
    const frameCount = Math.min(duration, videoDuration); // Ensure we don't request more frames than the video duration
    const width = metadata.streams[0].width;
    const height = metadata.streams[0].height;
    ffmpeg(videoPath)
      .on("end", function () {
        console.log("Frames extraction completed.");
        // Process the extracted frames
        processFrames(res);
      })
      .on("error", function (err) {
        console.error("Error extracting frames:", err);
        res.status(500).send("Error extracting frames.");
      })
      .screenshots({
        count: frameCount,
        folder: "uploads/",
        filename: "frame-at-%s-seconds.png",
        size: `${width}x${height}`,
      });
  });
});

function processFrames(res) {
  const frames = fs
    .readdirSync("uploads/")
    .filter((file) => file.startsWith("frame-"));
  const promises = [];
  const verifiedNumbers = Object.keys(userData);

  frames.forEach((frame) => {
    const framePath = `uploads/${frame}`;
    console.log(`Processing frame: ${framePath}`);

    const formData = new FormData();
    formData.append("image", fs.createReadStream(framePath));
    formData.append("country", "us");

    const headers = {
      ...formData.getHeaders(),
      Accept: "application/json",
      "x-rapidapi-ua": "RapidAPI-Playground",
      "x-rapidapi-key": process.env.RAPIDAPI_KEY,
      "x-rapidapi-host": "openalpr.p.rapidapi.com",
    };

    // Send each frame to OpenALPR API for processing
    promises.push(
      axios.post(
        "https://openalpr.p.rapidapi.com/recognize?country=us",
        formData,
        { headers }
      )
    );
  });

  // Wait for all API requests to finish
  Promise.all(promises)
    .then((responses) => {
      const results = responses
        .map((response, index) => {
          const plateResult = response.data.results[0]; // Assuming the first result is the most relevant
          if (!plateResult) return null; // Skip if no plate result

          const plate = plateResult.plate;
          let authenticationStatus = "New Visitor";
          let userAssociatedData = null;

          if (verifiedNumbers.includes(plate)) {
            authenticationStatus = "Verified";
            userAssociatedData = userData[plate];
          }

          return {
            //frame: frames[index],
            plate: plate,
            //confidence: plateResult.confidence,
            authentication: authenticationStatus,
            user: userAssociatedData,
          };
        })
        .filter((result) => result !== null); // Filter out results with no plate

      res.json(results);
      // Clean up uploaded files after processing
      cleanUpFiles();
    })
    .catch((error) => {
      console.error("Error processing frames:", error);
      res.status(500).send("Error processing frames.");
      // Clean up uploaded files after processing
      cleanUpFiles();
    });
}

function cleanUpFiles() {
  // Delete uploaded files after processing
  const files = fs.readdirSync("uploads/");
  files.forEach((file) => {
    fs.unlinkSync(`uploads/${file}`);
  });
}

app.use("/openai", aichatRoute);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
