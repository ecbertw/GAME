'use strict';
const Core=require('./run/core/simulation.js');
const Level=require('./run/levels/astral-first-light.js');
async function initDb(db){
  if(!db)return;
  await db.query(`CREATE TABLE IF NOT EXISTS run_vnext_profile(
    player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    best_ms INTEGER,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}
async function start(){return{mode:'movement-lab',engineVersion:Core.VERSION,levelId:Level.id,levelVersion:Level.version}}
async function finish(){throw Object.assign(new Error('RUN competitive submissions are disabled while the new movement foundation is being built.'),{status:409})}
async function rankings(){return{players:[],mode:'movement-lab'}}
async function profile(db,id){
  if(!db||!id)return{bestMs:null,worldRank:null,countryRank:null,mode:'movement-lab'};
  const r=await db.query('SELECT best_ms AS "bestMs" FROM run_vnext_profile WHERE player_id=$1',[id]).catch(()=>({rows:[]}));
  return{bestMs:r.rows[0]?.bestMs??null,worldRank:null,countryRank:null,mode:'movement-lab'};
}
async function daily(){return{enabled:false,mode:'movement-lab'}}
module.exports={initDb,start,finish,rankings,profile,daily};
