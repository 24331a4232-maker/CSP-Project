import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const users = await getDocs(collection(db, "users"));
  console.log("--- USERS ---");
  users.forEach(d => console.log(d.id, d.data()));
  
  const profiles = await getDocs(collection(db, "profiles"));
  console.log("--- PROFILES ---");
  profiles.forEach(d => console.log(d.id, d.data()));
}
check().catch(console.error);
