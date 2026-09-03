/**
 * NEXUS 2D - FRONTEND JQUERY SCRIPT (LANDING PAGE)
 * Handles Dark/Light Mode, Challenging Section, Daily Gift Streak Claiming,
 * Mystery Chest Opening, Category Filtering, and Play Modal.
 */

$(document).ready(function () {
  // Global State
  let allGames = [];
  let currentCategory = 'all';
  let currentSort = 'featured';
  let searchQuery = '';
  let favorites = getFavorites();
  let playerProfile = getPlayerProfile();

  // Initialize Theme
  initTheme();

  // Initialize Player Coins in UI
  updateCoinsUI();

  // Load Games & Sections
  loadGames();

  // Setup Event Handlers
  setupEventListeners();

  // Update Favorites Counter Badge
  updateFavoritesBadge();

  /**
   * -------------------------------------------------------------
   * THEME MANAGEMENT (DARK / LIGHT MODE)
   * -------------------------------------------------------------
   */
  function initTheme() {
    const savedTheme = localStorage.getItem('nexus_theme') || 'dark';
    applyTheme(savedTheme);

    $('#themeToggleBtn').on('click', function () {
      const isDark = $('html').hasClass('dark');
      const newTheme = isDark ? 'light' : 'dark';
      applyTheme(newTheme);
      showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
    });
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      $('html').addClass('dark').removeClass('light');
      $('.theme-icon-sun').removeClass('hidden');
      $('.theme-icon-moon').addClass('hidden');
    } else {
      $('html').removeClass('dark').addClass('light');
      $('.theme-icon-sun').addClass('hidden');
      $('.theme-icon-moon').removeClass('hidden');
    }
    localStorage.setItem('nexus_theme', theme);
  }

  /**
   * -------------------------------------------------------------
   * COIN & GIFT REWARDS MANAGEMENT
   * -------------------------------------------------------------
   */
  function updateCoinsUI() {
    playerProfile = getPlayerProfile();
    const formatted = (playerProfile.coins || 0).toLocaleString();
    $('#navCoinBalance').text(formatted);
    $('#giftSectionCoinBalance').text(formatted + ' Coins');
  }

  // Daily Streak Claim
  $('#claimStreakBtn').on('click', function () {
    const bonus = 250;
    addPlayerCoins(bonus);
    updateCoinsUI();

    // Visual feedback on card
    $('#day5Card')
      .removeClass('animate-pulse border-amber-500 bg-amber-500/20')
      .addClass('bg-emerald-500/10 border-emerald-500/30 text-emerald-400');
    $('#day5Card .text-amber-500').removeClass('text-amber-500').addClass('text-emerald-500');
    $('#day5Card').html(`
      <span class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Day 5</span>
      <div class="text-emerald-500 text-lg"><i class="fa-solid fa-circle-check"></i></div>
      <span class="block text-xs font-bold text-slate-800 dark:text-slate-200">+250 Coins</span>
      <span class="text-[10px] text-emerald-500 font-bold">Claimed Just Now!</span>
    `);
    $('#streakStatusText').text('Day 5 of 7 Claimed 🔥');

    showToast(`🎉 Daily Reward Claimed! +${bonus} Coins added to your profile!`, 'success');
  });

  // Mystery Chest Open
  $('#openChestBtn, #chestWobbleIcon').on('click', function () {
    const rewards = [150, 200, 300, 450, 500];
    const won = rewards[Math.floor(Math.random() * rewards.length)];
    addPlayerCoins(won);
    updateCoinsUI();

    showToast(`🎁 Mystery Chest Opened! You won +${won} Bonus Coins & 50 XP!`, 'success');
  });

  /**
   * -------------------------------------------------------------
   * GAME CATALOG LOADING & SECTIONS RENDERING
   * -------------------------------------------------------------
   */
  function loadGames() {
    allGames = getGameCatalog();
    renderHeroBanner(allGames);
    renderChallengingSection(allGames);
    renderCategoryPills(allGames);
    renderGameGrid();
  }

  // Render Hero Showcase
  function renderHeroBanner(games) {
    const heroGame = games.find(g => g.featured) || games[0];
    if (!heroGame) return;

    $('#heroTitle').text(heroGame.title);
    $('#heroDescription').text(heroGame.description);
    $('#heroCategory').text(heroGame.category);
    $('#heroRating').text(heroGame.rating);
    $('#heroPlays').text((heroGame.plays || 15000).toLocaleString() + '+ Plays');
    $('#heroBannerImg').attr('src', heroGame.banner || heroGame.thumbnail);

    $('#heroPlayBtn').off('click').on('click', function () {
      openGameModal(heroGame.id, true);
    });

    const platformsHtml = (heroGame.platforms || ['Web', 'PC']).map(p => 
      `<span class="text-xs px-2.5 py-1 rounded-md bg-white/20 backdrop-blur-md text-white font-medium">${p}</span>`
    ).join(' ');
    $('#heroPlatforms').html(platformsHtml);
  }

  // Render ⚡ Challenging Section (6 High Stakes Hardcore Games)
  function renderChallengingSection(games) {
    const challenging = games.filter(g => g.isChallenging).slice(0, 6);
    const container = $('#challengingGamesGrid');
    container.empty();

    challenging.forEach(game => {
      const difficultyClass = game.difficulty === 'Insane'
        ? 'bg-rose-600 text-white'
        : 'bg-orange-500 text-white';

      const card = `
        <div class="game-card rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col justify-between group">
          <div class="relative w-full pt-[55%] overflow-hidden bg-slate-950">
            <span class="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${difficultyClass} shadow-md flex items-center gap-1">
              <i class="fa-solid fa-skull"></i> ${game.difficulty}
            </span>
            <span class="absolute top-3 right-3 z-10 px-2 py-1 rounded-lg text-[11px] font-black bg-black/60 backdrop-blur-md text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <i class="fa-solid fa-coins text-xs"></i> +${game.rewardPoints || 250}
            </span>

            <img src="${game.thumbnail}" alt="${game.title}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>

            <div class="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs">
              <span class="px-2 py-0.5 rounded-md bg-slate-900/80 text-[11px] font-semibold text-violet-400 border border-violet-500/20">
                ${game.category}
              </span>
              <div class="flex items-center gap-1 text-amber-400 bg-slate-900/80 px-2 py-0.5 rounded-md">
                <i class="fa-solid fa-star text-[10px]"></i>
                <span class="font-bold text-white text-[11px]">${game.rating}</span>
              </div>
            </div>
          </div>

          <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
            <div>
              <h3 class="font-bold text-slate-900 dark:text-white text-base group-hover:text-orange-500 transition-colors truncate">
                ${game.title}
              </h3>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                ${game.description}
              </p>
            </div>

            <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span class="text-[11px] text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1">
                <i class="fa-solid fa-gamepad text-orange-500"></i> ${game.plays.toLocaleString()} Trials
              </span>

              <button data-id="${game.id}" class="challenge-play-btn px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/30 flex items-center gap-1.5 transition-all">
                <i class="fa-solid fa-play text-[10px]"></i> Accept Challenge
              </button>
            </div>
          </div>
        </div>
      `;
      container.append(card);
    });

    $('.challenge-play-btn').off('click').on('click', function () {
      const id = $(this).data('id');
      openGameModal(id, true);
    });
  }

  // Category Pills
  function renderCategoryPills(games) {
    const categories = ['all', ...new Set(games.map(g => g.category))];
    let pillsHtml = '';

    categories.forEach(cat => {
      const isSelected = cat === currentCategory;
      const count = cat === 'all' ? games.length : games.filter(g => g.category === cat).length;
      const activeClass = isSelected 
        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700';

      pillsHtml += `
        <button data-category="${cat}" class="category-pill whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${activeClass}">
          <span>${cat === 'all' ? '🔥 All 100 Games' : cat}</span>
          <span class="text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}">${count}</span>
        </button>
      `;
    });

    $('#categoryPillsContainer').html(pillsHtml);

    $('.category-pill').on('click', function () {
      currentCategory = $(this).data('category');
      renderCategoryPills(allGames);
      renderGameGrid();
    });
  }

  // Render Preview Grid (First 12 games on landing page)
  function renderGameGrid() {
    let filtered = [...allGames];

    if (currentCategory !== 'all') {
      filtered = filtered.filter(g => g.category === currentCategory);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        (g.tags && g.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    switch (currentSort) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'plays':
        filtered.sort((a, b) => (b.plays || 0) - (a.plays || 0));
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'featured':
      default:
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    // Limit landing page preview to 12 games (full catalog is on games.html)
    const previewList = filtered.slice(0, 12);
    $('#gameCountDisplay').text(`Showing ${previewList.length} of ${allGames.length} 2D Games`);

    const grid = $('#gamesGrid');
    grid.empty();

    if (previewList.length === 0) {
      grid.html(`
        <div class="col-span-full py-12 text-center text-slate-500">
          <i class="fa-solid fa-gamepad text-3xl mb-2 text-violet-500"></i>
          <p class="font-bold">No games match your search.</p>
        </div>
      `);
      return;
    }

    previewList.forEach(game => {
      const isFav = favorites.includes(game.id);
      const card = createGameCard(game, isFav);
      grid.append(card);
    });

    attachCardEvents();
  }

  function createGameCard(game, isFav) {
    const isHardcore = game.difficulty === 'Hardcore' || game.difficulty === 'Insane';
    const badgeHtml = isHardcore
      ? `<span class="absolute top-3 left-3 z-10 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-orange-600 text-white shadow"><i class="fa-solid fa-fire"></i> ${game.difficulty}</span>`
      : `<span class="absolute top-3 left-3 z-10 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-violet-600/90 text-white shadow">${game.category}</span>`;

    return `
      <div class="game-card group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 transition-all duration-300">
        <div class="relative w-full pt-[58%] overflow-hidden bg-slate-950">
          ${badgeHtml}

          <button data-game-id="${game.id}" class="fav-toggle-btn absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all ${isFav ? 'text-rose-500' : 'text-slate-300'}">
            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart text-xs"></i>
          </button>

          <img src="${game.thumbnail}" alt="${game.title}" loading="lazy" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>

          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 backdrop-blur-[2px]">
            <button data-game-id="${game.id}" class="quick-play-btn px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-xl flex items-center gap-2">
              <i class="fa-solid fa-play"></i> Play 2D
            </button>
          </div>

          <div class="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-slate-300">
            <span class="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
              <i class="fa-solid fa-coins text-[10px]"></i> +${game.rewardPoints || 100} Coins
            </span>
            <div class="flex items-center gap-1 text-amber-400 bg-slate-900/80 px-2 py-0.5 rounded-md">
              <i class="fa-solid fa-star text-[10px]"></i>
              <span class="font-bold text-white text-[11px]">${game.rating}</span>
            </div>
          </div>
        </div>

        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-slate-900 dark:text-white group-hover:text-violet-500 transition-colors line-clamp-1 text-sm">
              ${game.title}
            </h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
              ${game.description}
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span class="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ${game.releaseYear}
            </span>
            <button data-game-id="${game.id}" class="details-modal-btn text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-300 flex items-center gap-1">
              Details <i class="fa-solid fa-chevron-right text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function attachCardEvents() {
    $('.quick-play-btn').off('click').on('click', function (e) {
      e.stopPropagation();
      openGameModal($(this).data('game-id'), true);
    });

    $('.details-modal-btn').off('click').on('click', function (e) {
      e.stopPropagation();
      openGameModal($(this).data('game-id'), false);
    });

    $('.fav-toggle-btn').off('click').on('click', function (e) {
      e.stopPropagation();
      toggleFavorite($(this).data('game-id'));
    });
  }

  /**
   * -------------------------------------------------------------
   * FAVORITES & MODAL
   * -------------------------------------------------------------
   */
  function getFavorites() {
    const saved = localStorage.getItem('nexus_favorites');
    return saved ? JSON.parse(saved) : [];
  }

  function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    const game = allGames.find(g => g.id === id);
    const title = game ? game.title : 'Game';

    if (index > -1) {
      favorites.splice(index, 1);
      showToast(`Removed "${title}" from Favorites`, 'info');
    } else {
      favorites.push(id);
      showToast(`Added "${title}" to Favorites! ❤️`, 'success');
    }

    localStorage.setItem('nexus_favorites', JSON.stringify(favorites));
    updateFavoritesBadge();
    renderGameGrid();
  }

  function updateFavoritesBadge() {
    const count = favorites.length;
    $('#favCounterBadge').text(count);
    if (count > 0) {
      $('#favCounterBadge').removeClass('hidden');
    } else {
      $('#favCounterBadge').addClass('hidden');
    }
  }

  function openGameModal(id, startPlaying = false) {
    const game = allGames.find(g => g.id === id);
    if (!game) return;

    $('#modalGameTitle').text(game.title);
    $('#modalGameCategory').text(game.category);
    $('#modalGameDifficulty').text(game.difficulty || 'Casual');
    $('#modalGameRating').text(game.rating);
    $('#modalGameBounty').text(`+${game.rewardPoints || 100} Coins`);
    $('#modalGamePlays').text((game.plays || 20000).toLocaleString() + ' Plays');
    $('#modalGameDesc').text(game.description);
    $('#modalGamePoster').attr('src', game.thumbnail);

    const tagsHtml = (game.tags || ['2D', 'HTML5']).map(t =>
      `<span class="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">#${t}</span>`
    ).join(' ');
    $('#modalGameTags').html(tagsHtml);

    const playUrl = game.playUrl || "https://play2048.co/";
    const iframe = $('#gamePlayIframe');
    const iframeContainer = $('#gamePlayIframeContainer');
    const posterContainer = $('#gamePosterContainer');

    if (startPlaying) {
      posterContainer.addClass('hidden');
      iframeContainer.removeClass('hidden');
      iframe.attr('src', playUrl);
      $('#modalPlayToggleBtn').html('<i class="fa-solid fa-eye mr-1"></i> View Poster');
      // Award reward coins for playing!
      addPlayerCoins(20);
      updateCoinsUI();
    } else {
      posterContainer.removeClass('hidden');
      iframeContainer.addClass('hidden');
      iframe.attr('src', '');
      $('#modalPlayToggleBtn').html('<i class="fa-solid fa-play mr-1"></i> Play Game Now');
    }

    $('#modalPlayToggleBtn').off('click').on('click', function () {
      if (iframeContainer.hasClass('hidden')) {
        posterContainer.addClass('hidden');
        iframeContainer.removeClass('hidden');
        iframe.attr('src', playUrl);
        $(this).html('<i class="fa-solid fa-eye mr-1"></i> View Poster');
        addPlayerCoins(20);
        updateCoinsUI();
      } else {
        posterContainer.removeClass('hidden');
        iframeContainer.addClass('hidden');
        iframe.attr('src', '');
        $(this).html('<i class="fa-solid fa-play mr-1"></i> Play Game Now');
      }
    });

    $('#modalFullscreenBtn').off('click').on('click', function () {
      const elem = document.getElementById('gamePlayIframe');
      if (elem.requestFullscreen) elem.requestFullscreen();
    });

    $('#modalFavBtn').off('click').on('click', function () {
      toggleFavorite(game.id);
    });

    $('#gameModal').removeClass('hidden').addClass('flex');
    $('body').addClass('overflow-hidden');
  }

  function closeGameModal() {
    $('#gameModal').addClass('hidden').removeClass('flex');
    $('#gamePlayIframe').attr('src', '');
    $('body').removeClass('overflow-hidden');
  }

  function setupEventListeners() {
    let timer;
    $('#searchInput').on('input', function () {
      clearTimeout(timer);
      searchQuery = $(this).val();
      timer = setTimeout(renderGameGrid, 200);
    });

    $('#clearSearchBtn').on('click', function () {
      $('#searchInput').val('');
      searchQuery = '';
      renderGameGrid();
    });

    $('#sortSelect').on('change', function () {
      currentSort = $(this).val();
      renderGameGrid();
    });

    $('#closeModalBtn, #modalBackdrop').on('click', closeGameModal);

    $(document).on('keydown', function (e) {
      if (e.key === 'Escape') closeGameModal();
    });

    $('#mobileMenuBtn').on('click', function () {
      $('#mobileMenu').toggleClass('hidden');
    });

    window.addEventListener('storage', function (e) {
      if (e.key === 'nexus_gaming_catalog_v1') {
        loadGames();
      }
      if (e.key === 'nexus_theme') {
        applyTheme(e.newValue || 'dark');
      }
      if (e.key === 'nexus_player_profile') {
        updateCoinsUI();
      }
    });

    window.addEventListener('player-profile-updated', updateCoinsUI);
  }

  function showToast(message, type = 'info') {
    const container = $('#toastContainer');
    const toastId = 'toast-' + Date.now();

    const colors = {
      success: 'bg-emerald-600 text-white shadow-emerald-500/20',
      error: 'bg-rose-600 text-white shadow-rose-500/20',
      info: 'bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 shadow-xl'
    };

    const toastHtml = `
      <div id="${toastId}" class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-medium transition-all duration-300 transform translate-y-4 opacity-0 ${colors[type] || colors.info}">
        <span>${message}</span>
      </div>
    `;

    container.append(toastHtml);
    const elem = $(`#${toastId}`);

    setTimeout(() => elem.removeClass('translate-y-4 opacity-0'), 50);
    setTimeout(() => {
      elem.addClass('translate-y-4 opacity-0');
      setTimeout(() => elem.remove(), 300);
    }, 3200);
  }
});
