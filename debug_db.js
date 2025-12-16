import db from './server/src/db.js';

const recent = db.prepare("SELECT fire, ts FROM readings WHERE fire IS NOT NULL ORDER BY ts DESC LIMIT 20").all();
console.log("Recent 20 fire readings:");
console.table(recent);

const count = recent.filter(r => Number(r.fire) === 1).length;
console.log("Calculated fireCount:", count);
