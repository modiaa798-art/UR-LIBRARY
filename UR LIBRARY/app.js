// ==========================================
// UR LIBRARY - JavaScript Main
// ==========================================

// Configuration
const CONFIG = {
  API_URL: '', // سيتم تعيينه بعد الـ Deploy (https://ur-library-api.{ACCOUNT}.workers.dev)
  R2_URL: '', // سيتم تعيينه بعد الـ Deploy (https://ur-library-files.{ACCOUNT}.r2.cloudflarestorage.com)
  STORAGE_KEY: 'ur-library-files',
};

// State
let selectedFile = null;
let allFiles = [];

// Initialize App
function initApp() {
  loadTheme();
  setupEventListeners();
  loadFiles();
  updateStats();
}

// ==========================================
// Theme Management
// ==========================================

function loadTheme() {
  const savedTheme = localStorage.getItem('ur-library-theme') || 'light';
  setTheme(savedTheme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const toggle = document.getElementById('themeToggle');
  toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('ur-library-theme', theme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}

// ==========================================
// Event Listeners
// ==========================================

function setupEventListeners() {
  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Upload
  document.getElementById('uploadBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });

  document.getElementById('fileInput').addEventListener('change', handleFileSelect);

  // Classification form
  document.getElementById('saveBtn').addEventListener('click', handleSaveFile);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);

  // Search
  document.getElementById('searchInput').addEventListener('input', handleSearch);

  // Close modal on outside click
  document.getElementById('classificationModal').addEventListener('click', (e) => {
    if (e.target.id === 'classificationModal') {
      closeModal();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

// ==========================================
// File Upload Handling
// ==========================================

function handleFileSelect(e) {
  selectedFile = e.target.files[0];
  
  if (!selectedFile) return;

  if (!selectedFile.type.includes('pdf')) {
    alert('يرجى تحديد ملف PDF فقط');
    return;
  }

  document.getElementById('fileName').value = selectedFile.name;
  
  // Clear form fields
  document.getElementById('subject').value = '';
  document.getElementById('type').value = '';
  document.getElementById('term').value = '';
  document.getElementById('year').value = '';
  document.getElementById('chapter').value = '';
  document.getElementById('tags').value = '';

  // Open modal
  document.getElementById('classificationModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('classificationModal').style.display = 'none';
  selectedFile = null;
  document.getElementById('fileInput').value = '';
}

// ==========================================
// Save File (Upload to R2)
// ==========================================

async function handleSaveFile() {
  if (!validateForm()) {
    alert('الرجاء ملء جميع الحقول المطلوبة');
    return;
  }

  if (!selectedFile) {
    alert('الرجاء تحديد ملف PDF');
    return;
  }

  const saveBtn = document.getElementById('saveBtn');
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="loading"></span> جاري الحفظ...';

  try {
    // Upload to R2 using Worker
    const formData = new FormData();
    formData.append('file', selectedFile);

    const response = await fetch(`${CONFIG.API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      // Save metadata to localStorage
      const metadata = {
        id: generateId(),
        name: selectedFile.name,
        subject: document.getElementById('subject').value,
        type: document.getElementById('type').value,
        term: document.getElementById('term').value,
        year: document.getElementById('year').value,
        chapter: document.getElementById('chapter').value || '',
        tags: document.getElementById('tags').value || '',
        uploadedAt: new Date().toISOString(),
        size: (selectedFile.size / 1024 / 1024).toFixed(2), // MB
      };

      saveFileMetadata(metadata);
      loadFiles();
      updateStats();
      closeModal();
      showNotification('تم حفظ الملف بنجاح! ✅');
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('Upload error:', error);
    showNotification('حدث خطأ في حفظ الملف: ' + error.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

// ==========================================
// Metadata Management (localStorage)
// ==========================================

function saveFileMetadata(metadata) {
  const files = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
  files.push(metadata);
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(files));
}

function loadFiles() {
  allFiles = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
  renderLibrary(allFiles);
}

function deleteFileMetadata(fileId) {
  const files = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
  const updatedFiles = files.filter(f => f.id !== fileId);
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(updatedFiles));
  allFiles = updatedFiles;
}

// ==========================================
// File Operations
// ==========================================

function openFile(fileName) {
  const fileUrl = `${CONFIG.R2_URL}/uploads/${encodeURIComponent(fileName)}`;
  window.open(fileUrl, '_blank');
}

async function deleteFile(fileId, fileName) {
  if (!confirm('هل تريد حذف هذا الملف؟')) {
    return;
  }

  const deleteBtn = event.target;
  deleteBtn.disabled = true;
  deleteBtn.innerHTML = '<span class="loading"></span>';

  try {
    // Delete from R2 using Worker
    const response = await fetch(`${CONFIG.API_URL}/api/delete?file=${encodeURIComponent(fileName)}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      deleteFileMetadata(fileId);
      loadFiles();
      updateStats();
      showNotification('تم حذف الملف بنجاح ✓');
    } else {
      throw new Error('Delete failed');
    }
  } catch (error) {
    console.error('Delete error:', error);
    showNotification('حدث خطأ في حذف الملف: ' + error.message, 'error');
    deleteBtn.disabled = false;
    deleteBtn.textContent = 'حذف';
  }
}

// ==========================================
// Library Rendering
// ==========================================

function renderLibrary(files) {
  const container = document.getElementById('subjectsContainer');
  const emptyState = document.getElementById('emptyState');

  if (files.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  // Group files by subject
  const grouped = groupFilesBySubject(files);
  const subjects = Object.keys(grouped).sort();

  container.innerHTML = subjects.map(subject => {
    const subjectFiles = grouped[subject];
    const emoji = getSubjectEmoji(subject);

    return `
      <div class="subject-section">
        <div class="subject-header">
          <span>${emoji}</span>
          <span>${subject} (${subjectFiles.length})</span>
        </div>
        <div class="subject-files">
          ${subjectFiles.map(file => renderFileCard(file)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function renderFileCard(file) {
  return `
    <div class="file-card">
      <div class="file-info">
        <div class="file-name">📄 ${escapeHtml(file.name)}</div>
        <div class="file-meta">
          <span class="file-meta-item"><strong>${file.type}</strong></span>
          <span class="file-meta-item">•</span>
          <span class="file-meta-item">${file.term}</span>
          <span class="file-meta-item">•</span>
          <span class="file-meta-item">${file.year}</span>
          ${file.chapter ? `<span class="file-meta-item">•</span><span class="file-meta-item">${file.chapter}</span>` : ''}
          ${file.tags ? `<span class="file-meta-item">•</span><span class="file-meta-item">🏷️ ${file.tags}</span>` : ''}
        </div>
      </div>
      <div class="file-actions">
        <button class="btn btn-small" onclick="openFile('${escapeHtml(file.name)}')">
          فتح
        </button>
        <button class="btn btn-small btn-delete" onclick="deleteFile('${file.id}', '${escapeHtml(file.name)}')">
          حذف
        </button>
      </div>
    </div>
  `;
}

function groupFilesBySubject(files) {
  return files.reduce((acc, file) => {
    const subject = file.subject || 'بدون تصنيف';
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(file);
    return acc;
  }, {});
}

// ==========================================
// Search & Filter
// ==========================================

function handleSearch(e) {
  const query = e.target.value.toLowerCase().trim();

  if (!query) {
    renderLibrary(allFiles);
    return;
  }

  const filtered = allFiles.filter(file => {
    return (
      file.name.toLowerCase().includes(query) ||
      file.subject.toLowerCase().includes(query) ||
      file.type.toLowerCase().includes(query) ||
      file.chapter?.toLowerCase().includes(query) ||
      file.tags?.toLowerCase().includes(query)
    );
  });

  renderLibrary(filtered);
}

// ==========================================
// Statistics
// ==========================================

function updateStats() {
  const files = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '[]');
  
  // Total files
  document.getElementById('totalFiles').textContent = files.length;

  // Total size
  let totalSize = 0;
  files.forEach(file => {
    totalSize += parseFloat(file.size) || 0;
  });

  document.getElementById('totalSize').textContent = totalSize > 0 ? totalSize.toFixed(2) + ' MB' : '0 MB';
}

// ==========================================
// Utilities
// ==========================================

function validateForm() {
  const subject = document.getElementById('subject').value.trim();
  const type = document.getElementById('type').value.trim();
  const term = document.getElementById('term').value.trim();
  const year = document.getElementById('year').value.trim();

  return subject && type && term && year;
}

function generateId() {
  return 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function getSubjectEmoji(subject) {
  const emojiMap = {
    'الرياضيات': '📐',
    'الفيزياء': '⚛️',
    'الكيمياء': '🧪',
    'الأحياء': '🔬',
    'اللغة الإنجليزية': '🌍',
    'اللغة العربية': '📖',
  };

  return emojiMap[subject] || '📚';
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 8px;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    max-width: 300px;
  `;

  if (type === 'success') {
    notification.style.backgroundColor = '#10b981';
    notification.style.color = 'white';
  } else {
    notification.style.backgroundColor = '#ef4444';
    notification.style.color = 'white';
  }

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Animation keyframes (add to CSS dynamically)
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// ==========================================
// Initialize
// ==========================================

document.addEventListener('DOMContentLoaded', initApp);
