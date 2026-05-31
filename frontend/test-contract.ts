import { config } from "dotenv";
config({ path: ".env.local" });
import { initializeContract } from "./lib/contract";

(async () => {
  try {
    const xdr = await initializeContract("GD67H7VBW22JJ5T3WGSQBUOJVEOLD6WARKXAYZ23NRNDXTUM7ARZGOKP");
    console.log("XDR generated:", xdr);
  } catch (e) {
    console.error("Test error:", e);
  }
})();
