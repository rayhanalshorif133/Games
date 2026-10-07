"""
Audio generator for Attack to Ship game.
Generates authentic retro arcade military sound effects (.wav) into media/
"""

import wave
import struct
import math
import random
import os

os.makedirs('media', exist_ok=True)

def write_wav(filename, samples, sample_rate=44100):
    with wave.open(filename, 'w') as wav_file:
        n_channels = 1
        sampwidth = 2
        n_frames = len(samples)
        wav_file.setparams((n_channels, sampwidth, sample_rate, n_frames, 'NONE', 'not compressed'))
        
        # Clip and pack
        packed = bytearray()
        for s in samples:
            val = max(-1.0, min(1.0, s))
            int_val = int(val * 32767)
            packed.extend(struct.pack('<h', int_val))
        wav_file.writeframes(packed)
    print(f"Created {filename}")

def gen_sonar():
    # Atmospheric submarine sonar ping
    sample_rate = 44100
    duration = 1.2
    n_samples = int(sample_rate * duration)
    samples = []
    freq = 1150.0
    for i in range(n_samples):
        t = i / sample_rate
        # fast attack, long sinusoidal decay with slight reverberation
        env = math.exp(-3.5 * t)
        s = math.sin(2 * math.pi * freq * t) * env
        # secondary subtle overtone
        s += 0.25 * math.sin(2 * math.pi * (freq * 1.5) * t) * math.exp(-5.0 * t)
        samples.append(s * 0.7)
    write_wav('media/sonar.wav', samples, sample_rate)

def gen_bomb_drop():
    # Hatch mechanical click + downward whoosh whistle
    sample_rate = 44100
    duration = 0.4
    n_samples = int(sample_rate * duration)
    samples = []
    for i in range(n_samples):
        t = i / sample_rate
        # descending tone from 600Hz down to 220Hz
        freq = 600 - 380 * (t / duration)
        env = (1.0 - t / duration) ** 1.5
        noise = (random.random() * 2.0 - 1.0) * 0.15
        s = (math.sin(2 * math.pi * freq * t) * 0.8 + noise) * env
        samples.append(s * 0.7)
    write_wav('media/bomb_drop.wav', samples, sample_rate)

def gen_torpedo_launch():
    # Underwater pressurized hiss & launch impulse
    sample_rate = 44100
    duration = 0.35
    n_samples = int(sample_rate * duration)
    samples = []
    for i in range(n_samples):
        t = i / sample_rate
        freq = 280 + 350 * (t / duration)
        env = (1.0 - t / duration)
        noise = (random.random() * 2.0 - 1.0) * 0.35
        s = (math.sin(2 * math.pi * freq * t) * 0.6 + noise) * env
        samples.append(s * 0.6)
    write_wav('media/torpedo_launch.wav', samples, sample_rate)

def gen_explosion():
    # Deep underwater concussive blast with low frequency rumble
    sample_rate = 44100
    duration = 0.65
    n_samples = int(sample_rate * duration)
    samples = []
    for i in range(n_samples):
        t = i / sample_rate
        env = math.exp(-5.0 * t)
        # filtered noise + low bass tone (65Hz sliding to 30Hz)
        noise = (random.random() * 2.0 - 1.0)
        bass = math.sin(2 * math.pi * (65 - 35 * t) * t)
        s = (noise * 0.65 + bass * 0.5) * env
        samples.append(s * 0.9)
    write_wav('media/explosion.wav', samples, sample_rate)

def gen_shield_hit():
    # Sci-fi energy deflection pulse & resonance
    sample_rate = 44100
    duration = 0.4
    n_samples = int(sample_rate * duration)
    samples = []
    for i in range(n_samples):
        t = i / sample_rate
        freq = 850 + 200 * math.sin(40 * math.pi * t)
        env = math.exp(-6.0 * t)
        s = math.sin(2 * math.pi * freq * t) * env
        samples.append(s * 0.75)
    write_wav('media/shield_hit.wav', samples, sample_rate)

def gen_powerup():
    # Upward arpeggio chime: 3 bright ascending tones
    sample_rate = 44100
    duration = 0.5
    n_samples = int(sample_rate * duration)
    samples = []
    tones = [523.25, 659.25, 783.99, 1046.5] # C5, E5, G5, C6
    for i in range(n_samples):
        t = i / sample_rate
        step = min(3, int(t / (duration / 4)))
        freq = tones[step]
        env = math.exp(-8.0 * (t % (duration / 4)))
        s = math.sin(2 * math.pi * freq * t) * env
        samples.append(s * 0.8)
    write_wav('media/powerup.wav', samples, sample_rate)

def gen_gameover():
    # Minor descending cadence
    sample_rate = 44100
    duration = 1.0
    n_samples = int(sample_rate * duration)
    samples = []
    tones = [440.0, 392.0, 349.23, 293.66]
    for i in range(n_samples):
        t = i / sample_rate
        step = min(3, int(t / (duration / 4)))
        freq = tones[step]
        env = math.exp(-4.0 * (t % (duration / 4)))
        s = math.sin(2 * math.pi * freq * t) * env
        samples.append(s * 0.7)
    write_wav('media/gameover.wav', samples, sample_rate)

if __name__ == '__main__':
    gen_sonar()
    gen_bomb_drop()
    gen_torpedo_launch()
    gen_explosion()
    gen_shield_hit()
    gen_powerup()
    gen_gameover()
    print("All audio files generated successfully!")

