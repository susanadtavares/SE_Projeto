// simples, guarda tudo em memória
let last = null;
let history = [];

export function saveReading(data) {
  // data expected: { temp, hum, aqi, fire, ts }
  
  // Add timestamp if missing
  if (!data.ts) data.ts = new Date();

  history.push(data);
  if (history.length > 1000) history.shift();

  // Logic for fire detection
  // Check last 5 readings for fire === 1 (assuming fire is sent as number 1 or 0)
  // "a partir de 5 uns diz que tem perigo de fogo"
  let fireDanger = false;
  
  // We need at least 5 readings to determine danger based on the rule
  if (history.length >= 5) {
    const last5 = history.slice(-5);
    // Check if all 5 have fire == 1
    // We use loose equality or ensure type consistency. Assuming JSON number.
    const allFire = last5.every(r => Number(r.fire) === 1);
    if (allFire) {
      fireDanger = true;
    }
  }
  
  // Update last reading with the calculated danger status
  // Merge with existing 'last' to preserve data from other sensors if this is a partial update
  last = { ...(last || {}), ...data, fireDanger };
}

export function getLast(req, res) {
  if (!last) return res.status(204).send();
  res.json(last);
}

export function getHistory(req, res) {
  res.json(history);
}
