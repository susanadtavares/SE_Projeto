// simples, guarda tudo em memória
let last = null;
let history = [];

export function saveReading(data) {
  last = data;
  history.push(data);

  // impedir que o histórico cresça demais
  if (history.length > 1000) history.shift();
}

export function getLast(req, res) {
  if (!last) return res.status(204).send();
  res.json(last);
}

export function getHistory(req, res) {
  res.json(history);
}
