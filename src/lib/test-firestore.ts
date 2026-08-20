import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function testFirestore() {
  const snapshot = await getDocs(collection(db, "products"));

  console.log(
    "Firestore connected. Documents:",
    snapshot.size
  );
}
