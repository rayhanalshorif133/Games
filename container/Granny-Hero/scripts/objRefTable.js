const C3 = self.C3;
self.C3_GetObjectRefTable = function () {
	return [
		C3.Plugins.Sprite,
		C3.Behaviors.Tween,
		C3.Behaviors.Rotate,
		C3.Behaviors.Orbit,
		C3.Behaviors.MoveTo,
		C3.Behaviors.destroy,
		C3.Plugins.Touch,
		C3.Behaviors.Pin,
		C3.Behaviors.Flash,
		C3.Plugins.System.Cnds.OnLayoutStart,
		C3.Behaviors.Rotate.Acts.SetSpeed,
		C3.Plugins.System.Cnds.For,
		C3.Plugins.Sprite.Acts.Spawn,
		C3.Plugins.System.Exps.loopindex,
		C3.Behaviors.Pin.Acts.PinByProperties,
		C3.Plugins.Touch.Cnds.OnTouchStart,
		C3.Plugins.System.Acts.SetVar,
		C3.Plugins.Sprite.Exps.X,
		C3.Plugins.Sprite.Exps.Y,
		C3.Behaviors.Orbit.Acts.SetEnabled,
		C3.Behaviors.MoveTo.Acts.SetEnabled,
		C3.Behaviors.MoveTo.Acts.SetMaxSpeed,
		C3.Behaviors.MoveTo.Acts.MoveToPosition,
		C3.Plugins.Sprite.Cnds.OnCollision,
		C3.Plugins.Sprite.Acts.Destroy,
		C3.Behaviors.Flash.Acts.Flash,
		C3.Plugins.System.Acts.Wait,
		C3.Plugins.Sprite.Cnds.OnDestroyed,
		C3.Plugins.System.Acts.CreateObject
	];
};
self.C3_JsPropNameTable = [
	{spr_bg: 0},
	{spr_demo: 0},
	{Tween: 0},
	{spr_grandma_head: 0},
	{Rotate: 0},
	{Orbit: 0},
	{MoveTo: 0},
	{DestroyOutside: 0},
	{spr_fry_pan: 0},
	{spr_grandma_eye_left: 0},
	{Touch: 0},
	{spr_moving_target: 0},
	{spr_rat_circle: 0},
	{spr_terget_node: 0},
	{Pin: 0},
	{Flash: 0},
	{spr_enemy: 0},
	{Start_X: 0},
	{Start_Y: 0}
];

self.InstanceType = {
	spr_bg: class extends self.ISpriteInstance {},
	spr_demo: class extends self.ISpriteInstance {},
	spr_grandma_head: class extends self.ISpriteInstance {},
	spr_fry_pan: class extends self.ISpriteInstance {},
	spr_grandma_eye_left: class extends self.ISpriteInstance {},
	Touch: class extends self.IInstance {},
	spr_moving_target: class extends self.ISpriteInstance {},
	spr_rat_circle: class extends self.ISpriteInstance {},
	spr_terget_node: class extends self.ISpriteInstance {},
	spr_enemy: class extends self.ISpriteInstance {}
}