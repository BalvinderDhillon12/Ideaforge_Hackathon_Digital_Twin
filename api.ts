
let BASE_URL = "https://<YOUR_NGROK_URL>"; // Can be updated via UI

export const setBaseUrl = (url: string) => {
  // Remove trailing slash if present
  BASE_URL = url.replace(/\/$/, "");
  console.log("API Base URL set to:", BASE_URL);
};

export async function fetchRadiomics(file: File) {
  const form = new FormData();
  form.append("file", file);

  try {
    const res = await fetch(`${BASE_URL}/radiomics`, {
      method: "POST",
      body: form
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Radiomics fetch failed: ${res.status} ${errorText}`);
    }
    return await res.json();
  } catch (err) {
    console.error("API Error (Radiomics):", err);
    throw err;
  }
}

export async function fetchPolicy(radiomicsVector: number[]) {
  try {
    const res = await fetch(`${BASE_URL}/policy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: radiomicsVector })
    });

    if (!res.ok) {
        throw new Error(`Policy fetch failed: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("API Error (Policy):", err);
    throw err;
  }
}

export async function fetchSimulation(treatmentName: string, radiomicsVector: number[]) {
  try {
    const res = await fetch(`${BASE_URL}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        treatment: treatmentName,
        state: radiomicsVector
      })
    });

    if (!res.ok) {
        throw new Error(`Simulation fetch failed: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("API Error (Simulation):", err);
    throw err;
  }
}
