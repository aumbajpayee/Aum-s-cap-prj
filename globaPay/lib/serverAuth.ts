// lib/serverAuth.ts
import { createSessionClient } from "./appwrite.server";

export async function requireUserId() {
  const { account } = await createSessionClient(); // <-- await & destructure
  const me = await account.get();                  // works now
  return me.$id;
}
