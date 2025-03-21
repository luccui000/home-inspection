const $ = (query) => document.getElementById(query);
const $$ = (query) => document.querySelector(query);

// Global state management
const state = {
  selectedDirection: 'north',
  selectedFilters: new Set(),
  selectedDetails: new Set(),
  checklist: [],
  activeChecklistItem: null,
  isDragging: false,
  dragIcon: null,
  longPressTimer: null,
  isDragStarted: false,
  panOffset: { x: 0, y: 0 },
  zoomLevel: 1,
  pinnedIcons: [],
  selectedShape: null,
  dragStartedInTools: false,
};

// Direction mapping
const DIRECTIONS = {
  north: { icon: 'arrow_upward', text: '前面' },
  east: { icon: 'arrow_forward', text: '右側' },
  south: { icon: 'arrow_downward', text: '後面' },
  west: { icon: 'arrow_back', text: '左側' },
};

document.addEventListener('DOMContentLoaded', () => {
  // Make sure we clear any previous filters
  state.selectedFilters = new Set(['all']);
  state.selectedDetails = new Set(['all']);

  // Set north as active direction
  state.selectedDirection = 'north';

  // Setup UI components
  setupDirectionNav();
  setupFilterButtons();
  initializeChecklist();

  // Setup photo history button
  setupPhotoHistoryButton();

  // Update UI for north direction
  const northButton = document.querySelector(
    '.direction-button[data-direction="north"]'
  );
  if (northButton) {
    northButton.classList.add('active');
  }

  // Load filter buttons for north direction
  loadFilterButtons(state.selectedDirection);

  // Update blueprint image for north
  updateBlueprintImage(state.selectedDirection);

  // Update pinned icons visibility
  updateBlueprintIcons();

  // Update checklist to show all items for north direction
  updateChecklist();

  // Setup remaining components
  setupShapeButtonEvents();
  setupBlueprintZoom();
  setupCameraButtonEvent();
});

function getShapeStyle(item) {
  const color = item.color;

  switch (item.shape) {
    case 'triangle':
      return `border-left: 12px solid transparent; 
              border-right: 12px solid transparent; 
              border-bottom: 24px solid ${color};
              background-color: transparent;`;
    case 'circle':
      return `background-color: ${color};
              border-radius: 50%;`;
    case 'square':
      return `background-color: ${color};
              border-radius: 4px;`;
    default:
      return `background-color: ${color};
              border-radius: 50%;`;
  }
}

function getPartName(part) {
  const names = {
    walls: '外壁',
    roof: '窓',
    foundation: '排水',
  };
  return names[part] || part;
}

function getShapeIcon(detail) {
  const shapes = {
    crack: 'circle',
    paint: 'square',
    seal: 'triangle',
  };
  return shapes[detail] || 'circle';
}

function getShapeColor(detail) {
  const colors = {
    crack: 'red',
    paint: '#3b82f6',
    seal: '#84cc16',
  };
  return colors[detail] || '#3b82f6';
}

function initializeChecklist() {
  // Initial checklist data
  state.checklist = checklistItems;
  updateProgress();
}

// Add this function to create and setup the photo history button
function setupPhotoHistoryButton() {
  // Check if button already exists
  let photoHistoryButton = document.getElementById('photo-history-button');

  // If not, create it
  if (!photoHistoryButton) {
    photoHistoryButton = document.createElement('button');
    photoHistoryButton.id = 'photo-history-button';
    photoHistoryButton.className = 'action-button photo-history-button';
    photoHistoryButton.innerHTML =
      '<span class="material-icons">photo_library</span>';

    // Find check-all-camera button and insert the history button before it
    const cameraButton = document.getElementById('check-all-camera');
    if (cameraButton && cameraButton.parentNode) {
      cameraButton.parentNode.insertBefore(photoHistoryButton, cameraButton);
    }
  }

  // Add click handler
  photoHistoryButton.addEventListener('click', showPhotoGallery);

  // Update visibility
  updatePhotoHistoryButtonVisibility();
}

// Add this function to show the photo gallery
function showPhotoGallery() {
  // Collect all photos from all checklist items
  const allPhotos = [];

  state.checklist.forEach((item) => {
    if (item.photos && item.photos.length > 0) {
      item.photos.forEach((photo) => {
        allPhotos.push({
          ...photo,
          itemName: item.name,
          itemId: item.id,
        });
      });
    }
  });

  if (allPhotos.length === 0) {
    // No photos to show
    return;
  }

  // Create modal for photo gallery
  const modal = document.createElement('div');
  modal.className = 'modal photo-gallery-modal';

  // Sort photos by timestamp (newest first)
  allPhotos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>写真ギャラリー</h3>
        <button class="close-modal-button">
          <span class="material-icons">close</span>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="photo-gallery">
          ${allPhotos
            .map(
              (photo) => `
            <div class="gallery-item" data-item-id="${photo.itemId}">
              <div class="gallery-image-container">
                <img src="${photo.url}" alt="Inspection photo">
              </div>
              <div class="gallery-item-details">
                <p class="gallery-item-name">${photo.itemName}</p>
                <p class="gallery-item-time">${formatDate(photo.timestamp)}</p>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </div>
  `;

  // Add event handlers
  const closeButton = modal.querySelector('.close-modal-button');
  closeButton.addEventListener('click', () => {
    modal.remove();
  });

  // Add click handler for gallery items to navigate to the associated checklist item
  const galleryItems = modal.querySelectorAll('.gallery-item');
  galleryItems.forEach((item) => {
    item.addEventListener('click', () => {
      const itemId = item.dataset.itemId;
      modal.remove();
      openIssueModal(itemId);
    });
  });

  document.body.appendChild(modal);
  modal.style.display = 'flex';
}

// Add this function if it doesn't already exist
function formatDate(timestamp) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  return `${date.getFullYear()}/${(date.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date
    .getHours()
    .toString()
    .padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// Add this function to update the visibility of the photo history button
function updatePhotoHistoryButtonVisibility() {
  const photoHistoryButton = document.getElementById('photo-history-button');
  if (!photoHistoryButton) return;

  // Check if any photos exist across all checklist items
  const hasPhotos = state.checklist.some(
    (item) => item.photos && item.photos.length > 0
  );

  // Show or hide based on photo existence
  photoHistoryButton.style.display = hasPhotos ? 'flex' : 'none';
}

// Direction Navigation Handler
function setupDirectionNav() {
  const directionButtons = document.querySelectorAll('.direction-button');

  directionButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons first
      directionButtons.forEach((button) => {
        button.classList.remove('active');
      });

      // Add active class to clicked button
      btn.classList.add('active');

      // Update selected direction
      const direction = btn.dataset.direction;
      state.selectedDirection = direction;
      state.selectedFilters = new Set(['all']);
      state.selectedDetails = new Set(['all']);

      updateBlueprintImage(direction);

      // Update filter buttons for new direction
      loadFilterButtons(direction);

      // Update pinned icons visibility
      updateBlueprintIcons();

      // Update visibility
      updateBulkPhotoHistoryButtonVisibility();

      // Update checklist items
      updateChecklist();
    });
  });
}

function updateBlueprintImage(direction) {
  const blueprintImage = document.querySelector('#blueprint-image');
  // Update blueprint image based on direction
  blueprintImage.src = `./assets/images/${direction}-blueprint.jpg`;
}

function getFilterButtonsByDirection(direction) {
  // Define filter options for each direction
  const filterMap = {
    north: [
      { id: 'wall', icon: 'format_paint', name: '外壁' },
      { id: 'window', icon: 'window', name: '窓' },
      { id: 'drain', icon: 'water_drop', name: '排水' },
    ],
    east: [
      { id: 'wall', icon: 'format_paint', name: '外壁' },
      { id: 'window', icon: 'window', name: '窓' },
    ],
    south: [
      { id: 'wall', icon: 'format_paint', name: '外壁' },
      { id: 'window', icon: 'window', name: '窓' },
      { id: 'drain', icon: 'water_drop', name: '排水' },
    ],
    west: [
      { id: 'wall', icon: 'format_paint', name: '外壁' },
      { id: 'window', icon: 'window', name: '窓' },
    ],
  };

  const filters = filterMap[direction] || [];

  return filters
    .map(
      (filter) => `
    <button class="filter-button" data-filter="${filter.id}">
      <span>${filter.name}</span>
      <span class="material-icons dropdown-icon">chevron_right</span>
    </button>
  `
    )
    .join('');
}

// Helper function to update single item UI
function updateChecklistItemUI(itemElement, itemData) {
  const checkButton = itemElement.querySelector('.check-button');
  const secondButton = itemElement.querySelector(
    '.close-button, .photo-button'
  );

  // Update check button
  checkButton.classList.toggle('active', itemData.status === 'completed');

  // Update border based on status
  if (itemData.status === 'completed') {
    itemElement.style.borderLeft = '2px solid var(--success-color)';
  } else if (itemData.status === 'issue') {
    itemElement.style.borderLeft = '2px solid var(--error-color)';
  } else {
    itemElement.style.borderLeft = '1px solid var(--border-color)';
  }

  // Update second button
  if (itemData.status === 'completed') {
    secondButton.className = 'action-button photo-button';
    secondButton.innerHTML = '<span class="material-icons">photo_camera</span>';
  } else {
    secondButton.className = 'action-button close-button';
    secondButton.innerHTML = '<span class="material-icons">close</span>';

    // Add active class for issue status
    if (itemData.status === 'issue') {
      secondButton.classList.add('active');
    }
  }
}

// Load filter buttons based on direction
function loadFilterButtons(direction) {
  const filterHTML = getFilterButtonsByDirection(direction);
  const filterNav = document.querySelector('.filter-nav');

  if (!filterNav) return;

  // Reset filter state
  state.selectedDetails.clear();
  state.selectedDetails.add('all');

  // Update filter buttons
  filterNav.innerHTML = filterHTML;

  // Setup filter button handlers
  setupFilterButtons();

  // Close any open dropdown
  const filterDropdown = document.getElementById('filter-dropdown');
  if (filterDropdown) {
    filterDropdown.classList.remove('show');
  }
}

// 2. Fix recursive loop in checklist update
function setupChecklistItemHandlers() {
  document.querySelectorAll('.checklist-item').forEach((item) => {
    const checkButton = item.querySelector('.check-button');
    const secondButton = item.querySelector('.close-button, .photo-button');
    const photoIndicator = item.querySelector('.checklist-text-image');
    const itemId = parseInt(item.dataset.id);

    // Remove existing listeners to prevent duplicates
    checkButton?.replaceWith(checkButton.cloneNode(true));
    secondButton?.replaceWith(secondButton.cloneNode(true));
    if (photoIndicator)
      photoIndicator.replaceWith(photoIndicator.cloneNode(true));

    // Get fresh references after replacement
    const newCheckButton = item.querySelector('.check-button');
    const newSecondButton = item.querySelector('.close-button, .photo-button');
    const newPhotoIndicator = item.querySelector('.checklist-text-image');

    // Add click handler for the photo indicator
    if (newPhotoIndicator) {
      newPhotoIndicator.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering the item click
        showItemPhotoHistory(itemId);
      });

      // Make it look clickable
      newPhotoIndicator.style.cursor = 'pointer';
    }

    // Add new listeners
    newCheckButton?.addEventListener('click', () => {
      const checklistItem = state.checklist.find((i) => i.id === itemId);
      if (!checklistItem) return;

      checklistItem.status =
        checklistItem.status === 'completed' ? 'pending' : 'completed';

      // Update UI without triggering full checklist update
      updateChecklistItemUI(item, checklistItem);
      updateProgress();
    });

    newSecondButton?.addEventListener('click', () => {
      if (newSecondButton.classList.contains('photo-button')) {
        openCamera(itemId);
      } else {
        item.style.borderLeft = '2px solid var(--error-color)';
        newSecondButton.classList.add('active');
        openIssueModal(itemId);
      }
    });
  });
}

// Add this new function to show photo history for a specific item
function showItemPhotoHistory(itemId) {
  const item = state.checklist.find((i) => i.id === parseInt(itemId));
  if (!item) return;

  // Initialize photos array if needed
  if (!item.photos) {
    item.photos = [];
  }

  // Create modal for the photo history
  const modal = document.createElement('div');
  modal.className = 'modal item-photo-history-modal';

  // Sort photos by timestamp (newest first)
  const photos = [...item.photos].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${item.name} - 写真履歴</h3>
        <button class="close-modal-button">
          <span class="material-icons">close</span>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="item-photo-gallery">
          ${photos
            .map(
              (photo) => `
            <div class="gallery-item">
              <div class="gallery-image-container">
                <img src="${photo.url}" alt="Issue photo">
              </div>
              <div class="gallery-item-details">
                <p class="gallery-item-time">${formatDate(photo.timestamp)}</p>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
        
        <div class="upload-container">
          <label for="item-photo-upload-${itemId}" class="upload-button">
            <span class="material-icons">upload</span>
            <span>写真をアップロード</span>
          </label>
          <input type="file" id="item-photo-upload-${itemId}" accept="image/*" style="display: none;" />
        </div>
      </div>
    </div>
  `;

  // Add event handler to close button
  document.body.appendChild(modal);
  modal.style.display = 'flex';

  const closeButton = modal.querySelector('.close-modal-button');
  closeButton.addEventListener('click', () => {
    modal.remove();
  });

  // Handle file upload
  const fileInput = modal.querySelector(`#item-photo-upload-${itemId}`);
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください。');
      return;
    }

    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
      <div class="spinner"></div>
      <p>アップロード中...</p>
    `;
    loadingIndicator.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 100;
    `;
    modal.querySelector('.modal-content').appendChild(loadingIndicator);

    // Read the file
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target.result;

      // Add to item photos
      const photoId = 'photo_' + Date.now();
      const timestamp = new Date().toISOString();

      // Add the photo to the item
      item.photos.push({
        id: photoId,
        url: imageUrl,
        timestamp: timestamp,
        isUploaded: true,
      });

      // Update UI to show new photo count
      updateChecklist();

      // Update photo gallery in the modal
      updateItemPhotoGallery(modal, item);

      // Remove loading indicator
      loadingIndicator.remove();

      // Reset file input
      fileInput.value = '';
    };

    reader.readAsDataURL(file);
  });
}

// Add this helper function to update the item photo gallery
function updateItemPhotoGallery(modal, item) {
  const galleryContainer = modal.querySelector('.item-photo-gallery');
  if (!galleryContainer) return;

  const photos = [...item.photos].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  galleryContainer.innerHTML = photos
    .map(
      (photo) => `
    <div class="gallery-item">
      <div class="gallery-image-container">
        <img src="${photo.url}" alt="Issue photo">
      </div>
      <div class="gallery-item-details">
        <p class="gallery-item-time">${formatDate(photo.timestamp)}</p>
      </div>
    </div>
  `
    )
    .join('');
}

// Handle item completion
function toggleItemComplete(itemId, item, button) {
  const checklistItem = state.checklist.find((i) => i.id === itemId);

  if (!checklistItem) return;

  checklistItem.status =
    checklistItem.status === 'completed' ? 'pending' : 'completed';
  button.classList.toggle('active');
  item.classList.toggle('completed');

  if (checklistItem.status === 'completed') {
    item.style.borderLeft = '4px solid var(--success-color)';
  } else {
    item.style.borderLeft = 'none';
  }

  updateProgress();
}

function updateProgress() {
  const total = state.checklist.length;
  const completed = state.checklist.filter(
    (item) => item.status === 'completed' || item.status === 'issue'
  ).length;
  const completedCount = state.checklist.filter(
    (item) => item.status === 'completed'
  ).length;
  const issues = state.checklist.filter(
    (item) => item.status === 'issue'
  ).length;

  // Update counts
  document.getElementById('total-items').textContent = total;
  document.getElementById('completed-items').textContent = completed;
  document.getElementById('completed-count').textContent = completedCount;
  document.getElementById('issue-count').textContent = issues;

  // Update progress bar
  const percentage = Math.round(((completed + issues) / total) * 100);
  document.getElementById('progress-percentage').textContent = `${percentage}%`;
  document.getElementById('progress-bar').style.width = `${percentage}%`;
}

// Add this new function to properly handle camera access
function openCamera(itemId) {
  // First check if the MediaDevices API is supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showCameraError('このブラウザはカメラをサポートしていません。');
    return;
  }

  // Check if we're in a secure context (HTTPS or localhost)
  if (!window.isSecureContext) {
    showCameraError('カメラを使用するには、安全な接続（HTTPS）が必要です。');
    return;
  }

  // Show loading indicator
  const loadingModal = document.createElement('div');
  loadingModal.className = 'modal loading-modal';
  loadingModal.innerHTML = `
    <div class="modal-content" style="background: rgba(255,255,255,0.9); padding: 20px; border-radius: 8px; text-align: center;">
      <div style="margin-bottom: 15px;">
        <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
      </div>
      <p>カメラにアクセスしています...</p>
    </div>
  `;

  // Add spinner animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(loadingModal);
  loadingModal.style.display = 'flex';

  // Try to access camera with timeout
  const cameraPromise = navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'environment', // Use back camera if available
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  });

  // Add a timeout in case permissions dialog is ignored
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error('カメラへのアクセスがタイムアウトしました。')),
      10000
    );
  });

  // Race between camera access and timeout
  Promise.race([cameraPromise, timeoutPromise])
    .then((stream) => {
      // Success! Remove loading and show camera
      loadingModal.remove();
      const modal = createCameraModal(stream, itemId);
      document.body.appendChild(modal);
    })
    .catch((err) => {
      // Handle specific errors
      loadingModal.remove();
      console.error('Camera error:', err);

      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError'
      ) {
        showCameraError(
          'カメラへのアクセスが拒否されました。ブラウザの設定でカメラのアクセス許可を確認してください。'
        );
      } else if (
        err.name === 'NotFoundError' ||
        err.name === 'DevicesNotFoundError'
      ) {
        showCameraError(
          'カメラデバイスが見つかりません。デバイスにカメラが接続されていることを確認してください。'
        );
      } else if (
        err.name === 'NotReadableError' ||
        err.name === 'TrackStartError'
      ) {
        showCameraError(
          'カメラにアクセスできませんでした。他のアプリがカメラを使用していないか確認してください。'
        );
      } else {
        showCameraError(
          'カメラエラー: ' + (err.message || '不明なエラーが発生しました。')
        );
      }
    });
}

function openIssueModal(itemId) {
  const item = state.checklist.find((i) => i.id === itemId);
  if (!item) return;

  const modal = document.createElement('div');
  modal.className = 'modal issue-modal';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${item.name}</h3>
        <button class="close-modal-button">
          <span class="material-icons">close</span>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="issue-form">
          <textarea 
            placeholder="問題の詳細を入力してください"
            class="issue-description"
          ></textarea>
        </div>

        <div class="issue-photos-section">
          <div class="photos-header">
            <h4>写真一覧</h4>
          </div>
          
          <div class="issue-photos">
            ${item.photos
              .map(
                (photo) => `
                <div class="photo-preview">
                  <img src="${photo.url}" alt="Issue photo">
                  <button class="remove-photo" onclick="removePhoto(${itemId}, '${photo.id}')">
                    <span class="material-icons">close</span>
                  </button>
                </div>
              `
              )
              .join('')}
              <div class="photo-preview open-camera" onclick="openCamera(${itemId})">
                <span class="material-icons camera-icon">photo_camera</span>
              </div>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="cancel-button">キャンセル</button>
        <button class="save-button">保存</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  setupIssueModalHandlers(modal, itemId);
  modal.style.display = 'flex';
}

function openPhotoHistory(itemId) {
  const item = state.checklist.find((i) => i.id === itemId);
  if (!item?.photos?.length) return;

  const modal = document.createElement('div');
  modal.className = 'modal photo-history-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>写真履歴</h3>
      <div class="photo-grid">
        ${item.photos
          .map(
            (photo) => `
          <div class="photo-item">
            <img src="${photo.url}" alt="Inspection photo">
            <span class="photo-date">${formatDate(photo.timestamp)}</span>
          </div>
        `
          )
          .join('')}
      </div>
      <button class="close-button">閉じる</button>
    </div>
  `;

  document.body.appendChild(modal);
  setupPhotoHistoryModalHandlers(modal);
}

// Replace the getItemIconConfig function with this improved version
function getItemIconConfig(part, detail) {
  // Define mapping of part and detail to shape and color
  const iconConfigs = {
    // Wall-related items
    wall: {
      crack: { shape: 'circle', color: '#ef4444' },
      paint: { shape: 'square', color: '#3b82f6' },
      stain: { shape: 'triangle', color: '#84cc16' },
    },
    // Window-related items
    window: {
      glass: { shape: 'square', color: '#3b82f6' },
      frame: { shape: 'circle', color: '#ef4444' },
      seal: { shape: 'triangle', color: '#84cc16' },
    },
    // Drainage-related items
    drain: {
      gutter: { shape: 'triangle', color: '#ef4444' },
      pipe: { shape: 'square', color: '#3b82f6' },
      drain: { shape: 'circle', color: '#84cc16' },
    },
  };

  // Return configuration or default
  return (
    (iconConfigs[part] && iconConfigs[part][detail]) || {
      shape: 'circle',
      color: '#64748b',
    }
  );
}
// Update the getFilterChips function to use consistent icons
function getFilterChips(filter) {
  // Define filter options for each category with consistent icons
  const filterOptions = {
    wall: [
      { id: 'crack', icon: 'architecture', name: 'ひび割れ' },
      { id: 'paint', icon: 'format_paint', name: '塗装剥がれ' },
      { id: 'stain', icon: 'opacity', name: '汚れ' },
    ],
    window: [
      { id: 'glass', icon: 'window', name: 'ガラス' },
      { id: 'frame', icon: 'crop_square', name: '枠' },
      { id: 'seal', icon: 'border_style', name: 'シール' },
    ],
    drain: [
      { id: 'gutter', icon: 'water_drop', name: '雨どい' },
      { id: 'pipe', icon: 'timeline', name: '配管' },
      { id: 'drain', icon: 'stream', name: '排水口' },
    ],
  };

  // Add "All" option at the beginning
  let options = [];

  // Add specific options for this filter type
  if (filterOptions[filter]) {
    options = options.concat(filterOptions[filter]);
  }

  return options
    .map(
      (option) => `
    <button class="filter-chip" data-detail="${option.id}">
      <span class="material-icons">${option.icon}</span>
      <span>${option.name}</span>
    </button>
  `
    )
    .join('');
}

// Update getPartIcon function to use consistent icons with filters
function getPartIcon(part) {
  const icons = {
    walls: 'format_paint', // Consistent with wall filter
    roof: 'roofing', // Updated to a more appropriate icon
    foundation: 'water_drop', // Consistent with drain filter
  };
  return icons[part] || 'circle';
}

// Add a mapping function for detail icons to be consistent
function getDetailIcon(detail) {
  const icons = {
    structure: 'architecture',
    paint: 'format_paint',
    material: 'opacity',
    window: 'window',
    door: 'door_front',
  };
  return icons[detail] || 'circle';
}

function setupFilterChips() {
  const chips = document.querySelectorAll('.filter-chip');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const detail = chip.dataset.detail;

      // Handle multi-selection
      if (detail === 'all') {
        chips.forEach((c) => c.classList.remove('active'));
        state.selectedDetails.clear();
        state.selectedDetails.add('all');
      } else {
        const allChip = document.querySelector(
          '.filter-chip[data-detail="all"]'
        );
        if (allChip) allChip.classList.remove('active');
        state.selectedDetails.delete('all');

        chip.classList.toggle('active');
        if (chip.classList.contains('active')) {
          state.selectedDetails.add(detail);
        } else {
          state.selectedDetails.delete(detail);
        }
      }

      updateChecklist();
    });
  });
}

function updateFilteredItems(selectedDetails) {
  // Filter items based on selected details
  const filteredItems = checklist.filter((item) => {
    if (selectedDetails.includes('all')) return true;
    return selectedDetails.includes(item.detail);
  });

  // Update display
  updateChecklist(filteredItems);
}

function setupFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-button');
  const filterDropdown = document.getElementById('filter-dropdown');

  let activeButton = null;

  // Make sure selectedFilters is initialized
  if (!state.selectedFilters) {
    state.selectedFilters = new Set();
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;

      if (activeButton === button) {
        // Close dropdown if clicking active button
        closeDropdown();
      } else {
        // Open dropdown for new button
        openDropdown(button, filter);
      }
    });
  });

  function openDropdown(button, filter) {
    // Update active states
    if (activeButton) {
      activeButton.classList.remove('active');
    }
    button.classList.add('active');
    activeButton = button;

    // Update selected filter
    state.selectedFilters.clear();
    state.selectedFilters.add(filter);

    // Clear selected details when switching filter
    state.selectedDetails.clear();

    // Get filter chips based on selected filter
    const chips = getFilterChips(filter);

    // Update dropdown content
    const container = filterDropdown.querySelector('.filter-chips-container');
    container.innerHTML = chips;

    // Show dropdown
    filterDropdown.classList.add('show');

    // Position dropdown next to active button
    const buttonRect = button.getBoundingClientRect();
    filterDropdown.style.top = `${buttonRect.top}px`;
    filterDropdown.style.left = `${buttonRect.width + 40}px`;

    // Add chip click handlers
    setupFilterChips();

    // Update checklist to show filtered items for this filter
    updateChecklist();
  }

  function closeDropdown() {
    if (activeButton) {
      activeButton.classList.remove('active');
      activeButton = null;
    }
    filterDropdown.classList.remove('show');
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (
      !e.target.closest('.filter-button') &&
      !e.target.closest('.filter-dropdown')
    ) {
      closeDropdown();
    }
  });
}

// 3. Update setupFilterChips to properly handle chip selection
function setupFilterChips() {
  const chips = document.querySelectorAll('.filter-chip');

  chips.forEach((chip) => {
    // Reset chip state when loading
    chip.classList.remove('active');

    // Check if this chip is already selected
    if (state.selectedDetails.has(chip.dataset.detail)) {
      chip.classList.add('active');
    }

    chip.addEventListener('click', () => {
      const detail = chip.dataset.detail;

      // Handle multi-selection
      if (detail === 'all') {
        chips.forEach((c) => c.classList.remove('active'));
        state.selectedDetails.clear();
        state.selectedDetails.add('all');
      } else {
        // Remove 'all' selection if it exists
        state.selectedDetails.delete('all');
        const allChip = document.querySelector(
          '.filter-chip[data-detail="all"]'
        );
        if (allChip) allChip.classList.remove('active');

        // Toggle this chip's state
        chip.classList.toggle('active');

        if (chip.classList.contains('active')) {
          state.selectedDetails.add(detail);
        } else {
          state.selectedDetails.delete(detail);
        }
      }

      // Update the checklist display
      updateChecklist();
    });
  });
}

// Also update the renderChecklist function to ensure items are properly filtered by direction
function renderChecklist(container, filteredItems = null) {
  // Get items to display
  const itemsToDisplay =
    filteredItems ||
    state.checklist.filter((item) => {
      // Always filter by direction first
      if (item.direction !== state.selectedDirection) return false;

      // If we have active filters but "all" is selected, show everything for this direction
      if (state.selectedFilters.has('all')) return true;

      // Rest of the filtering logic remains the same
      if (state.selectedFilters.size > 0 || state.selectedDetails.size > 0) {
        // Check if the item's part matches any selected filter
        const partMatch = Array.from(state.selectedFilters).some((filter) => {
          // Map filter IDs to actual part values in checklist items
          const partMapping = {
            wall: 'walls',
            window: 'walls', // Note: window items are under 'walls' part but with 'window' detail
            drain: 'foundation',
          };

          return item.part === partMapping[filter];
        });

        // Check if item's detail matches any selected detail
        const detailMatch =
          state.selectedDetails.size > 0
            ? Array.from(state.selectedDetails).some((detail) => {
                // Map detail IDs to actual detail values
                const detailMapping = {
                  crack: 'structure',
                  paint: 'paint',
                  stain: 'material',
                  glass: 'window',
                  frame: 'window',
                  seal: 'door',
                  gutter: 'structure',
                  pipe: 'material',
                  drain: 'material',
                };

                return item.detail === detailMapping[detail];
              })
            : true;

        // Apply appropriate filtering logic
        if (
          state.selectedFilters.size > 0 &&
          state.selectedDetails.size === 0
        ) {
          return partMatch;
        }
        if (
          state.selectedDetails.size > 0 &&
          state.selectedFilters.size === 0
        ) {
          return detailMatch;
        }
        return partMatch && detailMatch;
      }

      // Default: show all items for current direction
      return true;
    });

  // Group items by part
  const groupedByPart = itemsToDisplay.reduce((groups, item) => {
    if (!groups[item.part]) {
      groups[item.part] = [];
    }
    groups[item.part].push(item);
    return groups;
  }, {});

  // Render grouped items
  container.innerHTML = Object.entries(groupedByPart)
    .map(([part, items]) => renderChecklistGroup(part, items))
    .join('');
}

// 3. Optimize state updates
function updateChecklist(filteredItems = null) {
  const container = document.querySelector('.checklist');
  if (!container) return;

  // Render checklist without setting up handlers
  renderChecklist(container, filteredItems);

  // Set up handlers once after rendering
  setupChecklistItemHandlers();

  // Update progress once
  updateProgress();

  // Fix scrolling issues
  fixChecklistScrolling();
}

// Helper function to render checklist group
// Update renderChecklistGroup to include detail icons
function renderChecklistGroup(part, items) {
  // Group by detail type
  const groupedByDetail = {};

  items.forEach((item) => {
    if (!groupedByDetail[item.detail]) {
      groupedByDetail[item.detail] = [];
    }
    groupedByDetail[item.detail].push(item);
  });

  // Create part header
  let html = '';

  // Add each detail group
  Object.entries(groupedByDetail).forEach(([detail, detailItems]) => {
    if (detailItems.length > 0) {
      // Count completed or issue items in this detail group
      const completedCount = detailItems.filter(
        (item) => item.status === 'completed' || item.status === 'issue'
      ).length;

      html += `
        <div class="detail-group">
          <div class="detail-header">
            <div class="detail-title">
              <span class="material-icons">${getDetailIcon(detail)}</span>
              <span class="detail-name">${getDetailName(detail)}</span>
            </div>
            <span class="detail-count">${completedCount}/${
        detailItems.length
      }</span>
          </div>
          ${detailItems.map((item) => renderChecklistItem(item)).join('')}
        </div>
      `;
    }
  });

  html += `</div>`;
  return html;
}

// Add this helper function to get detail names
function getDetailName(detail) {
  const names = {
    structure: '構造',
    paint: '塗装',
    material: '素材',
    window: '窓',
    door: 'ドア',
  };
  return names[detail] || detail;
}

// Helper function to render checklist item
function renderChecklistItem(item) {
  return `
    <div class="checklist-item ${item.status}" data-id="${item.id}">
      <div class="checklist-header">
        <div class="shape-icon ${item.shape}" 
             style="${getShapeStyle(item)};">
        </div>
        <div class="checklist-text"><span>${item.name}</span> ${
    item.photos.length > 0
      ? `
          <div class="checklist-text-image" data-item-id="${item.id}">
            <span class="material-icons">images</span>
            <span class="photo-count">${item.photos.length}</span>
          </div>
        `
      : ''
  }</div>
      </div>
      <div class="checklist-actions">
        <button class="action-button check-button ${
          item.status === 'completed' ? 'active' : ''
        }">
          <span class="material-icons">check</span>
        </button>
        <button class="action-button ${
          item.status === 'completed' ? 'photo-button' : 'close-button'
        }">
          <span class="material-icons">${
            item.status === 'completed' ? 'photo_camera' : 'close'
          }</span>
        </button>
      </div>
    </div>
  `;
}

// Modified createCameraModal function with better error handling
function createCameraModal(stream, itemId, currentModal = null) {
  // Create the overlay container that will cover the entire screen
  const overlay = document.createElement('div');
  overlay.className = 'camera-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #000;
    z-index: 9999999;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  `;

  // Create the camera view container
  const cameraViewContainer = document.createElement('div');
  cameraViewContainer.className = 'camera-view-container';
  cameraViewContainer.style.cssText = `
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  // Create the video element
  const video = document.createElement('video');
  video.id = 'camera-stream';
  video.autoplay = true;
  video.playsInline = true;
  video.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: cover;
  `;

  // Create canvas for photo capture
  const canvas = document.createElement('canvas');
  canvas.id = 'photo-canvas';
  canvas.style.cssText = `
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  `;

  // Create photo preview element (will be shown after capture)
  const photoPreview = document.createElement('img');
  photoPreview.className = 'photo-preview';
  photoPreview.style.cssText = `
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    background-color: #000;
  `;

  // Create camera controls container
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'camera-controls';
  controlsContainer.style.cssText = `
    position: absolute;
    bottom: 20px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 40px;
    padding: 20px;
    z-index: 10001;
  `;

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.className = 'camera-button close-button';
  closeButton.style.cssText = `
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.3);
    border: none;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  `;
  closeButton.innerHTML = `<span class="material-icons" style="color: white; font-size: 24px;">close</span>`;

  // Create capture button
  const captureButton = document.createElement('button');
  captureButton.className = 'camera-button capture-button';
  captureButton.style.cssText = `
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background-color: white;
    border: 4px solid rgba(255, 255, 255, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  `;
  captureButton.innerHTML = `<span class="material-icons" style="color: #f44336; font-size: 30px;">photo_camera</span>`;

  // Create retake button (hidden initially)
  const retakeButton = document.createElement('button');
  retakeButton.className = 'camera-button retake-button';
  retakeButton.style.cssText = `
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.3);
    border: none;
    display: none;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  `;
  retakeButton.innerHTML = `<span class="material-icons" style="color: white; font-size: 24px;">replay</span>`;

  // Create save button (hidden initially)
  const saveButton = document.createElement('button');
  saveButton.className = 'camera-button save-button';
  saveButton.style.cssText = `
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background-color: #4CAF50;
    border: 4px solid rgba(255, 255, 255, 0.5);
    display: none;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  `;
  saveButton.innerHTML = `<span class="material-icons" style="color: white; font-size: 30px;">check</span>`;

  // Add all elements to the DOM
  controlsContainer.appendChild(closeButton);
  controlsContainer.appendChild(captureButton);
  controlsContainer.appendChild(retakeButton);
  controlsContainer.appendChild(saveButton);

  cameraViewContainer.appendChild(video);
  cameraViewContainer.appendChild(canvas);
  cameraViewContainer.appendChild(photoPreview);
  cameraViewContainer.appendChild(controlsContainer);

  overlay.appendChild(cameraViewContainer);
  document.body.appendChild(overlay);

  // Connect the video to the stream
  try {
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play().catch((err) => {
        console.error('Error playing video:', err);
        closeOverlay();
        showCameraError('カメラの起動中にエラーが発生しました。');
      });
    };
  } catch (err) {
    console.error('Error setting video source:', err);
    closeOverlay();
    showCameraError('カメラのストリーム設定中にエラーが発生しました。');
    return overlay;
  }

  // Handle photo capture
  captureButton.addEventListener('click', () => {
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.9);

    // Show preview
    photoPreview.src = imageData;
    photoPreview.style.display = 'block';
    video.style.display = 'none';

    // Update controls
    captureButton.style.display = 'none';
    retakeButton.style.display = 'flex';
    saveButton.style.display = 'flex';
  });

  // Handle retake photo
  retakeButton.addEventListener('click', () => {
    // Hide preview, show video
    photoPreview.style.display = 'none';
    video.style.display = 'block';

    // Update controls
    captureButton.style.display = 'flex';
    retakeButton.style.display = 'none';
    saveButton.style.display = 'none';
  });

  // Handle save photo
  saveButton.addEventListener('click', () => {
    if (itemId) {
      const item = state.checklist.find((i) => i.id === parseInt(itemId));
      if (item) {
        // Initialize photos array if needed
        if (!item.photos) {
          item.photos = [];
        }

        // Add new photo to item
        const photoId = 'photo_' + Date.now();
        item.photos.push({
          id: photoId,
          url: photoPreview.src,
          timestamp: new Date().toISOString(),
        });

        // Update UI
        updateChecklist();

        // If we have a reference to the current issue modal, update its photos
        if (currentModal) {
          updateIssueModalPhotos(currentModal, item);
        }
      }
    }

    // Close camera overlay
    closeOverlay();
  });

  // Handle close
  closeButton.addEventListener('click', closeOverlay);

  // Function to close and clean up
  function closeOverlay() {
    // Stop all video tracks
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    // Remove overlay from DOM
    overlay.remove();
  }

  // Add swipe down to close
  let touchStartY = 0;
  overlay.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  });

  overlay.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartY;

    // If swiping down significantly, close the overlay
    if (diff > 100) {
      closeOverlay();
    }
  });

  // Return the overlay
  return overlay;
}

// Add this new function to update photos in the issue modal
function updateIssueModalPhotos(modal, item) {
  if (!modal || !item) return;

  const photosContainer = modal.querySelector('.issue-photos');
  if (!photosContainer) return;

  // Generate HTML for all photos plus the camera button
  photosContainer.innerHTML =
    item.photos
      .map(
        (photo) => `
      <div class="photo-preview">
        <img src="${photo.url}" alt="Issue photo">
        <button class="remove-photo" onclick="removePhoto(${item.id}, '${photo.id}')">
          <span class="material-icons">close</span>
        </button>
      </div>
    `
      )
      .join('') +
    `<div class="photo-preview open-camera" onclick="showCameraConfirm(${item.id})">
      <span class="material-icons camera-icon">photo_camera</span>
    </div>`;
}

// Also update the removePhoto function to refresh the modal
function removePhoto(itemId, photoId) {
  const item = state.checklist.find((i) => i.id === parseInt(itemId));
  if (!item || !item.photos) return;

  // Remove the photo from the array
  item.photos = item.photos.filter((photo) => photo.id !== photoId);

  // Update the UI
  updateChecklist();

  // Update the current modal if it's open
  const currentModal = document.querySelector('.issue-modal');
  if (currentModal) {
    updateIssueModalPhotos(currentModal, item);
  }
}

function setupShapeButtonEvents() {
  const shapeButtons = document.querySelectorAll('.shape-button');
  const shapeTools = document.querySelector('.shape-tools');

  shapeButtons.forEach((button) => {
    // Add mouse/touch events for dragging
    let isDragging = false;
    let startX, startY;

    // Handle touch start
    button.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;

        const toolsRect = shapeTools.getBoundingClientRect();
        state.dragStartedInTools =
          touch.clientX >= toolsRect.left &&
          touch.clientX <= toolsRect.right &&
          touch.clientY >= toolsRect.top &&
          touch.clientY <= toolsRect.bottom;

        // Start drag after long press
        state.longPressTimer = setTimeout(() => {
          isDragging = true;
          state.selectedShape = {
            shape: button.dataset.shape,
            color: button.dataset.color,
          };
          startDrag(e);
        }, 200);
      },
      { passive: false }
    );

    // Handle touch move
    button.addEventListener(
      'touchmove',
      (e) => {
        if (!isDragging) {
          // Cancel long press if moved before timer
          clearTimeout(state.longPressTimer);
          return;
        }
        e.preventDefault();
        handleDrag(e);
      },
      { passive: false }
    );

    // Handle touch end
    button.addEventListener('touchend', (e) => {
      clearTimeout(state.longPressTimer);
      if (isDragging) {
        endDrag(e);
        isDragging = false;
      } else {
        // Handle as normal click if not dragging
        const touch = e.changedTouches[0];
        const moveX = Math.abs(touch.clientX - startX);
        const moveY = Math.abs(touch.clientY - startY);

        // Only trigger click if minimal movement
        if (moveX < 5 && moveY < 5) {
          selectShape(button.dataset.shape, button.dataset.color);
        }
      }
    });

    // Cancel drag on touch cancel
    button.addEventListener('touchcancel', () => {
      clearTimeout(state.longPressTimer);
      if (isDragging) {
        cleanup();
        isDragging = false;
      }
    });
  });
}

function startDrag(e) {
  const touch = e.touches[0];

  // Create drag icon
  state.dragIcon = document.createElement('div');
  state.dragIcon.className = 'dragged-icon';

  // Set initial position
  state.dragIcon.style.cssText = `
    position: fixed;
    z-index: 9999;
    pointer-events: none;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 24px;
    left: ${touch.clientX}px;
    top: ${touch.clientY}px;
  `;

  // Add shape content
  state.dragIcon.innerHTML = createShapeHTML(state.selectedShape);
  document.body.appendChild(state.dragIcon);

  state.isDragging = true;
}

function handleDrag(e) {
  if (!state.isDragging || !state.dragIcon) return;

  const touch = e.touches[0];

  // Update drag icon position
  state.dragIcon.style.left = `${touch.clientX}px`;
  state.dragIcon.style.top = `${touch.clientY}px`;

  // Check drop zone
  const blueprintContainer = document.querySelector(
    '.blueprint-image-container'
  );
  const rect = blueprintContainer.getBoundingClientRect();

  if (isOverDropZone(touch, rect)) {
    blueprintContainer.classList.add('drop-highlight');
  } else {
    blueprintContainer.classList.remove('drop-highlight');
  }
}

function endDrag(e) {
  if (!state.isDragging) return;

  const touch = e.changedTouches[0];
  const blueprintContainer = document.querySelector(
    '.blueprint-image-container'
  );

  const rect = blueprintContainer.getBoundingClientRect();

  if (isOverDropZone(touch, rect)) {
    // Calculate drop position relative to container
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Add icon at drop position
    addPinnedIcon(x, y);
  }

  cleanup();
}

// Thay đổi từ let selectShape = null thành:
function selectShape(shape, color) {
  // Update selected shape in state
  if (
    state.selectedShape &&
    state.selectedShape.shape === shape &&
    state.selectedShape.color === color
  ) {
    // If clicking the same shape, deselect it
    state.selectedShape = null;
  } else {
    // Select new shape
    state.selectedShape = { shape, color };
  }

  // Update UI
  updateShapeButtons();
}

function cleanup() {
  state.isDragging = false;
  if (state.dragIcon) {
    state.dragIcon.remove();
    state.dragIcon = null;
  }

  const blueprintContainer = document.querySelector(
    '.blueprint-image-container'
  );
  blueprintContainer.classList.remove('drop-highlight');
}

function addPinnedIcon(x, y) {
  // Create new icon with hasIssue flag
  const blueprint = document.querySelector('#blueprint-image');
  const blueprintRect = blueprint.getBoundingClientRect();
  const centerX = blueprintRect.width / 2;
  const centerY = blueprintRect.height / 2;
  const currentScale = state.zoomLevel || 1;

  // Store unscaled coordinates
  const originalX = centerX + (x - centerX) / currentScale;
  const originalY = centerY + (y - centerY) / currentScale;

  // Create new icon with selected shape
  const newIcon = {
    iconId: null,
    id: Date.now().toString(),
    shape: state.selectedShape.shape,
    color: state.selectedShape.color,
    x: originalX,
    y: originalY,
    direction: state.selectedDirection,
    hasIssue: false,
  };

  // Find matching checklist item for this shape and color
  const matchingItem = state.checklist.find((item) => {
    return (
      item.shape === state.selectedShape.shape &&
      item.color === state.selectedShape.color
    );
  });

  newIcon.iconId = matchingItem?.id;

  // Add to pinned icons list
  state.pinnedIcons.push(newIcon);

  // If we found a matching item
  if (matchingItem) {
    console.log('Found matching item:', matchingItem);

    // Initialize pinnedIcons array if needed
    if (!matchingItem.pinnedIcons) {
      matchingItem.pinnedIcons = [];
    }

    // Link icon to checklist item
    matchingItem.pinnedIcons.push(newIcon.id);

    // Mark icon as having issue
    newIcon.hasIssue = true;

    // Update the UI to show the issue indicator
    updateBlueprintIcons();

    // Ensure modal opens with a slight delay to allow UI to update
    setTimeout(() => {
      console.log('Opening modal for item ID:', matchingItem.id);
      openIssueModal(matchingItem.id);
    }, 100);
  } else {
    console.log('No matching item found for shape:', state.selectedShape);
    updateBlueprintIcons();
  }
}

function createShapeHTML({ shape, color }) {
  switch (shape) {
    case 'circle':
      return `<div class="circle-shape" style="background-color: ${color}; width: 24px; height: 24px;"></div>`;
    case 'triangle':
      return `<div class="triangle-shape" style="border-left: 12px solid transparent; border-right: 12px solid transparent; border-bottom: 24px solid ${color};"></div>`;
    case 'square':
      return `<div class="square-shape" style="background-color: ${color}; width: 24px; height: 24px;"></div>`;
    default:
      return '';
  }
}

function isOverDropZone(touch, rect) {
  return (
    touch.clientX >= rect.left &&
    touch.clientX <= rect.right &&
    touch.clientY >= rect.top &&
    touch.clientY <= rect.bottom
  );
}

function setupBlueprintZoom() {
  const container = document.querySelector('.blueprint-container');
  const blueprint = document.querySelector('#blueprint-image');
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');

  if (!container || !blueprint || !zoomInBtn || !zoomOutBtn) return;

  const ZOOM_STEP = 0.2;
  const MAX_ZOOM = 3;
  const MIN_ZOOM = 1;

  let currentScale = 1;

  function updateZoom(newScale) {
    currentScale = newScale;
    state.zoomLevel = currentScale;

    // Update blueprint scale
    blueprint.style.transform = `scale(${currentScale})`;

    // Update pinned icons positions
    const icons = document.querySelectorAll('.pinned-icon');
    const containerRect = container.getBoundingClientRect();
    const blueprintRect = blueprint.getBoundingClientRect();

    icons.forEach((icon) => {
      const originalX = parseFloat(icon.dataset.originalX);
      const originalY = parseFloat(icon.dataset.originalY);

      // Calculate position relative to blueprint center
      const centerX = blueprintRect.width / 2;
      const centerY = blueprintRect.height / 2;

      // Apply scale from center
      const scaledX = centerX + (originalX - centerX) * currentScale;
      const scaledY = centerY + (originalY - centerY) * currentScale;

      icon.style.transform = `translate(${scaledX}px, ${scaledY}px) scale(${currentScale})`;
    });

    // Update button states
    zoomInBtn.disabled = currentScale >= MAX_ZOOM;
    zoomOutBtn.disabled = currentScale <= MIN_ZOOM;
  }

  // Zoom button handlers
  zoomInBtn.addEventListener('click', () => {
    const newScale = Math.min(currentScale + ZOOM_STEP, MAX_ZOOM);
    if (newScale !== currentScale) {
      updateZoom(newScale);
    }
  });

  zoomOutBtn.addEventListener('click', () => {
    const newScale = Math.max(currentScale - ZOOM_STEP, MIN_ZOOM);
    if (newScale !== currentScale) {
      updateZoom(newScale);
    }
  });
}

// 1. Remove duplicate updateBlueprintIcons and consolidate into one function
function updateBlueprintIcons() {
  const container = document.querySelector('.pinned-icons-container');
  if (!container) return;

  const blueprintImage = document.querySelector('#blueprint-image');
  const currentScale = parseFloat(
    blueprintImage.style.transform?.match(/scale\((.*?)\)/)?.[1] || 1
  );
  const blueprintRect = blueprintImage.getBoundingClientRect();
  const centerX = blueprintRect.width / 2;
  const centerY = blueprintRect.height / 2;

  const visibleIcons = state.pinnedIcons.filter(
    (icon) => icon.direction === state.selectedDirection
  );

  container.innerHTML = visibleIcons
    .map(
      (icon) => `
    <div class="pinned-icon ${icon.hasIssue ? 'has-issue' : ''}" 
         data-id="${icon.id}"
         data-icon-id="${icon.iconId}"
         data-original-x="${icon.x}"
         data-original-y="${icon.y}"
         style="position: absolute;
                transform: translate(${
                  centerX + (icon.x - centerX) * currentScale
                }px, 
                                  ${
                                    centerY + (icon.y - centerY) * currentScale
                                  }px) 
                         scale(${currentScale});">
      <div class="icon-shape ${icon.shape}-shape"
           style="${getShapeCSSByType(icon)}">
      </div> 
    </div>
  `
    )
    .join('');

  setupPinnedIconEvents();
}

// Helper function to calculate distance between two touch points
function getDistance(touch1, touch2) {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getShapeCSSByType(icon) {
  switch (icon.shape) {
    case 'circle':
      return `background-color: ${icon.color}; 
              border-radius: 50%;`;
    case 'triangle':
      return `border-left: 12px solid transparent;
              border-right: 12px solid transparent;
              border-bottom: 24px solid ${icon.color};
              background-color: transparent;`;
    case 'square':
      return `background-color: ${icon.color};`;
    default:
      return '';
  }
}

function setupPinnedIconEvents() {
  const pinnedIcons = document.querySelectorAll('.pinned-icon');

  pinnedIcons.forEach((icon) => {
    // Long press to delete
    let longPressTimer;

    icon.addEventListener('touchstart', () => {
      longPressTimer = setTimeout(() => {
        showDeleteConfirm(icon);
      }, 800);
    });

    icon.addEventListener('touchend', () => {
      clearTimeout(longPressTimer);
    });

    // Click to show issue/details
    icon.addEventListener('click', () => {
      const iconId = icon.dataset.iconId;

      if (iconId) {
        openIssueModal(iconId);
      }
    });
  });
}

function showDeleteConfirm(icon) {
  const iconId = icon.dataset.id;

  // Create overlay element
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 99998;
  `;

  // Create confirmation dialog
  const confirm = document.createElement('div');
  confirm.className = 'delete-confirm';
  confirm.style.cssText = `
    background-color: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-width: 80%;
    width: 320px;
    text-align: center;
    z-index: 99999;
  `;

  confirm.innerHTML = `
    <p style="margin-bottom: 16px; font-size: 16px; font-weight: 500;">このマーカーを削除しますか？</p>
    <div class="confirm-actions" style="display: flex; justify-content: space-between;">
      <button class="cancel-button" style="flex: 1; padding: 8px 12px; margin-right: 8px; background-color: #f0f0f0; border: none; border-radius: 4px; font-weight: 500;">キャンセル</button>
      <button class="delete-button" style="flex: 1; padding: 8px 12px; background-color: #f44336; color: white; border: none; border-radius: 4px; font-weight: 500;">削除</button>
    </div>
  `;

  // Handle cancellation - both by cancel button and by clicking overlay
  const cancelAction = () => {
    overlay.remove();
  };

  confirm.querySelector('.cancel-button').onclick = cancelAction;
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      cancelAction();
    }
  };

  // Handle deletion
  confirm.querySelector('.delete-button').onclick = () => {
    // Remove from state
    state.pinnedIcons = state.pinnedIcons.filter((i) => i.id !== iconId);

    // Remove from checklist items
    state.checklist.forEach((item) => {
      if (item.pinnedIcons) {
        item.pinnedIcons = item.pinnedIcons.filter((i) => i !== iconId);
      }
    });

    // Update display
    updateBlueprintIcons();
    overlay.remove();
  };

  // Add confirmation dialog to overlay, then add overlay to body
  overlay.appendChild(confirm);
  document.body.appendChild(overlay);

  // Prevent default touch behavior on overlay to avoid accidental interactions
  overlay.addEventListener(
    'touchmove',
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );
}

function showIconDetails(iconId, iconData) {
  // Find associated checklist item
  const item = state.checklist.find((i) => i.id === parseInt(iconId));

  if (item) {
    openIssueModal(iconId);
  }
}

function updateShapeButtons() {
  const shapeButtons = document.querySelectorAll('.shape-button');

  shapeButtons.forEach((button) => {
    // Reset all buttons
    button.classList.remove('active');

    // Check if this button matches selected shape
    if (
      state.selectedShape &&
      button.dataset.shape === state.selectedShape.shape &&
      button.dataset.color === state.selectedShape.color
    ) {
      button.classList.add('active');
    }
  });

  // Update cursor on blueprint container
  const blueprintContainer = document.querySelector(
    '.blueprint-image-container'
  );
  if (state.selectedShape) {
    blueprintContainer.classList.add('shape-selected');
    blueprintContainer.style.cursor = 'crosshair';
  } else {
    blueprintContainer.classList.remove('shape-selected');
    blueprintContainer.style.cursor = 'default';
  }
}

function setupIssueModalHandlers(modal, itemId) {
  const item = state.checklist.find((i) => i.id === parseInt(itemId));
  if (!item) return;

  // Store original values to handle cancel
  const originalDescription = item.description || '';
  item.status = 'issue';

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${item.name}</h3>
        <button class="close-modal-button">
          <span class="material-icons">close</span>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="issue-form">
          <textarea 
            placeholder="問題の詳細を入力してください"
            class="issue-description"
          >${originalDescription}</textarea>
        </div>

        <div class="issue-photos-section">
          <div class="photos-header">
            <h4>写真一覧</h4>
          </div>
          
          <div class="issue-photos">
            ${item.photos
              .map(
                (photo) => `
        <div class="photo-preview">
          <img src="${photo.url}" alt="Issue photo">
          <button class="remove-photo" onclick="removePhoto(${itemId}, '${photo.id}')">
            <span class="material-icons">close</span>
          </button>
        </div>
      `
              )
              .join('')}
              <div class="photo-preview open-camera" onclick="showCameraConfirm(${itemId})">
                <span class="material-icons camera-icon">photo_camera</span>
              </div>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button class="cancel-button">キャンセル</button>
        <button class="save-button">保存</button>
      </div>
    </div>
  `;

  const textarea = modal.querySelector('.issue-description');
  const cancelButton = modal.querySelector('.cancel-button');
  const saveButton = modal.querySelector('.save-button');
  const closeButton = modal.querySelector('.close-modal-button');

  // Handle cancel - restore original values
  cancelButton.onclick = () => {
    item.description = originalDescription;

    // Update UI with original state
    updateChecklistItemUI(
      document.querySelector(`[data-id="${itemId}"]`),
      item
    );

    modal.remove();
  };

  // Handle close button same as cancel
  closeButton.onclick = cancelButton.onclick;

  // Handle save - update with new values
  saveButton.onclick = () => {
    const newDescription = textarea.value.trim();

    item.description = newDescription;
    item.status = 'issue';

    // Update UI with new state
    const checklistItem = document.querySelector(`[data-id="${itemId}"]`);
    if (checklistItem) {
      updateChecklistItemUI(checklistItem, item);
      updateProgress();
    }

    modal.remove();
  };

  document.body.appendChild(modal);
  modal.style.display = 'flex';

  // Focus textarea
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

function showCameraConfirm(itemId) {
  const confirm = document.createElement('div');
  confirm.className = 'modal camera-confirm-modal';

  confirm.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>カメラへのアクセス</h3>
      </div>
      <div class="modal-body">
        <p>写真を撮影するためにカメラを使用します。</p>
        <p>カメラの使用を許可してください。</p>
      </div>
      <div class="modal-actions">
        <button class="cancel-button">キャンセル</button>
        <button class="confirm-button">OK</button>
      </div>
    </div>
  `;

  // Handle cancel
  confirm.querySelector('.cancel-button').onclick = () => {
    confirm.remove();
  };

  // Handle confirm
  confirm.querySelector('.confirm-button').onclick = () => {
    confirm.remove();
    // Store the current open modal reference so we can update it later
    const currentModal = document.querySelector('.issue-modal');

    // Open camera and pass both itemId and the current modal
    openCamera(itemId, currentModal);
  };

  document.body.appendChild(confirm);
  confirm.style.display = 'flex';
}

// Update openCamera function
function openCamera(itemId, currentModal) {
  // First check if the MediaDevices API is supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showCameraError('このブラウザはカメラをサポートしていません。');
    return;
  }

  // Check if we're in a secure context (HTTPS or localhost)
  if (!window.isSecureContext) {
    showCameraError('カメラを使用するには、安全な接続（HTTPS）が必要です。');
    return;
  }

  // Show loading indicator
  const loadingModal = document.createElement('div');
  loadingModal.className = 'modal loading-modal';
  loadingModal.innerHTML = `
    <div class="modal-content" style="background: rgba(255,255,255,0.9); padding: 20px; border-radius: 8px; text-align: center;">
      <div style="margin-bottom: 15px;">
        <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
      </div>
      <p>カメラにアクセスしています...</p>
    </div>
  `;

  document.body.appendChild(loadingModal);
  loadingModal.style.display = 'flex';

  // Try to access camera with timeout
  const cameraPromise = navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'environment', // Use back camera if available
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  });

  // Add a timeout in case permissions dialog is ignored
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error('カメラへのアクセスがタイムアウトしました。')),
      10000
    );
  });

  // Race between camera access and timeout
  Promise.race([cameraPromise, timeoutPromise])
    .then((stream) => {
      // Success! Remove loading and show camera
      loadingModal.remove();
      const modal = createCameraModal(stream, itemId, currentModal);
      document.body.appendChild(modal);
    })
    .catch((err) => {
      // Handle specific errors
      loadingModal.remove();
      console.error('Camera error:', err);

      // Error handling code remains the same...
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError'
      ) {
        showCameraError(
          'カメラへのアクセスが拒否されました。ブラウザの設定でカメラのアクセス許可を確認してください。'
        );
      } else if (
        err.name === 'NotFoundError' ||
        err.name === 'DevicesNotFoundError'
      ) {
        showCameraError(
          'カメラデバイスが見つかりません。デバイスにカメラが接続されていることを確認してください。'
        );
      } else if (
        err.name === 'NotReadableError' ||
        err.name === 'TrackStartError'
      ) {
        showCameraError(
          'カメラにアクセスできませんでした。他のアプリがカメラを使用していないか確認してください。'
        );
      } else {
        showCameraError(
          'カメラエラー: ' + (err.message || '不明なエラーが発生しました。')
        );
      }
    });
}

// Improved error display with details
function showCameraError(message) {
  const error = document.createElement('div');
  error.className = 'modal camera-error-modal';

  error.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>カメラエラー</h3>
        <button class="close-modal-button">
          <span class="material-icons">close</span>
        </button>
      </div>
      <div class="modal-body">
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="material-icons" style="font-size: 48px; color: #f44336;">error_outline</span>
        </div>
        <p>${message}</p>
        <p>以下をお試しください：</p>
        <ul style="list-style: disc; margin-left: 20px; line-height: 1.5;">
          <li>ブラウザの設定でカメラへのアクセスを許可する</li>
          <li>他のアプリがカメラを使用していないことを確認する</li>
          <li>デバイスを再起動する</li>
          <li>別のブラウザを試す</li>
        </ul>
      </div>
      <div class="modal-actions">
        <button class="close-button">閉じる</button>
      </div>
    </div>
  `;

  const closeButton = error.querySelector('.close-button');
  const closeModalButton = error.querySelector('.close-modal-button');

  closeButton.onclick = () => error.remove();
  closeModalButton.onclick = () => error.remove();

  document.body.appendChild(error);
  error.style.display = 'flex';
}

function setupCameraButtonEvent() {
  const cameraButton = document.getElementById('check-all-camera');

  cameraButton.addEventListener('click', () => {
    // Show confirmation dialog before proceeding
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal camera-confirm-modal';
    confirmModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>一括確認</h3>
          <button class="close-modal-button">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <p>全て問題なしに設定しますか？</p>
          <p>設定した後にいつか写真を撮ってください。</p>
        </div>
        <div class="modal-actions">
          <button class="cancel-button">キャンセル</button>
          <button class="confirm-button">確認する</button>
        </div>
      </div>
    `;

    // Handle cancel
    const cancelButton = confirmModal.querySelector('.cancel-button');
    const closeButton = confirmModal.querySelector('.close-modal-button');

    cancelButton.onclick = () => confirmModal.remove();
    closeButton.onclick = () => confirmModal.remove();

    // Handle confirm
    confirmModal.querySelector('.confirm-button').onclick = () => {
      confirmModal.remove();

      // Only proceed with camera access after confirmation
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showCameraError('このブラウザはカメラをサポートしていません。');
        return;
      }

      // Show loading spinner
      const loadingModal = document.createElement('div');
      loadingModal.className = 'modal loading-modal';
      loadingModal.innerHTML = `
        <div class="modal-content" style="background: rgba(255,255,255,0.9); padding: 20px; border-radius: 8px; text-align: center;">
          <div style="margin-bottom: 15px;">
            <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
          </div>
          <p>カメラにアクセスしています...</p>
        </div>
      `;
      document.body.appendChild(loadingModal);
      loadingModal.style.display = 'flex';

      // Request camera access
      navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        .then((stream) => {
          loadingModal.remove();
          // Use our separate function for check-all camera
          createCameraCheckAll(stream);
        })
        .catch((err) => {
          loadingModal.remove();
          showCameraError('カメラのアクセスエラー: ' + err.message);
        });
    };

    document.body.appendChild(confirmModal);
    confirmModal.style.display = 'flex';
  });
}

function createCameraCheckAll(stream) {
  // Create the overlay container
  const overlay = document.createElement('div');
  overlay.className = 'camera-overlay check-all-mode';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #000;
    z-index: 9999999;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  `;

  // Create camera container and elements
  const cameraViewContainer = document.createElement('div');
  cameraViewContainer.className = 'camera-view-container';
  cameraViewContainer.style.cssText = `
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  `;

  // Create the video element
  const video = document.createElement('video');
  video.id = 'camera-stream-checkall';
  video.autoplay = true;
  video.playsInline = true;
  video.style.cssText = `
    width: 100%;
    height: 100%;
    object-fit: cover;
  `;

  // Create canvas for photo capture
  const canvas = document.createElement('canvas');
  canvas.id = 'photo-canvas-checkall';
  canvas.style.cssText = `
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  `;

  // Create photo preview
  const photoPreview = document.createElement('img');
  photoPreview.className = 'photo-preview';
  photoPreview.style.cssText = `
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    background-color: #000;
  `;

  // Create UI for the check-all indicator
  const checkAllLabel = document.createElement('div');
  checkAllLabel.className = 'check-all-label';
  checkAllLabel.innerHTML = `
    <div class="check-all-badge">
      <span class="material-icons">done_all</span>
      <span>一括確認モード</span>
    </div>
  `;
  checkAllLabel.style.cssText = `
    position: absolute;
    top: 20px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    z-index: 10001;
  `;

  // Create controls container
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'camera-controls';
  controlsContainer.style.cssText = `
    position: absolute;
    bottom: 20px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 40px;
    padding: 20px;
    z-index: 10001;
  `;

  // Create buttons
  const closeButton = document.createElement('button');
  closeButton.className = 'camera-button close-button';
  closeButton.style.cssText = `
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.3);
    border: none;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  `;
  closeButton.innerHTML = `<span class="material-icons" style="color: white; font-size: 24px;">close</span>`;

  const captureButton = document.createElement('button');
  captureButton.className = 'camera-button capture-button';
  captureButton.style.cssText = `
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background-color: white;
    border: 4px solid rgba(255, 255, 255, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  `;
  captureButton.innerHTML = `<span class="material-icons" style="color: #f44336; font-size: 30px;">photo_camera</span>`;

  // Create retake button (hidden initially)
  const retakeButton = document.createElement('button');
  retakeButton.className = 'camera-button retake-button';
  retakeButton.style.cssText = `
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.3);
    border: none;
    display: none;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  `;
  retakeButton.innerHTML = `<span class="material-icons" style="color: white; font-size: 24px;">replay</span>`;

  // Create save button (hidden initially)
  const saveButton = document.createElement('button');
  saveButton.className = 'camera-button save-button';
  saveButton.style.cssText = `
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background-color: #4CAF50;
    border: 4px solid rgba(255, 255, 255, 0.5);
    display: none;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  `;
  saveButton.innerHTML = `<span class="material-icons" style="color: white; font-size: 30px;">check</span>`;

  // Assemble the DOM structure
  controlsContainer.appendChild(closeButton);
  controlsContainer.appendChild(captureButton);
  controlsContainer.appendChild(retakeButton);
  controlsContainer.appendChild(saveButton);

  cameraViewContainer.appendChild(video);
  cameraViewContainer.appendChild(canvas);
  cameraViewContainer.appendChild(photoPreview);
  cameraViewContainer.appendChild(checkAllLabel);
  cameraViewContainer.appendChild(controlsContainer);

  overlay.appendChild(cameraViewContainer);
  document.body.appendChild(overlay);

  // Connect video to stream
  try {
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play().catch((err) => {
        console.error('Error playing video:', err);
        closeOverlay();
        showCameraError('カメラの起動中にエラーが発生しました。');
      });
    };
  } catch (err) {
    console.error('Error setting video source:', err);
    closeOverlay();
    showCameraError('カメラのストリーム設定中にエラーが発生しました。');
    return;
  }

  // Handle photo capture
  captureButton.addEventListener('click', () => {
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = canvas.toDataURL('image/jpeg', 0.9);

    // Show preview
    photoPreview.src = imageData;
    photoPreview.style.display = 'block';
    video.style.display = 'none';

    // Update controls
    captureButton.style.display = 'none';
    retakeButton.style.display = 'flex';
    saveButton.style.display = 'flex';
  });

  // Handle retake
  retakeButton.addEventListener('click', () => {
    // Hide preview, show video
    photoPreview.style.display = 'none';
    video.style.display = 'block';

    // Update controls
    captureButton.style.display = 'flex';
    retakeButton.style.display = 'none';
    saveButton.style.display = 'none';
  });

  // Handle save - THIS IS THE KEY DIFFERENCE FOR CHECK-ALL FUNCTIONALITY
  saveButton.addEventListener('click', () => {
    // Save bulk photo to history
    const timestamp = new Date().toISOString();
    const photoId = 'bulk_photo_' + Date.now();

    // Initialize photo history structure if needed
    if (!state.bulkPhotoHistory) {
      state.bulkPhotoHistory = {
        north: [],
        east: [],
        south: [],
        west: [],
      };
    }

    // Add new photo to current direction's history
    state.bulkPhotoHistory[state.selectedDirection].push({
      id: photoId,
      url: photoPreview.src,
      timestamp: timestamp,
      direction: state.selectedDirection,
    });

    // Mark all items in this direction as completed
    state.checklist.forEach((item) => {
      if (
        item.direction === state.selectedDirection &&
        item.status !== 'issue'
      ) {
        item.status = 'completed';
      }
    });

    // Update UI
    updateChecklist();
    updateProgress();

    // Update photo history button visibility
    updateBulkPhotoHistoryButtonVisibility();

    // Close overlay
    closeOverlay();
  });

  // Handle close
  closeButton.addEventListener('click', closeOverlay);

  // Function to close and clean up
  function closeOverlay() {
    // Stop all video tracks
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    // Remove overlay from DOM
    overlay.remove();
  }

  // Add swipe to close
  let touchStartY = 0;
  overlay.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  });

  overlay.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const diff = touchY - touchStartY;

    // If swiping down significantly, close overlay
    if (diff > 100) {
      closeOverlay();
    }
  });

  return overlay;
}

function createCameraView() {
  const cameraView = document.createElement('div');

  cameraView.className = 'camera-view';
  cameraView.innerHTML = `
    <div class="camera-container">
      <video id="camera-preview" autoplay playsinline></video>
      <canvas id="photo-canvas" style="display: none;"></canvas>
      <div class="camera-controls">
        <button class="capture-button">
          <span class="material-icons">photo_camera</span>
        </button>
        <button class="close-button">
          <span class="material-icons">close</span>
        </button>
      </div>
    </div>
  `;

  document.append(cameraView);
}

// Add function to update the bulk photo history button visibility
function updateBulkPhotoHistoryButtonVisibility() {
  const historyButton = document.getElementById('bulk-photo-history-button');
  if (!historyButton) {
    // Create the history button if it doesn't exist
    setupBulkPhotoHistoryButton();
    return;
  }

  // Check if we have any bulk photos for current direction
  const hasPhotos =
    state.bulkPhotoHistory &&
    state.bulkPhotoHistory[state.selectedDirection] &&
    state.bulkPhotoHistory[state.selectedDirection].length > 0;

  // Show or hide button
  historyButton.style.display = hasPhotos ? 'flex' : 'none';
}

// Add function to setup bulk photo history button
function setupBulkPhotoHistoryButton() {
  // If button already exists, don't create it again
  if (document.getElementById('bulk-photo-history-button')) return;

  // Create button
  const historyButton = document.createElement('button');
  historyButton.id = 'bulk-photo-history-button';
  historyButton.className = 'action-button bulk-photo-history-button';
  historyButton.innerHTML = '<span class="material-icons">collections</span>';
  historyButton.style.cssText = `
    background-color: var(--primary-color); 
    color: white;
    margin-right: 8px;
  `;

  // Find the check-all-camera button
  const cameraButton = document.getElementById('check-all-camera');
  if (cameraButton && cameraButton.parentNode) {
    // Insert history button before camera button
    cameraButton.parentNode.insertBefore(historyButton, cameraButton);
  }

  // Add click handler to show bulk photo history
  historyButton.addEventListener('click', showBulkPhotoHistory);

  // Update visibility
  updateBulkPhotoHistoryButtonVisibility();
}

// Add function to show bulk photo history
function showBulkPhotoHistory() {
  if (!state.bulkPhotoHistory) {
    state.bulkPhotoHistory = {
      north: [],
      east: [],
      south: [],
      west: [],
    };
  }

  const photos = state.bulkPhotoHistory[state.selectedDirection] || [];

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal bulk-photo-history-modal';

  // Sort photos newest first
  photos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const directionText = DIRECTIONS[state.selectedDirection].text;

  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${directionText}方向の一括確認写真</h3>
        <button class="close-modal-button">
          <span class="material-icons">close</span>
        </button>
      </div>
      
      <div class="modal-body"> 
        <div class="bulk-photo-gallery">
          ${photos
            .map(
              (photo) => `
            <div class="gallery-item">
              <div class="gallery-image-container">
                <img src="${photo.url}" alt="一括確認写真">
              </div>
              <div class="gallery-item-details">
                <p class="gallery-item-time">${formatDate(photo.timestamp)}</p>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="upload-container">
          <label for="bulk-photo-upload" class="upload-button">
            <span class="material-icons">upload</span>
            <span>写真をアップロード</span>
          </label>
          <input type="file" id="bulk-photo-upload" accept="image/*" style="display: none;" />
        </div>
      </div>
    </div>
  `;

  // Add to document
  document.body.appendChild(modal);
  modal.style.display = 'flex';

  // Add close button handler
  const closeButton = modal.querySelector('.close-modal-button');
  closeButton.addEventListener('click', () => {
    modal.remove();
  });

  // Handle file upload
  const fileInput = modal.querySelector('#bulk-photo-upload');
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください。');
      return;
    }

    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
      <div class="spinner"></div>
      <p>アップロード中...</p>
    `;
    loadingIndicator.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 100;
    `;
    modal.querySelector('.modal-content').appendChild(loadingIndicator);

    // Read the file
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target.result;

      // Add to bulkPhotoHistory
      const photoId = 'bulk_photo_' + Date.now();
      const timestamp = new Date().toISOString();

      if (!state.bulkPhotoHistory[state.selectedDirection]) {
        state.bulkPhotoHistory[state.selectedDirection] = [];
      }

      state.bulkPhotoHistory[state.selectedDirection].push({
        id: photoId,
        url: imageUrl,
        timestamp: timestamp,
        direction: state.selectedDirection,
        isUploaded: true,
      });

      // Mark all items in this direction as completed
      state.checklist.forEach((item) => {
        if (
          item.direction === state.selectedDirection &&
          item.status !== 'issue'
        ) {
          item.status = 'completed';
        }
      });

      // Update checklist UI
      updateChecklist();
      updateProgress();

      // Update button visibility
      updateBulkPhotoHistoryButtonVisibility();

      // Update gallery
      updateBulkPhotoGallery(modal);

      // Remove loading indicator
      loadingIndicator.remove();

      // Reset file input
      fileInput.value = '';
    };

    reader.readAsDataURL(file);
  });
}

// Add this helper function to update the gallery in the modal
function updateBulkPhotoGallery(modal) {
  const galleryContainer = modal.querySelector('.bulk-photo-gallery');
  if (!galleryContainer) return;

  const photos = state.bulkPhotoHistory[state.selectedDirection] || [];
  photos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  galleryContainer.innerHTML = photos
    .map(
      (photo) => `
    <div class="gallery-item">
      <div class="gallery-image-container">
        <img src="${photo.url}" alt="一括確認写真">
      </div>
      <div class="gallery-item-details">
        <p class="gallery-item-time">${formatDate(photo.timestamp)}</p>
      </div>
    </div>
  `
    )
    .join('');
}

// Add this function to fix checklist scrolling issues
function fixChecklistScrolling() {}
