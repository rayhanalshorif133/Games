"""
Project Validation Script for Choice Side Construct 3 Build
Verifies HTML, CSS, JavaScript, image assets, media audio, and icons
"""

import os
import json

def validate():
    errors = []
    warnings = []

    # 1. Check Root Files
    required_files = [
        'index.html',
        'style.css',
        'appmanifest.json',
        'c3runtime.js',
        'c3project.json'
    ]
    for rf in required_files:
        if not os.path.exists(rf):
            errors.append(f"Missing root file: {rf}")
        elif os.path.getsize(rf) == 0:
            errors.append(f"Empty root file: {rf}")

    # 2. Check Scripts
    required_scripts = [
        'scripts/audio.js',
        'scripts/particles.js',
        'scripts/obstacles.js',
        'scripts/player.js',
        'scripts/game.js',
        'scripts/main.js'
    ]
    for sc in required_scripts:
        if not os.path.exists(sc):
            errors.append(f"Missing script: {sc}")
        elif os.path.getsize(sc) == 0:
            errors.append(f"Empty script: {sc}")

    # 3. Check Images
    required_images = [
        'images/bg_canyon.png',
        'images/wall_left.png',
        'images/wall_right.png',
        'images/player_climb_0.png',
        'images/player_climb_1.png',
        'images/player_jump.png',
        'images/player_hurt.png',
        'images/saw_blade.png',
        'images/boulder.png',
        'images/fireball.png',
        'images/apple_green.png',
        'images/apple_yellow.png',
        'images/apple_purple.png',
        'images/apple_slice_left.png',
        'images/apple_slice_right.png',
        'images/heart.png',
        'images/slash_trail.png',
        'images/ui_home.png',
        'images/ui_audio.png',
        'images/ui_audio_off.png',
        'images/ui_apple_badge.png',
        'images/ui_life_badge.png'
    ]
    for im in required_images:
        if not os.path.exists(im):
            errors.append(f"Missing image: {im}")
        elif os.path.getsize(im) == 0:
            errors.append(f"Empty image: {im}")

    # 4. Check Media
    required_media = [
        'media/jump.wav',
        'media/slice.wav',
        'media/hit.wav',
        'media/heart.wav',
        'media/gameover.wav',
        'media/click.wav',
        'media/bgm.wav'
    ]
    for md in required_media:
        if not os.path.exists(md):
            errors.append(f"Missing media: {md}")
        elif os.path.getsize(md) == 0:
            errors.append(f"Empty media: {md}")

    # 5. Check Icons
    required_icons = [
        'icons/loading-logo.png',
        'icons/icon-16.png',
        'icons/icon-32.png',
        'icons/icon-64.png',
        'icons/icon-128.png',
        'icons/icon-256.png',
        'icons/icon-512.png'
    ]
    for ic in required_icons:
        if not os.path.exists(ic):
            errors.append(f"Missing icon: {ic}")
        elif os.path.getsize(ic) == 0:
            errors.append(f"Empty icon: {ic}")

    # Print Report
    print("=" * 60)
    print("CHOICE SIDE CONSTRUCT 3 BUILD VALIDATION REPORT")
    print("=" * 60)
    if errors:
        print(f"FAILED: Found {len(errors)} errors:")
        for e in errors:
            print(f"  [ERROR] {e}")
        return False
    else:
        print("ALL REQUIRED FILES, SCRIPTS, ASSETS, AUDIO & ICONS VALIDATED!")
        print(f"Verified {len(required_files)} root files")
        print(f"Verified {len(required_scripts)} JavaScript modules")
        print(f"Verified {len(required_images)} Sprite & background PNG textures")
        print(f"Verified {len(required_media)} Audio WAV sound effects & music")
        print(f"Verified {len(required_icons)} Construct 3 PWA icons")
        print("=" * 60)
        return True

if __name__ == '__main__':
    validate()

