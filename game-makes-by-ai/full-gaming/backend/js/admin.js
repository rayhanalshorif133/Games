/**
 * NEXUS GAMING ADMIN PANEL - JQUERY SCRIPT
 * Handles Dark/Light Mode, Game Upload (URL & File Preview),
 * Editing, Deletion, Live Form Preview, Stats, and Data Management.
 */

$(document).ready(function () {
  // Global State
  let games = [];
  let currentTableSearch = '';
  let currentTableCategory = 'all';
  let gameToDeleteId = null;
  let editingGameId = null;

  // Initialize Theme
  initAdminTheme();

  // Load Catalog
  loadAdminCatalog();

  // Setup Event Handlers
  setupAdminEvents();

  /**
   * -------------------------------------------------------------
   * THEME MANAGEMENT
   * -------------------------------------------------------------
   */
  function initAdminTheme() {
    const savedTheme = localStorage.getItem('nexus_theme') || 'dark';
    applyAdminTheme(savedTheme);

    $('#adminThemeToggleBtn').on('click', function () {
      const isDark = $('html').hasClass('dark');
      const newTheme = isDark ? 'light' : 'dark';
      applyAdminTheme(newTheme);
      showAdminToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
    });
  }

  function applyAdminTheme(theme) {
    if (theme === 'dark') {
      $('html').addClass('dark').removeClass('light');
      $('.theme-icon-sun').removeClass('hidden');
      $('.theme-icon-moon').addClass('hidden');
      $('#themeStatusText').text('Light');
    } else {
      $('html').removeClass('dark').addClass('light');
      $('.theme-icon-sun').addClass('hidden');
      $('.theme-icon-moon').removeClass('hidden');
      $('#themeStatusText').text('Dark');
    }
    localStorage.setItem('nexus_theme', theme);
  }

  /**
   * -------------------------------------------------------------
   * DATA ACCESS & LOCALSTORAGE
   * -------------------------------------------------------------
   */
  function loadAdminCatalog() {
    games = getGameCatalog();
    renderStats();
    renderGamesTable();
    populateCategoryDropdowns();
  }

  function saveCatalogToStorage() {
    saveGameCatalog(games);
    // Dispatch storage event manually for same-tab updates
    window.dispatchEvent(new Event('storage'));
  }

  /**
   * -------------------------------------------------------------
   * DASHBOARD STATS
   * -------------------------------------------------------------
   */
  function renderStats() {
    const totalGames = games.length;
    const featuredCount = games.filter(g => g.featured).length;
    const uniqueCategories = [...new Set(games.map(g => g.category))].length;
    const totalPlays = games.reduce((acc, g) => acc + (g.plays || 0), 0);

    $('#statTotalGames').text(totalGames);
    $('#statFeaturedGames').text(featuredCount);
    $('#statCategories').text(uniqueCategories);
    $('#statTotalPlays').text(totalPlays.toLocaleString());

    // Render Recent Uploads in Dashboard
    const recent = [...games].slice(-4).reverse();
    let recentHtml = '';
    recent.forEach(g => {
      recentHtml += `
        <div class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <img src="${g.thumbnail}" alt="${g.title}" class="w-12 h-12 rounded-lg object-cover">
          <div class="flex-1 min-w-0">
            <h5 class="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">${g.title}</h5>
            <span class="text-[11px] text-violet-600 dark:text-violet-400">${g.category}</span>
          </div>
          <span class="text-xs font-bold text-amber-500 flex items-center gap-1">
            <i class="fa-solid fa-star text-[10px]"></i> ${g.rating}
          </span>
        </div>
      `;
    });
    $('#recentUploadsContainer').html(recentHtml);
  }

  /**
   * -------------------------------------------------------------
   * GAMES MANAGEMENT TABLE
   * -------------------------------------------------------------
   */
  function renderGamesTable() {
    let list = [...games];

    // Filter by category
    if (currentTableCategory !== 'all') {
      list = list.filter(g => g.category === currentTableCategory);
    }

    // Filter by search
    if (currentTableSearch.trim() !== '') {
      const q = currentTableSearch.toLowerCase().trim();
      list = list.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        (g.developer && g.developer.toLowerCase().includes(q))
      );
    }

    const tbody = $('#gamesTableBody');
    tbody.empty();

    if (list.length === 0) {
      tbody.html(`
        <tr>
          <td colspan="7" class="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            <i class="fa-solid fa-folder-open text-2xl mb-2 text-violet-500"></i>
            <p>No games match your table filter.</p>
          </td>
        </tr>
      `);
      return;
    }

    list.forEach(game => {
      const featuredToggle = game.featured
        ? `<button data-id="${game.id}" class="toggle-featured-btn px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20">
             <i class="fa-solid fa-star mr-1"></i> Featured
           </button>`
        : `<button data-id="${game.id}" class="toggle-featured-btn px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-amber-500">
             <i class="fa-regular fa-star mr-1"></i> Standard
           </button>`;

      const platformsStr = (game.platforms || []).join(', ');

      const tr = `
        <tr class="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40">
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              <img src="${game.thumbnail}" alt="${game.title}" class="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700">
              <div>
                <h4 class="font-bold text-sm text-slate-900 dark:text-white">${game.title}</h4>
                <span class="text-xs text-slate-600 dark:text-slate-400">${game.developer || 'Independent'}</span>
              </div>
            </div>
          </td>
          <td class="py-3 px-4">
            <span class="px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
              ${game.category}
            </span>
          </td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-1 text-xs font-bold text-amber-500">
              <i class="fa-solid fa-star text-[10px]"></i>
              <span>${game.rating}</span>
            </div>
            <span class="text-[10px] text-slate-600 dark:text-slate-400">${game.releaseYear}</span>
          </td>
          <td class="py-3 px-4 text-xs text-slate-600 dark:text-slate-400 max-w-[150px] truncate">
            ${platformsStr || 'PC'}
          </td>
          <td class="py-3 px-4">
            ${featuredToggle}
          </td>
          <td class="py-3 px-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button data-id="${game.id}" class="edit-game-btn p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-colors" title="Edit Game">
                <i class="fa-solid fa-pen-to-square text-xs"></i>
              </button>
              <button data-id="${game.id}" class="delete-game-btn p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors" title="Delete Game">
                <i class="fa-solid fa-trash-can text-xs"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
      tbody.append(tr);
    });

    attachTableEvents();
  }

  function attachTableEvents() {
    // Edit Game Click
    $('.edit-game-btn').off('click').on('click', function () {
      const id = $(this).data('id');
      openEditModal(id);
    });

    // Delete Game Click
    $('.delete-game-btn').off('click').on('click', function () {
      const id = $(this).data('id');
      openDeleteConfirmModal(id);
    });

    // Toggle Featured Status
    $('.toggle-featured-btn').off('click').on('click', function () {
      const id = $(this).data('id');
      const game = games.find(g => g.id === id);
      if (game) {
        game.featured = !game.featured;
        saveCatalogToStorage();
        renderStats();
        renderGamesTable();
        showAdminToast(`Updated: "${game.title}" featured status changed`, 'info');
      }
    });
  }

  function populateCategoryDropdowns() {
    const categories = ['all', ...new Set(games.map(g => g.category))];
    let filterOptions = '';
    categories.forEach(cat => {
      filterOptions += `<option value="${cat}">${cat === 'all' ? 'All Categories' : cat}</option>`;
    });
    $('#tableCategoryFilter').html(filterOptions);
  }

  /**
   * -------------------------------------------------------------
   * UPLOAD NEW GAME & LIVE FORM PREVIEW
   * -------------------------------------------------------------
   */
  // Live Card Preview Sync
  function syncLivePreview() {
    const title = $('#uploadTitle').val().trim() || 'Game Title Preview';
    const category = $('#uploadCategory').val() || 'Action';
    const rating = $('#uploadRating').val() || '4.8';
    const year = $('#uploadYear').val() || '2024';
    const desc = $('#uploadDesc').val().trim() || 'Real-time game description preview will appear here as you type in the upload form.';
    const imgUrl = $('#uploadImgUrl').val().trim() || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';
    const isFeatured = $('#uploadFeatured').is(':checked');

    $('#previewCardTitle').text(title);
    $('#previewCardCategory').text(category);
    $('#previewCardRating').text(rating);
    $('#previewCardYear').text(year);
    $('#previewCardDesc').text(desc);
    $('#previewCardImg').attr('src', imgUrl);
    
    if (isFeatured) {
      $('#previewCardFeatured').removeClass('hidden');
    } else {
      $('#previewCardFeatured').addClass('hidden');
    }
  }

  // Handle Form Inputs for Live Preview
  $('#uploadTitle, #uploadCategory, #uploadRating, #uploadYear, #uploadDesc, #uploadImgUrl, #uploadFeatured').on('input change', function () {
    syncLivePreview();
  });

  // Handle Local File Upload with FileReader (DataURL)
  $('#uploadThumbnailFile').on('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showAdminToast('Please select a valid image file', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = function (evt) {
        const base64Img = evt.target.result;
        $('#uploadImgUrl').val(base64Img);
        syncLivePreview();
        showAdminToast('Image loaded for thumbnail preview!', 'success');
      };
      reader.readAsDataURL(file);
    }
  });

  // Form Submission (Add Game)
  $('#uploadGameForm').on('submit', function (e) {
    e.preventDefault();

    const title = $('#uploadTitle').val().trim();
    if (!title) {
      showAdminToast('Please enter a game title', 'error');
      return;
    }

    const category = $('#uploadCategory').val() || 'Action';
    const developer = $('#uploadDeveloper').val().trim() || 'Independent Studio';
    const releaseYear = parseInt($('#uploadYear').val()) || new Date().getFullYear();
    const rating = parseFloat($('#uploadRating').val()) || 4.5;
    const thumbnail = $('#uploadImgUrl').val().trim() || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';
    const playUrl = $('#uploadPlayUrl').val().trim() || 'https://play2048.co/';
    const isPlayableWeb = $('#uploadIsPlayableWeb').is(':checked');
    const featured = $('#uploadFeatured').is(':checked');
    const description = $('#uploadDesc').val().trim() || 'An exhilarating gaming adventure waiting to be explored.';
    const systemReq = $('#uploadSysReq').val().trim() || 'Standard modern browser and gaming PC.';

    // Collect Selected Platforms
    const platforms = [];
    $('.platform-checkbox:checked').each(function () {
      platforms.push($(this).val());
    });
    if (platforms.length === 0) platforms.push('PC');

    // Parse Tags
    const tagsInput = $('#uploadTags').val().trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [category, 'Gaming'];

    // Generate unique ID
    const newId = 'game-' + Date.now();

    const newGame = {
      id: newId,
      title: title,
      category: category,
      developer: developer,
      releaseYear: releaseYear,
      rating: rating,
      plays: Math.floor(Math.random() * 20000) + 5000,
      featured: featured,
      thumbnail: thumbnail,
      banner: thumbnail,
      playUrl: playUrl,
      isPlayableWeb: isPlayableWeb,
      platforms: platforms,
      description: description,
      systemReq: systemReq,
      tags: tags
    };

    // Add to games array
    games.unshift(newGame);
    saveCatalogToStorage();

    // Reset Form
    $('#uploadGameForm')[0].reset();
    $('#uploadYear').val(new Date().getFullYear());
    $('#uploadRating').val(4.8);
    syncLivePreview();

    // Update UI
    renderStats();
    renderGamesTable();
    populateCategoryDropdowns();

    showAdminToast(`Success: "${title}" uploaded and published!`, 'success');

    // Automatically switch to All Games tab
    switchTab('games-tab');
  });

  /**
   * -------------------------------------------------------------
   * EDIT GAME MODAL WORKFLOW
   * -------------------------------------------------------------
   */
  function openEditModal(id) {
    const game = games.find(g => g.id === id);
    if (!game) return;

    editingGameId = id;

    $('#editTitle').val(game.title);
    $('#editCategory').val(game.category);
    $('#editDeveloper').val(game.developer);
    $('#editYear').val(game.releaseYear);
    $('#editRating').val(game.rating);
    $('#editImgUrl').val(game.thumbnail);
    $('#editPlayUrl').val(game.playUrl || '');
    $('#editDesc').val(game.description);
    $('#editSysReq').val(game.systemReq || '');
    $('#editTags').val((game.tags || []).join(', '));
    $('#editFeatured').prop('checked', !!game.featured);
    $('#editIsPlayableWeb').prop('checked', !!game.isPlayableWeb);

    // Reset and check platforms
    $('.edit-platform-checkbox').prop('checked', false);
    (game.platforms || []).forEach(p => {
      $(`.edit-platform-checkbox[value="${p}"]`).prop('checked', true);
    });

    // Preview
    $('#editImgPreview').attr('src', game.thumbnail);

    $('#editGameModal').removeClass('hidden').addClass('flex');
  }

  // Handle Edit Thumbnail Change Preview
  $('#editImgUrl').on('input', function () {
    $('#editImgPreview').attr('src', $(this).val());
  });

  // Edit Local File Upload
  $('#editThumbnailFile').on('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (evt) {
        $('#editImgUrl').val(evt.target.result);
        $('#editImgPreview').attr('src', evt.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  // Save Edit Changes
  $('#editGameForm').on('submit', function (e) {
    e.preventDefault();
    if (!editingGameId) return;

    const game = games.find(g => g.id === editingGameId);
    if (!game) return;

    game.title = $('#editTitle').val().trim();
    game.category = $('#editCategory').val();
    game.developer = $('#editDeveloper').val().trim();
    game.releaseYear = parseInt($('#editYear').val()) || game.releaseYear;
    game.rating = parseFloat($('#editRating').val()) || game.rating;
    game.thumbnail = $('#editImgUrl').val().trim() || game.thumbnail;
    game.banner = game.thumbnail;
    game.playUrl = $('#editPlayUrl').val().trim() || game.playUrl;
    game.description = $('#editDesc').val().trim() || game.description;
    game.systemReq = $('#editSysReq').val().trim() || game.systemReq;
    game.featured = $('#editFeatured').is(':checked');
    game.isPlayableWeb = $('#editIsPlayableWeb').is(':checked');

    // Platforms
    const platforms = [];
    $('.edit-platform-checkbox:checked').each(function () {
      platforms.push($(this).val());
    });
    game.platforms = platforms.length > 0 ? platforms : ['PC'];

    // Tags
    const tagsInput = $('#editTags').val().trim();
    game.tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [game.category];

    saveCatalogToStorage();
    renderStats();
    renderGamesTable();
    populateCategoryDropdowns();

    closeEditModal();
    showAdminToast(`Updated "${game.title}" successfully!`, 'success');
  });

  function closeEditModal() {
    $('#editGameModal').addClass('hidden').removeClass('flex');
    editingGameId = null;
  }

  $('#closeEditModalBtn, #cancelEditBtn').on('click', closeEditModal);

  /**
   * -------------------------------------------------------------
   * DELETE CONFIRMATION MODAL WORKFLOW
   * -------------------------------------------------------------
   */
  function openDeleteConfirmModal(id) {
    const game = games.find(g => g.id === id);
    if (!game) return;

    gameToDeleteId = id;
    $('#deleteGameTitle').text(`"${game.title}"`);
    $('#deleteConfirmModal').removeClass('hidden').addClass('flex');
  }

  $('#confirmDeleteBtn').on('click', function () {
    if (!gameToDeleteId) return;

    const game = games.find(g => g.id === gameToDeleteId);
    const title = game ? game.title : 'Game';

    games = games.filter(g => g.id !== gameToDeleteId);
    saveCatalogToStorage();

    renderStats();
    renderGamesTable();
    populateCategoryDropdowns();

    closeDeleteModal();
    showAdminToast(`Deleted "${title}" from catalog`, 'error');
  });

  function closeDeleteModal() {
    $('#deleteConfirmModal').addClass('hidden').removeClass('flex');
    gameToDeleteId = null;
  }

  $('#cancelDeleteBtn, #closeDeleteModalBtn').on('click', closeDeleteModal);

  /**
   * -------------------------------------------------------------
   * NAVIGATION TABS
   * -------------------------------------------------------------
   */
  function switchTab(tabId) {
    $('.nav-item').removeClass('active');
    $(`.nav-item[data-tab="${tabId}"]`).addClass('active');

    $('.tab-content').addClass('hidden');
    $(`#${tabId}`).removeClass('hidden');

    // Specific tab triggers
    if (tabId === 'games-tab') {
      renderGamesTable();
    } else if (tabId === 'upload-tab') {
      syncLivePreview();
    } else if (tabId === 'dashboard-tab') {
      renderStats();
    }
  }

  $('.nav-item').on('click', function (e) {
    e.preventDefault();
    const targetTab = $(this).data-tab;
    if (targetTab) {
      switchTab(targetTab);
    }
  });

  // Topbar "+ New Game" button
  $('#topbarAddGameBtn').on('click', function () {
    switchTab('upload-tab');
  });

  /**
   * -------------------------------------------------------------
   * BACKUP, EXPORT, AND RESTORE CATALOG
   * -------------------------------------------------------------
   */
  // Reset to default 12 games
  $('#resetDefaultsBtn').on('click', function () {
    if (confirm("Reset catalog back to original default 12 games? Custom added games will be replaced.")) {
      localStorage.setItem('nexus_gaming_catalog_v1', JSON.stringify(DEFAULT_GAMES));
      games = [...DEFAULT_GAMES];
      saveCatalogToStorage();
      renderStats();
      renderGamesTable();
      populateCategoryDropdowns();
      showAdminToast('Catalog reset to 12 default games!', 'info');
    }
  });

  // Export JSON
  $('#exportJsonBtn').on('click', function () {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(games, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "nexus_gaming_catalog_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showAdminToast('Exported catalog as JSON file!', 'success');
  });

  // Import JSON
  $('#importJsonFile').on('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (evt) {
        try {
          const imported = JSON.parse(evt.target.result);
          if (Array.isArray(imported) && imported.length > 0) {
            games = imported;
            saveCatalogToStorage();
            renderStats();
            renderGamesTable();
            populateCategoryDropdowns();
            showAdminToast(`Imported ${imported.length} games successfully!`, 'success');
          } else {
            showAdminToast('Invalid JSON file format (expected array of games)', 'error');
          }
        } catch (err) {
          showAdminToast('Error parsing JSON file: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    }
  });

  /**
   * -------------------------------------------------------------
   * TABLE SEARCH & CATEGORY FILTER
   * -------------------------------------------------------------
   */
  function setupAdminEvents() {
    let tableSearchTimer;
    $('#tableSearchInput').on('input', function () {
      clearTimeout(tableSearchTimer);
      currentTableSearch = $(this).val();
      tableSearchTimer = setTimeout(renderGamesTable, 200);
    });

    $('#tableCategoryFilter').on('change', function () {
      currentTableCategory = $(this).val();
      renderGamesTable();
    });

    // Mobile sidebar toggle
    $('#adminMobileMenuBtn').on('click', function () {
      $('#adminSidebar').toggleClass('-translate-x-full');
    });

    // Listen to storage changes from frontend
    window.addEventListener('storage', function (e) {
      if (e.key === 'nexus_gaming_catalog_v1') {
        games = getGameCatalog();
        renderStats();
        renderGamesTable();
      }
      if (e.key === 'nexus_theme') {
        applyAdminTheme(e.newValue || 'dark');
      }
    });
  }

  /**
   * -------------------------------------------------------------
   * TOAST NOTIFICATIONS
   * -------------------------------------------------------------
   */
  function showAdminToast(message, type = 'info') {
    const container = $('#adminToastContainer');
    const toastId = 'adm-toast-' + Date.now();

    const colors = {
      success: 'bg-emerald-600 text-white shadow-emerald-500/20',
      error: 'bg-rose-600 text-white shadow-rose-500/20',
      info: 'bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 shadow-xl'
    };

    const icons = {
      success: '<i class="fa-solid fa-check-circle text-emerald-300"></i>',
      error: '<i class="fa-solid fa-triangle-exclamation text-rose-300"></i>',
      info: '<i class="fa-solid fa-circle-info text-violet-400"></i>'
    };

    const toastHtml = `
      <div id="${toastId}" class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all duration-300 transform translate-y-4 opacity-0 ${colors[type] || colors.info}">
        <span>${icons[type] || icons.info}</span>
        <span class="flex-1">${message}</span>
      </div>
    `;

    container.append(toastHtml);
    const elem = $(`#${toastId}`);

    setTimeout(() => {
      elem.removeClass('translate-y-4 opacity-0');
    }, 50);

    setTimeout(() => {
      elem.addClass('translate-y-4 opacity-0');
      setTimeout(() => {
        elem.remove();
      }, 300);
    }, 3200);
  }
});

