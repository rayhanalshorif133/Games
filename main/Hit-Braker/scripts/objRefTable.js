const C3 = self.C3;
self.C3_GetObjectRefTable = function () {
	return [
		C3.Plugins.Sprite,
		C3.Plugins.Tilemap
	];
};
self.C3_JsPropNameTable = [
	{spr_bg_color: 0},
	{tileBG: 0}
];

self.InstanceType = {
	spr_bg_color: class extends self.ISpriteInstance {},
	tileBG: class extends self.ITilemapInstance {}
}