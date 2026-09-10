const C3 = self.C3;
self.C3_GetObjectRefTable = function () {
	return [
		C3.Plugins.Sprite,
		C3.Behaviors.Bullet,
		C3.Behaviors.scrollto,
		C3.Plugins.Touch,
		C3.Plugins.System.Cnds.OnLayoutStart,
		C3.Behaviors.Bullet.Acts.SetAngleOfMotion,
		C3.Plugins.Touch.Cnds.OnTouchStart,
		C3.Behaviors.Bullet.Exps.AngleOfMotion
	];
};
self.C3_JsPropNameTable = [
	{Bullet: 0},
	{ScrollTo: 0},
	{spr_player: 0},
	{spr_wall: 0},
	{spr_no_access: 0},
	{Touch: 0}
];

self.InstanceType = {
	spr_player: class extends self.ISpriteInstance {},
	spr_wall: class extends self.ISpriteInstance {},
	spr_no_access: class extends self.ISpriteInstance {},
	Touch: class extends self.IInstance {}
}