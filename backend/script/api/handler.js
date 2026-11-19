import fs from 'fs';
import crypto from 'crypto';

import { loginApi } from "./script/login.js";
import { registerApi } from "./script/register.js";
import { createServerApi } from "./script/createServer.js";
import { selectServerApi } from "./script/selectServer.js";
import { mainApi } from "./script/main.js";

export function setupApi(app) {
  app.get('/', (req, res) => {
    res.send("API Server is running!");
  });
  
  app.get('/api/main', (req, res) => {
    mainApi(req, res, fs);
  });
  
  app.get('/api/selectServer', (req, res) => {
    selectServerApi(req, res, fs)
  });
  
  app.post('/api/login', (req, res) => {
    loginApi(req, res, fs);
  });
  
  app.post('/api/register', (req, res) => {
    registerApi(req, res, fs, crypto);
  });
  
  app.post('/api/createServer', (req, res) => {
    createServerApi(req, res, fs);
  });

  console.log("All apis have been loaded")
}