<template>
  <div class="icon-manager">
    <header class="header">
      <div class="title-area">
        <h1>phillUI Icons Manager</h1>
        <span class="version-badge" v-if="currentVersion">v{{ currentVersion }}</span>
      </div>
      <div class="actions">
        <button @click="refreshIcons" class="btn-refresh" :disabled="syncing">
          Refresh
        </button>
        <button @click="syncToGit" :disabled="syncing || pendingCount === 0" class="btn-sync">
          {{ syncing ? 'Syncing...' : `Sync to Git (${pendingCount})` }}
        </button>
        <button @click="exportToNPM" :disabled="syncing" class="btn-export">
          Export to NPM
        </button>
      </div>
    </header>

    <main class="content">
      <section class="upload-section">
        <div 
          class="drop-zone"
          @dragover.prevent
          @drop.prevent="handleDrop"
          @click="fileInput?.click()"
        >
          <p>Click or drag SVG here to upload / replace</p>
          <input 
            type="file" 
            ref="fileInput" 
            accept=".svg" 
            multiple
            style="display: none" 
            @change="handleFileSelect"
          >
        </div>
      </section>

      <section class="search-section">
        <input v-model="searchQuery" placeholder="Search icons..." class="search-input">
      </section>

      <section class="icon-grid">
        <div v-for="icon in filteredIcons" :key="icon.name" class="icon-card" :class="{ 'is-pending': icon.status === 'pending' }">
          <div class="icon-preview" v-html="icon.content"></div>
          <div class="icon-info">
            <span class="icon-name">{{ icon.name }}</span>
            <span v-if="icon.status === 'pending'" class="status-badge">Pending</span>
          </div>
        </div>
      </section>
    </main>
    
    <div v-if="toast" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Icon {
  name: string
  content: string
  status: 'pending' | 'synced'
}

interface Toast {
  message: string
  type: 'success' | 'info' | 'error'
}

const icons = ref<Icon[]>([])
const currentVersion = ref('')
const searchQuery = ref('')
const syncing = ref(false)
const toast = ref<Toast | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const fetchIcons = async () => {
  try {
    const res = await fetch('/api/icons')
    icons.value = await res.json()
  } catch (e) {
    showToast('Failed to fetch icons', 'error')
  }
}

const fetchVersion = async () => {
  try {
    const res = await fetch('/api/version')
    const data = await res.json()
    currentVersion.value = data.version
  } catch (e) {}
}

const refreshIcons = async () => {
  syncing.value = true
  try {
    const res = await fetch('/api/refresh', { method: 'POST' })
    if (res.ok) {
      showToast('Icons refreshed from GitHub')
      await fetchIcons()
    } else {
      showToast('Refresh failed', 'error')
    }
  } catch (e) {
    showToast('Refresh failed', 'error')
  } finally {
    syncing.value = false
  }
}

const pendingCount = computed(() => icons.value.filter(i => i.status === 'pending').length)

const filteredIcons = computed(() => {
  return icons.value.filter(i => i.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
  toast.value = { message, type }
  setTimeout(() => {
    toast.value = null
  }, 3000)
}

const uploadFile = async (file: File) => {
  const name = file.name.replace('.svg', '')
  const formData = new FormData()
  formData.append('file', file)
  formData.append('name', name)

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      showToast(`Icon "${name}" staged!`)
      fetchIcons()
    } else {
      showToast(data.error || 'Upload failed', 'error')
    }
  } catch (e) {
    showToast('Upload failed', 'error')
  }
}

const handleDrop = (e: DragEvent) => {
  const files = e.dataTransfer?.files
  if (!files || files.length === 0) return
  Array.from(files).forEach(file => {
    if (file && file.name.endsWith('.svg')) {
      uploadFile(file)
    }
  })
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return
  Array.from(files).forEach(file => {
    if (file) {
      uploadFile(file)
    }
  })
}

const syncToGit = async () => {
  syncing.value = true
  try {
    const res = await fetch('/api/sync', { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      showToast(data.message || 'Batch sync successful!', 'success')
      await fetchIcons()
    } else {
      showToast(data.error || 'Sync failed', 'error')
    }
  } catch (e) {
    showToast('Sync failed', 'error')
  } finally {
    syncing.value = false
  }
}

const exportToNPM = async () => {
  if (!confirm('This will trigger a production build and publish to NPM. Continue?')) return
  syncing.value = true
  try {
    const res = await fetch('/api/export', { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      showToast(data.message || 'Workflow triggered!', 'info')
    } else {
      showToast(data.error || 'Failed to trigger workflow', 'error')
    }
  } catch (e) {
    showToast('Request failed', 'error')
  } finally {
    syncing.value = false
  }
}

onMounted(() => {
  fetchIcons()
  fetchVersion()
})
</script>

<style scoped>
.icon-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 3rem 1.5rem;
  font-family: 'Inter', -apple-system, system-ui, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1.5rem;
}

.title-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.version-badge {
  background: #f1f5f9;
  color: #64748b;
  padding: 0.15rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.drop-zone {
  border: 1px dashed #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f8fafc;
  color: #94a3b8;
  margin-bottom: 1.5rem;
  font-size: 0.85rem;
}

.drop-zone:hover {
  border-color: #3c9cff;
  background: white;
  color: #3c9cff;
}

.search-input {
  width: 100%;
  padding: 0.6rem 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 2rem;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #3c9cff;
  box-shadow: 0 0 0 3px rgba(60, 156, 255, 0.08);
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: flex-start;
  min-height: 200px;
}

.icon-card {
  width: calc(12.5% - 0.875rem);
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  background: white;
  transition: all 0.2s ease;
  position: relative;
}

.icon-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04);
  border-color: #3c9cff50;
}

.icon-card.is-pending {
  border-color: #ffd666;
  background: #fffbe6;
}

.icon-preview {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.icon-preview :deep(svg) {
  width: 100%;
  height: 100%;
  max-width: 32px;
  max-height: 32px;
}

.icon-info {
  width: 100%;
  text-align: center;
}

.icon-name {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 0.25rem;
}

.status-badge {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  font-size: 0.6rem;
  padding: 0.1rem 0.35rem;
  background: #faad14;
  color: white;
  border-radius: 4px;
  font-weight: 600;
}

.btn-refresh {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 0.6rem 1.25rem;
  border-radius: 10px;
  cursor: pointer;
  margin-right: 0.75rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-sync {
  background: #3c9cff;
  color: white;
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-sync:hover:not(:disabled) {
  background: #2b8ce6;
  transform: scale(1.02);
}

.btn-export {
  background: linear-gradient(135deg, #5ac725 0%, #40a01a 100%);
  color: white;
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  margin-left: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(90, 199, 37, 0.2);
}

.btn-export:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(90, 199, 37, 0.3);
}

.btn-export:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
  box-shadow: none;
}

.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 2rem;
  border-radius: 12px;
  color: white;
  z-index: 100;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  font-weight: 500;
}

.toast.success { background: #5ac725; }
.toast.info { background: #3c9cff; }
.toast.error { background: #f56c6c; }
</style>
