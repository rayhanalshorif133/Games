const C3 = self.C3;
self.C3_GetObjectRefTable = function () {
	return [
		C3.Plugins.Sprite
	];
};
self.C3_JsPropNameTable = [
	{spr_obj: 0},
	{spr_player: 0},
	{spr: 0},
	{bg: 0}
];

self.InstanceType = {
	spr_obj: class extends self.ISpriteInstance {},
	spr_player: class extends self.ISpriteInstance {},
	spr: class extends self.ISpriteInstance {},
	bg: class extends self.ISpriteInstance {}
}