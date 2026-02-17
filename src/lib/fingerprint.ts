const STORAGE_KEY = "poll_voter_fingerprint";

export function getVoterFingerprint(): string {
   let fp = localStorage.getItem(STORAGE_KEY);
   if (!fp) {
      fp = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, fp);
   }
   if (!document.cookie.includes("poll_fp=")) {
      document.cookie = `poll_fp=${fp}; path=/; max-age=31536000; SameSite=Lax`;
   }
   return fp;
}

export function getCookieFingerprint(): string | null {
   const match = document.cookie.match(/poll_fp=([^;]+)/);
   return match ? match[1] : null;
}

export function getEffectiveFingerprint(): string {
   const cookieFp = getCookieFingerprint();
   const storageFp = localStorage.getItem(STORAGE_KEY);

   if (cookieFp) {
      if (!storageFp) localStorage.setItem(STORAGE_KEY, cookieFp);
      return cookieFp;
   }

   return getVoterFingerprint();
}
