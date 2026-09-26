'use strict';
const crypto=require('node:crypto');

async function initDb(db){
 await db.query(`CREATE TABLE IF NOT EXISTS player_progress(player_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,total_exp INTEGER NOT NULL DEFAULT 0,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
 await db.query(`CREATE TABLE IF NOT EXISTS progress_events(id UUID PRIMARY KEY,player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,game VARCHAR(12) NOT NULL,run_id UUID NOT NULL,exp INTEGER NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),UNIQUE(game,run_id))`);
 await db.query(`CREATE TABLE IF NOT EXISTS player_badges(player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,badge VARCHAR(32) NOT NULL,awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(player_id,badge))`);
 await db.query(`INSERT INTO player_progress(player_id) SELECT id FROM players ON CONFLICT DO NOTHING`);
 await db.query(`INSERT INTO player_badges(player_id,badge) SELECT id,'first-100' FROM players ORDER BY created_at,id LIMIT 100 ON CONFLICT DO NOTHING`);
}

const levelFrom=xp=>Math.max(1,Math.floor(Math.sqrt(Math.max(0,Number(xp)||0)/100))+1);
const levelStart=level=>Math.pow(Math.max(0,level-1),2)*100;
const levelEnd=level=>Math.pow(level,2)*100;

async function award(db,playerId,game,runId,score){
 const points=Math.max(5,Math.min(50,10+(game==='jump'?Math.floor(Number(score||0)/12)*2:Math.floor(Number(score||0)*2))));
 const event=await db.query(`INSERT INTO progress_events(id,player_id,game,run_id,exp) VALUES($1,$2,$3,$4,$5) ON CONFLICT(game,run_id) DO NOTHING RETURNING exp`,[crypto.randomUUID(),playerId,game,runId,points]);
 if(!event.rowCount)return profile(db,{id:playerId});
 await db.query(`INSERT INTO player_progress(player_id,total_exp) VALUES($1,$2) ON CONFLICT(player_id) DO UPDATE SET total_exp=player_progress.total_exp+EXCLUDED.total_exp,updated_at=NOW()`,[playerId,points]);
 if(game==='jump'&&Number(score)>=120)await db.query(`INSERT INTO player_badges(player_id,badge) VALUES($1,'skybound') ON CONFLICT DO NOTHING`,[playerId]);
 if(game==='pulse'&&Number(score)>=10)await db.query(`INSERT INTO player_badges(player_id,badge) VALUES($1,'pulse-10') ON CONFLICT DO NOTHING`,[playerId]);
 const games=await db.query('SELECT COUNT(DISTINCT game)::int AS count FROM progress_events WHERE player_id=$1',[playerId]);
 if(Number(games.rows[0]?.count)>=2)await db.query(`INSERT INTO player_badges(player_id,badge) VALUES($1,'explorer') ON CONFLICT DO NOTHING`,[playerId]);
 return profile(db,{id:playerId});
}

async function profile(db,player){
 await db.query(`INSERT INTO player_badges(player_id,badge) SELECT id,'first-100' FROM (SELECT id FROM players ORDER BY created_at,id LIMIT 100) pioneers WHERE id=$1 ON CONFLICT DO NOTHING`,[player.id]);
 const [progress,badges]=await Promise.all([
  db.query('SELECT total_exp AS "totalExp" FROM player_progress WHERE player_id=$1',[player.id]),
  db.query('SELECT badge,awarded_at AS "awardedAt" FROM player_badges WHERE player_id=$1 ORDER BY awarded_at,badge',[player.id])
 ]);
 const totalExp=Number(progress.rows[0]?.totalExp||0),level=levelFrom(totalExp),start=levelStart(level),end=levelEnd(level);
 return{ok:true,totalExp,level,levelExp:totalExp-start,nextLevelExp:end-start,badges:badges.rows};
}

module.exports={initDb,award,profile,levelFrom};
