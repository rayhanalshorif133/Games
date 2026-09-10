const C3 = self.C3;
self.C3_GetObjectRefTable = function () {
	return [
		C3.Plugins.Sprite
	];
};
self.C3_JsPropNameTable = [
	{spr_demo: 0},
	{spr_full_assets: 0}
];

self.InstanceType = {
	spr_demo: class extends self.ISpriteInstance {},
	spr_full_assets: class extends self.ISpriteInstance {}
}