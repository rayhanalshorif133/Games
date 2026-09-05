/**
 * storage.js - Local data persistence for Missile Escape
 */

const STORAGE_KEY = 'missile_escape_save_v1';

const DEFAULT_DATA = {
    highScore: 0,
    coins: 250, // Starting bonus currency
    selectedShip: 'cx16', // 'cx16', 'dko', 'wo84'
    ships: {
        cx16: { unlocked: true, level: 1 },
        dko: { unlocked: false, level: 1, unlockCost: 400 },
        wo84: { unlocked: false, level: 1, unlockCost: 800 }
    },
    upgrades: {
        speed: 1,      // Max 5
        agility: 1,    // Max 5
        flares: 1,     // Max 5 (starts with 3, +1 per upgrade)
        magnet: 1      // Max 5
    },
    settings: {
        soundVolume: 0.8,
        musicVolume: 0.5,
        soundEnabled: true,
        musicEnabled: true,
        controlType: 'joystick' // 'joystick', 'drag', 'keyboard'
    },
    stats: {
        gamesPlayed: 0,
        missilesDodged: 0,
        nearMisses: 0,
        flaresUsed: 0
    }
};

class StorageManager {
    constructor() {
        this.data = this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return JSON.parse(JSON.stringify(DEFAULT_DATA));
            const parsed = JSON.parse(raw);
            return {
                ...DEFAULT_DATA,
                ...parsed,
                ships: { ...DEFAULT_DATA.ships, ...(parsed.ships || {}) },
                upgrades: { ...DEFAULT_DATA.upgrades, ...(parsed.upgrades || {}) },
                settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
                stats: { ...DEFAULT_DATA.stats, ...(parsed.stats || {}) }
            };
        } catch (e) {
            console.warn('Could not read from localStorage, using defaults:', e);
            return JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }

    getHighScore() {
        return this.data.highScore || 0;
    }

    setHighScore(score) {
        if (score > (this.data.highScore || 0)) {
            this.data.highScore = Math.floor(score);
            this.save();
            return true;
        }
        return false;
    }

    getCoins() {
        return this.data.coins || 0;
    }

    addCoins(amount) {
        this.data.coins = Math.max(0, (this.data.coins || 0) + amount);
        this.save();
        return this.data.coins;
    }

    spendCoins(amount) {
        if ((this.data.coins || 0) >= amount) {
            this.data.coins -= amount;
            this.save();
            return true;
        }
        return false;
    }

    getSelectedShip() {
        return this.data.selectedShip || 'cx16';
    }

    setSelectedShip(shipId) {
        if (this.data.ships[shipId] && this.data.ships[shipId].unlocked) {
            this.data.selectedShip = shipId;
            this.save();
            return true;
        }
        return false;
    }

    upgradeShip(shipId) {
        const ship = this.data.ships[shipId];
        if (!ship) return false;
        if (ship.level < 3) {
            const cost = ship.level === 1 ? 500 : 1000;
            if (this.spendCoins(cost)) {
                ship.level += 1;
                this.save();
                return true;
            }
        }
        return false;
    }

    unlockShip(shipId) {
        const ship = this.data.ships[shipId];
        if (!ship || ship.unlocked) return false;
        const cost = ship.unlockCost || 500;
        if (this.spendCoins(cost)) {
            ship.unlocked = true;
            this.data.selectedShip = shipId;
            this.save();
            return true;
        }
        return false;
    }

    getUpgradeLevel(type) {
        return this.data.upgrades[type] || 1;
    }

    getUpgradeCost(type) {
        const lvl = this.getUpgradeLevel(type);
        if (lvl >= 5) return null;
        return lvl * 150;
    }

    buyUpgrade(type) {
        const currentLvl = this.getUpgradeLevel(type);
        if (currentLvl >= 5) return false;
        const cost = this.getUpgradeCost(type);
        if (cost && this.spendCoins(cost)) {
            this.data.upgrades[type] = currentLvl + 1;
            this.save();
            return true;
        }
        return false;
    }

    recordStats(gameStats) {
        if (!gameStats) return;
        this.data.stats.gamesPlayed = (this.data.stats.gamesPlayed || 0) + 1;
        this.data.stats.missilesDodged = (this.data.stats.missilesDodged || 0) + (gameStats.missilesDodged || 0);
        this.data.stats.nearMisses = (this.data.stats.nearMisses || 0) + (gameStats.nearMisses || 0);
        this.data.stats.flaresUsed = (this.data.stats.flaresUsed || 0) + (gameStats.flaresUsed || 0);
        this.save();
    }
}

export const storage = new StorageManager();

