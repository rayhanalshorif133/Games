const C3 = self.C3;
self.C3_GetObjectRefTable = function () {
	return [
		C3.Plugins.Sprite,
		C3.Behaviors.Pin,
		C3.Behaviors.EightDir,
		C3.Behaviors.Flash,
		C3.Plugins.TiledBg,
		C3.Plugins.Tilemap,
		C3.Behaviors.Fade,
		C3.Plugins.Keyboard,
		C3.Plugins.Touch,
		C3.Plugins.LocalStorage,
		C3.Plugins.Audio,
		C3.Plugins.Text,
		C3.Plugins.System.Cnds.OnLayoutStart,
		C3.Plugins.System.Acts.SetLayerOpacity,
		C3.Plugins.System.Cnds.CompareBoolVar,
		C3.Plugins.System.Acts.SetBoolVar,
		C3.Plugins.Audio.Acts.Play,
		C3.Plugins.Touch.Cnds.OnTapGestureObject,
		C3.Behaviors.Fade.Acts.StartFade,
		C3.Plugins.System.Acts.Wait,
		C3.Plugins.System.Acts.GoToLayout,
		C3.Plugins.Touch.Cnds.OnTapGesture,
		C3.Plugins.Touch.Cnds.OnHoldGesture,
		C3.Plugins.Sprite.Cnds.IsAnimPlaying,
		C3.Plugins.Sprite.Acts.SetInstanceVar,
		C3.Behaviors.EightDir.Acts.SetEnabled,
		C3.Plugins.Sprite.Acts.SetVisible,
		C3.Plugins.Sprite.Acts.MoveToTop,
		C3.Plugins.Sprite.Acts.SetAnim,
		C3.Plugins.System.Acts.SetVar,
		C3.Plugins.System.Acts.ResetEventVar,
		C3.Plugins.System.Cnds.PickByEvaluate,
		C3.Plugins.System.Acts.CreateObject,
		C3.Plugins.Sprite.Acts.SetPos,
		C3.Plugins.Sprite.Exps.ImagePointX,
		C3.Plugins.Sprite.Exps.ImagePointY,
		C3.Behaviors.Pin.Acts.PinByProperties,
		C3.Plugins.System.Cnds.PickLastCreated,
		C3.Plugins.System.Cnds.PickAll,
		C3.Behaviors.Pin.Acts.PinByDistance,
		C3.Plugins.Sprite.Acts.MoveToBottom,
		C3.Plugins.Sprite.Cnds.IsOverlapping,
		C3.Plugins.Sprite.Acts.AddInstanceVar,
		C3.Plugins.System.Acts.AddVar,
		C3.Plugins.System.Exps.int,
		C3.Plugins.System.Exps.random,
		C3.Plugins.Sprite.Acts.Destroy,
		C3.Plugins.System.Cnds.IsGroupActive,
		C3.Plugins.System.Cnds.Compare,
		C3.Plugins.Sprite.Exps.X,
		C3.Plugins.Sprite.Exps.Y,
		C3.Behaviors.Flash.Acts.Flash,
		C3.Plugins.System.Cnds.EveryTick,
		C3.Plugins.Text.Acts.SetText,
		C3.Plugins.Sprite.Acts.MoveForward,
		C3.Plugins.System.Cnds.ForEachOrdered,
		C3.Plugins.Sprite.Acts.SetAngle,
		C3.Plugins.Sprite.Exps.Angle,
		C3.Plugins.Touch.Cnds.OnTouchStart,
		C3.Plugins.Touch.Exps.X,
		C3.Plugins.Touch.Exps.Y,
		C3.Plugins.System.Exps.time,
		C3.Plugins.Touch.Cnds.IsInTouch,
		C3.Plugins.System.Cnds.Else,
		C3.Plugins.Touch.Cnds.OnTouchEnd,
		C3.Plugins.Sprite.Cnds.OnCollision,
		C3.ScriptsInEvents.EventSheet1_Event33_Act10
	];
};
self.C3_JsPropNameTable = [
	{points: 0},
	{Spr_Apple: 0},
	{Spr_InvisibleWall: 0},
	{Pin: 0},
	{Spr_SnakeTail: 0},
	{duration: 0},
	{active: 0},
	{Spr_PowerUp: 0},
	{moveSpeed: 0},
	{"8Direction": 0},
	{Flash: 0},
	{Spr_SnakeHead: 0},
	{Spr_SnakeJoint: 0},
	{index: 0},
	{Spr_SnakePart: 0},
	{Spr_SnakeTongue: 0},
	{Spr_Banner: 0},
	{Spr_SnakeTailPart4: 0},
	{Spr_SnakeTailPart1: 0},
	{Spr_SnakeTailPart2: 0},
	{Spr_SnakeTailPart3: 0},
	{Spr_TailJoint1: 0},
	{Spr_TailJoint2: 0},
	{Spr_TailJoint3: 0},
	{Spr_TailJoint4: 0},
	{BG_MainMenu: 0},
	{TM_Decor: 0},
	{TM_Ground: 0},
	{TM_Tree: 0},
	{Fade: 0},
	{Spr_FadeIn: 0},
	{Spr_FadeOut: 0},
	{Spr_Darken: 0},
	{Keyboard: 0},
	{Touch: 0},
	{LS_SnakeScore: 0},
	{Audio: 0},
	{Txt_CurrentScore: 0},
	{Txt_HighScore: 0},
	{Txt_FullScreen: 0},
	{Txt_PlusPoint: 0},
	{distance: 0},
	{moveAngle: 0},
	{Spr_Joystick: 0},
	{Spr_JoystickBase: 0},
	{GUI_PlayBtn: 0},
	{GUI_ReturnBtn: 0},
	{Spr_Instruction: 0},
	{Spr_Play: 0},
	{BG_Title: 0},
	{Sprite: 0},
	{Music: 0},
	{maxIndex: 0},
	{isTouching: 0},
	{baseX: 0},
	{baseY: 0},
	{touchStartTIme: 0},
	{maxDIstance: 0},
	{appleCount: 0},
	{GameActive: 0},
	{tempX: 0},
	{tempY: 0}
];

self.InstanceType = {
	Spr_Apple: class extends self.ISpriteInstance {},
	Spr_InvisibleWall: class extends self.ISpriteInstance {},
	Spr_SnakeTail: class extends self.ISpriteInstance {},
	Spr_PowerUp: class extends self.ISpriteInstance {},
	Spr_SnakeHead: class extends self.ISpriteInstance {},
	Spr_SnakeJoint: class extends self.ISpriteInstance {},
	Spr_SnakePart: class extends self.ISpriteInstance {},
	Spr_SnakeTongue: class extends self.ISpriteInstance {},
	Spr_Banner: class extends self.ISpriteInstance {},
	Spr_SnakeTailPart4: class extends self.ISpriteInstance {},
	Spr_SnakeTailPart1: class extends self.ISpriteInstance {},
	Spr_SnakeTailPart2: class extends self.ISpriteInstance {},
	Spr_SnakeTailPart3: class extends self.ISpriteInstance {},
	Spr_TailJoint1: class extends self.ISpriteInstance {},
	Spr_TailJoint2: class extends self.ISpriteInstance {},
	Spr_TailJoint3: class extends self.ISpriteInstance {},
	Spr_TailJoint4: class extends self.ISpriteInstance {},
	BG_MainMenu: class extends self.ITiledBackgroundInstance {},
	TM_Decor: class extends self.ITilemapInstance {},
	TM_Ground: class extends self.ITilemapInstance {},
	TM_Tree: class extends self.ITilemapInstance {},
	Spr_FadeIn: class extends self.ISpriteInstance {},
	Spr_FadeOut: class extends self.ISpriteInstance {},
	Spr_Darken: class extends self.ISpriteInstance {},
	Keyboard: class extends self.IInstance {},
	Touch: class extends self.IInstance {},
	LS_SnakeScore: class extends self.IInstance {},
	Audio: class extends self.IInstance {},
	Txt_CurrentScore: class extends self.ITextInstance {},
	Txt_HighScore: class extends self.ITextInstance {},
	Txt_FullScreen: class extends self.ITextInstance {},
	Txt_PlusPoint: class extends self.ITextInstance {},
	Spr_Joystick: class extends self.ISpriteInstance {},
	Spr_JoystickBase: class extends self.ISpriteInstance {},
	GUI_PlayBtn: class extends self.ISpriteInstance {},
	GUI_ReturnBtn: class extends self.ISpriteInstance {},
	Spr_Instruction: class extends self.ISpriteInstance {},
	Spr_Play: class extends self.ISpriteInstance {},
	BG_Title: class extends self.ITiledBackgroundInstance {},
	Sprite: class extends self.ISpriteInstance {}
}