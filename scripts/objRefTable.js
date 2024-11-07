const C3 = self.C3;
self.C3_GetObjectRefTable = function () {
	return [
		C3.Plugins.Sprite,
		C3.Behaviors.destroy,
		C3.Behaviors.Bullet,
		C3.Behaviors.Turret,
		C3.Behaviors.Pin,
		C3.Plugins.Tilemap,
		C3.Plugins.Touch,
		C3.Plugins.System.Cnds.IsGroupActive,
		C3.Plugins.System.Cnds.Every,
		C3.Plugins.Sprite.Acts.Spawn,
		C3.Plugins.System.Cnds.EveryTick,
		C3.Plugins.Sprite.Acts.MoveForward,
		C3.Plugins.Sprite.Cnds.OnCollision,
		C3.Plugins.Sprite.Acts.SetAngle,
		C3.Plugins.Sprite.Cnds.CompareInstanceVar,
		C3.Plugins.Sprite.Acts.Destroy,
		C3.Plugins.System.Cnds.OnLayoutStart,
		C3.Behaviors.Turret.Acts.AddTarget,
		C3.Plugins.Touch.Cnds.OnTouchObject,
		C3.Plugins.System.Acts.CreateObject,
		C3.Plugins.Sprite.Exps.X,
		C3.Plugins.Sprite.Exps.Y,
		C3.Behaviors.Turret.Cnds.OnShoot,
		C3.Plugins.Sprite.Acts.SubInstanceVar,
		C3.Behaviors.Bullet.Cnds.CompareTravelled
	];
};
self.C3_JsPropNameTable = [
	{DestroyOutsideLayout: 0},
	{Bullet: 0},
	{Arrow_1: 0},
	{torrent: 0},
	{Turret: 0},
	{Pin: 0},
	{torrent_1: 0},
	{bg: 0},
	{EnemySpawner: 0},
	{health: 0},
	{Enemy_1: 0},
	{driection: 0},
	{change_direction: 0},
	{new_build: 0},
	{Touch: 0}
];

self.InstanceType = {
	Arrow_1: class extends self.ISpriteInstance {},
	torrent: class extends self.ISpriteInstance {},
	torrent_1: class extends self.ISpriteInstance {},
	bg: class extends self.ITilemapInstance {},
	EnemySpawner: class extends self.ISpriteInstance {},
	Enemy_1: class extends self.ISpriteInstance {},
	change_direction: class extends self.ISpriteInstance {},
	new_build: class extends self.ISpriteInstance {},
	Touch: class extends self.IInstance {}
}