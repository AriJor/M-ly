import express from 'express';
import cors from 'cors';
import fs from 'fs';
import crypto from 'crypto';

import { mainApi } from "./backend/script/main.js";
import { loginApi } from "./backend/script/login.js";
import { registerApi } from "./backend/script/register.js";
import { createServerApi } from "./backend/script/createServer.js";

// Setup
const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send("API Server is running!");
});

app.post('/api/login', (req, res) => {
  loginApi(req, res, fs, crypto);
});

app.post('/api/register', (req, res) => {
  registerApi(req, res, fs, crypto);
});

app.get('/api/main', (req, res) => {
  mainApi(req, res, fs, crypto);
});

app.post('/api/createServer', (req, res) => {
  createServerApi(req, res, fs, crypto);
});

// Make sure "server.js" can run
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});