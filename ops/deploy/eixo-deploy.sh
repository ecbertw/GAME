#!/usr/bin/env bash
set -euo pipefail
APP="/opt/eixo"

if [ "$(id -u)" -ne 0 ]; then echo "Run with sudo." >&2; exit 1; fi
sudo -u eixo git -C "$APP" config core.fileMode false
PREV="$(sudo -u eixo git -C "$APP" rev-parse HEAD)"
echo "Current: $PREV"

if [ -n "$(sudo -u eixo git -C "$APP" status --porcelain --untracked-files=no)" ]; then
  echo "Tracked local changes exist; refusing deploy." >&2
  sudo -u eixo git -C "$APP" status --short
  exit 1
fi

echo "[1/5] Pull main"
sudo -u eixo git -C "$APP" pull --ff-only origin main
NEW="$(sudo -u eixo git -C "$APP" rev-parse HEAD)"
echo "New: $NEW"

# If the pull updated this deploy script, the currently running Bash process
# still has the old file contents loaded. Re-exec the freshly pulled script
# once so the rest of the deploy always uses the new version.
if [ "$NEW" != "$PREV" ] && [ "${EIXO_DEPLOY_REEXEC:-0}" != "1" ]; then
  echo "Deploy script updated; restarting with the new version..."
  exec env EIXO_DEPLOY_REEXEC=1 bash "$APP/ops/deploy/eixo-deploy.sh"
fi

echo "[2/5] Dependencies"
cd "$APP"
sudo -u eixo npm install --omit=dev --ignore-scripts --package-lock=false

echo "[3/5] Syntax"
for f in server.js auth-server.js server-start.js paypal-server.js paypal-checkout.js ui.js vip-fix.js jump-server.js jump-physics.js jump-worlds.js jump-motion.js jump-rig.js jump-art-layout.js jump-scenery.js jump-exact-renderer.js jump.js pulse-orbit.js pulse-orbit-server.js progression-server.js redesign.js; do node --check "$APP/$f"; done
for f in "$APP"/assets/jump-exact/*.js; do node --check "$f"; done
node --test "$APP"/tests/*.test.js

echo "[4/6] Purge removed RUN data"
ENV_FILE="$(systemctl show eixo.service -p EnvironmentFiles --value 2>/dev/null | awk '{print $1}')"
if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
fi
if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is unavailable; refusing to leave RUN data behind." >&2
  exit 1
fi
sudo -u eixo env DATABASE_URL="$DATABASE_URL" node <<'NODE'
const {Pool}=require('pg');
(async()=>{
  const url=String(process.env.DATABASE_URL||'');
  const pool=new Pool({connectionString:url,ssl:url.includes('localhost')?false:{rejectUnauthorized:false},max:1});
  try{
    await pool.query('BEGIN');
    await pool.query(`
      CREATE TEMP TABLE _removed_game_exp AS
      SELECT player_id, COALESCE(SUM(exp),0)::int AS exp
      FROM progress_events
      WHERE game='run'
      GROUP BY player_id
    `);
    await pool.query(`
      UPDATE player_progress p
      SET total_exp=GREATEST(0,p.total_exp-x.exp),updated_at=NOW()
      FROM _removed_game_exp x
      WHERE p.player_id=x.player_id
    `);
    await pool.query("DELETE FROM progress_events WHERE game='run'");
    await pool.query("UPDATE players SET featured_badge=NULL WHERE featured_badge LIKE 'run-%'");
    await pool.query("DELETE FROM player_badges WHERE badge LIKE 'run-%'");
    await pool.query(`
      DELETE FROM player_badges b
      WHERE b.badge='explorer'
        AND (SELECT COUNT(DISTINCT e.game) FROM progress_events e WHERE e.player_id=b.player_id)<2
    `);
    await pool.query(`
      UPDATE players p
      SET featured_badge=NULL
      WHERE p.featured_badge='explorer'
        AND NOT EXISTS (
          SELECT 1 FROM player_badges b
          WHERE b.player_id=p.id AND b.badge='explorer'
        )
    `);
    await pool.query(`
      DROP TABLE IF EXISTS
        run_astral_daily_scores,
        run_astral_scores_100,
        run_astral_scores,
        run_scores_100,
        run_scores,
        run_daily_progress,
        run_level_progress,
        run_daily_scores,
        run_best_times,
        run_attempts,
        run_vnext_profile
      CASCADE
    `);
    await pool.query('COMMIT');
    console.log('RUN database data removed.');
  }catch(e){
    try{await pool.query('ROLLBACK')}catch(_){}
    console.error(e);
    process.exitCode=1;
  }finally{
    await pool.end();
  }
})();
NODE

echo "[5/6] Restart"
systemctl restart eixo
sleep 3

echo "[6/6] Health and exposure checks"
if ! curl -fsS -H "Host: eixo.at" http://127.0.0.1:3000/health >/tmp/eixo-health; then
  echo "Health failed. Rolling back to $PREV" >&2
  systemctl stop eixo || true
  sudo -u eixo git -C "$APP" reset --hard "$PREV"
  cd "$APP"; sudo -u eixo npm install --omit=dev --ignore-scripts --package-lock=false
  systemctl start eixo
  exit 1
fi
cat /tmp/eixo-health; echo

for p in server.js auth-server.js server-start.js paypal-server.js jump-server.js package.json .git/HEAD .env; do
  code="$(curl -sS -o /dev/null -w "%{http_code}" -H "Host: eixo.at" "http://127.0.0.1:3000/$p")"
  if [ "$code" != "404" ]; then
    echo "SECURITY CHECK FAILED: /$p returned $code" >&2
    exit 1
  fi
done

systemctl is-active --quiet eixo
echo "Deploy OK: $NEW"
