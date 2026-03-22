import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function test() {
  try {
    const q = query(collection(db, 'users'), limit(1));
    const snapshot = await getDocs(q);
    console.log('Success! Found', snapshot.size, 'users.');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

test();
