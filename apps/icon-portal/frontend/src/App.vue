<template>
  <div class="icon-manager">
    <header class="header">
      <h1>phillUI Icons Manager</h1>
      <div class="actions">
        <button @click="syncToGit" :disabled="syncing" class="btn-sync">
          {{ syncing ? 'Syncing...' : 'Sync to Git' }}
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
        <div v-for="icon in filteredIcons" :key="icon.name" class="icon-card">
          <div class="icon-preview" v-html="icon.content"></div>
          <div class="icon-info">
            <span class="icon-name">{{ icon.name }}</span>
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
}

interface Toast {
  message: string
  type: 'success' | 'error'
}

const icons = ref<Icon[]>([])
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

const filteredIcons = computed(() => {
  return icons.value.filter(i => i.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
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
      showToast(`Icon "${name}" uploaded and built!`)
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
      showToast(data.message || 'Synced to remote successfully!', 'success')
    } else {
      showToast(data.error || 'Sync failed', 'error')
    }
  } catch (e) {
    showToast('Sync failed', 'error')
  } finally {
    syncing.value = false
  }
}

onMounted(fetchIcons)
</script>

<style scoped>
.icon-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: Inter, system-ui, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.icon-manager h1 {
  font-size: 1.8rem;
  color: #333;
}

.drop-zone {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #f9f9f9;
}

.drop-zone:hover {
  border-color: #3c9cff;
  background: #f0f7ff;
}

.search-input {
  width: 100%;
  padding: 0.8rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 2rem 0;
  font-size: 1rem;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1.5rem;
}

.icon-card {
  padding: 1.5rem;
  border: 1px solid #eee;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.2s;
}

.icon-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.icon-preview {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
}

.icon-preview :deep(svg) {
  width: 100%;
  height: 100%;
}

.icon-name {
  font-size: 0.85rem;
  color: #666;
  word-break: break-all;
}

.btn-sync {
  background: #3c9cff;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
}

.btn-sync:disabled {
  background: #ccc;
}

.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 2rem;
  border-radius: 8px;
  color: white;
  z-index: 100;
}

.toast.success { background: #5ac725; }
.toast.error { background: #f56c6c; }
</style>
