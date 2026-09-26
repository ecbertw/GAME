/* Editable art bounds. Surface rows are physical contacts, not PNG edges. */
(function(root){
'use strict';
root.EixoJumpArtLayout={
 surfaces:{
  forest:{platform:{rect:[162,95,1755,94],surface:105},ground:{rect:[162,116,1755,114],surface:128}},
  city:{platform:{rect:[14,75,1767,114],surface:75},ground:{rect:[14,91,1767,139],surface:91}},
  snow:{platform:{rect:[11,40,1759,107],surface:44},ground:{rect:[11,49,1759,130],surface:54}},
  astral:{platform:{rect:[130,9,1764,119],surface:9},ground:{rect:[130,11,1764,145],surface:11}}
 },
 // All scene anchors are normalized against the background, before cover/camera.
 scenes:{
  forest:{lights:[[.060,.134],[.150,.651],[.123,.823],[.959,.698]],flags:[[.087,.23,.043,.29],[.856,.672,.031,.15]],falls:[[.188,.510,.012,.135],[.31,.573,.012,.155],[.493,.821,.009,.16],[.777,.819,.008,.10]]},
  city:{lights:[[.052,.165],[.017,.372],[.133,.758],[.975,.574],[.947,.788]],flags:[[.072,.285,.039,.235],[.895,.53,.04,.22]],falls:[[.192,.422,.014,.105],[.286,.615,.014,.16],[.38,.722,.014,.13]]},
  snow:{lights:[[.123,.53],[.938,.544]],flags:[[.104,.223,.03,.228],[.938,.224,.033,.238]],falls:[]},
  astral:{lights:[[.138,.146],[.137,.477],[.064,.854],[.988,.193],[.894,.538]],crystals:[[.046,.185],[.135,.643],[.878,.65]],flags:[[.084,.08,.025,.272],[.932,.25,.025,.191]],stars:[[.34,.124],[.358,.184],[.526,.128],[.784,.05],[.756,.314]],falls:[]}
 }
};
})(window);
