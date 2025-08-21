import admin from 'firebase-admin';
import 'dotenv/config';

var serviceAccount = require("./ava-cursos-fdbbb-firebase-adminsdk-fbsvc-e9b86042ff.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export default admin;