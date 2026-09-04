const C3 = self.C3;
self.C3_GetObjectRefTable = function () {
	return [
		C3.Plugins.Sprite,
		C3.Behaviors.Pin,
		C3.Behaviors.Tween,
		C3.Behaviors.Platform,
		C3.Behaviors.Rotate,
		C3.Behaviors.solid,
		C3.Behaviors.destroy,
		C3.Plugins.Touch,
		C3.Plugins.System.Cnds.OnLayoutStart,
		C3.Plugins.Sprite.Acts.Spawn,
		C3.Plugins.Touch.Cnds.OnTouchStart,
		C3.Behaviors.Tween.Acts.TweenTwoProperties,
		C3.Plugins.Sprite.Exps.Y,
		C3.Plugins.Sprite.Cnds.OnCollision,
		C3.Plugins.System.Acts.SetVar,
		C3.Plugins.System.Exps.random,
		C3.Plugins.Sprite.Cnds.CompareY,
		C3.Plugins.Sprite.Acts.SetY,
		C3.Plugins.Sprite.Exps.Height,
		C3.Behaviors.Pin.Acts.PinByProperties,
		C3.Plugins.Sprite.Acts.Destroy,
		C3.Plugins.System.Cnds.PickAll,
		C3.Plugins.System.Acts.Wait,
		C3.Plugins.Sprite.Exps.X
	];
};
self.C3_JsPropNameTable = [
	{spr_arrow_spwn_node: 0},
	{spr_stick_spawnr: 0},
	{Pin: 0},
	{spr_arrow_collision: 0},
	{spr_ui: 0},
	{Tween: 0},
	{Platform: 0},
	{Rotate: 0},
	{spr_ball: 0},
	{Solid: 0},
	{DestroyOutside: 0},
	{spr_arrow: 0},
	{spr_land: 0},
	{Touch: 0},
	{spr_stick: 0},
	{spr_arrow_dummy: 0},
	{UP_BALL_COUNT: 0}
];

self.InstanceType = {
	spr_arrow_spwn_node: class extends self.ISpriteInstance {},
	spr_stick_spawnr: class extends self.ISpriteInstance {},
	spr_arrow_collision: class extends self.ISpriteInstance {},
	spr_ui: class extends self.ISpriteInstance {},
	spr_ball: class extends self.ISpriteInstance {},
	spr_arrow: class extends self.ISpriteInstance {},
	spr_land: class extends self.ISpriteInstance {},
	Touch: class extends self.IInstance {},
	spr_stick: class extends self.ISpriteInstance {},
	spr_arrow_dummy: class extends self.ISpriteInstance {}
}