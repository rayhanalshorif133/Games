/**
 * NEXUS 2D - ALL 100 GAMES CATALOG SCRIPT (games.html)
 * Handles progressive pagination, grid/list view toggling,
 * multi-filtering (category, difficulty, search), sorting, and modal playback.
 */

$(document).ready(function () {
  let allGames = [];
  let currentCategory = 'all';
  let currentDifficulty = 'all';
  let currentSort = 'featured';
  let searchQuery = '';
  let viewMode = 'grid'; // 'grid' or 'list'
  let pageSize = 24;
  let visibleCount = 24;
  let favorites = getFavorites();
  let playerProfile = getPlayerProfile();

  // Initialize Theme
  initTheme();
  updateCoinsUI();

  // Check URL params (e.g. games.html?filter=challenging)
  const urlParams = new URLSearchParams(window.location.search);
  const filterParam = urlParams.get('filter');
  if (filterParam === 'challenging') {
    currentDifficulty = 'Challenging';
    $('#difficultySelect').val('Challenging');
  }

  // Load Catalog
  loadGames();

  // Setup Event Listeners
  setupEvents();

  function initTheme() {
    const savedTheme = localStorage.getItem('nexus_theme') || 'dark';
    applyTheme(savedTheme);

    $('#themeToggleBtn').on('click', function () {
      const isDark = $('html').hasClass('dark');
      const newTheme = isDark ? 'light' : 'dark';
      applyTheme(newTheme);
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

  function updateCoinsUI() {
    playerProfile = getPlayerProfile();
    $('#navCoinBalance').text((playerProfile.coins || 0).toLocaleString());
  }

  function loadGames() {
    allGames = getGameCatalog();
    renderCategoryPills();
    renderGames();
    updateFavoritesBadge();
  }

  function renderCategoryPills() {
    const categories = ['all', ...new Set(allGames.map(g => g.category))];
    let html = '';

    categories.forEach(cat => {
      const isSelected = cat === currentCategory;
      const count = cat === 'all' ? allGames.length : allGames.filter(g => g.category === cat).length;
      const activeClass = isSelected 
        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700';

      html += `
        <button data-category="${cat}" class="games-cat-pill whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${activeClass}">
          <span>${cat === 'all' ? '🎮 All 100 Games' : cat}</span>
          <span class="text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}">${count}</span>
        </button>
      `;
    });

    $('#gamesCategoryPills').html(html);

    $('.games-cat-pill').on('click', function () {
      currentCategory = $(this).data('category');
      visibleCount = pageSize;
      renderCategoryPills();
      renderGames();
    });
  }

  function getFilteredGames() {
    let list = [...allGames];

    // Category
    if (currentCategory !== 'all') {
      list = list.filter(g => g.category === currentCategory);
    }

    // Difficulty
    if (currentDifficulty !== 'all') {
      if (currentDifficulty === 'Challenging') {
        list = list.filter(g => g.isChallenging);
      } else {
        list = list.filter(g => g.difficulty === currentDifficulty);
      }
    }

    // Search
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        (g.difficulty && g.difficulty.toLowerCase().includes(q)) ||
        (g.tags && g.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Sorter
    switch (currentSort) {
      case 'plays':
        list.sort((a, b) => (b.plays || 0) - (a.plays || 0));
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'coins':
        list.sort((a, b) => (b.rewardPoints || 0) - (a.rewardPoints || 0));
        break;
      case 'name-asc':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'featured':
      default:
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    return list;
  }

  function renderGames() {
    const filtered = getFilteredGames();
    const container = $('#allGamesContainer');
    container.empty();

    const displayList = filtered.slice(0, visibleCount);
    $('#allGamesCountDisplay').text(`Showing ${displayList.length} of ${filtered.length} 2D Games (${allGames.length} Total Library)`);

    // Toggle Load More Button
    if (visibleCount >= filtered.length) {
      $('#loadMoreBtn').addClass('hidden');
    } else {
      $('#loadMoreBtn').removeClass('hidden');
    }

    if (displayList.length === 0) {
      container.removeClass('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4').addClass('col-span-full');
      container.html(`
        <div class="col-span-full py-16 text-center text-slate-500">
          <i class="fa-solid fa-ghost text-4xl mb-3 text-violet-500"></i>
          <h4 class="font-bold text-lg text-slate-800 dark:text-slate-200">No 2D games found</h4>
          <p class="text-xs text-slate-400 mt-1">Try relaxing filters or searching for another term.</p>
        </div>
      `);
      return;
    }

    // Grid View vs List View
    if (viewMode === 'grid') {
      container.attr('class', 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6');
      displayList.forEach(game => {
        container.append(createGridCard(game));
      });
    } else {
      container.attr('class', 'space-y-3 col-span-full');
      displayList.forEach(game => {
        container.append(createListCard(game));
      });
    }

    attachEvents();
  }

  function createGridCard(game) {
    const isFav = favorites.includes(game.id);
    const difficultyBadge = game.difficulty === 'Insane' || game.difficulty === 'Hardcore'
      ? `<span class="absolute top-3 left-3 z-10 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-orange-600 text-white shadow"><i class="fa-solid fa-skull"></i> ${game.difficulty}</span>`
      : `<span class="absolute top-3 left-3 z-10 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-violet-600/90 text-white shadow">${game.category}</span>`;

    return `
      <div class="game-card group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 transition-all duration-300">
        <div class="relative w-full pt-[58%] overflow-hidden bg-slate-950">
          ${difficultyBadge}

          <button data-id="${game.id}" class="fav-toggle-btn absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white flex items-center justify-center transition-all ${isFav ? 'text-rose-500' : 'text-slate-300'}">
            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart text-xs"></i>
          </button>

          <img src="${game.thumbnail}" alt="${game.title}" loading="lazy" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>

          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 backdrop-blur-[2px]">
            <button data-id="${game.id}" class="quick-play-btn px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-xl flex items-center gap-2">
              <i class="fa-solid fa-play"></i> Play 2D
            </button>
          </div>

          <div class="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-slate-300">
            <span class="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
              <i class="fa-solid fa-coins text-[10px]"></i> +${game.rewardPoints || 100}
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
            <span class="text-xs text-slate-600 dark:text-slate-400 font-medium">
              ${game.difficulty}
            </span>
            <button data-id="${game.id}" class="details-modal-btn text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-300 flex items-center gap-1">
              Details <i class="fa-solid fa-chevron-right text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function createListCard(game) {
    const isFav = favorites.includes(game.id);

    return `
      <div class="game-card-list p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <img src="${game.thumbnail}" alt="${game.title}" class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-violet-500/10 text-violet-500 border border-violet-500/20">${game.category}</span>
              <span class="text-[10px] font-semibold text-slate-600 dark:text-slate-400">${game.difficulty}</span>
            </div>
            <h4 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate mt-0.5">${game.title}</h4>
            <div class="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1">
              <span class="flex items-center gap-1 text-amber-500 font-bold"><i class="fa-solid fa-star text-[10px]"></i> ${game.rating}</span>
              <span class="hidden sm:inline">&bull;</span>
              <span class="hidden sm:inline">${(game.plays || 20000).toLocaleString()} Plays</span>
              <span>&bull;</span>
              <span class="text-amber-400 font-semibold">+${game.rewardPoints || 100} Coins</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button data-id="${game.id}" class="fav-toggle-btn p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 ${isFav ? 'text-rose-500' : 'text-slate-400'}">
            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart text-sm"></i>
          </button>
          <button data-id="${game.id}" class="quick-play-btn px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 whitespace-nowrap">
            <i class="fa-solid fa-play text-[10px]"></i> Play
          </button>
        </div>
      </div>
    `;
  }

  function attachEvents() {
    $('.quick-play-btn').off('click').on('click', function (e) {
      e.stopPropagation();
      openModal($(this).data('id'), true);
    });

    $('.details-modal-btn').off('click').on('click', function (e) {
      e.stopPropagation();
      openModal($(this).data('id'), false);
    });

    $('.fav-toggle-btn').off('click').on('click', function (e) {
      e.stopPropagation();
      toggleFavorite($(this).data('id'));
    });
  }

  function openModal(id, startPlaying = false) {
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

    const playUrl = game.playUrl || "https://play2048.co/";
    const iframe = $('#gamePlayIframe');
    const iframeContainer = $('#gamePlayIframeContainer');
    const posterContainer = $('#gamePosterContainer');

    if (startPlaying) {
      posterContainer.addClass('hidden');
      iframeContainer.removeClass('hidden');
      iframe.attr('src', playUrl);
      $('#modalPlayToggleBtn').html('<i class="fa-solid fa-eye mr-1"></i> View Poster');
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

  function closeModal() {
    $('#gameModal').addClass('hidden').removeClass('flex');
    $('#gamePlayIframe').attr('src', '');
    $('body').removeClass('overflow-hidden');
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
    renderGames();
  }

  function updateFavoritesBadge() {
    $('#favCounterBadge').text(favorites.length);
    if (favorites.length > 0) $('#favCounterBadge').removeClass('hidden');
    else $('#favCounterBadge').addClass('hidden');
  }

  function getFavorites() {
    const saved = localStorage.getItem('nexus_favorites');
    return saved ? JSON.parse(saved) : [];
  }

  function setupEvents() {
    // Search
    let timer;
    $('#gamesSearchInput').on('input', function () {
      clearTimeout(timer);
      searchQuery = $(this).val();
      visibleCount = pageSize;
      timer = setTimeout(renderGames, 200);
    });

    $('#clearGamesSearchBtn').on('click', function () {
      $('#gamesSearchInput').val('');
      searchQuery = '';
      visibleCount = pageSize;
      renderGames();
    });

    // Difficulty Dropdown
    $('#difficultySelect').on('change', function () {
      currentDifficulty = $(this).val();
      visibleCount = pageSize;
      renderGames();
    });

    // Sort Dropdown
    $('#gamesSortSelect').on('change', function () {
      currentSort = $(this).val();
      renderGames();
    });

    // View Mode Toggle
    $('#viewGridBtn').on('click', function () {
      viewMode = 'grid';
      $(this).addClass('bg-violet-600 text-white').removeClass('text-slate-400');
      $('#viewListBtn').removeClass('bg-violet-600 text-white').addClass('text-slate-400');
      renderGames();
    });

    $('#viewListBtn').on('click', function () {
      viewMode = 'list';
      $(this).addClass('bg-violet-600 text-white').removeClass('text-slate-400');
      $('#viewGridBtn').removeClass('bg-violet-600 text-white').addClass('text-slate-400');
      renderGames();
    });

    // Load More Button
    $('#loadMoreBtn').on('click', function () {
      visibleCount += pageSize;
      renderGames();
    });

    // Modal
    $('#closeModalBtn, #modalBackdrop').on('click', closeModal);
    $(document).on('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    $('#mobileMenuBtn').on('click', function () {
      $('#mobileMenu').toggleClass('hidden');
    });

    window.addEventListener('storage', function (e) {
      if (e.key === 'nexus_gaming_catalog_v1') {
        allGames = getGameCatalog();
        renderGames();
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
      success: 'bg-emerald-600 text-white',
      info: 'bg-slate-900 text-white border border-slate-700'
    };

    container.append(`
      <div id="${toastId}" class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-xs sm:text-sm font-medium transition-all duration-300 transform translate-y-4 opacity-0 ${colors[type] || colors.info}">
        <span>${message}</span>
      </div>
    `);

    setTimeout(() => $(`#${toastId}`).removeClass('translate-y-4 opacity-0'), 50);
    setTimeout(() => {
      $(`#${toastId}`).addClass('translate-y-4 opacity-0');
      setTimeout(() => $(`#${toastId}`).remove(), 300);
    }, 3200);
  }
});

