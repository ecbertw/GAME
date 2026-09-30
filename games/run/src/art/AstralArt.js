import { platformSvg, shardSvg, checkpointSvg, breakableSvg, spikesSvg } from './AstralPrimitives.js';
import { bounceSvg, speedSvg, finishSvg, chestSvg, relicSvg, archSvg, waterfallSvg, clusterSvg } from './AstralObjects.js';
import { skySvg, farSvg, midSvg, foregroundSvg } from './AstralBackdrop.js';

const dataUri = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/\n+/g,' ').replace(/\s{2,}/g,' ').trim());

export const ASTRAL_KEYS = Object.freeze({
  sky:'run-astral-sky', far:'run-astral-far', mid:'run-astral-mid', foreground:'run-astral-foreground',
  platformLarge:'run-platform-large', platformMedium:'run-platform-medium', platformSmall:'run-platform-small', movingPlatform:'run-platform-moving',
  shard:'run-shard', checkpointOff:'run-checkpoint-off', checkpointOn:'run-checkpoint-on', breakable:'run-breakable', spikes:'run-spikes',
  bounce:'run-bounce', speed:'run-speed', finish:'run-finish', chestClosed:'run-chest-closed', chestOpen:'run-chest-open', relic:'run-relic',
  arch:'run-arch', waterfall:'run-waterfall', crystalCluster:'run-crystal-cluster'
});

export function preloadAstralArt(scene){
  const assets = [
    [ASTRAL_KEYS.sky,skySvg()],[ASTRAL_KEYS.far,farSvg()],[ASTRAL_KEYS.mid,midSvg()],[ASTRAL_KEYS.foreground,foregroundSvg()],
    [ASTRAL_KEYS.platformLarge,platformSvg(860,300,false,false)],[ASTRAL_KEYS.platformMedium,platformSvg(620,260,false,false)],
    [ASTRAL_KEYS.platformSmall,platformSvg(390,235,false,true)],[ASTRAL_KEYS.movingPlatform,platformSvg(580,260,true,false)],
    [ASTRAL_KEYS.shard,shardSvg()],[ASTRAL_KEYS.checkpointOff,checkpointSvg(false)],[ASTRAL_KEYS.checkpointOn,checkpointSvg(true)],
    [ASTRAL_KEYS.breakable,breakableSvg()],[ASTRAL_KEYS.spikes,spikesSvg()],[ASTRAL_KEYS.bounce,bounceSvg()],[ASTRAL_KEYS.speed,speedSvg()],
    [ASTRAL_KEYS.finish,finishSvg()],[ASTRAL_KEYS.chestClosed,chestSvg(false)],[ASTRAL_KEYS.chestOpen,chestSvg(true)],[ASTRAL_KEYS.relic,relicSvg()],
    [ASTRAL_KEYS.arch,archSvg()],[ASTRAL_KEYS.waterfall,waterfallSvg()],[ASTRAL_KEYS.crystalCluster,clusterSvg()]
  ];
  for(const [key,svg] of assets) scene.load.svg(key,dataUri(svg));
}
