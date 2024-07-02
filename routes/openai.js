const express = require("express");
const { OpenAI } = require("openai");
require("dotenv").config();

const router = express.Router();

// Set up OpenAI Client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Assistant can be created via API or UI
const assistantId = process.env.AssistantId;
let pollingInterval;

// Set up a Thread
async function createThread() {
  console.log("Creating a new thread...");
  const thread = await openai.beta.threads.create();
  return thread;
}

async function addMessage(threadId, message) {
  console.log("Adding a new message to thread: " + threadId);
  const response = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: message,
  });
  return response;
}

async function runAssistant(threadId) {
  console.log("Running assistant for thread: " + threadId);
  const response = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    // Make sure to not overwrite the original instruction, unless you want to
  });

  console.log(response);

  return response;
}

async function checkingStatus(res, threadId, runId) {
  const runObject = await openai.beta.threads.runs.retrieve(threadId, runId);

  const status = runObject.status;
  console.log(runObject);
  console.log("Current status: " + status);

  if (status == "completed") {
    clearInterval(pollingInterval);

    const messagesList = await openai.beta.threads.messages.list(threadId);
    let messages = [];

    messagesList.body.data.forEach((message) => {
      messages.push(message.content);
    });
    const latestMessage = messages[0][0].text.value;
    console.log(latestMessage);
    res.json({ latestMessage });
  } else if (status == "failed") {
    clearInterval(pollingInterval);
    res.json({ latestMessage: "Failed to run the assistant" });
  }
}

//=========================================================
//============== ROUTE SERVER =============================
//=========================================================

// Open a new thread
router.get("/thread", (req, res) => {
  createThread().then((thread) => {
    res.json({ threadId: thread.id });
  });
});

router.post("/chat", (req, res) => {
  console.log(req.body);
  const { message, threadId } = req.body;

  addMessage(threadId, message).then((message) => {
    // res.json({ messageId: message.id });

    // Run the assistant
    runAssistant(threadId).then((run) => {
      const runId = run.id;

      // Check the status
      pollingInterval = setInterval(() => {
        checkingStatus(res, threadId, runId);
      }, 5000);
    });
  });
});

module.exports = router;
