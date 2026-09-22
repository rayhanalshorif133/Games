/**
 * Construct 3 Runtime Compatibility Bridge
 * Provides standard C3 API interfaces for the Mr. Bean Jump engine.
 */
window.C3 = {
    version: "r400",
    Runtime: {
        setLayoutSize: function(w, h) {
            if (window.Game) {
                window.Game.width = w;
                window.Game.height = h;
            }
        },
        getScore: function() {
            return window.Game ? window.Game.score : 0;
        },
        restart: function() {
            if (window.Game) {
                window.Game.restartGame();
            }
        }
    }
};

