/**
 * NEXUS 2D - PLAYER PROFILE SCRIPT (profile.html)
 * Handles gamer identity display, XP level calculations, favorite games showcase,
 * badges/achievements, match history, and profile editing.
 */

$(document).ready(function () {
  let profile = getPlayerProfile();
  let allGames = getGameCatalog();
  let favorites = getFavorites();

  initTheme();
  renderProfile();
  renderFavorites();
  renderBadges();
  renderHistory();
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

  function renderProfile() {
    profile = getPlayerProfile();

    $('#profileName').text(profile.name);
    $('#profileTag').text(profile.tag);
    $('#profileTitleBadge').text(profile.title);
    $('#profileBio').text(profile.bio);
    $('#profileAvatarImg').attr('src', profile.avatar);

    $('#profileLevelText').text(`Level ${profile.level}`);
    $('#profileXpText').text(`${(profile.xp || 0).toLocaleString()} / ${(profile.maxXP || 10000).toLocaleString()} XP`);
    const pct = Math.min(100, Math.round(((profile.xp || 0) / (profile.maxXP || 10000)) * 100));
    $('#profileXpBar').css('width', `${pct}%`);

    $('#statTotalPlayed').text(profile.totalPlayed || 128);
    $('#statHoursLogged').text(`${profile.hoursLogged || 86} hrs`);
    $('#statWinRate').text(`${profile.winRate || 74}%`);
    $('#statCoins').text((profile.coins || 0).toLocaleString());
    $('#navCoinBalance').text((profile.coins || 0).toLocaleString());
  }

  function getFavorites() {
    const saved = localStorage.getItem('nexus_favorites');
    return saved ? JSON.parse(saved) : [];
  }

  function renderFavorites() {
    favorites = getFavorites();
    $('#profileFavCount').text(favorites.length);

    const favGames = allGames.filter(g => favorites.includes(g.id));
    const container = $('#profileFavoritesGrid');
    container.empty();

    if (favGames.length === 0) {
      container.removeClass('grid-cols-1 sm:grid-cols-2 lg:grid-cols-4').addClass('col-span-full');
      container.html(`
        <div class="col-span-full py-12 text-center text-slate-500">
          <i class="fa-regular fa-heart text-3xl mb-2 text-rose-500"></i>
          <h4 class="font-bold text-slate-800 dark:text-slate-200">No favorite 2D games saved</h4>
          <p class="text-xs text-slate-400 mt-1">Browse our 100 games library and click the heart icon on any game to bookmark it here!</p>
          <a href="games.html" class="inline-block mt-4 px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs">Browse All 100 Games</a>
        </div>
      `);
      return;
    }

    container.attr('class', 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6');
    favGames.forEach(game => {
      const card = `
        <div class="game-card rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div class="relative w-full pt-[58%] bg-slate-950">
            <button data-id="${game.id}" class="remove-fav-btn absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 text-rose-500 flex items-center justify-center text-xs hover:scale-110 transition-transform" title="Remove Favorite">
              <i class="fa-solid fa-heart"></i>
            </button>
            <img src="${game.thumbnail}" alt="${game.title}" class="absolute inset-0 w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
            <span class="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900/80 text-violet-400 border border-violet-500/20">${game.category}</span>
          </div>
          <div class="p-4 space-y-2">
            <h4 class="font-bold text-sm text-slate-900 dark:text-white truncate">${game.title}</h4>
            <div class="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span class="text-amber-400 font-bold"><i class="fa-solid fa-star text-[10px]"></i> ${game.rating}</span>
              <button data-id="${game.id}" class="profile-play-btn px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1">
                <i class="fa-solid fa-play text-[9px]"></i> Play
              </button>
            </div>
          </div>
        </div>
      `;
      container.append(card);
    });

    $('.profile-play-btn').off('click').on('click', function () {
      const id = $(this).data('id');
      const game = allGames.find(g => g.id === id);
      if (game) {
        $('#modalGameTitle').text(game.title);
        $('#gamePlayIframe').attr('src', game.playUrl || "https://play2048.co/");
        $('#gameModal').removeClass('hidden').addClass('flex');
        $('body').addClass('overflow-hidden');
      }
    });

    $('.remove-fav-btn').off('click').on('click', function () {
      const id = $(this).data('id');
      favorites = favorites.filter(f => f !== id);
      localStorage.setItem('nexus_favorites', JSON.stringify(favorites));
      renderFavorites();
      showToast('Removed from favorites', 'info');
    });
  }

  function renderBadges() {
    const badges = profile.badges || [];
    const container = $('#profileBadgesGrid');
    container.empty();

    badges.forEach(b => {
      const isUnlocked = b.unlocked;
      const card = `
        <div class="p-4 rounded-2xl border ${isUnlocked ? 'bg-white dark:bg-slate-900 border-amber-500/30 shadow-md' : 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 opacity-60'} flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl ${isUnlocked ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'} flex items-center justify-center text-xl flex-shrink-0">
            <i class="fa-solid ${b.icon}"></i>
          </div>
          <div class="min-w-0 flex-1">
            <h5 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">${b.name}</h5>
            <p class="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1">${b.desc}</p>
            <span class="text-[10px] font-bold ${isUnlocked ? 'text-emerald-500' : 'text-slate-500'} mt-0.5 block">
              ${isUnlocked ? `Unlocked ${b.date || 'Active'}` : 'Locked'}
            </span>
          </div>
        </div>
      `;
      container.append(card);
    });
  }

  function renderHistory() {
    const history = profile.history || [];
    const container = $('#profileHistoryContainer');
    container.empty();

    history.forEach(h => {
      const row = `
        <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center text-base">
              <i class="fa-solid fa-gamepad"></i>
            </div>
            <div>
              <h5 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">${h.gameTitle}</h5>
              <span class="text-[11px] text-slate-600 dark:text-slate-400">${h.category} &bull; ${h.time}</span>
            </div>
          </div>
          <div class="text-right">
            <span class="block text-xs font-bold text-slate-800 dark:text-slate-200">Score: ${h.score.toLocaleString()}</span>
            <span class="text-[11px] font-bold text-amber-500">+${h.coinsEarned} Coins</span>
          </div>
        </div>
      `;
      container.append(row);
    });
  }

  function setupEvents() {
    // Tab switching
    $('.profile-tab-btn').on('click', function () {
      $('.profile-tab-btn').removeClass('active bg-violet-600 text-white shadow-md').addClass('text-slate-600 dark:text-slate-400');
      $(this).addClass('active bg-violet-600 text-white shadow-md').removeClass('text-slate-600 dark:text-slate-400');

      const targetTab = $(this).data('tab');
      $('.profile-tab-content').addClass('hidden');
      $(`#${targetTab}`).removeClass('hidden');
    });

    // Edit Profile Modal
    $('#openEditProfileBtn').on('click', function () {
      $('#editGamerName').val(profile.name);
      $('#editGamerTag').val(profile.tag);
      $('#editGamerTitle').val(profile.title);
      $('#editGamerAvatar').val(profile.avatar);
      $('#editGamerBio').val(profile.bio);
      $('#editProfileModal').removeClass('hidden').addClass('flex');
    });

    $('#closeEditProfileBtn, #cancelEditProfileBtn').on('click', function () {
      $('#editProfileModal').addClass('hidden').removeClass('flex');
    });

    $('#editProfileForm').on('submit', function (e) {
      e.preventDefault();
      profile.name = $('#editGamerName').val().trim();
      profile.tag = $('#editGamerTag').val().trim();
      profile.title = $('#editGamerTitle').val().trim();
      profile.avatar = $('#editGamerAvatar').val().trim();
      profile.bio = $('#editGamerBio').val().trim();

      savePlayerProfile(profile);
      renderProfile();
      $('#editProfileModal').addClass('hidden').removeClass('flex');
      showToast('Gamer profile updated successfully!', 'success');
    });

    // Play modal close
    $('#closeModalBtn, #modalBackdrop').on('click', function () {
      $('#gameModal').addClass('hidden').removeClass('flex');
      $('#gamePlayIframe').attr('src', '');
      $('body').removeClass('overflow-hidden');
    });

    $('#mobileMenuBtn').on('click', function () {
      $('#mobileMenu').toggleClass('hidden');
    });

    window.addEventListener('storage', function (e) {
      if (e.key === 'nexus_player_profile') {
        renderProfile();
      }
      if (e.key === 'nexus_favorites') {
        renderFavorites();
      }
      if (e.key === 'nexus_theme') {
        applyTheme(e.newValue || 'dark');
      }
    });

    window.addEventListener('player-profile-updated', renderProfile);
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

