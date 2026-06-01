import './style.css'
import { createIcons, Cpu, Layout, Smartphone, Users2, ClipboardList, MessageSquareMore, ShieldCheck, Clock, Target, Eye, Users, PhoneCall, Globe, MapPin, MessageSquarePlus, CheckCircle2, HandMetal, BrainCircuit, Shield, Quote, ArrowRight, Mic, ImagePlus, Search, Plus } from 'lucide'

// Initialize Lucide Icons
createIcons({
  icons: {
    Cpu,
    Layout,
    Smartphone,
    Users2,
    ClipboardList,
    MessageSquareMore,
    ShieldCheck,
    Clock,
    Target,
    Eye,
    Users,
    PhoneCall,
    Globe,
    MapPin,
    MessageSquarePlus,
    CheckCircle2,
    HandMetal,
    BrainCircuit,
    Shield,
    Quote,
    ArrowRight,
    Mic,
    ImagePlus,
    Search,
    Plus
  }
})

// Header Scroll Effect
const header = document.querySelector('header')
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled')
  } else {
    header.classList.remove('scrolled')
  }
})

// Reveal Animations on Scroll
const revealElements = document.querySelectorAll('[data-reveal]')
const revealOnScroll = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active')
    }
  })
}, {
  threshold: 0.1
})

revealElements.forEach(el => revealOnScroll.observe(el))

// Smooth Scroll for Internal Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault()
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    })
  })
})

// Vision Language Toggle
const visionContainer = document.querySelector('.vision-text-container')
const visionEn = document.querySelector('.vision-en')
if (visionContainer && visionEn) {
  visionContainer.addEventListener('click', () => {
    // Only toggle on mobile screens (when English is hidden by default)
    if (window.innerWidth <= 768) {
      visionEn.classList.toggle('show')
    }
  })
}

// Grievance Form Handling
const API_BASE = import.meta.env.VITE_API_BASE || '';

const grievanceForm = document.getElementById('grievance-form')
const formSuccess = document.getElementById('form-success')
const descriptionInput = document.getElementById('citizen-description')
const photoInput = document.getElementById('citizen-photo')
const photoPreview = document.getElementById('photo-preview')
const photoPreviewImg = document.getElementById('photo-preview-img')
const photoFileName = document.getElementById('photo-file-name')
const removePhotoBtn = document.getElementById('remove-photo-btn')
const voiceTypeBtn = document.getElementById('voice-type-btn')
const voiceStatus = document.getElementById('voice-status')
const categorySelect = document.getElementById('citizen-category')
const categoryShortcutButtons = document.querySelectorAll('.category-shortcuts button')
const descriptionCount = document.getElementById('description-count')
const useLocationBtn = document.getElementById('use-location-btn')
const locationStatus = document.getElementById('location-status')

let selectedPhotoData = ''
let selectedPhotoName = ''
let selectedLocation = ''
let recognition = null
let isListening = false

function updateVoiceStatus(message) {
  if (voiceStatus) {
    voiceStatus.textContent = message
  }
}

function appendTranscript(transcript) {
  if (!descriptionInput || !transcript) return

  const existingText = descriptionInput.value.trim()
  descriptionInput.value = existingText ? `${existingText} ${transcript}` : transcript
  updateDescriptionCount()
  descriptionInput.focus()
}

function updateDescriptionCount() {
  if (!descriptionInput || !descriptionCount) return

  const max = 500
  const length = descriptionInput.value.trim().length
  descriptionCount.textContent = `${Math.min(length, max)} / ${max}`
  descriptionCount.style.color = length >= 20 ? '#2e7d32' : '#777'
}

function setupDescriptionHelper() {
  if (!descriptionInput) return

  descriptionInput.addEventListener('input', updateDescriptionCount)
  updateDescriptionCount()
}

function syncCategoryShortcuts(value) {
  categoryShortcutButtons.forEach(button => {
    button.classList.toggle('active', button.dataset.category === value)
  })
}

function setupCategoryShortcuts() {
  if (!categorySelect || categoryShortcutButtons.length === 0) return

  categoryShortcutButtons.forEach(button => {
    button.addEventListener('click', () => {
      categorySelect.value = button.dataset.category
      syncCategoryShortcuts(categorySelect.value)
      categorySelect.focus()
    })
  })

  categorySelect.addEventListener('change', () => syncCategoryShortcuts(categorySelect.value))
}

function setupLocationCapture() {
  if (!useLocationBtn || !locationStatus) return

  if (!navigator.geolocation) {
    useLocationBtn.disabled = true
    locationStatus.textContent = 'Location capture is not supported in this browser.'
    return
  }

  useLocationBtn.addEventListener('click', () => {
    locationStatus.textContent = 'Capturing current location...'
    useLocationBtn.disabled = true

    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords
      selectedLocation = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      locationStatus.textContent = `Location captured: ${selectedLocation}`
      useLocationBtn.disabled = false
    }, () => {
      locationStatus.textContent = 'Unable to capture location. Please type the area manually.'
      useLocationBtn.disabled = false
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    })
  })
}

function setupVoiceTyping() {
  if (!voiceTypeBtn || !descriptionInput) return

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    voiceTypeBtn.disabled = true
    voiceTypeBtn.title = 'Voice typing is not supported in this browser.'
    updateVoiceStatus('Voice typing is not supported in this browser. Try Chrome or Edge.')
    return
  }

  recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = navigator.language && navigator.language.startsWith('ta') ? 'ta-IN' : 'en-IN'

  recognition.addEventListener('start', () => {
    isListening = true
    voiceTypeBtn.classList.add('is-listening')
    voiceTypeBtn.setAttribute('aria-pressed', 'true')
    updateVoiceStatus('Listening... speak now.')
  })

  recognition.addEventListener('result', (event) => {
    let finalTranscript = ''
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript
      }
    }
    appendTranscript(finalTranscript.trim())
  })

  recognition.addEventListener('end', () => {
    isListening = false
    voiceTypeBtn.classList.remove('is-listening')
    voiceTypeBtn.setAttribute('aria-pressed', 'false')
    updateVoiceStatus('Voice typing paused. Tap again to continue.')
  })

  recognition.addEventListener('error', (event) => {
    updateVoiceStatus(`Voice typing stopped: ${event.error}.`)
  })

  voiceTypeBtn.addEventListener('click', () => {
    if (!recognition) return

    if (isListening) {
      recognition.stop()
    } else {
      recognition.start()
    }
  })
}

function resetPhotoUpload() {
  selectedPhotoData = ''
  selectedPhotoName = ''
  if (photoInput) photoInput.value = ''
  if (photoPreview) photoPreview.hidden = true
  if (photoPreviewImg) photoPreviewImg.removeAttribute('src')
  if (photoFileName) photoFileName.textContent = ''
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const maxSize = 1200
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = () => reject(new Error('Unable to read this image.'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('Unable to load this file.'))
    reader.readAsDataURL(file)
  })
}

function setupPhotoUpload() {
  if (!photoInput) return

  photoInput.addEventListener('change', async () => {
    const file = photoInput.files && photoInput.files[0]
    if (!file) {
      resetPhotoUpload()
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.')
      resetPhotoUpload()
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Please upload an image smaller than 5 MB.')
      resetPhotoUpload()
      return
    }

    try {
      selectedPhotoData = await compressImage(file)
      selectedPhotoName = file.name

      if (photoPreviewImg) photoPreviewImg.src = selectedPhotoData
      if (photoFileName) photoFileName.textContent = file.name
      if (photoPreview) photoPreview.hidden = false
    } catch (error) {
      alert(error.message)
      resetPhotoUpload()
    }
  })

  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', resetPhotoUpload)
  }
}

setupVoiceTyping()
setupPhotoUpload()
setupDescriptionHelper()
setupCategoryShortcuts()
setupLocationCapture()

if (grievanceForm) {
  grievanceForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const submitBtn = document.getElementById('submit-btn')
    const originalText = submitBtn.innerHTML

    // UI Feedback
    submitBtn.innerHTML = '<span class="tamil-text">சமர்ப்பிக்கிறது...</span> | Submitting...'
    submitBtn.disabled = true

    // Gather Form Data
    const name = document.getElementById('citizen-name').value.trim()
    const phone = document.getElementById('citizen-phone').value.trim()
    const constituency = document.getElementById('citizen-constituency').value.trim()
    const category = document.getElementById('citizen-category').value
    let description = document.getElementById('citizen-description').value.trim()
    const photoData = selectedPhotoData
    const photoName = selectedPhotoName

    if (selectedLocation) {
      description = `${description}\n\nCaptured location: ${selectedLocation}`
    }

    try {
      const response = await fetch(`${API_BASE}/api/grievances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, constituency, category, description, photoData, photoName })
      })

      const result = await response.json()

      if (result.success) {
        // Update the Tracking ID on success screen
        const successTrackId = document.getElementById('success-track-id')
        if (successTrackId) {
          successTrackId.textContent = result.trackId
        }

        // Switch view states
        grievanceForm.style.display = 'none'
        formSuccess.style.display = 'block'
        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } else {
        alert('Problem submitting grievance: ' + (result.message || 'Unknown error'))
        submitBtn.innerHTML = originalText
        submitBtn.disabled = false
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Unable to submit your request at this time. Please make sure the backend server is running.')
      submitBtn.innerHTML = originalText
      submitBtn.disabled = false
    }
  })
}

// Track Form Submit (Mock)
const trackForm = document.getElementById('track-form');
if (trackForm) {
  trackForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const trackResult = document.getElementById('track-result');
    const submitBtn = trackForm.querySelector('.track-submit-btn');
    const originalText = submitBtn.innerHTML;

    submitBtn.innerHTML = 'SEARCHING...';
    submitBtn.disabled = true;
    trackResult.style.display = 'none';

    // Simulate network delay for tracking
    setTimeout(() => {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      trackResult.style.display = 'block';
    }, 800);
  });
}

