/**
 * BITCOIN CLICKER 2: THE SEQUEL
 * Core Engine Optimized
 */

const Game = {
    // State
    bitcoins: 0,
    bitcoinRate: 0,
    totalSeconds: 0,
    clickCount: 0,
    lastTick: Date.now(),
    
    // Config
    version: "2.0.0-Sequel",
    priceMultiplier: 1.15,
    
    // Save Data Object
    records: {
        longestGame: 0,
        highestRate: 0,
        highestGame: 0,
        mostClicks: 0
    },

    units: ["Million", "Billion", "Trillion", "Quadrillion", "Quintillion", "Sextillion", "Septillion", "Octillion", "Nonillion", "Decillion"],

    items: [
        { id: "item_oldCalculator", name: "Old Calculator", basePrice: 0.0000001, bps: 0.00000001 },
        { id: "item_oldCpu", name: "Old CPU", basePrice: 0.00000125, bps: 0.0000001 },
        { id: "item_rapsberrypy", name: "Raspberry Pi", basePrice: 0.00005, bps: 0.000005 },
        { id: "item_smartphone", name: "Smartphone", basePrice: 0.0005, bps: 0.00005 },
        { id: "item_gamingPC", name: "Gaming PC", basePrice: 0.015, bps: 0.001 },
        { id: "item_miningFarm", name: "Mining Farm", basePrice: 250, bps: 2.5 },
        { id: "item_quantumRig", name: "Quantum Rig", basePrice: 245000, bps: 1500 },
        { id: "item_blackHole", name: "Black Hole Miner", basePrice: 750000000000, bps: 10000000 }
    ],

    init() {
        this.loadSave();
        this.setupEventListeners();
        this.renderStore();
        
        // Start the game loop (60 FPS for smooth UI, but math stays 1s based)
        requestAnimationFrame(() => this.loop());
        
        // Save every 15 seconds
        setInterval(() => this.saveGame(), 15000);
    },

    // --- Core Logic ---

    loop() {
        const now = Date.now();
        const delta = (now - this.lastTick) / 1000;

        if (delta >= 1) {
            this.tick();
            this.lastTick = now;
        }

        this.updateUI();
        requestAnimationFrame(() => this.loop());
    },

    tick() {
        this.bitcoins += this.bitcoinRate;
        this.totalSeconds++;
        
        // Update Highscores
        if (this.bitcoins > this.records.highestGame) this.records.highestGame = this.bitcoins;
        if (this.bitcoinRate > this.records.highestRate) this.records.highestRate = this.bitcoinRate;
        if (this.totalSeconds > this.records.longestGame) this.records.longestGame = this.totalSeconds;
    },

    handleManualClick() {
        const clickPower = 0.00000001; // Base Satoshi
        this.bitcoins += clickPower;
        this.clickCount++;
        if (this.clickCount > this.records.mostClicks) this.records.mostClicks = this.clickCount;
        this.updateUI();
    },

    buyItem(itemId) {
        const item = this.items.find(i => i.id === itemId);
        const owned = parseInt(localStorage.getItem(itemId) || 0);
        const currentPrice = item.basePrice * Math.pow(this.priceMultiplier, owned);

        if (this.bitcoins >= currentPrice) {
            this.bitcoins -= currentPrice;
            const newAmount = owned + 1;
            localStorage.setItem(itemId, newAmount);
            
            this.calculateTotalRate();
            this.updateUI();
        }
    },

    calculateTotalRate() {
        let newRate = 0;
        this.items.forEach(item => {
            const owned = parseInt(localStorage.getItem(item.id) || 0);
            newRate += (owned * item.bps);
        });
        this.bitcoinRate = newRate;
    },

    // --- UI & Helpers ---

    formatNumber(num, fixed = 8) {
        if (num >= 1000000) {
            const exponent = Math.floor(Math.log10(num) / 3) * 3;
            const unitIndex = Math.floor(exponent / 3) - 2;
            const shortNum = (num / Math.pow(10, exponent)).toFixed(2);
            return `${shortNum} ${this.units[unitIndex] || '???'}`;
        }
        return num < 1 ? num.toFixed(fixed) : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    formatTime(sec) {
        const h = Math.floor(sec / 3600).toString().padStart(2, '0');
        const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    },

    updateUI() {
        $(".bitcoinAmount").text(this.formatNumber(this.bitcoins));
        $(".satoshiAmount").text(Math.floor(this.bitcoins * 100000000).toLocaleString());
        $(".bSecRateNumber").text(this.formatNumber(this.bitcoinRate));
        $("#timer").text(this.formatTime(this.totalSeconds));
        
        // Dynamic styling for buttons
        this.items.forEach(item => {
            const owned = parseInt(localStorage.getItem(item.id) || 0);
            const price = item.basePrice * Math.pow(this.priceMultiplier, owned);
            const $el = $(`#${item.id}`);
            
            $el.find(".amount").text(owned);
            $el.find(".price").text(this.formatNumber(price) + " BTC");
            
            if (this.bitcoins >= price) {
                $el.removeClass("inactive");
            } else {
                $el.addClass("inactive");
            }
        });
    },

    // --- Infrastructure ---

    setupEventListeners() {
        $(".bitcoin").on("click", () => this.handleManualClick());
        
        $(document).on("click", ".purchaseItem", (e) => {
            this.buyItem($(e.currentTarget).attr("id"));
        });

        $(".resetButton").on("click", () => this.resetGame());
    },

    saveGame() {
        const saveData = {
            bitcoins: this.bitcoins,
            totalSeconds: this.totalSeconds,
            records: this.records,
            clickCount: this.clickCount
        };
        localStorage.setItem("saveData", JSON.stringify(saveData));
    },

    loadSave() {
        const raw = localStorage.getItem("saveData");
        if (raw) {
            const data = JSON.parse(raw);
            this.bitcoins = data.bitcoins || 0;
            this.totalSeconds = data.totalSeconds || 0;
            this.records = data.records || this.records;
            this.clickCount = data.clickCount || 0;
        }
        this.calculateTotalRate();
    },

    renderStore() {
        // You could use this to dynamically generate the HTML for your store items
        // instead of hardcoding them in index.html
    },

    resetGame() {
        if(confirm("Are you sure you want to restart your empire?")) {
            localStorage.clear();
            location.reload();
        }
    }
};

$(document).ready(() => Game.init());
